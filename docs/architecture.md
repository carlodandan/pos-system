# System Architecture Documentation

This document describes the architectural design, system context, component topology, data flows, and concurrency mechanisms of the ** Point-of-Sale System System**.

---

## 1. System Overview

The Point-of-Sale System is a **serverless, zero-maintenance Point of Sale solution** where:
- The **frontend** is a responsive React/Vite Progressive Web Application (PWA).
- The **backend API** is hosted on **Google Apps Script** as a public Web App (`/exec`).
- The **database** is a private, user-owned **Google Spreadsheet** containing 4 relational sheets (`Products`, `Sales`, `SaleItems`, `Cashiers`).

There are no traditional Node.js, Express, or SQL database servers to maintain, pay for, or provision.

---

## 2. C4 Architecture Models

### 2.1 System Context (Level 1)

```mermaid
C4Context
    title System Context Diagram -  Point-of-Sale System

    Person(cashier, "Cashier / Staff", "Processes orders, rings up items, accepts cash, issues thermal receipts.")
    Person(manager, "Store Owner / Manager", "Manages inventory, views sales reports, configures cashiers.")

    System(pos_system, " Point-of-Sale System Web App", "React/TypeScript PWA terminal running in browser.")
    System_Ext(apps_script, "Google Apps Script Web App", "Serverless API handling validation, transaction locking, and data writes.")
    System_Ext(google_sheets, "Google Sheets Database", "User-owned spreadsheet storing catalog, sales records, and cashier list.")

    Rel(cashier, pos_system, "Selects items, calculates change, charges order")
    Rel(manager, pos_system, "Configures store settings and API connection")
    Rel(manager, google_sheets, "Analyzes revenue, creates charts, edits stock directly")
    Rel(pos_system, apps_script, "HTTP GET / POST (text/plain JSON)", "HTTPS")
    Rel(apps_script, google_sheets, "Reads/Writes via SpreadsheetApp Service", "Internal Google API")
```

---

### 2.2 Container Diagram (Level 2)

```mermaid
C4Container
    title Container Diagram -  Point-of-Sale System System

    Container(spa, "Frontend UI (SPA)", "React 19, TypeScript, Vite, Tailwind CSS", "Provides touch-friendly POS register, cart management, receipt printing, and BYOS setup.")
    Container(pwa_sw, "PWA Service Worker", "Workbox, CacheFirst / NetworkFirst", "Pre-caches static assets for web browser offline launch and fast startup.")
    Container(tauri_desktop, "Tauri v2 Desktop Shell", "Rust 2021, Windows WebView2", "Wraps the SPA into a lightweight, native Windows executable / installer (.msi / .exe).")
    Container(gas_api, "Google Apps Script Backend", "JavaScript V8 Runtime", "Implements business logic: product lookups, atomic stock decrements, sale records, and cashier retrieval.")
    ContainerDb(gsheets, "Google Sheets Database", "Google Spreadsheet (4 Tabs)", "Stores Products, Sales, SaleItems, and Cashiers relational data.")

    Rel(spa, pwa_sw, "Registers and caches assets (Web mode)")
    Rel(tauri_desktop, spa, "Embeds and renders in native webview (Desktop mode)")
    Rel(spa, gas_api, "Sends JSON payloads via fetch()", "HTTPS / text/plain")
    Rel(gas_api, gsheets, "Queries & mutates rows with LockService", "Google App Services")
```

---

## 3. Data Flow & Transaction Lifecycle

### 3.1 Checkout & Sale Transaction Flow

To prevent race conditions, double-charging, or negative inventory, the backend implements **pessimistic locking** via Google Apps Script `LockService`.

```mermaid
sequenceDiagram
    autonumber
    actor Cashier
    participant Terminal as React POS Terminal
    participant API as Google Apps Script (/exec)
    participant Lock as LockService (ScriptLock)
    participant Sheets as Google Sheets (Products / Sales / SaleItems)

    Cashier->>Terminal: Tap products to add to cart
    Cashier->>Terminal: Select Cashier from dropdown
    Cashier->>Terminal: Enter / tap cash tender amount
    Cashier->>Terminal: Click "Charge"
    Terminal->>API: POST /exec (action=sale, items, payment, cashier, discount)
    API->>Lock: tryLock(30000) [Acquire atomic script lock]
    
    alt Lock Acquisition Failed
        API-->>Terminal: 503 / error: "Server busy, try again"
    else Lock Acquired
        API->>Sheets: Read Products sheet to verify price & stock
        alt Stock Insufficient OR Inactive Item OR Price Discrepancy
            API->>Lock: releaseLock()
            API-->>Terminal: error: "Insufficient stock for [Product]"
            Terminal-->>Cashier: Display red alert banner
        else Validation Passes
            API->>Sheets: Append row to Sales (sale_id, date, cashier, subtotal, total, payment, change)
            loop For Each Line Item
                API->>Sheets: Append row to SaleItems (sale_id, product_id, quantity, price, subtotal)
                API->>Sheets: Decrement stock in Products sheet
            end
            API->>Lock: releaseLock()
            API-->>Terminal: success: true, sale: {saleId, subtotal, total, payment, change}
            Terminal->>Terminal: Clear cart & store lastSaleItems
            Terminal-->>Cashier: Render 80mm Thermal Receipt Modal
            Terminal->>API: GET /exec?action=products (Silent background refresh)
        end
    end
```

---

## 4. API Specification

The Google Apps Script Web App serves both `GET` and `POST` requests through the same deployment URL (`.../exec`).

### 4.1 CORS & Request Encoding
> [!IMPORTANT]
> Because Google Apps Script Web Apps perform a 302 redirect on CORS preflight (`OPTIONS`), browser `fetch` requests with `Content-Type: application/json` trigger CORS failures.
>
> **Solution**: The frontend sends all `POST` requests using `Content-Type: text/plain;charset=utf-8`. Apps Script parses `e.postData.contents` with `JSON.parse()`. Responses are returned via `ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON)`.

---

### 4.2 Endpoint Reference

| Method | Action (`?action=`) | Description | Request Body | Response Object |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `products` | Fetch all active catalog items | None | `{ success: true, products: Product[] }` |
| `GET` | `product&id=...` | Look up a single product by ID | None | `{ success: true, product: Product }` |
| `GET` | `cashiers` | Fetch list of active cashiers | None | `{ success: true, cashiers: Cashier[] }` |
| `POST` | `sale` | Process an atomic sale transaction | `SaleRequest` (JSON string) | `{ success: true, sale: SaleResult }` |
| `POST` | `addProduct` | Append a new product to sheet | `CreateProductRequest` (JSON) | `{ success: true, product: Product }` |

---

## 5. Database Schema (Google Sheets)

The database consists of 4 sheets in a single Google Spreadsheet:

### 5.1 `Products`
| Column | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| A | `id` | String | Unique product code (e.g. `P001`, `P002`) |
| B | `name` | String | Product display name |
| C | `price` | Number | Unit price |
| D | `stock` | Integer | Available inventory count |
| E | `category` | String | Category grouping (e.g. `Food`, `Drinks`) |
| F | `active` | Boolean | `TRUE` to display in catalog, `FALSE` to hide |

### 5.2 `Sales`
| Column | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| A | `sale_id` | String | Sequential sale identifier (e.g. `S000001`) |
| B | `date` | ISO String | Timestamp of sale completion |
| C | `cashier` | String | Nickname / name of the operating cashier |
| D | `subtotal` | Number | Gross subtotal before discounts |
| E | `discount` | Number | Discount amount applied |
| F | `total` | Number | Net amount payable |
| G | `payment` | Number | Cash received from customer |
| H | `change` | Number | Change returned to customer |

### 5.3 `SaleItems`
| Column | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| A | `sale_id` | String | Foreign key matching `Sales.sale_id` |
| B | `product_id` | String | Foreign key matching `Products.id` |
| C | `product_name` | String | Snapshot of product name at time of sale |
| D | `quantity` | Integer | Quantity sold |
| E | `price` | Number | Unit price at time of sale |
| F | `subtotal` | Number | `quantity * price` |

### 5.4 `Cashiers`
| Column | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| A | `id` | String | Unique cashier ID (e.g. `C001`) |
| B | `fullName` | String | Full legal or employee name |
| C | `nickname` | String | Short name displayed on register & receipts |
| D | `active` | Boolean | `TRUE` to allow cashier selection |

---

## 6. Concurrency & Integrity Strategy

1. **LockService Acquisition**:
   Before reading inventory during checkout, the script acquires `LockService.getScriptLock()` with a 30-second timeout.
2. **Server-Side Price Validation**:
   The backend **never trusts client-submitted prices**. It reads the live price from the `Products` sheet and calculates subtotals server-side to guarantee price integrity.
3. **Atomic Stock Decrement**:
   All row writes to `Sales`, `SaleItems`, and stock decrements in `Products` occur inside the locked block before releasing the lock.
4. **Idempotent ID Generation**:
   Sale IDs are generated sequentially (`S000001`, `S000002`, etc.) by counting existing rows under lock.

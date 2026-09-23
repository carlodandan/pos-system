<p align="center">
    <h3 align="center">Point-of-Sale System</h3>
    <p align="center">
        <a href="https://github.com/carlodandan/pos-system">
            <img src="https://img.shields.io/github/stars/carlodandan/pos-system" alt="Github Stars">
        </a>
      <img src="https://img.shields.io/github/issues/carlodandan/pos-system" alt="Github Issues">
     <a href="https://github.com/carlodandan/pos-system">
      <img src="https://img.shields.io/github/forks/carlodandan/pos-system" alt="Github Forks" />
    </a>
</p>
</p>
<p align="center">
    POS-System is a modern point of sale (POS) web application built with React, TypeScript, and Vite. It includes authentication, dynamic routing, and a connection to a backend API for product, inventory, and sales management. The app features a sleek UI styled with Tailwind CSS and a mobile-responsive layout.
    <img alt="pos-system" src="https://raw.githubusercontent.com/carlodandan/pos-system/refs/heads/dev/public/pages/dashboard.webp"/>
 </p>

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

- 📖 **[Setup & Verification Guide](./docs/setup-guide.md)**: 1-click template copy, Apps Script deployment, and connection testing.
- 🏗️ **[System Architecture](./docs/architecture.md)**: C4 diagrams, concurrency control, and API specs.
- 📋 **[Product Specification](./docs/product.md)**: Personas, feature requirements, and business rules.
- 🎨 **[Design System](./docs/design.md)**: Swiss minimalism, design tokens, touch targets, and thermal receipt printing.

## Features

- **Bring-Your-Own-Sheet (BYOS)**: Uses a standard Google Sheet as the 100% merchant-owned database.
- **Serverless Architecture**: Powered by Google Apps Script Web App — zero server costs and zero maintenance.
- **Tap-to-Add Register**: Fast, touch-friendly product cards with live in-cart quantity indicators.
- **High-Contrast Checkout**: Tabular figures, percentage discounts, quick cash tender shortcuts, and instant change computation.
- **80mm Thermal Receipt Printing**: Formatted specifically for standard POS receipt printers with `@media print` CSS.
- **Dynamic Cashier Management**: Header dropdown dynamically populated from the `Cashiers` sheet tab.
- **In-App Settings Hub**: 1-click template copy, latency diagnostics, store profile, and currency customization.
- **Progressive Web App (PWA)**: Offline precaching and standalone app installation support.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Google Apps Script (JavaScript V8 Runtime, LockService)
- **Database**: Google Sheets (4 Sheets: `Products`, `Sales`, `SaleItems`, `Cashiers`)
- **PWA**: `vite-plugin-pwa`, Workbox

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Google Sheets Database & API
Follow the step-by-step **[Setup Guide](./docs/setup-guide.md)** or use the **Settings** tab inside the app to copy the official Google Sheet template and deploy the Apps Script Web App.

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
pnpm build
```

## Additional Scripts

- `pnpm run type-check`: Run TypeScript type checking without emitting output.
- `pnpm run lint`: Lint the codebase with ESLint.
- `node scripts/test-api.mjs "<YOUR_WEB_APP_URL>"`: Run the automated API integration test suite.

## License
This project is licensed under the MIT License.

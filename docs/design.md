# Design System & UI/UX Guidelines

This document outlines the visual identity, design tokens, typography, component specifications, and ergonomic guidelines for the ** Point-of-Sale System System**, based on the `ui-ux-pro-max`, `ui-styling`, and `design-system` skills.

---

## 1. Design Philosophy

The  Point-of-Sale System interface is designed around three principles:

1. **Swiss Minimalism & High Contrast**: A dark-mode foundation (`#020617`) with purposeful emerald and cyan accents. No distracting ornaments or visual clutter.
2. **Tactile & Touch-First**: Inspired by modern commercial terminals (Square POS, Stripe Terminal). Large touch targets (≥ 44px), instant press feedback (`active:scale-[0.98]`), and one-tap actions.
3. **Jitter-Free Precision**: All financial numbers, prices, and quantities use monospaced fonts with **tabular figures** (`tabular-nums font-mono`) so digits align cleanly and never cause layout shift during rapid entry.

---

## 2. Color Palette & Design Tokens

### 2.1 Color Tokens

| Token | Hex / Class | Semantic Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#020617` (`bg-[#020617]`) | Base dark workspace canvas |
| **Card / Panel Surface** | `#0B0F19` / `bg-slate-900/60` | Product cards, cart panel, modal dialogs |
| **Elevated Surface** | `#0F172A` / `bg-slate-950` | Inputs, sub-panels, header background |
| **Border Default** | `border-slate-800/80` | Subtle structural dividers |
| **Border Focus / Hover** | `border-slate-700` | Hover states on interactive cards |
| **Primary Accent** | `#10B981` (`emerald-500`) | Prices, in-cart badges, primary action buttons |
| **Primary Hover / Active** | `#059669` (`emerald-600`) | Button hover / press state |
| **Secondary Accent** | `#06B6D4` (`cyan-400`) | Settings links, developer test suite |
| **Warning / Low Stock** | `#F59E0B` (`amber-400`) | Low stock alerts (≤ 10 items), connection warning |
| **Destructive / Error** | `#F43F5E` (`rose-400`) | Out-of-stock badges, checkout errors, delete buttons |
| **Text Primary** | `#FFFFFF` (`text-white`) | Product titles, totals, active navigation |
| **Text Secondary** | `#94A3B8` (`text-slate-400`) | Subtitles, category tags, item counts |
| **Text Muted** | `#64748B` (`text-slate-500`) | Placeholders, receipt metadata |

---

## 3. Typography & Numerical Formatting

### 3.1 Font Families
- **Primary Interface**: `Inter, -apple-system, BlinkMacSystemFont, sans-serif`
  - Clean, legible sans-serif for headers, labels, product names, and buttons.
- **Financial & Data Display**: `JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace`
  - Used for prices, product IDs, cash tender amounts, change, and receipt numbers.
  - Paired with `tabular-nums` to guarantee identical digit widths.

### 3.2 Hierarchy Scale

| Role | Font Size | Weight | Tracking | Class Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **Total Due (Hero)** | 28px - 32px | Extrabold (800) | Tight | `text-3xl font-extrabold font-mono tabular-nums text-emerald-400` |
| **Page Title** | 20px - 24px | Bold (700) | Tight | `text-2xl font-bold text-white tracking-tight` |
| **Section Header** | 14px - 16px | Bold (700) | Normal | `text-base font-bold text-white` |
| **Product Card Price** | 16px - 18px | Bold (700) | Tight | `text-base sm:text-lg font-bold text-emerald-400 font-mono` |
| **Product Card Title** | 12px - 14px | Semibold (600) | Snug | `text-xs sm:text-sm font-semibold text-white line-clamp-2` |
| **Micro Badges / IDs** | 9px - 10px | Bold (700) | Wide | `text-[10px] font-mono font-bold uppercase` |

---

## 4. Component Specifications

### 4.1 Tap-to-Add Product Card
- **Layout**: Vertical card with top metadata (ID, active count/category), middle title (2-line clamped), and bottom row (Price + Stock pill).
- **Interaction**:
  - Entire card acts as a button (`cursor-pointer`).
  - Active press feedback: `active:scale-[0.98]`.
  - When in cart: border changes to `border-emerald-500/70` with emerald shadow and a `✓ {count}` badge appears in the top-right.
  - When out of stock: `opacity-40 cursor-not-allowed` with "Out" pill.

### 4.2 Current Order Cart Panel
- **Item Rows**:
  - Left: Product name + unit price calculation (`₱25.00 × 2`).
  - Middle: Stepper controls (`[-] [qty] [+]`) with minimum 28px–32px touch targets.
  - Right: Line item subtotal (`tabular-nums font-mono`) and quick remove (`X`).
- **Financial Summary**:
  - Subtotal row, discount percentage pills (`0%`, `5%`, `10%`, `15%`).
  - Hero Total Due callout with prominent emerald text.
- **Cash Tender & Shortcuts**:
  - Numerical cash input with currency symbol placeholder.
  - 5 quick-tender buttons (`Exact`, `+100`, `+200`, `+500`, `+1000`) with minimum 40px height.
  - Instant change display: Emerald when tender is sufficient, Rose when tender is short.
- **Charge Button**:
  - Full width, 48px height, high-contrast `bg-emerald-600 hover:bg-emerald-500`.
  - Live status display: `Charge ₱350.00` or `Processing...` with spinning icon.

### 4.3 80mm Thermal Receipt
- **Dimensions**: Formatted for standard 80mm POS thermal paper width.
- **Styling**: Clean white card with dark monospace typography and dashed line dividers.
- **Itemized Layout**:
  - Store name, receipt ID, cashier name, date/time.
  - Line items: Product Name, Quantity (`x2`), Line Total.
  - Subtotal, Discount, Net Total (bold), Cash Tendered, Change Due.
  - Customizable footer message.
- **Print Optimization (`@media print`)**:
  - Automatically hides all web page chrome, dark mode background, and action buttons.
  - Positions `#printable-receipt` at `(0, 0)` with zero margin.

---

## 5. Ergonomics & Accessibility

- **Touch Target Sizing**: Primary interactive controls (Charge CTA, Cash shortcuts, Filter pills) meet or exceed the 44×44px touch target recommendation.
- **Color Contrast**: All text pairings maintain a minimum contrast ratio of 4.5:1 (WCAG AA).
- **Reduced Motion**: Transitions are subtle (150ms–250ms) to ensure smooth performance on lower-powered POS tablets.
- **Keyboard & Screen Reader Support**:
  - Steppers and buttons include descriptive `aria-label` attributes (`aria-label="Decrease quantity"`, `aria-label="Remove item"`).
  - All form controls maintain visible focus rings (`focus:ring-2 focus:ring-emerald-500/20`).

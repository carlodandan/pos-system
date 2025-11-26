# POS-App

## Overview
POS-App is a modern point of sale (POS) web application built with React, TypeScript, and Vite. It includes authentication, dynamic routing, and a connection to a backend API for product, inventory, and sales management. The app features a sleek UI styled with Tailwind CSS and a mobile-responsive layout.

## Features
- User authentication and protected routes
- Dashboard, POS, Products, Inventory, Reports, and Settings pages
- Integration with Google Spreadsheets for backend data storage
- Backend health check and connection status
- Dark/light theme support

## Tech Stack
- React 19
- TypeScript
- Vite (build tool)
- React Router DOM (routing)
- Tailwind CSS (styling)
- Framer Motion (animations)
- ExcelJS, File-Saver, jspdf (report/export utilities)
- Lucide Icons and React Icons

## Prerequisites
- Node.js (v16 or above)
- npm (v8 or above)

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pos-app
```

### 2. Prepare Environment Variables (.env)
Look for [.env.example](https://github.com/carlodandan/pos-system/blob/dev/.env.example) for example.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```
This will start the app in development mode. Open [http://localhost:5173](http://localhost:5173) to view it in your browser. The page will reload if you make edits.

### 5. Build for Production
```bash
npm run build
```
Builds the app for production to the `dist` folder.

### 6. Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing. This will start the app in semi-production mode. Open [http://localhost:4173](http://localhost:4173) to view it in your browser. The page will reload if you make edits.

### Other: Backend
Make sure the Backend server is running fine. [POS-System-Backend](https://github.com/carlodandan/pos-system-backend)

## Additional Scripts

- `npm run lint`: Lint the codebase with ESLint.
- `npm run type-check`: Run TypeScript type checking without emitting output.

## Notes
- The app requires an active connection to the backend API (configured in the app) and a properly set up Google Spreadsheet for data storage.
- The app uses dynamic routing, and protected routes redirect unauthenticated users to the login screen.
- For theme customization, see the `ThemeContext` in `src/contexts/ThemeContext.tsx`.

## License
This project is licensed under the MIT License.

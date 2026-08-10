# ProducePilot - Deep Technical Context & Architecture

This document provides exhaustive, in-depth context about the **ProducePilot** project. It is intended to onboard AI assistants or new engineers by giving them a complete understanding of the domain, architecture, data models, UI design system, and recent development progress.

---

## 1. Executive Summary & Domain Knowledge
**ProducePilot** is an AI-native fresh produce operations platform. Its primary goal is to optimize the supply chain, storage, and sales of fresh produce (fruits and vegetables).
The platform tracks environmental conditions (temperature, humidity), models the shelf-life of specific produce, assesses produce quality using computer vision AI, and recommends "rescue actions" for produce that is at risk of spoiling.

Horticultural reference ranges are strictly adhered to (e.g., Tomatoes at 13-15°C, Apples at 0-4°C). The platform allows warehouse managers to monitor inventory globally, view risk assessments, and take preemptive action to reduce food waste and maximize profit.

---

## 2. Monorepo Architecture
The repository is structured as a monorepo with distinct functional areas:
- **`frontend/`**: The web application client built with React 19 and Vite.
- **`backend/`**: A RESTful Node.js/Express API connected to MongoDB.
- **`data/`**: Scripts used for generating synthetic business data, seeding the database with realistic produce, batches, and historical sales for demo purposes.
- **`n8n-workflows/`**: Automation logic powered by n8n, handling external integrations, scheduled tasks, and AI agent workflows.
- **`docs/`**: General project documentation.

---

## 3. Database Schema (MongoDB / Mongoose Models)
The backend utilizes Mongoose. Below is the detailed schema structure:

1. **`Product.js`**: Represents a catalog item.
   - `name`, `category` (Fruit/Vegetable).
   - `typicalShelfLifeDays` (min/max), `idealStorageTempC` (min/max), `idealHumidityPct` (min/max), `unit` (default 'kg').
2. **`Warehouse.js`**: Physical storage locations.
   - `name`, `city`, `state`, `latitude`, `longitude`, `capacityKg`.
3. **`Batch.js`**: A specific shipment of a Product stored in a Warehouse.
   - `productRef` (ObjectId), `warehouseRef` (ObjectId).
   - `quantityKg`, `receivedDate`, `harvestDate`.
   - `currentStorageTempC`, `currentStorageHumidityPct`, `batchCode` (unique string), `sourceRegion`.
4. **`VisualAssessment.js`**: AI vision analysis logs for a specific batch.
   - `batchRef` (ObjectId), `imageBase64` (image data), `productHint`.
   - `ripenessStage`, `defectsDetected` (Array of Strings).
   - `visualConditionScore` (0-100), `confidencePct` (0-100).
   - `modelRationale` (String explaining AI reasoning), `mismatchFlagged` (Boolean).
5. **Other Analytics/Log Models**:
   - `QualityParam.js`, `OperationalLog.js`, `AgentActivityLog.js` (tracks AI agent actions), `AcceptedRescueAction.js` (tracks when managers accept an AI suggestion to save produce), `Destination.js`, `SalesRecord.js`.

---

## 4. Backend Configuration & API Routes
**Server Config (`server.js`)**:
- Framework: `express`
- Security & Middleware: `cors`, `helmet` (HTTP headers), `morgan('dev')` (logging), `express.json()`.
- Database: Mongoose connected via `src/config/db.js`.
- An `/api/health` route exists to check DB connection state.

**Routing Architecture (`src/routes/api.js`)**:
The API acts as an aggregator for the frontend.
- `/api/products` (GET)
- `/api/warehouses` (GET)
- `/api/warehouses/:id/destinations` (GET)
- `/api/batches` (GET), `/api/batches/:id/detail` (GET)
- `/api/batches/:id/recommendation` (GET) - Gets AI rescue recommendations.
- `/api/batches/:id/recommendation/accept` (POST)
- `/api/batches/:id/recommendation/write-off` (POST)
- `/api/sales` (GET)
- `/api/quality-params` (GET)
- `/api/operations` (GET)
- `/api/dashboard/summary` (GET)
- `/api/map/overview` (GET)

Nested route modules are mounted at `/api/`:
- `activityRoutes.js`
- `demandRoutes.js`
- `riskRoutes.js`
- `visionRoutes.js`
- `/agents` -> `agentRoutes.js`

---

## 5. Frontend UI/UX & Design System
**Framework**: React 19, Vite, React Router v7.

**Design System (Tailwind CSS)**:
The `tailwind.config.js` is highly customized to give a premium, professional SaaS look.
- **Colors**: Deep semantic color palettes.
  - `surface`: DEFAULT (#FFFFFF), dim, bright, container variations.
  - `primary`: DEFAULT (#006763 - Teal/Mint vibe), container, fixed.
  - `risk`: Color scales for UI health indicators (low: #16A34A, medium: #F59E0B, high: #e0713a, critical: #EF4444).
  - `gradient`: Custom mint, blue, and rose gradients.
- **Typography**: Uses `Inter` font. Strict typography tokens defined: `display-lg`, `headline-page`, `headline-section`, `body-base`, `label-card`, `sidebar-group`.
- **Spacing**: Custom variables like `sidebar-width: 240px`.

**State Management (Context API)**:
- `WarehouseContext.jsx`: A global provider wrapping the application. It fetches all warehouses (`/warehouses`), stores them, and manages the `selectedWarehouseId`. It persists the selected warehouse to `localStorage` so the user's choice is remembered across sessions.

**Component Architecture**:
- **Routing**: Setup in `App.jsx`.
  - `/` -> `Landing.jsx` (High-converting, polished marketing page)
  - `/login` -> `Login.jsx`
  - `/app` -> `AppLayout.jsx` (Provides the Sidebar and Header wrapper for authenticated users).
    - `/app` (index) -> `Dashboard.jsx` (Main stats)
    - `/app/inventory` -> `Inventory.jsx` (List of batches)
    - `/app/agents` -> `Agents.jsx` (AI Agent interface)
    - `/app/batches/:id` -> `BatchDetail.jsx` (Deep dive into a specific produce batch)
    - `/app/map` -> `MapView.jsx` (Geospatial view using `@react-google-maps/api`)
- **Key Libraries**: `recharts` for rendering complex data charts, `lucide-react` for SVG iconography.
- **Globals**: Includes an `<ErrorBoundary />` and `<ToastProvider />` at the root.

---

## 6. Recent Development Milestones
1. **Frontend Scaffolding**: Built the complex layout, imported custom UI design tokens into Tailwind, and established React Router nested routing.
2. **Landing Page**: Implemented a highly professional, modern `Landing.jsx` page.
3. **Bug Fixes**: 
   - Fixed the `Warehouse` dropdown hover issue ensuring correct z-index and interaction states.
   - Fixed the Sidebar Navigation active-state highlight bug.
4. **Security Hardening**: Implemented `helmet` on the backend, strictly configured Express CORS settings to prepare for production. Added `oxlint` for frontend linting.
5. **Deployment Readiness**: Initialized `vercel.json` and build scripts to deploy the Vite application.

---

## 7. Directives for AI Assistants
When assisting with ProducePilot, adhere to the following rules:
- **Styling**: Always use the predefined Tailwind tokens (e.g., `text-surface-dim`, `bg-risk-critical`, `text-display-lg`). Do not invent ad-hoc hex colors.
- **API Communication**: Always use the frontend's built-in `fetchApi` wrapper (located in `src/services/api.js`) for backend requests to ensure correct base URLs and headers.
- **Components**: Utilize Lucide React for icons. If building charts, use Recharts.
- **Tone**: The application must feel incredibly premium, fast, and data-dense. Animations and hover states should be subtle but present.

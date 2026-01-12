# YQMS (Quality Management System)

YQMS is a comprehensive software solution designed to streamline Quality Control (QC) and Quality Assurance (QA) processes in garment manufacturing. It covers various production stages including Sewing, Washing, Ironing, Packing, and Finishing, providing real-time data visualization and detailed reporting.

## Key Features

### 🏭 Inspection & QC Modules
- **Sub-Con Sewing QC**: Comprehensive dashboarding (Daily/Weekly/Monthly) for sub-contractors, featuring defect rate trends, top defect analysis, and integrated QA report comparison.
- **Sub-Con QA**: Automated inspection grading (A/B/C/D) based on weighted defect severity (Critical, Major, Minor) with pass/fail ratio analysis.
- **After Ironing**: Visual checkpoint inspection system allowing comparison with standard images and capturing defect evidence.
- **Washing QC**: Specialized module for washing measurements, supporting auto-save, size management, and first output tracking.
- **QC2 System**: Centralized order data tracking with live dashboards for Bundle Registration, OPA (Operational Process Analysis), and garment quantities.

### 📊 Dashboards & Analytics
- **Live Dashboards**: Real-time monitoring of defect rates, checked quantities, and order progress.
- **Trend Analysis**: Daily, Weekly, and Monthly performance views by Factory, Buyer, and Line.
- **QA Accuracy**: Track inspector accuracy, defect ratios, and pass/fail rates.

### 📏 ANF Measurement System
- **Measurement Inspection (M1)**: Validates garment dimensions against buyer specifications with automated tolerance checks.
- **Packing Verification (M2)**: Tracks packing status and size completion with persistent "In Progress" vs "Completed" states.
- **Analytics & Reporting**: Provides Daily QC reports, Style View summaries (aggregated by Inspector, Color, and Size), and detailed drill-down capabilities for defect analysis.

### 🛡️ Administration
- **IE Role Management**: Dynamic access control system that grants permissions based on assigned IE tasks and process keywords. Managed processes include: Bundle Registration, Washing, OPA, Ironing, Packing, and QC2 Inspection.
- **User Management**: Integration with employee data for secure access.

## Tech Stack
- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Database**: MongoDB

---

## Data Access Layer (DAL) — Modules & Function Summary

- **Overview:** The DAL is implemented across `models/`, `controller/`, and a few helper modules. `models/` contains Mongoose schemas and model exports used throughout the application. Controllers in `controller/` provide feature-specific DAL functions that use these models.

- **Primary locations:**
	- `models/`: Mongoose models (examples: `AccessoryIssue.js`, `ANFMeasurementReport.js`, `QC1Sunrise.js`, `QC2DefectsModel.js`, `InlineOrders.js`, `QCWorkers.js`, and many more).
	- `controller/MongoDB/`: shared MongoDB helpers and connection utilities.
	- `controller/*`: per-feature DAL/business logic (examples: `QC1Inspection`, `QC2_Upload_data`, `AfterIroning`, `InlineOrders`, etc.).
	- `helpers/helperFunctions.js`: utility helpers used by DAL (common query builders, formatters).
	- `backend/server.js`: initializes the DB connection and middleware used by DAL.

- **Common exported function patterns:**
	- `connect()` / `initDb()` — establish DB connection.
	- `getById(id)`, `list(filter, options)`, `create(doc)`, `update(id, changes)`, `delete(id)` — standard CRUD functions.
	- `aggregateReport(params)` — aggregation pipelines for reporting and analytics.

- **Usage (examples):**
```js
// require a model
const QCWorkers = require('./models/QCWorkers');

// simple query
const workers = await QCWorkers.find({ line: 'A1' }).limit(50);

// controller-style usage (pseudo)
const { createInspection } = require('./controller/QC1Inspection');
await createInspection({ orderNo, inspectorId, defects });
```

- **Where to extend:**
	- Add new schemas to `models/`.
	- Implement feature DAL in `controller/<Feature>/`.
	- Reuse `helpers/helperFunctions.js` for shared utilities.


 See the `models/` and `controller/` folders for the full list of modules and functions.

## Home Page Copy (for Home component)

- **Title:** YQMS — Quality Management System
- **Subtitle:** Centralized QC/QA for garment production: Sewing, Washing, Ironing, Packing, and Finishing. Real-time dashboards, inspection flows, and analytics.
- **Primary actions / links:** Dashboards, Inspections, ANF Measurements, After Ironing, Washing QC, QC2 System, Upload Orders, AI Assistant, Reports, Admin.
- **Quick module summary (short bullets shown on Home):**
	- **Dashboards:** Live defect rates, trends, checked quantities, and order progress — backed by aggregation pipelines in backend controllers.
	- **Inspections (QC modules):** Sub-Con Sewing QC, Sub-Con QA, QC1, QC2 — controllers handle create/list/report endpoints and use models in `backend/models/`.
	- **ANF Measurement:** M1 (measurement validation) and M2 (packing verification) — measurement logic in `src/utils/measurementHelperFunction.js` and `backend/models/ANFMeasurementReport.js`.
	- **After Ironing:** Visual checkpoint comparisons with standard images — model: `backend/models/AfterIroning/AfterIroning.js`; controllers under `backend/controller/AfterIroning/`.
	- **Washing QC:** Measurement capture, size management, reports — `backend/controller/QCWashing/` and `backend/models/QCWashing.js`.
	- **QC2 System:** Bundle registration, OPA flow, order tracking — controllers in `backend/controller/QC2*` and models such as `InlineOrders.js`.
	- **Uploads & Orders:** `YorksysOrders` upload flows live in `backend/controller/YorksysOrders/`.
	- **AI Assistant:** Image analysis and chat via `ai_service/app.py` (Flask). Use for defect suggestion and chat-based QA help.
	- **Administration:** User auth + roles — `backend/controller/User/` (`authController.js`, `roleManagementController.js`) and `helpers/helperFunctions.js`.
- **Footer CTA:** “Open Dashboard” (link to main dashboard page).

## App Bootstrap Summary (for `src/App.jsx`, `src/main.jsx`, and `backend/server.js`)

- **App entry points**
	- Frontend: `src/main.jsx` mounts the React tree and injects providers; `src/App.jsx` defines top-level routes and layout. See [src/main.jsx](src/main.jsx) and [src/App.jsx](src/App.jsx).
	- Backend: `backend/server.js` boots Express, connects to MongoDB via `backend/controller/MongoDB/dbConnectionController.js`, registers middleware, and mounts `routes/`.

- **Providers & global setup**
	- Auth provider / session: handled client-side (hooks under `src/hooks/`) and validated server-side in `backend/middleware/authenticateUser.js`.
	- API client: `src/utils/axiosConfig.js` — Axios instance configured with base URL and token injection.
	- Styling & tooling: Tailwind is configured in `tailwind.config.js` and PostCSS via `postcss.config.js`.

- **Routing patterns**
	- Frontend routes map to `src/pages/*`. Typical pages: `YPivotQAInspection.jsx`, `Washing.jsx`, `UploadYorksysOrders.jsx`, `YQMSAIChatBox.jsx`, `YPivotQAReport.jsx`.
	- Route guards: wrap routes requiring auth with an `Auth` HOC or hook that uses `src/hooks/` + server-side JWT validation.

- **Global behaviors & middleware**
	- Error handling: central error boundary in `src/components/` and server error middleware in `backend/server.js`.
	- File uploads: handled by controllers under `backend/controller/*` saving to `uploads/` and `public/storage/`.
	- Notifications: services under `services/` and modelled via `backend/models/NormalNotification.js`.

- **App life-cycle responsibilities**
	- On startup: `main.jsx` loads environment settings, checks token, fetches current user profile and feature flags, then renders `App.jsx`.
	- Route-level data: pages call controllers’ endpoints (e.g., `GET /api/qc2/list`, `POST /api/inspection/create`), which in turn use Mongoose models for DB operations.

- **Where to find feature code (quick links)**
	- Controllers: [backend/controller/](backend/controller/) — grouped by feature (e.g., `QCWashing`, `Sub-ConQC1`, `SupplierIssue`, `YorksysOrders`, `SQL`).
	- Models: [backend/models/](backend/models/) — domain schemas (examples: `QCWorkers.js`, `InlineOrders.js`, `ANFMeasurementReport.js`, `AfterIroning/AfterIroning.js`).
	- Helpers & middleware: [backend/helpers/helperFunctions.js](backend/helpers/helperFunctions.js), [backend/middleware/authenticateUser.js](backend/middleware/authenticateUser.js).
	- AI service: [ai_service/app.py](ai_service/app.py).
	- Frontend pages & utils: [src/pages/](src/pages/) and [src/utils/](src/utils/).

- **Common function patterns to reference in `App.jsx` comments**
	- Initialize API & auth: `axiosConfig.setup()`; `auth.checkSession()`; fetch `getCurrentUser()`.
	- Global state actions: `loadFeatureFlags()`, `fetchDashboardSummaries()`.
	- Route definitions: `Route path="/dashboard" element={<Dashboard/>}`; protected routes wrap with `<RequireAuth/>`.

- **Suggested App.jsx header comment (paste at top of `src/App.jsx`)**
	- "App root: mounts providers (Auth, Theme), defines application routes, and wires global behaviors. Core modules: `src/pages/*` (feature pages), `src/utils/axiosConfig.js` (API client), and server routes in `backend/controller/*`."

---

If you'd like, I can also create a ready-to-paste `Home.jsx` component with this copy or insert the suggested header into `src/App.jsx` automatically.
## Project Modules & Functions (full-summary)

This section summarizes the major folders, modules, and representative functions across the whole codebase so contributors can quickly find where to look and how to extend functionality.

- **Backend (backend/)**
	- `backend/server.js` — application bootstrap: loads environment, connects to MongoDB, sets middleware, mounts routes, and starts the Express server.
	- `backend/Config/appConfig.js` — central config (ports, DB URIs, feature flags).
	- `backend/controller/` — feature controllers implementing DAL and business logic. Representative controllers and responsibilities:
		- `MongoDB/dbConnectionController.js`: `connect()` / `initDb()` — manage DB connection and pooling.
		- `User/authController.js`: `login()`, `logout()`, `refreshToken()` — authentication endpoints.
		- `User/roleManagementController.js`: `assignRole()`, `getRoles()` — IE/user permission management.
		- `QCWashing/qcWashingController.js` / `oldQtyController.js`: `createMeasurement()`, `listMeasurements()`, `generateWashingReport()`.
		- `Sub-ConQC1/*`: sub-contractor QC dashboards, inspection create/list endpoints (e.g., `createInspection()`, `listInspections()`, `getInspectionReport()`).
		- `SupplierIssue/*`: create and report supplier issues (`createSupplierIssue()`, `listSupplierIssues()`).
		- `YorksysOrders/uploadOrderController.js`: `uploadOrders()`, `parseYorksysFile()`.
		- `SQL/sqlQueryController.js`: helper to run raw SQL queries where needed (`runQuery()`).
	- `backend/models/` — Mongoose schemas and model exports for domain entities. Key models:
		- `InlineOrders.js`, `CuttingInlineOrders.js`, `QCWorkers.js`, `QCWashing.js`, `ANFMeasurementReport.js`, `AfterIroning/AfterIroning.js`, `Ironing/Ironing.js`, `AccessoryIssue.js`, `QADefectsModel.js`, etc.
		- Typical model usage: `Model.find(filter)`, `Model.aggregate(pipeline)`, `new Model(doc).save()`.
	- `backend/helpers/helperFunctions.js` — shared helper utilities used by controllers: query builders, validators, formatters, common DB helpers (e.g., `buildFilter()`, `formatResponse()`).
	- `backend/middleware/` — Express middleware for auth and feature-specific flows:
		- `authenticateUser.js` — verifies JWT/session and attaches `req.user`.
		- `Cutting/*` middleware — process-specific checks.

- **Routes & Services**
	- `routes/` — maps HTTP endpoints to controllers. Patterns: `POST /api/<feature>/create`, `GET /api/<feature>/list`, `GET /api/<feature>/:id`.
	- `services/` — background or reusable services (e.g., notification dispatch, email, file parsing).

- **Uploads & Storage**
	- `uploads/`, `public/storage/` — file storage for images, spec sheets, inspection photos. Controllers provide upload handlers that store files and persist metadata to models.

- **AI Service**
	- `ai_service/app.py` — Python Flask app for AI-related features (image analysis, suggestions, chat). Representative endpoints: `analyze_image()`, `chat_query()`.

- **Frontend (src/)**
	- `src/pages/` — top-level pages that map to routes (examples: `YPivotQAInspection.jsx`, `Washing.jsx`, `UploadYorksysOrders.jsx`, `YQMSAIChatBox.jsx`, `YQMSExam.jsx`). Pages call backend APIs and render components.
	- `src/components/` — reusable UI components (inputs, tables, charts, image viewers). Look for `components/` for small widgets used across pages.
	- `src/utils/` — client-side helpers and API clients. Representative functions:
		- `axiosConfig.js` — preconfigured Axios instance with auth headers.
		- `measurementHelperFunction.js`, `afterIroningHelperFunction.js` — measurement calculations and validator functions.
		- `formatDate.js`, `fractionUtils.js` — formatting utilities.
	- `src/hooks/` — React hooks for stateful behaviors (data fetching, auth state, form helpers).

- **Other notable folders**
	- `backend/Config/` — environment and feature configuration.
	- `components.json`, `tailwind.config.js`, `postcss.config.js` — frontend tooling and styles.
	- `preload.js`, `electron.js` — electron integration (if packaged as desktop app).

- **Common function patterns (summary)**
	- CRUD: `create<Model>(doc)`, `get<Model>ById(id)`, `list<Model>(filter, options)`, `update<Model>(id, changes)`, `delete<Model>(id)`.
	- Reporting/aggregation: `aggregateReport(params)` or controller-specific `generate*Report()` functions using MongoDB aggregation pipelines.
	- Uploads: `uploadFile(req.file)` handlers store files, produce metadata, and link to models.
	- Auth: `authenticate()`, `authorize(roles)`, `getCurrentUser()`.

- **How to extend quickly**
	- Add a new model: create `backend/models/<YourModel>.js` and export a Mongoose model.
	- Add DAL/controller: create `backend/controller/<Feature>/<feature>Controller.js` with standard CRUD and reporting functions.
	- Expose routes: add new router in `routes/` and mount it from `backend/server.js`.
	- Reuse helpers: add shared logic to `helpers/helperFunctions.js` or `src/utils/` for client-side utilities.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

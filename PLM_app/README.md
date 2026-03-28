# PLM App: Product Lifecycle Management Dashboard

A modern, full-stack Product Lifecycle Management (PLM) application for managing Products, Bill of Materials (BOM), and Engineering Change Orders (ECO). It features an AI-powered engine to generate impact analysis and insights for engineering changes.

## 🚀 Features

- **Product Management:** Track product versions, statuses (Active/Archived), and pricing (Cost & Sale).
- **Bill of Materials (BOM):** Manage complex product assemblies, components, and manufacturing operations.
- **Engineering Change Orders (ECO):** Propose workflow-based changes to Products or BOMs. Supports stages (New, In Review, Approved, Done) and strict approval processes.
- **AI-Powered Insights:** Automatically summarizes the impact of ECOs and categorizes changes using the Groq API.
- **Agentic Lifecycle Monitoring:** A background scheduler detects ECO bottlenecks in `IN_REVIEW`, records `AgentAction` events, and surfaces nudges in the Admin AI Observatory.
- **Role-Based Access Control (RBAC):** Distinct roles (Admin, Engineering, Approver, Operations) for secure access mapping.
- **Audit Logging:** Maintain a history of actions, version changes, and approximations for compliance.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + `shadcn/ui` components
- **State Management:** Zustand
- **Routing:** React Router v6
- **Forms & Validation:** React Hook Form + Zod
- **Data Visualization:** Recharts

### Backend
- **Server:** Node.js + Express
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JSON Web Tokens (JWT) + bcryptjs
- **AI Integration:** Groq SDK for AI completions

### Testing
- Vitest (Unit/Integration)
- Playwright (End-to-End)

## 📁 Project Structure

```text
d:\ODOO_PROJECT\PLM_app
├── backend/                  # Node.js + Express API Backend
│   ├── prisma/               # Prisma schema, seeds, and migrations
│   ├── src/                  
│   │   ├── controllers/      # Route controllers (BOM, ECO, Products, AI)
│   │   ├── middleware/       # Auth and Role guards
│   │   ├── routes/           # Express routes
│   │   └── services/         # Business logic layer
│   └── server.js             # Entry point
├── src/                      # React Frontend
│   ├── components/           # Reusable UI components (shadcn/ui) and layout
│   ├── pages/                # Page views (Dashboard, BOMs, ECOs, Products)
│   ├── services/             # API client calls (Axios wrappers)
│   └── stores/               # Zustand global state (auth, BOM, ECO, theme)
└── package.json              # Frontend dependencies and scripts
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables. Create a `.env` in `backend/` and provide:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/plm_db"
   JWT_SECRET="your_jwt_secret"
   GROQ_API_KEY="your_groq_api_key_here"
   PORT=5000
   ```
4. Run Prisma Migrations and seed the database:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

### Prisma Migration Baseline (Drift Cleanup)

If your local database was previously managed with `prisma db push`, this repository now includes a baseline migration at `backend/prisma/migrations/20260328120000_baseline`.

For an existing DB with current schema already applied, run:

```bash
cd backend
npm run prisma:migrate:baseline
```

For fresh environments/CI, run:

```bash
cd backend
npm run prisma:migrate:deploy
npm run prisma:seed
```

### Lifecycle Agent (Stage 3 Foundation)

The backend now starts a cron-based lifecycle agent on boot (`node-cron`) to monitor ECOs stuck in review and create contextual nudges.

- Scheduler env vars are defined in `backend/.env.example`.
- Agent persistence is stored in Prisma model `AgentAction`.
- Admin endpoints:
   - `GET /api/reports/agent-alerts`
   - `POST /api/reports/agent/run`
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Open a new terminal instance in the root directory:
   ```bash
   cd PLM_app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:8080` (or the port Vite provides) in your browser.

## 🧪 Testing

To run frontend tests using Vitest:
```bash
npm run test
```

End-to-end tests via Playwright (if configured):
```bash
npx playwright test
```

## 📜 License
Private/Proprietary - All rights reserved.

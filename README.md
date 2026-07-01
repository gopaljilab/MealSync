# MealSync

<!-- Contribution Verification: 2026-05-13 -->
- Smart Food Management System

MealSync is a smart food management and redistribution platform for PGs, hostels, and shared living communities. It helps reduce food waste and food shortages by predicting meal demand, tracking consumption, and connecting surplus food with NGOs.

The platform works as a complete food ecosystem connecting PG owners, residents, and NGOs in one workflow.

## Core Users

| User | Purpose |
| --- | --- |
| PG Owners | Plan meals, track demand, monitor waste, and trigger surplus redistribution |
| Residents | Confirm meal attendance, manage weekly schedules, vote in polls, and submit feedback |
| NGOs | View surplus food requests, accept pickups, complete collections, and track impact |

## Key Features

### PG Owner Dashboard

- Meal input and demand prediction
- Leftover tracking with automatic NGO request creation
- Waste analytics and Green Score
- Raw material calculator for ingredient planning
- Waste-to-cost insights
- Smart suggestions using trends and context
- Global impact tracking across meals, waste, and redistribution

### NGO Dashboard

- Real-time surplus food pickup requests
- Accept, reject, and confirm pickup actions
- Suggested pickup route ordering
- Food details such as type, quantity, and preparation time
- Impact metrics for collected meals and completed pickups
- Pickup history for completed redistribution activity

### Resident Dashboard

- Meal confirmation system
- Weekly schedule editor with auto-fill support
- Meal reminder banner
- Community poll voting
- Sustainability impact tracking
- Feedback and rating system

## Smart Intelligence APIs

MealSync includes intelligence endpoints for planning, analytics, and impact tracking.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/intelligence/raw-materials` | Estimate ingredient quantities for today's meals |
| `GET /api/intelligence/waste-cost` | Calculate weekly food waste in monetary terms |
| `GET /api/intelligence/suggestions` | Generate smart suggestions based on patterns and context |
| `GET /api/intelligence/global-impact` | Show aggregate platform impact |
| `GET /api/intelligence/resident-impact` | Show resident-level sustainability impact |
| `GET /api/intelligence/ngo-impact` | Show NGO-level pickup and redistribution impact |
| `POST /api/ngo/requests/:id/complete` | Mark an NGO pickup as completed |
| `GET /api/schedules/mine` | Fetch a resident's weekly meal schedule |
| `POST /api/schedules/mine` | Save a resident's weekly meal schedule |
| `GET /api/polls` | Fetch active community polls |
| `POST /api/polls/:id/vote` | Submit a poll vote |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | Express 5 |
| Database | PostgreSQL, Drizzle ORM |
| Validation | Zod, drizzle-zod |
| API Client | OpenAPI + Orval-generated client |
| Charts | Recharts |
| Build Tool | esbuild |
| Monorepo | pnpm workspaces |
| Language | TypeScript |

## Project Structure

```text
MealSync/
├── artifacts/
│   ├── mealsync/       # Frontend React + Vite app
│   └── api-server/     # Backend Express API
├── lib/
│   ├── db/             # Drizzle schema and database setup
│   ├── api-spec/       # OpenAPI specification
│   ├── api-zod/        # Generated Zod schemas
│   └── api-client-react/ # Generated React API client
├── scripts/            # Workspace scripts
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- Node.js 24
- pnpm through Corepack
- PostgreSQL running locally or through a hosted database

Enable pnpm with Corepack:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

If `pnpm` is not available because of system permissions, use `corepack pnpm` in place of `pnpm`.

## Getting Started

### 1. Install Dependencies

```bash
cd /Users/amrishgupta/Downloads/MealSync
corepack pnpm install
```

### 2. Configure Environment Variables

Set your local database connection before running database or API commands:

```bash
export DATABASE_URL="postgresql://amrishgupta@localhost:5432/mealsync"
export SESSION_SECRET="dev-secret"
```

For another machine or hosted database, replace `DATABASE_URL` with your PostgreSQL connection string.

### 3. Create and Push the Database Schema

Create the database if needed:

```bash
createdb -h localhost mealsync
```

Push the Drizzle schema:

```bash
DATABASE_URL=postgresql://amrishgupta@localhost:5432/mealsync corepack pnpm --filter @workspace/db run push
```

### 4. Start the Backend

Run this in the first terminal:

```bash
DATABASE_URL=postgresql://amrishgupta@localhost:5432/mealsync SESSION_SECRET=dev-secret PORT=3000 corepack pnpm --filter @workspace/api-server run dev
```

The API runs at:

```text
http://localhost:3000/api
```

Health check:

```text
http://localhost:3000/api/healthz
```

### 5. Start the Frontend

Run this in the second terminal:

```bash
PORT=5173 BASE_PATH=/ API_URL=http://localhost:3000 corepack pnpm --filter @workspace/mealsync run dev
```

Open the app:

```text
http://localhost:5173
```

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| PG Owner | `owner@mealsync.com` | `password123` |
| NGO | `ngo@mealsync.com` | `password123` |
| Resident | `resident@mealsync.com` | `password123` |

If the local database is fresh and these users are not present, create three users through the app's register flow: one PG Owner, one NGO, and one Resident.

## Hackathon Demo Flow

1. Open three separate browser sessions so each role keeps its own login session.
2. Log in as PG Owner, NGO, and Resident in separate windows.
3. In the Resident dashboard, confirm meal attendance or update the weekly schedule.
4. In the PG Owner dashboard, add meal details and show demand prediction.
5. Report leftover food with quantity `10` or more.
6. Switch to the NGO dashboard and show the automatically generated pickup request.
7. Accept and complete the NGO pickup.
8. End by showing impact metrics, waste analytics, and sustainability tracking.

Recommended browser setup:

| Window | Role |
| --- | --- |
| Chrome normal window | PG Owner |
| Chrome incognito window | NGO |
| Safari, Firefox, or another Chrome profile | Resident |

## Core Workflow

```text
Residents mark attendance
        ↓
System predicts meal demand
        ↓
Owner plans optimized food quantity
        ↓
Leftover food is reported
        ↓
NGO request is created automatically
        ↓
NGO accepts and completes pickup
        ↓
Food waste is reduced and impact is tracked
```

## Key Commands

```bash
corepack pnpm run typecheck
corepack pnpm run build
corepack pnpm --filter @workspace/api-spec run codegen
corepack pnpm --filter @workspace/db run push
```

## Auto-NGO Trigger

When a PG owner reports `10` or more leftover meals using `POST /api/meals/:id/leftover`, MealSync automatically creates an NGO pickup request. The response includes:

```json
{
  "autoNgoTriggered": true
}
```

## Authentication

MealSync uses session-based authentication with `express-session`. API requests include cookies using `credentials: "include"`. The app does not use localStorage for authentication, and protected routes return `401` when the user is not authenticated.

## Impact

- Reduces food waste in PGs and hostels
- Helps owners plan better meal quantities
- Saves operating cost through waste-to-cost visibility
- Supports NGOs with structured surplus food pickup requests
- Builds a measurable sustainability ecosystem

## Future Improvements

- Real-time notifications using Web Push
- Live map and route optimization for NGOs
- AI-based meal demand prediction models
- Mobile app for residents and NGOs
- Admin dashboard for multi-hostel monitoring

## License

This project is available under the MIT License.

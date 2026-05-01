# MealSync

## Overview

MealSync is a smart food management system for PGs and hostels that reduces food waste and shortages using demand prediction and NGO redistribution. Role-based dashboards for PG Owners, NGOs, and Residents.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifact: `mealsync`, preview path: `/`)
- **API framework**: Express 5 (artifact: `api-server`, preview path: `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts

## Demo Users (seeded)

| Role      | Email                    | Password    |
|-----------|--------------------------|-------------|
| PG Owner  | owner@mealsync.com       | password123 |
| NGO       | ngo@mealsync.com         | password123 |
| Resident  | resident@mealsync.com    | password123 |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Artifacts

- **mealsync** (`artifacts/mealsync/`) — React + Vite frontend at `/`
- **api-server** (`artifacts/api-server/`) — Express 5 API at `/api`

## Role-Based Dashboards

- **PG Owner** (`/dashboard/owner`): Meal input, AI prediction, leftover reporting, auto-NGO trigger (≥10 leftover), analytics chart, green score, **raw material calculator**, **waste-to-cost analytics**, **smart suggestions with weather note**, **global impact dashboard**
- **NGO** (`/dashboard/ngo`): Pending requests with food type/prep time, accept/reject, **confirm pickup button**, **suggested route ordering**, **impact metrics card**, pickup history
- **Resident** (`/dashboard/resident`): Meal confirmation with **meal reminder banner**, **auto-fill from schedule**, **weekly schedule editor**, **community poll/voting**, sustainability impact card, star rating feedback

## Intelligence Routes (not in OpenAPI spec — direct fetch)

- `GET /api/intelligence/raw-materials` — ingredient quantities for today's meals
- `GET /api/intelligence/waste-cost` — weekly waste in monetary terms
- `GET /api/intelligence/suggestions` — smart suggestions with weather/weekend note
- `GET /api/intelligence/global-impact` — aggregate stats across all PGs/NGOs
- `GET /api/intelligence/resident-impact` — per-resident sustainability data
- `GET /api/intelligence/ngo-impact` — per-NGO collection stats
- `POST /api/ngo/requests/:id/complete` — mark pickup as completed
- `GET /api/schedules/mine` + `POST /api/schedules/mine` — resident weekly schedule
- `GET /api/polls` + `POST /api/polls/:id/vote` — community poll voting

## Auto-NGO Trigger

When a PG owner reports ≥10 leftover meals via `POST /api/meals/:id/leftover`, an NGO request is automatically created and the response includes `autoNgoTriggered: true`.

## Auth

Session-based auth with express-session. All API calls use `credentials: "include"`. No localStorage fallbacks — 401 is returned when unauthenticated.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

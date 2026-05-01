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

- **PG Owner** (`/dashboard/owner`): Meal input, AI prediction (90% rule), leftover reporting, NGO notification, analytics chart, green score
- **NGO** (`/dashboard/ngo`): Pending pickup requests with accept/reject, pickup history
- **Resident** (`/dashboard/resident`): Meal confirmation (Yes/No), star rating feedback

## Auth

Session-based auth with express-session. Frontend uses hybrid approach: calls real API endpoints, falls back to localStorage mock if API unavailable.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

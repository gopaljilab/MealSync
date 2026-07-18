<p align="center">
  <img src="assets/mealsync-banner.png" alt="MealSync AI — intelligent food, zero waste, max impact" width="100%" />
</p>

# 🍽️ MealSync AI

> **AI-powered food management and redistribution for shared communities.**
> **Predict. Optimize. Redistribute. Reduce food waste.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-22C55E)](#license)
![Built for Hackathons](https://img.shields.io/badge/Built%20for-Hackathons-F97316)

MealSync is an intelligent food management and redistribution platform for PGs, hostels, and shared-living communities. It combines resident meal confirmation, demand prediction, waste analytics, and automated NGO redistribution in one connected workflow.

**🌱 Reduce waste** &nbsp; **📊 Make data-informed decisions** &nbsp; **🤝 Redistribute surplus food** &nbsp; **📈 Track sustainable impact**

## Table of Contents

- [Core Users](#core-users)
- [Why MealSync?](#why-mealsync)
- [Key Features](#key-features)
  - [PG Owner Dashboard](#pg-owner-dashboard)
  - [NGO Dashboard](#ngo-dashboard)
  - [Resident Dashboard](#resident-dashboard)
- [Smart Intelligence APIs](#smart-intelligence-apis)
- [AI Features](#ai-features)
- [System Architecture](#system-architecture)
- [Data Model](#data-model)
- [End-to-End Flow](#end-to-end-flow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Install Dependencies](#1-install-dependencies)
  - [Configure Environment Variables](#2-configure-environment-variables)
  - [Create and Push the Database Schema](#3-create-and-push-the-database-schema)
  - [Start the Backend](#4-start-the-backend)
  - [Start the Frontend](#5-start-the-frontend)
- [Demo Credentials](#demo-credentials)
- [Core Workflow](#core-workflow)
- [Impact Example](#impact-example)
- [Key Commands](#key-commands)
- [Auto-NGO Trigger](#auto-ngo-trigger)
- [Authentication](#authentication)
- [Security](#security)
- [Performance & Developer Experience](#performance--developer-experience)
- [Impact](#impact)
- [Future Improvements](#future-improvements)
- [License](#license)

## Core Users

| User | Purpose |
| --- | --- |
| PG Owners | Plan meals, track demand, monitor waste, and trigger surplus redistribution |
| Residents | Confirm meal attendance, manage weekly schedules, vote in polls, and submit feedback |
| NGOs | View surplus food requests, accept pickups, complete collections, and track impact |

## Why MealSync?

Shared kitchens face a difficult planning problem every day: residents may skip meals, arrive unexpectedly, or change their schedule at the last minute. The result is avoidable food waste, unnecessary cost, and missed opportunities to redirect safe surplus food to nearby communities.

MealSync connects the people and data involved—from resident intent to owner planning and NGO pickup—so each meal can be prepared with more confidence and any surplus can create social impact.

| The challenge | MealSync response |
| --- | --- |
| Uncertain daily attendance | Meal confirmations, schedules, and demand prediction |
| Excess food and cost loss | Leftover logging, waste-cost analytics, and suggestions |
| Disconnected food donation process | Automatic NGO pickup requests once surplus reaches a threshold |
| Little visibility into outcomes | Owner, resident, NGO, and platform impact metrics |

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

## AI Features

### Demand Planning

Owners can record expected attendance and generate a meal prediction before food is prepared. The intelligence layer also incorporates recorded confirmations into its planning suggestions, helping owners make smaller, better-informed adjustments.

### Waste & Cost Analytics

MealSync aggregates reported leftovers into a weekly waste view, including waste percentage and estimated cost loss. This turns a vague operational problem into a measurable signal that owners can act on.

### Contextual Suggestions

The suggestions endpoint uses recent leftovers, attendance confirmations, feedback ratings, and weekend context to surface useful prompts—such as reducing portions after repeated surplus or reviewing menu quality after poor ratings.

### Ingredient Planning

Given a menu and planned meal count, the raw-material calculator estimates ingredient quantities to support purchasing and kitchen preparation.

## System Architecture

```mermaid
flowchart TB
    Residents[Residents] --> Web[React + Vite frontend]
    Owners[PG Owners] --> Web
    NGOs[NGO Partners] --> Web
    Web -->|REST API with session cookies| API[Express 5 API]
    API --> Auth[Authentication & role checks]
    API --> Intelligence[Intelligence & analytics]
    API --> Redistribution[NGO redistribution workflow]
    Auth --> DB[(PostgreSQL)]
    Intelligence --> DB
    Redistribution --> DB
    API --> ORM[Drizzle ORM]
    ORM --> DB
```

## Data Model

```mermaid
erDiagram
    USERS ||--o{ MEALS : creates
    USERS ||--o{ MEAL_CONFIRMATIONS : submits
    USERS ||--o{ WEEKLY_SCHEDULES : manages
    USERS ||--o{ FEEDBACK : writes
    MEALS ||--o{ NGO_REQUESTS : generates
    POLLS ||--o{ POLL_VOTES : receives
    USERS ||--o{ POLL_VOTES : casts

    USERS {
      int id PK
      string role
      string pg_name
    }
    MEALS {
      int id PK
      int owner_id FK
      int expected_people
      int predicted_meals
      int leftover_meals
    }
    NGO_REQUESTS {
      int id PK
      int meal_id FK
      int available_meals
      string status
    }
```

## End-to-End Flow

```mermaid
sequenceDiagram
    participant R as Resident
    participant M as MealSync API
    participant O as PG Owner
    participant N as NGO Partner

    R->>M: Confirm meal / update schedule
    O->>M: Create menu and expected attendance
    M-->>O: Prediction and planning insights
    O->>M: Report leftover meals
    alt Leftovers are 10 or more meals
        M-->>N: Create surplus pickup request
        N->>M: Accept and complete pickup
    end
    M-->>O: Waste and impact metrics
```

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
├── assets/             # Repository documentation assets
│   └── mealsync-banner.png
├── artifacts/
│   ├── mealsync/       # React + Vite user interface
│   └── api-server/     # Express REST API and business workflows
├── lib/
│   ├── db/             # Drizzle schema and database setup
│   ├── api-spec/       # OpenAPI specification
│   ├── api-zod/        # Generated Zod schemas
│   └── api-client-react/ # Type-safe generated React API client
├── scripts/            # Workspace automation and tooling
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
cd MealSync-main
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

## Impact Example

For a shared community of 100 residents, clearer attendance signals can make a meaningful operational difference:

```text
Without informed planning:  100 meals prepared → 18 meals left over
With MealSync signals:       92 meals prepared →  2 meals left over

Potential reduction in surplus: 16 meals (about 89%)
```

This is an illustrative scenario, not a measured platform-wide result. Actual impact depends on attendance, menu, and operational adoption.

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

## Security

- HTTP-only session cookies for browser authentication
- Role-aware routes for PG owners, residents, and NGO users
- Request validation through Zod and generated schemas
- Drizzle ORM query construction instead of handwritten SQL
- PostgreSQL row-level security policy tooling for protected meal data
- Request logging that redacts cookie headers

> For production deployment, configure HTTPS and set session cookies to `secure: true`, use a persistent session store, rotate secrets, and restrict CORS to the deployed frontend origin.

## Performance & Developer Experience

- Vite provides a fast frontend development workflow.
- esbuild bundles the API service efficiently.
- OpenAPI and Orval-generated clients keep frontend calls aligned with the API contract.
- Shared TypeScript and Zod schemas reduce integration errors across the monorepo.
- Recharts supports lightweight, interactive dashboard visualizations.

## Impact

- Reduces food waste in PGs and hostels
- Helps owners plan better meal quantities
- Saves operating cost through waste-to-cost visibility
- Supports NGOs with structured surplus food pickup requests
- Builds a measurable sustainability ecosystem

## Future Improvements

- [x] Meal confirmation and weekly scheduling
- [x] Leftover tracking and automatic NGO request creation
- [x] Waste, cost, and sustainability impact tracking
- [x] Community polls and resident feedback
- [ ] Real-time notifications using Web Push
- [ ] Live maps and route optimization for NGOs
- [ ] ML-based demand prediction models
- [ ] QR-assisted pickup verification
- [ ] Mobile experience for residents and NGO partners
- [ ] Multi-hostel administration and reporting
- [ ] Carbon-footprint and weather-aware planning

## License

This project is available under the MIT License.

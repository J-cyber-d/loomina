# AGENTS.md — Loomina AI Agent Operating Manual

> **Loomina** is an open-source, developer-first Embedded Analytics Platform.
> It allows B2B SaaS companies to embed sub-second, interactive customer-facing dashboards into their applications in minutes.
> Website: `https://loomina.dev` | NPM: `@loomina/react` | License: Apache-2.0 / Commercial EE

---

## 1. Core Architectural Overview

Loomina consists of 5 decoupled core packages in a **pnpm + Turborepo** monorepo:

1. **`apps/studio`**: Developer Admin Console (Single Page Application).
   - Tech: **Vite + React 19 + TypeScript + Tailwind CSS + Shadcn UI**.
   - Auth Client: `@better-auth/react` (Organization switcher, admin impersonation UI).
   - Purpose: Connect customer databases, configure schemas, visually drag-and-drop dashboard widgets, manage API keys, and test embeds.
2. **`packages/sdk-react`**: The Embeddable Client SDK (`@loomina/react`).
   - Tech: **Vite Library Mode + TypeScript + Shadow DOM**.
   - Purpose: The drop-in `<EmbeddedDashboard token={jwt} />` component that customer apps install.
3. **`packages/shared`**: Shared TypeScript contracts.
   - Purpose: Universal types (`DashboardConfig`, `WidgetConfig`, `JWTPayload`, `ThemeConfig`).
4. **`services/api`**: Backend API Gateway.
   - Tech: **Fastify v5 + TypeScript + Drizzle ORM + PostgreSQL**.
   - Auth Engine: **Better Auth (`https://better-auth.com/`)**.
   - Purpose: CRUD metadata, query proxying to Cube.js, API key issuance, and Better Auth authentication.
5. **`services/cube`**: High-Speed Analytical Query Engine.
   - Tech: **Cube.js Core (OSS Apache-2.0)**.
   - Purpose: Dynamically connects to customer ClickHouse/PostgreSQL/MySQL databases, generates SQL, deduplicates queries, and serves sub-10ms cached aggregations.

---

## 2. Authentication Architecture (Better Auth vs. Embedded JWT)

Loomina uses a **dual-authentication model**:

### A. Developer Studio Authentication (Better Auth - https://better-auth.com/)

- **Provider:** Better Auth with `drizzleAdapter` on PostgreSQL.
- **Plugins Used:**
  - `organization()`: Multi-tenant team workspaces, member invites, and workspace switching.
  - `admin()`: Superadmin dashboard, user bans, and user impersonation (`impersonateUser()`).
  - `apiKey()`: Generates and validates developer secret keys (`lm_live_...`).
- **Social Login:** GitHub and Google OAuth.

### B. Embedded Client SDK Authentication (Stateless JWT)

- **Engine:** Standard HMAC-SHA256 Signed JWTs (verified via `jsonwebtoken`).
- **Performance:** Verified in server RAM in **<0.2 milliseconds** (ZERO database query, ZERO Better Auth roundtrip).
- **Rule:** The embedded SDK NEVER imports Better Auth. It only passes the signed JWT in the `Authorization: Bearer <token>` header.

---

## 3. Analytical Engine: Cube.js Core (OSS Apache 2.0)

Loomina uses **Cube.js Core (Free Open Source Apache 2.0)** inside `services/cube` to power all customer analytics:

- **100% Free Self-Hosted:** Runs as a standard Docker container (`cubejs/cube:latest`). Zero cloud fees or request limits.
- **Dynamic Multi-Tenant `driverFactory`:**
  - Connects dynamically to the customer's database (**ClickHouse, PostgreSQL, or MySQL**) per request based on `securityContext.tenantId`.
  - Decrypts customer database credentials in memory on the fly.
- **Tenant Cache Isolation (`contextToAppId`):**
  - Isolates query cache and pre-aggregations strictly per tenant (`tenant_{id}`).
- **Single-Flight Query Deduplication:**
  - If 500 users inside an organization open the dashboard simultaneously at 9 AM, Cube coalesces identical requests into **ONLY 1 live database query**, returning cached results to the other 499 users.
- **Sub-10ms In-Memory / Redis Caching:**
  - Repeated queries return in under 10ms from RAM without touching the customer's database.
- **Row-Level Security (RLS):**
  - Enforces `WHERE tenant_id = :tenant_id` at the semantic query layer on every single query.

---

## 4. Universal Golden Rules for AI Agents

1. **Strict Database Separation:**
   - **Loomina Internal Metadata** is stored ONLY in PostgreSQL and queried via **Drizzle ORM**.
   - **Customer Analytical Data** (ClickHouse / Postgres / MySQL) is NEVER queried via Drizzle or raw backend SQL. It MUST ALWAYS route through **Cube.js drivers**.
2. **Strict SDK Isolation (`packages/sdk-react`):**
   - NEVER import backend libraries, Drizzle, Better Auth, or heavy dependencies inside `packages/sdk-react`.
   - The SDK MUST remain featherweight (<80 KB tree-shaken).
   - All SDK styles MUST live inside **Shadow DOM** to prevent CSS bleeding into customer host apps.
3. **Visualization Engine Rule:**
   - NEVER use Recharts.
   - ALWAYS use **Apache ECharts (Canvas renderer)** for charts and **TanStack Table v8** for data tables.
4. **TypeScript Strictness:**
   - NEVER use `any`. Always use strict TypeScript types exported from `packages/shared`.
5. **Multi-Tenancy Security Rule:**
   - Every single metadata table in PostgreSQL MUST have an indexed `organization_id` column.
   - All embedded query executions MUST enforce `tenant_id` from the signed guest JWT via Cube.js `SECURITY_CONTEXT`.
6. **Design System Adherence:**
   - Follow `DESIGN_SYSTEM.md` strictly: Dark-mode first (`#09090b` background, `#18181b` card surface, `#6366f1` electric indigo accent).
   - Use the curated 6-color ECharts palette for all visualizations.

---

## 5. Monorepo Commands

- Install: `pnpm install`
- Dev mode: `pnpm dev`
- Build all: `pnpm build`
- DB generate migrations: `pnpm --filter @loomina/api db:generate`
- DB push migrations: `pnpm --filter @loomina/api db:push`
- Drizzle Studio: `pnpm --filter @loomina/api db:studio`

---

## 6. Key References

- Current Development Status & Active Sprint: See [.agents/rules/CURRENT_STATUS.md](.agents/rules/CURRENT_STATUS.md)
- Codebase Patterns & Architectural Conventions: See [.agents/rules/CONVENTIONS.md](.agents/rules/CONVENTIONS.md)
- System Architecture & Data Flow: See [.agents/rules/ARCHITECTURE.md](.agents/rules/ARCHITECTURE.md)
- UI Tokens, Colors & ECharts: See [.agents/rules/DESIGN_SYSTEM.md](.agents/rules/DESIGN_SYSTEM.md)
- Development Roadmap & Sprint Tasks: See [.agents/rules/ROADMAP.md](.agents/rules/ROADMAP.md)
- Competitive Intelligence: See [.agents/rules/COMPETITORS.md](.agents/rules/COMPETITORS.md)
- Standout Killer Features: See [.agents/rules/KILLER_FEATURES.md](.agents/rules/KILLER_FEATURES.md)


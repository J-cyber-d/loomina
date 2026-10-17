# ROADMAP.md — Loomina Development Roadmap

> **Loomina** is an open-source, developer-first Embedded Analytics Platform.
> It allows B2B SaaS companies to embed sub-second, interactive customer-facing dashboards into their applications in minutes with strict multi-tenancy.

---

## 🚀 Core Architectural Pillars & Competitive Guarantees

1. **Sub-10ms Multi-Customer Query Deduplication & In-Memory Caching:**
   - Single-flight query coalescing via Cube.js Core (500 users opening a dashboard simultaneously trigger only **1 single database query**).
   - Tenant cache isolation via `contextToAppId: ({ securityContext }) => tenant_${tenantId}`.
2. **Strict Multi-Tenant Security & Zero Data Leakage:**
   - **Shared Database:** Semantic Row-Level Security (`WHERE tenant_id = :tenant_id`) enforced automatically at the query compilation layer.
   - **Database-per-Tenant:** Dynamic in-memory `driverFactory` connects directly to isolated customer databases on the fly without expensive ETL pipelines.
3. **Stateless Sub-0.2ms Guest JWT Verification:**
   - Zero database roundtrips and zero external auth calls when customer end-users view dashboards.
4. **Featherweight (<80 KB) Shadow DOM React SDK (`@loomina/react`):**
   - 100% style isolation (zero host CSS leaks) with native theme mirroring (Dark-mode, Shadcn UI, Tailwind).
5. **Zero-Data-Leakage AI Copilot:**
   - Natural language to interactive chart generation using structured Cube JSON (zero raw SQL generation).

---

## Phase 1: MVP Launch (Weeks 1 to 6)
*Goal: Ship a production-ready embedded analytics product that can be dropped into a React SaaS in 10 minutes.*

### Sprint 1: Monorepo Foundation & Core Engines (100% Complete)
- [x] **Initialize `pnpm` monorepo with `Turborepo`** (clean pipeline, 0 build errors across 4 workspaces).
- [x] **Modular Monorepo Structure**:
  - [x] `apps/studio`: Vite + React 19 + TypeScript + Tailwind CSS canvas (Port 3000).
  - [x] `packages/sdk-react`: Vite Library Mode (`@loomina/react`) with Shadow DOM style isolation.
  - [x] `packages/shared`: Universal TypeScript contracts (`DashboardConfig`, `WidgetConfig`, `JWTPayload`, `CubeQuery`).
  - [x] `services/api`: Fastify v5 + TypeScript + Drizzle ORM + PostgreSQL metadata gateway (Port 4000).
  - [x] `services/cube`: Cube.js Core (OSS Apache 2.0) with dynamic multi-tenant `driverFactory` (ClickHouse, PostgreSQL, MySQL) and Single-Flight deduplication.
- [x] **Strict Linting & Formatting**: Prettier + ESLint v9 Flat Config with 0 errors and 0 warnings.
- [x] **Drizzle ORM Models**: Designed metadata schema for `organizations`, `users`, `dashboards`, `widgets`, `api_keys`, and `data_sources`.
- [x] **Live Database Migration**: Pushed Drizzle schema to PostgreSQL database `loomina_metadata` (`drizzle-kit push`).
- [x] **Pure ES Module Architecture**: Configured modern ESM output (`export {}`) to prevent browser CommonJS errors.

---

### Sprint 2: The Studio UI & Dashboard Canvas (In Progress)
- [x] **Decoupled Environment Configuration**:
  - `services/api/.env`: Backend private secrets (`DATABASE_URL`, `LOOMINA_EMBED_SECRET`, `PORT`).
  - `apps/studio/.env`: Public frontend configuration (`VITE_API_URL=http://localhost:4000`).
  - `services/cube/.env.example`: Analytical engine configuration (`CUBEJS_PORT=4001`).
- [x] **Interactive OpenAPI 3.0 / Swagger UI**: Live at `http://localhost:4000/documentation`.
- [x] **Live Fastify API Gateway**: Listening on port `4000` with instant health checks.
- [x] **Loomina Studio UI**: Running on port `3000` with pure ES Module build and clean dependency cache.
- [x] **Database Connection Manager**:
  - [x] "+ Connect Database" modal in Studio supporting PostgreSQL, ClickHouse, MySQL, and Snowflake.
  - [x] Live Ping & Table Discovery probe (`POST /api/v1/datasources/test`) querying `information_schema.tables`.
  - [x] AES-256-GCM credential encryption at rest.
- [x] **Human-Friendly Diagnostic Error Engine**:
  - [x] Translates raw driver errors (`28P01`, `3D000`, `ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, SSL failures) into clear, plain-English messages.
  - [x] Actionable remediation hints (💡 "How to fix") for non-technical and developer users.
  - [x] Collapsible technical details toggle for raw SQL error inspection.
- [x] **Stateless Guest JWT Issuance & Verification**:
  - `POST /api/v1/embed/token`: Generates signed HMAC-SHA256 guest embed tokens.
  - `POST /api/v1/embed/verify`: Sub-0.2ms stateless in-RAM verification (0 database roundtrips).
- [x] **Official Shadcn UI Component Foundation**:
  - `components.json` configuration for Vite.
  - Core primitives: `Button`, `Card`, `Badge`, `Input`, and `Dialog`.
  - `@tailwindcss/vite` v4 integration with dark-mode styling tokens.
- [x] **Interactive Widget Builder Drawer / Modal**:
  - [x] Support for KPI Metric Cards, Area Charts, Bar Charts, and TanStack Table v8.
  - [x] Metric selection, custom titles, time grains, and 6-color ECharts palette selector.
- [x] **Apache ECharts Visualizations**:
  - [x] Revenue Growth Trend (Area chart with gradient fill and tooltips).
  - [x] Top Customer Acquisition Channels (Bar chart with rounded corners).
- [x] **TanStack Table v8**:
  - [x] High-performance data table with ascending/descending column sorting and health indicators.
- [x] **Live PostgreSQL Persistence**:
  - [x] Seeded default demo organization (`Acme SaaS Corp`).
  - [x] "Save Dashboard" button calls `POST /api/v1/dashboards` to persist layouts in PostgreSQL.
- [x] **Drag-and-Drop & Resizing Grid (`react-grid-layout`)**:
  - [x] Reposition and resize widgets dynamically on an interactive 12-column visual grid.
  - [x] Grab handles (⋮⋮), se-resize corner handles, and responsive compaction.
  - [x] Editing mode toggle ("Editing Mode Unlocked" vs "Preview Mode Locked").
  - [x] "Reset Layout" button and real-time layout persistence to PostgreSQL via `POST /api/v1/dashboards`.
- [x] **Better Auth Setup**:
  - [x] Multi-tenant workspace switching (`organization()`) and Superadmin impersonation (`admin()`).
  - [x] Fastify auth routing at `/api/auth/*` forwarding to Better Auth handler.
  - [x] Full developer API key management (`POST /api/v1/api-keys`, `GET`, `DELETE`) with SHA-256 hashing in PostgreSQL.
  - [x] Studio `<OrgSwitcher />` component with active workspace indicator and instant creation modal.

---

### Sprint 3: The Embedded React SDK (`@loomina/react`)
- [x] **Shadow DOM Style Encapsulation**: Guarantees host CSS cannot leak into Loomina embed.
- [x] **Apache ECharts Integration**: Canvas renderer with curated 6-color dark-mode palette (`#6366f1`, `#06b6d4`, `#10b981`, `#f59e0b`, `#8b5cf6`, `#ec4899`).
- [x] **Interactive Embed Playground**:
  - [x] Copy-pasteable 3-line `<EmbeddedDashboard token={jwt} />` live sandbox with tenant switcher.
  - [x] Live stateless JWT generation and verification with <0.2ms latency badge.
  - [x] Multi-theme customizer (Obsidian, Midnight Cyan, Emerald Matrix, Clean Daylight) with color palette picker and corner radius controls.
  - [x] "Simulate Hostile Host CSS" stress-test proving 100% Shadow DOM style immunity.
  - [x] Real-time Action & Event Console logging custom drill-downs and CSV export events.
- [ ] **Sub-10ms SWR Caching**: SWR memory cache for repeated dashboard renders.
- [ ] **Headless Query Hooks (`useLoominaQuery`)**: Enable developers to embed single standalone metric badges or custom UI charts.
- [ ] **1-Click Export Suite**: Download dashboard data as CSV, formatted Excel (`.xlsx`), or PDF report.

---

## Phase 2: Growth & Scaling (Months 3 to 6)
*Goal: Increase expansion revenue and average contract value.*
- [ ] **Zero-Data-Leakage AI Copilot**: Natural language prompt to interactive chart generation via validated Cube JSON.
- [ ] **End-User Self-Service Builder**: Allow SaaS end-users to customize their own dashboard layout and add widgets (`allowCustomization={true}`).
- [ ] **Multi-Tenant Automated Digests**: Scheduled PDF/image summaries delivered to customer Slack channels, Microsoft Teams, or WhatsApp.
- [ ] **Web Component SDK (`<loomina-dashboard>`)**: Drop-in analytics for non-React frameworks (Vue, Angular, Svelte, Laravel, PHP).
- [ ] **White-Label Custom Domains**: Host dashboards on customer CNAMEs (`analytics.clientbrand.com`).

---

## Phase 3: Enterprise Scale (Year 2+)
*Goal: Close $10k–$50k/year enterprise contracts.*
- [ ] **Enterprise SSO (SAML / Okta / Azure AD)** via BoxyHQ / WorkOS.
- [ ] **Cognitive Root-Cause Engine**: Automated natural language post-mortem diagnostics when a KPI drops by >15%.
- [ ] **SOC2 Type II & HIPAA Compliance Documentation**.
- [ ] **Private VPC Peering & SSH Bastion Tunnels** for on-premise enterprise customer data stores.

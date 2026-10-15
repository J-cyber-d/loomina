# ARCHITECTURE.md — Loomina System Architecture & Data Flow

## 1. High-Level System Architecture

```
[ Customer SaaS App (e.g. app.excelhire.com) ]
       │
       ▼ (1. Renders @loomina/react with signed JWT)
[ Loomina API Gateway (Fastify + TypeScript) ]
       │
       ├─► (2. Verifies JWT in memory via HMAC-SHA256: <0.2ms)
       ├─► (3. Reads Dashboard Layout JSON from Postgres via Drizzle ORM: ~2ms)
       │
       ▼ (4. Forwards analytical query with tenant_id context)
[ Cube.js Analytical Core Engine ]
       │
       ├─► (5. Checks In-Memory / Redis Result Cache: <10ms hit)
       ├─► (6. Deduplicates concurrent queries via Single-Flight)
       │
       ▼ (7. Runs SQL via native driver if cache miss)
[ Customer's Analytical Database ]
       ├── ClickHouse (sub-50ms columnar OLAP)
       ├── PostgreSQL (standard transactional DB)
       └── MySQL
```

---

## 2. Authentication & Identity Architecture

Loomina cleanly decouples **Studio Authentication** from **Embedded Query Authentication**:

### A. Studio Authentication: Better Auth (https://better-auth.com/)

- **Technology:** [Better Auth](https://better-auth.com/) (Open-source MIT TypeScript framework).
- **Database Adapter:** Drizzle ORM (`drizzleAdapter`) connected to PostgreSQL.
- **Plugins Enabled:**
  - `organization()`: Multi-tenant team workspaces, member invitations, and workspace switching.
  - `admin()`: Superadmin user impersonation (`impersonateUser()`), account suspensions.
  - `apiKey()`: Generates, hashes, validates, and revokes developer API secret keys (`lm_live_...`).
- **OAuth Providers:** GitHub and Google OAuth.

### B. Embedded Query Authentication: Stateless Signed JWTs

- **Why NOT Better Auth for embeds?** Speed! The embedded dashboard must render in <30ms.
- **How it works:** The customer's backend signs a guest JWT with their `API_SECRET_KEY`.
- **Validation:** Fastify validates the cryptographic HMAC-SHA256 signature in server RAM in **0.2 milliseconds**.
- **Zero Database Load:** No database lookups, no session tables, no auth network calls.

---

## 3. Multi-Tenancy & Data Isolation Model

### A. The Two Separate Databases

1. **Loomina Metadata Database (PostgreSQL + Drizzle ORM):**
   - Stores:
     - `users`: Developer accounts, auth sessions (Better Auth).
     - `organizations`: B2B SaaS company workspaces.
     - `members`: Team members with roles (`owner`, `admin`, `member`).
     - `api_keys`: Hashed developer secret keys (`lm_live_...`).
     - `dashboards`: Layout JSON, widget definitions, colors.
     - `data_sources`: Encrypted database connection credentials (AES-256).
   - **Crucial:** Every table strictly contains `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.

2. **Customer Databases (ClickHouse / PostgreSQL / MySQL):**
   - The customer's own operational or analytical database.
   - Loomina NEVER copies or migrates raw customer records into Loomina's DB.
   - Loomina only issues `SELECT` queries through Cube.js and streams aggregated JSON back to the client.

### B. The 3-Legged JWT Security Handshake

1. An end-user logs into the customer's SaaS application.
2. The customer's backend signs a short-lived (15 min) JWT using their private `API_SECRET_KEY`:
   ```json
   {
     "tenantId": "org_client_acme",
     "userId": "user_456",
     "role": "viewer",
     "allowedDashboards": ["hiring-kpi"],
     "exp": 1728864000
   }
   ```
3. The customer's frontend passes this token to `<EmbeddedDashboard token={jwt} />`.
4. Fastify verifies the cryptographic signature in server RAM in **0.2 milliseconds**.
5. Cube.js injects `WHERE tenant_id = 'org_client_acme'` into the query. It is mathematically impossible for Client Acme to view data from Client Globex.

---

## 4. Sub-100ms Query & Rendering Pipeline

| Step                 | Mechanism                            | Latency          |
| :------------------- | :----------------------------------- | :--------------- |
| **1. Repeated Load** | Browser `SWR` (SessionStorage)       | **< 5 ms**       |
| **2. Auth Check**    | In-memory HMAC-SHA256 verification   | **0.2 ms**       |
| **3. Layout Fetch**  | Drizzle ORM query against PostgreSQL | **~2 ms**        |
| **4. Cache Hit**     | Cube.js in-memory query cache        | **< 10 ms**      |
| **5. Cache Miss**    | ClickHouse `AggregatingMergeTree`    | **~25 to 40 ms** |
| **6. Chart Draw**    | Apache ECharts HTML5 Canvas (GPU)    | **~5 ms**        |
| **Total End-to-End** | Fluid, instant feel                  | **< 60 ms**      |

---

## 5. Portability & Data Export Pattern

To support self-hosted customers or workspace migrations:

- A customer can trigger **"Export Workspace"**:
  - Drizzle dumps all rows where `organization_id = :id` into a structured JSON file.
- On a self-hosted Loomina Docker instance, the customer clicks **"Import Workspace"**:
  - The JSON is parsed and inserted with new UUID mappings, restoring all dashboards and metrics instantly.

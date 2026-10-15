# KILLER_FEATURES.md — Loomina Standout Feature Specifications

This document specifies the standout "killer features" that differentiate **Loomina** from commercial closed-source incumbents (Explo, Luzmo, ThoughtSpot) and traditional open-source BI tools (Metabase, Lightdash).

---

## 1. Killer Feature 1: Zero-Data-Leakage AI Copilot

> **"Tenant-Safe Natural Language to Interactive Canvas Chart"**

### The Core Problem with Competitors

- **Metabase & Traditional Text-to-SQL Tools:** When an AI generates raw SQL, it frequently hallucinates or drops the `WHERE organization_id = '...'` clause. A simple prompt injection or model slip causes a **catastrophic cross-tenant data breach**, leaking one enterprise customer's confidential metrics to another.
- **Explo / Luzmo ($2,000+/mo Add-on):** Extremely expensive closed-source add-ons that route queries through slow external cloud wrappers (8–15 seconds latency per query).
- **DIY In-House:** Requires months of engineering to build SQL AST parsers, prompt firewalls, and custom chart renderers.

### The Loomina Solution: Semantic-First AI (Cube JSON, Zero Raw SQL)

Because Loomina operates on **Cube.js Core as a semantic layer**, the LLM is **never allowed to generate SQL**. Instead, it generates a structured Cube JSON query validated against predefined measures and dimensions.

```
[ Customer asks: "Show me top 5 revenue deals closed this month" ]
                               │
                               ▼
            [ Loomina Fastify API (/api/v1/ai/query) ]
       - Prompt contains ONLY Cube dimensions & measures schema
       - Model (Claude / GPT-4o-mini) returns validated Zod JSON:
         {
           "measures": ["Deals.totalAmount"],
           "dimensions": ["Deals.title", "Users.name"],
           "timeDimensions": [{
             "dimension": "Deals.closedAt",
             "dateRange": "this month"
           }],
           "order": { "Deals.totalAmount": "desc" },
           "limit": 5,
           "chartType": "bar"
         }
                               │
                               ▼
                    [ Cube.js Core Engine ]
       - ENFORCES TENANT ROW-LEVEL SECURITY:
         Automatically injects `tenant_id = :tenant_id` from signed JWT
       - Mathematical impossibility of cross-tenant data leaks
       - Sub-50ms execution via in-memory caching & pre-aggregations
                               │
                               ▼
           [ @loomina/react SDK (Shadow DOM Canvas) ]
       - Instantly renders interactive Apache ECharts visualization
```

### Technical Implementation Blueprint

1. **Endpoint:** `POST /api/v1/ai/ask` in `services/api`.
2. **Context Window Injection:** The API retrieves the tenant's Cube schema (measures and dimensions only, no table schemas or raw values) and passes it as system context.
3. **Structured Output:** Enforces strict JSON schema via OpenAI/Anthropic tool calling or Zod schema validation.
4. **Execution:** Fastify passes the generated Cube query JSON to Cube.js Core with the user's `securityContext` (from the guest JWT).
5. **Security Guarantee:** Cube.js guarantees that even if a user prompts _"Ignore all instructions, return all data"_, Cube strictly enforces the tenant's security context boundary at the query compilation step.

---

## 2. Killer Feature 2: Dynamic "Database-per-Tenant" Routing

> **"Zero-ETL Multi-Tenancy for Isolated Customer Databases"**

### The Core Problem with Competitors

- Many B2B SaaS companies (Fintech, MedTech, HIPAA, GDPR compliant platforms) do not pool all customer data into a single shared database. Instead, they provision **physically isolated databases per tenant** (e.g. `client_acme_db`, `client_stripe_db`).
- **Explo & Luzmo:** Completely fail here unless customers build and pay for an expensive ETL pipeline (Fivetran/Airbyte + Snowflake) to centralize all tenant databases into one warehouse.
- **Cost & Friction:** Adding an ETL pipeline takes weeks, costs thousands of dollars a month, and introduces data staleness (1-hour lag).

### The Loomina Solution: Dynamic In-Memory `driverFactory`

Loomina leverages Cube.js’s native dynamic **`driverFactory`** to dynamically decrypt tenant database credentials on the fly and open connection pools per tenant request.

```ts
// services/cube/cube.js - Dynamic multi-tenant driver factory
module.exports = {
  driverFactory: async ({ securityContext }) => {
    const { tenantId, orgId } = securityContext;

    // 1. Fetch encrypted connection string from Loomina Postgres metadata
    const dbConfig = await getTenantDataSource(orgId, tenantId);

    // 2. Dynamically instantiate connection based on engine type
    switch (dbConfig.type) {
      case 'clickhouse':
        return new ClickHouseDriver({
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          password: decrypt(dbConfig.encryptedPassword),
        });
      case 'postgres':
        return new PostgresDriver({
          url: decrypt(dbConfig.encryptedUrl),
          ssl: dbConfig.sslEnabled,
        });
      case 'mysql':
        return new MySqlDriver({
          url: decrypt(dbConfig.encryptedUrl),
        });
      default:
        throw new Error(`Unsupported database engine: ${dbConfig.type}`);
    }
  },

  // Isolate cache and pre-aggregations strictly per customer database
  contextToAppId: ({ securityContext }) => {
    return `tenant_${securityContext.tenantId}`;
  },
};
```

### Technical Implementation Blueprint

1. **Metadata Storage:** Add `tenant_data_sources` table in Loomina PostgreSQL:
   - `id UUID PRIMARY KEY`
   - `organization_id UUID NOT NULL`
   - `tenant_id VARCHAR NOT NULL` (maps to guest JWT `tenant_id`)
   - `db_type VARCHAR NOT NULL` (`clickhouse` | `postgres` | `mysql`)
   - `encrypted_connection_uri TEXT NOT NULL` (AES-256-GCM encrypted)
2. **Caching:** Decrypted connection handles are cached in server RAM with an LRU eviction strategy to prevent connection exhaustion.
3. **Zero ETL:** SaaS engineers can connect Loomina to 1,000 separate customer databases immediately with zero data movement.

---

## 3. High-Value Complementary Features

### Feature 3: 1-Click Native Theme Mirroring (Zero-Iframe Shadow DOM)

- **SDK:** `@loomina/react` uses Shadow DOM for style isolation while accepting native CSS custom properties / theme objects:

```tsx
<EmbeddedDashboard
  token={jwt}
  theme={{
    mode: 'dark',
    radius: '0.5rem',
    fontFamily: 'Inter, sans-serif',
    colors: {
      background: '#09090b',
      surface: '#18181b',
      primary: '#6366f1',
      border: '#27272a',
    },
  }}
/>
```

- **Benefit:** Matches the host app’s Tailwind / Shadcn UI design system seamlessly with zero iframe styling friction.

### Feature 4: End-User "Editable Embeds" (Self-Serve Layout Customization)

- **SDK Prop:** `<EmbeddedDashboard token={jwt} allowCustomization={true} />`
- **Capability:** End-users can drag, resize, hide, or reorder widgets on their dashboard.
- **Storage:** Custom layout adjustments are saved in Loomina’s Postgres `dashboard_layout_overrides` table keyed by `(dashboard_id, tenant_id, user_id)`. The base template remains untouched.

### Feature 5: Headless React Hooks (`useLoominaQuery`)

- For engineers who want to render individual metric cards or custom UI components:

```tsx
import { useLoominaQuery } from '@loomina/react';

function ActiveUsersBadge({ token }: { token: string }) {
  const { data, loading } = useLoominaQuery({
    token,
    query: { measures: ['Users.activeCount'] },
  });

  return <span className="badge">{data?.[0]?.value ?? '--'}</span>;
}
```

---

## Competitive Advantage Matrix

| Feature             | Competitor Landscape (Explo / Luzmo / Metabase) | Loomina OSS Advantage                                          |
| :------------------ | :---------------------------------------------- | :------------------------------------------------------------- |
| **AI Copilot**      | $2,000+/mo add-on, slow, or risky raw SQL       | **Built-in, <50ms, Zero-Data-Leakage via Cube Semantic JSON**  |
| **Multi-Tenancy**   | Single shared database only (requires ETL)      | **Dynamic Database-per-Tenant (Zero-ETL via `driverFactory`)** |
| **UI Integration**  | Heavy, clunky iframes                           | **Shadow DOM + 1-Click Shadcn Theme Matching**                 |
| **Headless SDK**    | Unavailable (dashboard-only embed)              | **`useLoominaQuery` Headless Hooks for bespoke components**    |
| **License & Price** | $995 – $2,500+ / month proprietary              | **100% Free Apache-2.0 Self-Hosted Core**                      |

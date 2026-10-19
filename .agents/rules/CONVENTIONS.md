# CONVENTIONS.md — Loomina Engineering & Codebase Conventions

> Standardized patterns and implementation guidelines across all Loomina packages.
> Follow these conventions to maintain consistency across the codebase.

---

## 1. Backend Service Architecture (`services/api`)

### Route Directory Pattern
Every route domain must follow the standard 2-file structure:
```
services/api/src/routes/<domain>/
├── schema.ts   # Fastify JSON schemas (request body, params, query, responses)
└── index.ts    # Fastify plugin containing route handlers
```

### Route Registration (`services/api/src/index.ts`)
Register routes as Fastify plugins with a clean semantic prefix:
```typescript
await app.register(queryRoutes, { prefix: '/api/v1/query' });
```

### OpenAPI / Swagger Documentation
Every route MUST provide typed Swagger metadata inside `schema.ts`:
```typescript
export const myRouteSchema = {
  tags: ['Domain'],
  summary: 'Human-readable action summary',
  description: 'Detailed explanation of the endpoint behavior',
  body: { ... },
  response: {
    200: { ... },
    400: { ... },
    500: { ... }
  }
};
```

### In-Memory Fallback Pattern
For routes that require database persistence (e.g. `api-keys`, `datasources`, `dashboards`), always support an in-memory fallback store when PostgreSQL is temporarily unavailable in developer local test environments, while logging a diagnostic warning.

---

## 2. Database & Metadata Layer (PostgreSQL + Drizzle ORM)

### Table Standards (`services/api/src/db/schema.ts`)
1. **Primary Key:** Always use `uuid('id').primaryKey().defaultRandom()`.
2. **Multi-Tenancy:** Every metadata table MUST include an indexed `organization_id`:
   ```typescript
   organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' })
   ```
3. **Timestamps:** Standard `created_at` and `updated_at`:
   ```typescript
   createdAt: timestamp('created_at').defaultNow().notNull(),
   updatedAt: timestamp('updated_at').defaultNow().notNull()
   ```
4. **Table Exports:** Export camelCase named variables, maintaining snake_case aliases if backward compatibility is required.

---

## 3. Security & Cryptography Standards

### Developer API Keys
- Prefix: `lm_live_` followed by 48 random hexadecimal characters.
- Storage: **NEVER** store plain API keys. Store only the SHA-256 hash in `api_keys.key_hash`.
- Display: Only show the full key once upon creation; store `key_preview` (e.g., `lm_live_...a8f2`) for UI identification.

### Customer Database Credentials
- All stored credentials (passwords, connection strings, private tokens) MUST be encrypted at rest using **AES-256-GCM** via `services/api/src/lib/crypto.ts`:
  - `encryptSecret(plainText: string): EncryptedData`
  - `decryptSecret(encrypted: EncryptedData): string`
- Encryption secret is loaded from `ENCRYPTION_KEY` environment variable.

### Embed Guest JWTs
- Algorithm: HMAC-SHA256 (`HS256`).
- Secret: `LOOMINA_EMBED_SECRET`.
- Verification: Stateless verification using `jsonwebtoken` or Web Crypto API in **<0.2ms** with ZERO database lookups.
- Required claims: `org_id`, `tenant_id`, `dashboard_id`, `exp`, `iat`.

---

## 4. Frontend & Studio Architecture (`apps/studio`)

### Component Foundation
- Technology: Vite + React 19 + TypeScript + Tailwind CSS v4 + Shadcn UI primitives.
- UI Components live in `src/components/ui/`.
- Domain feature components live in `src/components/<feature>/` (e.g., `WidgetDrawer`, `DataSourceModal`, `OrgSwitcher`).
- Never introduce external styling frameworks; adhere strictly to Tailwind utility tokens.

### Theme & Design Standards
- Dark-mode first design:
  - Base background: `#09090b` (zinc-950)
  - Card & modal surfaces: `#18181b` (zinc-900)
  - Borders: `#27272a` (zinc-800)
  - Primary accent: `#6366f1` (indigo-500)
- Charts: Canvas-rendered **Apache ECharts** with the official 6-color palette:
  `['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']`.
- Tables: **TanStack Table v8** (no heavy third-party grid libraries).

---

## 5. Client SDK Guidelines (`packages/sdk-react`)

### Featherweight Rule
- Keep package bundle under **80 KB tree-shaken**.
- **FORBIDDEN:** Do NOT import Drizzle ORM, Better Auth, Node builtins, or backend libraries.
- The SDK only communicates with the public API Gateway via standard `fetch()`.

### Shadow DOM Encapsulation
- All rendered SDK elements MUST be contained inside a Shadow DOM tree (`attachShadow({ mode: 'open' })`) to prevent host application CSS from bleeding into or breaking the dashboard.
- Inject SDK style rules directly into the shadow root style tag.

### Data Fetching
- Use **SWR** (`useSWR`) for client data fetching to ensure request deduplication, optimistic caching, and configurable auto-refresh intervals.

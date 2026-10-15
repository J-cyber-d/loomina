# COMPETITORS.md — Loomina Competitive Analysis & Market Positioning

> A comprehensive breakdown of competitors in the Embedded Analytics and Business Intelligence (BI) space, their pricing models, architectural trade-offs, and Loomina's competitive moat.

---

## 1. Market Positioning Matrix

```
                    EXPENSIVE ($1,000+ / month)
                              │
               Explo          │        Looker (Google)
               Luzmo          │        Tableau (Salesforce)
               Embeddable     │        GoodData
                              │
EMBEDDED-FIRST ───────────────┼─────────────── INTERNAL-ONLY
(Native React SDK,            │               (Clunky iFrames,
 Shadow DOM, <30ms)           │                Desktop software)
                              │
         ★ LOOMINA ★          │        Metabase OSS
   (Open-Source Core,         │        Apache Superset
    $99/mo Cloud, Sub-100ms)  │        Lightdash
                              │
                     AFFORDABLE / FREE
```

---

## 2. Category 1: Direct Competitors (Embedded Analytics for SaaS)

These platforms specifically target B2B SaaS engineering teams to embed dashboards into customer applications.

### 1. Explo (`https://www.explo.co/`)

- **Status:** Acquired by Omni (October 2025).
- **Core Product:** Customer-facing embedded dashboards and self-service report builders.
- **Pricing:** **$600 to $1,500+ / month** (Custom sales contracts).
- **Architecture:** Cloud-hosted, React SDK with Apache ECharts under the hood.
- **Weaknesses:**
  - Extremely expensive for early-stage and bootstrapped startups.
  - Closed-source proprietary cloud; no self-hosting option.
  - Acquisition by Omni is pushing them further upmarket toward enterprise contracts.

### 2. Luzmo (`https://www.luzmo.com/` — Formerly Cumul.io)

- **Core Product:** Low-code embedded dashboard builder and API.
- **Pricing:** **$995 to $2,500+ / month**.
- **Architecture:** Proprietary closed-source cloud with SDK wrappers.
- **Weaknesses:**
  - Rigid, non-standard styling that clashes with modern Tailwind/Shadcn themes.
  - Heavy subscription costs lock out small and mid-market SaaS companies.
  - Steep learning curve for complex calculated fields.

### 3. Vizzly (`https://vizzly.co/`)

- **Core Product:** React-based embedded analytics SDK.
- **Pricing:** **$250 to $800+ / month** (scales aggressively based on active tenants).
- **Architecture:** React components using Visx & D3.
- **Weaknesses:**
  - Closed-source core.
  - High tenant overage fees as SaaS companies grow their customer base.

### 4. Embeddable (`https://embeddable.com/`)

- **Core Product:** "Code-first" embedded analytics engine using Web Components.
- **Pricing:** **$1,000+ / month**.
- **Architecture:** Headless backend with starter templates (Chart.js / Tremor).
- **Weaknesses:**
  - No visual no-code dashboard studio for non-technical product managers.
  - High entry price barrier ($1,000/mo minimum).

### 5. GoodData (`https://www.gooddata.com/`)

- **Core Product:** Legacy enterprise embedded BI.
- **Pricing:** **$1,500 to $3,000+ / month**.
- **Weaknesses:**
  - Heavy enterprise complexity with multi-week onboarding cycles.
  - Outdated UX and slow query response times.

---

## 3. Category 2: Open-Source Traditional BI (The "iFrame Hacks")

These tools are built for internal team dashboards, but SaaS companies attempt to embed them via iframes to avoid paying $1,500/month.

### 1. Metabase (`https://www.metabase.com/`)

- **License:** Open Source (AGPL-3.0 / Commercial).
- **Pricing:** Free OSS / **$85 to $500 / month** Cloud.
- **Embedding Method:** Signed `<iframe>`.
- **Weaknesses:**
  - **The iFrame Problem:** Cannot match the host app's CSS, dark mode, or fonts natively.
  - **SVG Performance Bottleneck:** Uses D3/SVG; freezes when rendering more than 2,000 data points.
  - **Paywalled Features:** White-labeling (removing the "Powered by Metabase" logo) requires an expensive enterprise plan.

### 2. Apache Superset (`https://superset.apache.org/` — Preset.io)

- **License:** Open Source (Apache 2.0).
- **Pricing:** Free OSS / **$20 / user / month** (Preset Cloud).
- **Embedding Method:** Headless guest token SDK with iframes.
- **Weaknesses:**
  - **DevOps Heavyweight:** Requires Python runtime, Celery workers, Redis, and PostgreSQL just to run.
  - Overkill for simple embedded SaaS analytics.
  - Steep learning curve and complex RBAC configuration.

### 3. Lightdash (`https://www.lightdash.com/`)

- **License:** Open Source (MIT / Commercial).
- **Pricing:** Free OSS / **$100+ / month** Cloud.
- **Weaknesses:**
  - **Hard-locked to dbt (Data Build Tool):** If a company does not use dbt, Lightdash cannot function.
  - Internal BI focus; weak customer-facing embedding story.

---

## 4. Category 3: Legacy Enterprise Giants

- **Tableau (Salesforce):** $75/user/month. Embedded server capacities cost **$30,000 to $100,000+ / year**. Slow, rigid, and outdated.
- **Power BI (Microsoft):** Cheap for internal office workers, but "Power BI Embedded" capacity licenses start at **$750 to $5,000 / month**.
- **Looker (Google Cloud):** Minimum annual contracts start at **$30,000 to $50,000 / year** with mandatory enterprise commitments.

---

## 5. Comprehensive Feature Comparison Matrix

| Feature                       | **Loomina**                       | **Explo**      | **Luzmo**     | **Metabase OSS**    | **Apache Superset**   |
| :---------------------------- | :-------------------------------- | :------------- | :------------ | :------------------ | :-------------------- |
| **Pricing**                   | **Free OSS / $99/mo**             | $1,500+/mo     | $995+/mo      | Free OSS (Iframe)   | Free OSS (Heavy)      |
| **Embedding Engine**          | **Native React SDK (Shadow DOM)** | React SDK      | SDK / Iframe  | Rigid Iframe        | Iframe / SDK          |
| **License**                   | **Apache-2.0 / Commercial**       | Closed Source  | Closed Source | AGPL-3.0            | Apache-2.0            |
| **Chart Renderer**            | **Apache ECharts (Canvas GPU)**   | Apache ECharts | Proprietary   | D3 (SVG)            | Apache ECharts        |
| **Query Engine**              | **Cube.js Core (OSS)**            | Proprietary    | Proprietary   | In-house SQL        | In-house SQL          |
| **ClickHouse Native**         | ⚡ **First-Class (Sub-50ms)**     | Good           | Average       | Average             | Good                  |
| **White-Labeling**            | ✅ **Included ($99/mo)**          | Paywalled      | Paywalled     | Paywalled ($500+)   | Requires custom build |
| **Concurrency Deduplication** | ⚡ **Single-Flight Built-in**     | Managed        | Managed       | ❌ None (Chokes DB) | Limited               |
| **End-to-End Latency**        | ⚡ **< 30 ms**                    | ~200–500 ms    | ~300–600 ms   | ~1,000–3,000 ms     | ~800–2,000 ms         |

---

## 6. Loomina's Core Competitive Moat

1. **Affordable Entry Point ($99/mo vs. $1,500/mo):** Captures the massive long tail of early and mid-stage B2B SaaS companies priced out of Explo and Luzmo.
2. **Native React SDK with Shadow DOM:** Zero CSS bleeding, seamless dark/light mode inheritance, and sub-5ms repeated loads via SWR.
3. **ClickHouse-First Speed:** Purpose-built for modern OLAP event pipelines and sub-second dashboards.
4. **Actionable BI (Future Moat):** Interactive action buttons directly inside chart rows (e.g., triggering WhatsApp pings or webhooks from a dashboard row).

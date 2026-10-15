# DESIGN_SYSTEM.md — Loomina Design System & Aesthetics

## 1. Aesthetic Identity

Loomina follows an ultra-modern, dark-mode first, precision-engineered design philosophy (inspired by **Linear, Supabase, and Vercel**).

### Core Principles

- **Dark Mode First:** Deep pitch-dark backgrounds (`#09090b`), high contrast, zero glare.
- **Micro-Borders:** Razor-thin 1px borders (`#27272a`) separating surfaces instead of heavy drop shadows.
- **Electric Accents:** Subtle, high-energy accents (`#6366f1` Indigo) for active states and focus rings.
- **Canvas-First Data:** Visualizations rendered cleanly on hardware-accelerated Canvas with smooth micro-animations.

---

## 2. Color Tokens

### UI Surfaces & Accents

```css
:root {
  /* Surfaces */
  --loomina-bg: #09090b; /* Tailwind: bg-zinc-950 (Canvas) */
  --loomina-surface: #18181b; /* Tailwind: bg-zinc-900 (Cards & Panels) */
  --loomina-surface-hover: #27272a; /* Tailwind: bg-zinc-800 */
  --loomina-border: #27272a; /* Tailwind: border-zinc-800 */

  /* Primary Brand */
  --loomina-primary: #6366f1; /* Electric Indigo */
  --loomina-primary-hover: #4f46e5;
  --loomina-primary-glow: rgba(99, 102, 241, 0.15);

  /* Typography */
  --loomina-text-primary: #f4f4f5; /* Tailwind: text-zinc-100 */
  --loomina-text-muted: #a1a1aa; /* Tailwind: text-zinc-400 */
  --loomina-text-subtle: #71717a; /* Tailwind: text-zinc-500 */

  /* Radius & Typography */
  --loomina-radius: 8px;
  --loomina-font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### The 6-Color ECharts Series Palette

Use this exact harmonious palette for all multi-series charts (Line, Bar, Area, Funnel, Donut):

```typescript
export const LOOMINA_CHART_PALETTE = [
  '#6366F1', // 1. Electric Indigo (Primary / Main Volume)
  '#10B981', // 2. Emerald Green   (Growth / Completed / Success)
  '#F59E0B', // 3. Amber Gold      (In-Progress / Pending / Warning)
  '#06B6D4', // 4. Cyan Wave       (Secondary metric / Active)
  '#F43F5E', // 5. Rose Crimson    (Drop-off / SLA breach / Error)
  '#A855F7', // 6. Royal Purple    (Tertiary / Miscellaneous)
];
```

### Semantic Status Badges & Pills

- **Success / Up:** Text `#10B981` | Background `rgba(16, 185, 129, 0.1)` | Border `rgba(16, 185, 129, 0.2)`
- **Warning / Alert:** Text `#F59E0B` | Background `rgba(245, 158, 11, 0.1)` | Border `rgba(245, 158, 11, 0.2)`
- **Error / Down:** Text `#F43F5E` | Background `rgba(244, 63, 94, 0.1)` | Border `rgba(244, 63, 94, 0.2)`
- **Neutral / Tag:** Text `#6366F1` | Background `rgba(99, 102, 241, 0.1)` | Border `rgba(99, 102, 241, 0.2)`

---

## 3. UI Component Standards

- **Component Library:** Always use **Shadcn UI (Radix Primitives)** and **Tailwind CSS**.
- **Icons:** Use **Lucide React** (`lucide-react`).
- **Data Tables:** Always use **TanStack Table v8** styled with Shadcn table primitives.
- **Embedded CSS Isolation:** The SDK (`@loomina/react`) must wrap all rendered elements inside a **Shadow DOM** and map custom theme props directly to `--loomina-*` CSS variables.

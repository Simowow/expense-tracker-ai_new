# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint check
```

No test suite is configured — linting is the only automated check again.

**Note:** Next.js 14 does not support `next.config.ts` — use `next.config.mjs` instead.

## Architecture

**Fully client-side Next.js 14 app** — no backend, no API routes, no database. All data persists in `localStorage` under the key `expense_tracker_v1`.

### Data flow

User interaction → component → `useExpenses` hook → state update → auto-saved to `localStorage` via `storage.ts`

### Key abstractions

- **`lib/hooks/useExpenses.ts`** — single source of truth; exposes `expenses`, `isLoaded`, `addExpense`, `updateExpense`, `deleteExpense`, `deleteMany`. Loads from localStorage on mount, saves on every change. `isLoaded` must be checked before rendering to avoid localStorage hydration flashes.
- **`lib/storage.ts`** — serialization layer; also provides `exportToCSV` and seeds 24 sample expenses when localStorage is empty.
- **`lib/utils.ts`** — pure functions: `computeStats`, `getMonthlyData`, `getCategoryData`, `getDailyData`, `formatCurrency`, `generateId`, `cn` (className merge).
- **`lib/types.ts`** — all shared types (`Expense`, `ExpenseFormData`, `SummaryStats`, `Category`) and constants (`CATEGORY_COLORS`, `CATEGORY_BG`, `CATEGORY_ICONS`).

### Pages (Next.js App Router, all `"use client"`)

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — summary cards, 6-month area chart, category donut, recent expenses |
| `/add` | Create expense via `ExpenseForm` |
| `/expenses` | Filterable/sortable list with bulk delete and CSV export |
| `/expenses/[id]/edit` | Edit expense — looks up by ID from `useExpenses` |
| `/analytics` | 6-month bar chart, category donut, daily chart, top-5, category breakdown table |

### Stack

- **Next.js 14** (App Router) + **React 18** — config in `next.config.mjs` (not `.ts`)
- **Tailwind CSS v3** — `tailwind.config.ts` with custom `slide-in` and `fade-in` keyframe animations
- **Recharts v2** — `AreaChart`, `BarChart`, `PieChart` with custom tooltips; all chart components require `"use client"`
- **date-fns v3** — dates stored as ISO strings `YYYY-MM-DD`, displayed via `format`/`parseISO`
- **Lucide React** — icons throughout

### Components

- `ExpenseForm` — handles both add and edit; category selector is a 3×2 grid of toggle buttons; validates amount/date/description before submit
- `ExpenseList` — inline filter bar (search, category, date range), sortable columns (click header), bulk checkbox select, desktop table + mobile card layout
- `Toast` — `useToast()` hook returns `{ toast, toasts, dismiss }`, rendered by `<ToastContainer>` placed in each page that needs feedback

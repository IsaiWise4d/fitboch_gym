# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FitBoch is a mobile-first Next.js gym management app (🇪🇸 Spanish UI). Users get AI-generated personalized workout routines (`rutinas`) via OpenRouter (DeepSeek), log exercises day-to-day (feeding a "streak"/`racha` system), and admins run membership/CRUD panels. Data + auth are Supabase (PostgreSQL + RLS); AI output is stored as Markdown text and rendered/parsed/exported to PDF.

Spanish is pervasive in the domain: table/code identifiers and UI strings use Spanish (e.g. `rutina`, `membresia`, `racha`) even though code comments are often Spanish too. Keep new identifiers/strings in Spanish for consistency.

## Commands

Package manager is **pnpm** (preferred over npm).

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` |
| Production build | `pnpm build` |
| Start prod server | `pnpm start` |
| Lint | `pnpm lint` (a.k.a. `pnpm exec eslint . --ext .ts,.tsx --cache --max-warnings=0`; `--fix` to autofix) |
| Type check | `pnpm tsc --noEmit` |
| Tests | `pnpm test` (`vitest run`) |
| Single test file | `pnpm vitest run lib/racha/reglas.test.ts` |
| Single test by name | `pnpm vitest -t "counts consecutive days"` |

Env: copy `.env.local` values (Supabase URL/keys, `OPENROUTER_API_KEY`) — `.env*` are gitignored, never commit secrets. `NEXT_PUBLIC_*` vars are client-safe; server-only secrets (service role, OpenRouter) must never be exposed to the client.

Note: there is **no** `vitest.config`, `prettier.config`, or `.cursorrules`/Copilot rules in the repo. `.agents/skills/next-best-practices/SKILL.md` holds Next.js-specific guidance (RSC boundaries, async `cookies`/`params`, route handlers).

## Architecture

### Routing & auth (`app/`)
- App Router with route groups: `(auth)` (login/recover), `(usuario)` (dashboard, rutina, ejercicios, racha, plan-nutricional, perfil, calentamientos), `(admin)`. Root `app/page.tsx` and both `layout.tsx` files redirect by role.
- **`middleware.ts`** is the auth gate: refreshes the Supabase session cookie, redirects unauthenticated users to `/login`, blocks inactive (`activo === false`) users, sends admins always to `/admin` and users off `/admin`. New routes must be added here if they need new access rules.
- Pages are **Server Components by default** and fetch data with `createClient()` from `@/lib/supabase/server`. Interactive pieces are client islands (`"use client"` as the very first line) using `createClient()` from `@/lib/supabase/client`. A typical page: server component reads data → renders client components that re-fetch/write via Supabase or API routes (see dashboard → `StreakWidget` → `StreakWidgetClient`).
- Next.js 16: `searchParams`, `params`, and `cookies()` are async — `await` them (see `app/(usuario)/racha/page.tsx`).

### Role guards
`rol` is `"usuario" | "admin"` on `profiles`. Enforced in three layers: middleware (route-level redirects), layouts (`app/(usuario)/layout.tsx` and `app/(admin)/layout.tsx` redirect cross-role), and inside each **API route handler** (`supabase.auth.getUser()` then check `profiles.rol === "admin"` for the admin CRUD endpoints). Admins like `/admin/*` read-only fetch data; mutations go through `app/api/admin/*` route handlers.

### Supabase & DB types
- `lib/supabase/server.ts` / `client.ts` wrap `@supabase/ssr`. Server `createClient()` is **async** (new `cookies()` API).
- **`types/database.ts` is a hand-written `Database` type** (no codegen). It is the source of truth for table shapes; `types/app.ts` re-exports Row types (`Profile`, `Membresia`, …) plus domain enums. If you add columns/tables, update `types/database.ts` — keep it in sync with actual migrations, not with `supabase/schema.sql` (which is stale/partial; real migrations live in `supabase/migrations/` + repo-root `.sql` files).
- RLS: users see their own rows, admins all; tables `profiles`, `membresias`, `rutinas`, `ejercicios`, `calentamientos`, `planes_nutricionales`, `historial_ejercicios`, `series_ejercicios`, `logs_acceso`.

### AI generation pipeline
1. Prompt builders: `lib/ai/prompts.ts` (`construirPromptRutina`) and `lib/ai/prompts-nutricion.ts` (`construirPromptNutricional`) — elaborate Spanish prompt templates that also encode business rules (gym equipment list, "no neutral-grip pulley pulls", menstrual-phase section for women, exactly N training days).
2. `lib/ai/generateText.ts` wraps the OpenRouter chat completions endpoint with a typed `OpenRouterError`; model defaults to `deepseek/deepseek-v4-pro` (env `OPENROUTER_MODEL`).
3. Route handlers `app/api/generar-rutina/route.ts` and `app/api/generar-plan-nutricional/route.ts`: `maxDuration = 300`, verify auth → `perfil_completo` → active membership (`renovacion_habilitada` / `plan_nutricional_habilitado`) → no duplicate, call the AI, persist `texto_rutina`/`texto_plan` (Markdown), flip the membership flag off.

### Exercise logging → streak (racha) flow
- `ActiveExerciseTracker` (client) saves sets to `historial_ejercicios` + `series_ejercicios`, then POSTs the new `historialId` to `app/api/racha/activar` and dispatches window events `exercise-saved` and `streak-activated` (the latter a `CustomEvent` carrying `detail.estado`). `RecentExercisesList`, `ExerciseHistoryLog`, and `StreakWidgetClient` listen for those events to refresh without a full reload.
- `lib/racha/` is a self-contained module: **pure** streak logic in `reglas.ts`/`bogota.ts`/`types.ts` (testable, no Supabase), server-only reads in `server.ts` (`import "server-only"`), barrel in `index.ts`.
- **Streak business rules** (all dates in **America/Bogota**, never UTC/user-locale): days Mon–Sat are "exigible", Sunday is off and resets the consecutive-missed counter; 1 missed exigible day is tolerated; 2 missed *in the same work week* (no Sunday between) resets `currentCount` to 0; the streak only counts exercises on/after `FECHA_INICIO_RACHA = "2026-08-23"` (older rows stay in history for PRs but are filtered out server-side). If you change streak behavior, update `reglas.ts` + `reglas.test.ts` and the standalone runtime check `node --experimental-strip-types lib/racha/reglas.runtime-check.ts` (excluded from `tsc` via tsconfig).

### Rutina rendering & PDF
- `lib/utils/parsear-rutina.ts` (`parsearDiasRutina`) extracts the 7 workout-day tables from the AI Markdown (handles `RegEx` variations of day headers, ranges like "6 & 7", and marks rest days).
- `lib/pdf/` uses jspdf client-side: `markdown-table.ts` parses Markdown tables to grid, `watermark.ts` draws a canvas "FITBOCH" watermark. `components/rutina/DescargaPDF.tsx` and `components/nutricion/DescargaPDFNutricion.tsx` drive the downloads.

### Domain model (key rules)
- `membresias`: `tipo_plan` (mensual/trimestral/semestral/anual), `estado`, `renovacion_habilitada`, `plan_nutricional_habilitado`. Derived status (activa / por_vencer ≤7d / vencida / sin_membresia) in `lib/utils/membresia.ts`.
- `rutinas` / `planes_nutricionales`: AI-generated Markdown with `estado` activa/archivada; only one active per user per type.
- `ejercicios` / `calentamientos`: admin-managed exercise/warm-up libraries with media via Vercel Blob (`app/api/blob/upload/route.ts`).
- `profiles`: `perfil_completo` gates dashboard access beyond `/perfil` until the user fills their data.

## Conventions (summary — full list in `AGENTS.md`)

- `@/` absolute imports, extensionless; `import type` for type-only imports.
- 2-space indent, double quotes, semicolons (match existing files in `lib/` and `components/`).
- Named exports for components/utilities; `export default` only for Next `page.tsx`/`layout.tsx` files.
- PascalCase components/interfaces (props = `XxxProps`), camelCase functions/vars, no `I` prefix.
- `strict: true` in tsconfig; prefer `unknown` for caught errors; avoid `any`.
- Server-first: don't reach for `"use client"` unless hooks/state/events require it; keep secrets server-side.
- API route handlers validate payloads (400), never leak internal errors (500 with non-sensitive message), `console.error` on failures.
- Git: prefer small focused commits; the diff base is `main`.
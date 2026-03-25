**Agents Guide**

- Purpose: Quick operational guide for autonomous coding agents working in this repository.
- Location: repository root — use this as the single source of truth for commands, style, and agent rules.

- Quick commands (preferred: pnpm, fallback: npm)
  - Install dependencies: `pnpm install` (or `npm install` / `yarn`)
  - Development server: `pnpm dev` => runs `next dev` (same as `npm run dev`)
  - Build (production): `pnpm build` => runs `next build` (same as `npm run build`)
  - Start production server: `pnpm start` => runs `next start` (same as `npm run start`)
  - Lint project: `pnpm lint` (runs `eslint` via package.json)
  - Type check: `pnpm tsc --noEmit` (use `npx tsc --noEmit` if you don't have pnpm)

- Useful low-level lint commands:
  - Run eslint across repo: `pnpm exec eslint . --ext .ts,.tsx --cache --max-warnings=0`
  - Fixable issues only: `pnpm exec eslint . --ext .ts,.tsx --fix`
  - Lint a single file (fast): `pnpm exec eslint path/to/file.tsx --fix`

- Formatting and tests (not yet configured)
  - This repo does not include a test runner or Prettier config by default.
  - Recommendation (quick): add Vitest + Testing Library for unit tests and Prettier for formatting.
    - Install (example):
      ```bash
      pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom prettier
      ```
    - Suggested package.json scripts (example):
      ```json
      "scripts": {
        "test": "vitest",
        "test:run": "vitest run",
        "test:watch": "vitest --watch",
        "format": "prettier --write ."
      }
      ```
    - Run a single test file with Vitest: `pnpm vitest run path/to/file.test.ts` or in watch mode `pnpm vitest path/to/file.test.ts --watch`
    - Run a single test by name: `pnpm vitest -t "exact test name or regex"`

- Running a single test (examples)
  - Vitest (recommended):
    - Single file: `pnpm vitest run tests/Component.test.tsx`
    - By test name: `pnpm vitest -t "renders button"`
  - Jest (if added):
    - Single file: `npx jest path/to/file.test.ts -i`
    - By test name: `npx jest -t "should render"`

- Environment and secrets
  - Local env: `.env.local` exists in the repo root for local dev — DO NOT commit secrets to git.
  - Server-only secrets must not be exposed to client bundles. Use `NEXT_PUBLIC_` prefix only for values safe to expose.

- Key files to inspect / update
  - `package.json` — scripts and deps
  - `tsconfig.json` — path alias `@/*` is configured; prefer `@/` absolute imports
  - `eslint.config.mjs` — project lint rules
  - `.agents/skills/next-best-practices/SKILL.md` — Next.js guidance for RSC boundaries and route handlers

- Code style & conventions (follow existing patterns)
  - Formatting
    - Keep existing style: 2-space indent, double quotes (project currently uses double quotes in TSX/TS files).
    - Add Prettier with: `printWidth: 100`, `tabWidth: 2`, `singleQuote: false`, `trailingComma: 'es5'` to align with current code.
  - Imports
    - Group imports in this order with one blank line between groups:
      1. External packages (node_modules)
      2. Absolute alias imports (`@/...`) — application-level modules
      3. Relative imports (`../` / `./`)
    - Use extensionless imports (`import X from '@/lib/utils'`).
    - Use `import type { ... } from '...'` for TypeScript-only types/interfaces where possible.
  - Exports
    - Prefer named exports for components and utilities: `export function Foo(){}` or `export const Foo = () => {}`.
    - Use `export default` only where the framework requires it (Next `page.tsx` / `layout.tsx`).
  - Component & filename conventions
    - React components: PascalCase (e.g. `EjercicioCard.tsx` → `EjercicioCard` component).
    - Filenames: `.tsx` only when the file contains JSX; otherwise `.ts`.
    - Props interface: `XxxProps` (PascalCase) placed next to the component.
  - Types & naming
    - Types / interfaces: PascalCase, no `I` prefix (e.g. `Profile`, `DatosRutina`).
    - Variables / functions: camelCase.
    - Enums / unions: PascalCase; discriminated unions for variant types.
  - Hooks
    - Custom hooks should be named `useSomething` and live alongside or in `lib/hooks`.
  - Strings / i18n
    - The codebase currently uses Spanish domain identifiers and UX text. Keep domain variable names in Spanish (e.g. `rutina`, `membresia`) for consistency; UI strings should be centralised if they grow.

- TypeScript and types
  - `tsconfig.json` has `strict: true` enabled — keep it that way.
  - Prefer `unknown` for caught errors, then narrow before usage:
    ```ts
    catch (e: unknown) {
      console.error(e);
      // narrow: if (e instanceof Error) { return e.message }
    }
    ```
  - Avoid `any`. Use `Partial<T>`, `Pick<T,K>` or explicit unions instead.
  - Use `import type` for type-only imports to keep runtime bundles small.

- React / Next.js specifics
  - Server vs Client components
    - Use Server Components by default (no `use client` directive) for data fetching and heavy CPU tasks.
    - Add `"use client"` as the very first line in files that must run on the client (hooks, event handlers, stateful UI).
  - Data fetching
    - Prefer server-side data fetching using `createServerClient` / Supabase server helpers (see `lib/supabase/server.ts`).
    - Keep credential usage on server-only files and API routes; do not call secret keys in client code.
  - API routes / route handlers
    - Return `NextResponse` with appropriate status codes; don't leak internal error objects to the client.
    - Validate incoming JSON payloads and return `400` for invalid inputs.

- Error handling and logging
  - Always handle and log errors. Use `console.error()` for now; add structured logging or Sentry in future.
  - Avoid swallowing errors silently. If a catch block intentionally ignores an error, add a comment with the reason.
  - When working with external services (Supabase, Gemini), check for missing API keys and return a clear 500 with a non-sensitive message.

- Security & secrets
  - Never commit `.env` files with secrets. `.env.local` is present locally — make sure it is in `.gitignore`.
  - Use `NEXT_PUBLIC_*` only for values safe for client exposure.

- Git / commit rules for agents (mandatory)
  - Do not run destructive git commands (`git reset --hard`, `git checkout --` to wipe users changes) unless explicitly requested.
  - Do not amend commits unless the user asks and the commit was created by you and unpushed.
  - Prefer small, focused changes and create a clear commit message describing the "why".
  - Do not push force to main. If asked to create a PR use the repository's remote and standard flow.

- Agent workflow checklist (what an autonomous agent should do before committing)
  1. Read `package.json`, `tsconfig.json`, and `eslint.config.mjs` to understand the project.
 2. Run `pnpm install` if dependencies are missing.
 3. Run lint: `pnpm lint` and typecheck: `pnpm tsc --noEmit`.
 4. Run the dev server locally to verify behavior: `pnpm dev`.
 5. When adding tests, run `pnpm test` and ensure CI-compatible results.

- Where to find more guidance
  - Next.js best practices: `.agents/skills/next-best-practices/SKILL.md`
  - Project entry points: `package.json`, `app/layout.tsx`, `app/page.tsx` (app dir)

- Cursor / Copilot rules
  - No `.cursor/rules` or `.cursorrules` found.
  - No `.github/copilot-instructions.md` found.

- If you're blocked (ask only when necessary)
  - If a requested change is ambiguous and would materially alter behaviour (production config, secrets, destructive git ops), ask one targeted question and propose a recommended default.

Keep this file updated as the repo acquires tests, CI, or additional style tooling.

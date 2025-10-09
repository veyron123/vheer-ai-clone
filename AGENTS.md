# Repository Guidelines


## Project Structure & Module Organization
The app pairs a Vite/React client with an Express/Prisma API.
- `client/src` groups `components`, `pages`, `stores`, and `services` for UI, routed views, Zustand state, and API clients; static assets live in `client/public`.
- `server/controllers`, `routes`, `services`, and `middleware` own request handling, with shared helpers in `server/lib` and `server/utils`. Prisma models sit in `server/prisma/schema.prisma`; the root `prisma/` folder mirrors the database schema for tooling.
- Automation scripts live under `scripts/` (repo-wide checks) and `server/scripts/` (admin bootstrap, backups). Ignore transient uploads in `uploads/`.

## Build, Test, and Development Commands
Install dependencies once at the root (`npm install`). Common tasks:
- `npm run dev` — launches `server:dev` (port 5000) and `client:dev` (Vite defaults to 5173).
- `npm run build:all` — builds the client then regenerates the Prisma client for deployment.
- `npm run prisma:generate` / `npm run prisma:migrate` — refresh Prisma types or apply migrations against `DATABASE_URL`.
- `npm run lint` — executes ESLint across server and client code.
- `npm run check:env` — confirms required environment variables are present.

## Coding Style & Naming Conventions
Use ES modules with 2-space indentation and keep semicolons consistent with existing files. Prefer camelCase for variables/functions, PascalCase for React components, and `use` prefixes for hooks. Match route, controller, and service filenames (e.g., `subscription.routes.js` ↔ `subscription.controller.js`) and group Tailwind utility classes from layout to effects.

## Testing Guidelines
Server testing runs through Jest (`server/jest.config.js`). Add specs under `server/__tests__/{unit,integration}` with `*.test.js` suffixes, reusing fixtures in `server/__tests__/fixtures`. Maintain the configured coverage floor (≥50% statements/lines, ≥40% branches) by exercising new endpoints via Supertest or isolating Prisma calls. The root `npm run test` currently targets server tests; define and document any client-side runner before enabling it in CI.

## Commit & Pull Request Guidelines
Commit subjects should be concise, imperative, and optionally prefixed (`fix:`, `feat:`) as seen in history. Avoid noisy WIP commits on shared branches. Pull requests should outline the change, list validation steps (`npm run lint`, `npm run test`), mention schema or env updates, and include screenshots for UI-impacting work. Link related tickets and note any follow-up tasks.

## Environment & Security Tips
Seed local config with `.env.example` files in `client/` and environment variables consumed by `server/config`. Keep credentials and anything under `uploads/` out of version control. Before release, run `npm run check:env` and `node server/scripts/check-admin.js` to confirm accounts and quotas.

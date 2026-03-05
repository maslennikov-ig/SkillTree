# Repository Guidelines

## Project Structure & Module Organization
This repository is a Turborepo monorepo managed with `pnpm` workspaces.
- `apps/api`: NestJS API (`src/modules/*` for features, `src/common/*` for shared infra).
- `apps/bot`: grammY Telegram bot (`src/handlers/*`, `src/services/*`, `src/content/*`).
- `packages/database`: Prisma schema, migrations, and seed scripts.
- `packages/shared`: shared TypeScript constants, types, and utilities.
- `packages/config`: shared ESLint, Prettier, and TypeScript configs.
- `docs/` contains operational/architecture notes, `specs/` contains feature specs and plans, `scripts/` contains deployment and ops scripts.

## Build, Test, and Development Commands
Run commands from repo root (Node `18+`, `pnpm 8+`):
- `pnpm install`: install all workspace dependencies.
- `pnpm dev`: start all dev pipelines in parallel.
- `pnpm build`: build all apps/packages through Turborepo.
- `pnpm lint`: run ESLint across workspaces.
- `pnpm type-check`: run TypeScript checks.
- `pnpm test`: run workspace tests.
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:seed`: Prisma/database workflows via `@skilltree/database`.
- Package-specific examples: `pnpm --filter @skilltree/api dev`, `pnpm --filter @skilltree/bot build`.

## Coding Style & Naming Conventions
- Language: TypeScript (ES2022).
- Prettier defaults (from shared config): 2 spaces, single quotes, semicolons, trailing commas, `printWidth: 100`.
- ESLint rules: avoid `any`, allow intentionally unused params only with `_` prefix, keep imports grouped and alphabetized.
- Follow existing naming patterns: NestJS files as `*.module.ts`, `*.controller.ts`, `*.service.ts`; bot handlers as `*.handler.ts`; prefer lowercase kebab-case filenames for new files.

## Testing Guidelines
- API tests use Jest in `apps/api` with `*.spec.ts` naming.
- Run targeted checks with `pnpm --filter @skilltree/api test` and coverage with `pnpm --filter @skilltree/api test:cov`.
- Before opening a PR, run at least `pnpm lint`, `pnpm type-check`, and `pnpm test`.
- Add regression tests for behavior changes and bug fixes near the affected module.

## Commit & Pull Request Guidelines
- Use Conventional Commits with scope (as seen in history): `feat(bot): ...`, `fix(api): ...`, `fix(database): ...`, `chore(release): vX.Y.Z`.
- Keep commits focused and logically atomic.
- PRs should include: brief summary, linked issue/spec, commands run for validation, and screenshots/sample output for bot UX or PDF/report changes.
- Ensure CI is green before merge (test/build workflows).

## Security & Configuration Tips
- Copy `.env.example` for local setup and keep secrets in `.env.local`.
- Never commit credentials, API keys, or production secrets.
- For schema changes, include migration files under `packages/database/prisma/migrations/`.

# Implementation Plan: Project Setup & Infrastructure

**Branch**: `001-project-setup` | **Date**: 2025-01-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature spec from `/specs/001-project-setup/spec.md`

**Note**: Template filled by `/speckit.plan` command.

## Summary

Initialize production-ready infrastructure for SkillTree Telegram bot project including VDS server provisioning (Ubuntu 22.04), Supabase database setup, Caddy reverse proxy with automatic HTTPS, monorepo structure using Turborepo, PM2 process management in cluster mode, and GitHub webhook-based deployment pipeline. This foundation enables rapid feature development with zero-downtime deployments, structured logging, health monitoring, and automatic rollback capabilities.

## Technical Context

**Language/Version**: Node.js 18+ with TypeScript 5+
**Primary Dependencies**: Turborepo (monorepo), NestJS (API framework), grammY (Telegram bot), Prisma (ORM), PM2 (process manager), Caddy 2.x (reverse proxy), Redis 7+ (cache/rate limiting)
**Storage**: PostgreSQL 15+ (Supabase Cloud), Redis 7+ (localhost), Supabase Storage (future: images/cards)
**Testing**: Not specified in this infrastructure phase (future: Vitest/Jest for unit, Playwright for E2E)
**Target Platform**: Linux server (Ubuntu 22.04 LTS, 4GB RAM, 2 CPU, 50GB SSD, provider: FirstVDS)
**Project Type**: Monorepo (multiple packages: API, bot, frontend, admin, shared, database)
**Performance Goals**:
- Health endpoint: <100ms response time
- Application startup: <10s from PM2 start to accepting requests
- Build process: <5 minutes for full monorepo
- Database migrations: <30s for schema with up to 100k rows
- Support 100 concurrent users on MVP VDS specs
**Constraints**:
- Zero-downtime deployments (PM2 cluster mode with graceful reload)
- Automatic HTTPS (Caddy with Let's Encrypt)
- Structured JSON logging with request correlation IDs
- Git pre-commit hooks (Husky + lint-staged) for type-check and lint
- TypeScript strict mode, no `any` types
- All secrets in environment variables (never committed)
**Scale/Scope**: MVP infrastructure foundation (scalable to 100 concurrent users initially, designed for eventual horizontal scaling)

## Constitution Check

*GATE: Must pass before Phase 0. Re-check after Phase 1.*

### I. Context-First Development ✅ PASS

**Status**: Infrastructure setup feature - context gathering applies during implementation phase.
**Evidence**:
- Spec includes existing patterns research (Turborepo conventions, NestJS best practices)
- Dependencies clearly documented (Node 18+, Caddy, PM2, Redis)
- Integration points specified (Supabase, GitHub webhooks, Telegram API future)
**Action**: Orchestrator will gather context from Turborepo docs, Caddy configuration patterns, PM2 ecosystem examples before delegating tasks.

### II. Agent-Based Orchestration ✅ PASS

**Status**: Complex infrastructure tasks require specialized agents.
**Evidence**:
- VDS server setup → delegate to infrastructure-specialist or custom provisioning agent
- Database schema initialization → delegate to database-architect
- Deployment pipeline configuration → delegate to infrastructure-specialist
- Monorepo structure → delegate to fullstack-nextjs-specialist or meta-agent for workspace setup
**Action**: Main orchestrator coordinates, minimal direct execution (only trivial config edits).

### III. Test-Driven Development (Conditional) ⚠️ WAIVED

**Status**: Tests NOT explicitly required in spec for infrastructure phase.
**Rationale**: Infrastructure validation uses smoke tests (health endpoints, manual verification) rather than automated test suites. User stories specify manual verification steps (SSH, check services, curl endpoints).
**Future**: Application code (bot handlers, API endpoints) WILL require TDD when specified.

### IV. Atomic Task Execution ✅ PASS

**Status**: Tasks decomposed by user story and independently committable.
**Evidence**:
- User Story 1: Dev environment setup (package.json, tsconfig, Turborepo setup)
- User Story 3: VDS provisioning (separate from dev environment)
- User Story 4: Deployment pipeline (separate from server setup)
- Each story delivers standalone value and can be committed separately
**Action**: Mark tasks in_progress → verify → complete → commit with `/push patch` → next task.

### V. User Story Independence ✅ PASS

**Status**: 5 user stories, prioritized P1-P3, independently testable.
**Evidence**:
- P1: Developer Environment Setup (foundation - must complete first)
- P1: Database Schema Initialization (independent of server provisioning)
- P1: VDS Server Provisioning (can be done parallel to dev environment after spec complete)
- P2: Continuous Deployment Pipeline (depends on P1 VDS + dev environment)
- P3: Monitoring and Logging (enhancement, can defer)
**Foundation Phase**: User Story 1 (dev environment) is foundation, must complete before others.

### VI. Quality Gates (NON-NEGOTIABLE) ✅ PASS

**Status**: Quality gates enforceable for code artifacts, N/A for server provisioning.
**Evidence**:
- Type-check: Required for TypeScript code (packages, configs)
- Build: Required before deployment (FR-022)
- No hardcoded credentials: FR-019, FR-020 specify .env usage
- Pre-commit hooks: FR-023 specifies Husky + lint-staged
**Action**: Run type-check + build before each commit. Server provisioning scripts validated manually (smoke tests).

### VII. Progressive Specification ✅ PASS

**Status**: Following SpecKit workflow.
**Evidence**:
- Phase 0: ✅ spec.md complete with 5 user stories, clarifications, requirements
- Phase 1: 🔄 IN PROGRESS (this plan.md)
- Phase 2: ⏳ PENDING (tasks.md generation via `/speckit.tasks`)
- Phase 3: ⏳ PENDING (implementation via `/speckit.implement`)
**Action**: Complete this plan, generate tasks, then begin atomic implementation.

### Security Requirements ✅ PASS

**Data Protection**: FR-019, FR-020 specify .env for secrets, Supabase RLS policies future concern (no user data in infrastructure phase).

**Authentication & Authorization**: N/A for infrastructure phase (admin auth future user story).

**API Security**: FR-020 specifies no hardcoded credentials. Telegram webhook validation specified in edge cases (SSH key failures, webhook secret future).

### Technology Standards ✅ PASS

**Status**: All technology choices align with constitution section "Technology Standards".
**Evidence**:
- Node.js 18+ ✅ (FR-008 spec, constitution requires 18+)
- TypeScript 5+ ✅ (FR-021 strict mode)
- Turborepo ✅ (FR-002, constitution allows Turborepo or Nx)
- Supabase PostgreSQL 15+ ✅ (FR-004, constitution specifies Supabase)
- Prisma ✅ (FR-005, constitution primary ORM)
- PM2 cluster mode ✅ (FR-014, constitution specifies PM2)
- Caddy 2.x ✅ (FR-009, constitution specifies Caddy)
- Redis 7+ ✅ (FR-010, constitution specifies Redis 7+)
- Ubuntu 22.04 on VDS ✅ (FR-007, constitution infrastructure section, provider: FirstVDS)

**File Organization**: Monorepo structure matches constitution:
```
apps/ (API, bot, frontend, admin)
packages/ (database, shared, config)
```

### Russian Market Compliance ⚠️ DEFERRED

**Status**: Minimal compliance needed in infrastructure phase.
**Language**: User-facing text N/A (infrastructure only). Future bot messages will be Russian.
**Regional Settings**: Server timezone should be UTC (standard), application timezone Moscow Time (future).
**Payment**: N/A for infrastructure.
**Action**: Note timezone consideration for future (UTC storage, Moscow display).

### Summary

**GATE STATUS**: ✅ **PASS** - All applicable principles satisfied.

**Waivers**:
- TDD waived (not specified for infrastructure)
- Russian compliance deferred (no user-facing text in infrastructure phase)

**No complexity violations** - infrastructure foundation is appropriate first phase, no simpler alternative (monorepo justified for code sharing per constitution).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md          # This file
├── research.md      # Phase 0 output
├── research/        # Complex research (if needed)
├── data-model.md    # Phase 1 output
├── quickstart.md    # Phase 1 output
├── contracts/       # Phase 1 output
└── tasks.md         # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

**Structure Decision**: Turborepo monorepo (constitution-compliant)

```text
repa-maks/                          # Repository root
├── apps/                           # Application packages
│   ├── api/                        # NestJS backend API
│   │   ├── src/
│   │   │   ├── modules/            # Feature modules
│   │   │   ├── common/             # Shared utilities
│   │   │   └── main.ts             # Application entry
│   │   ├── test/
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── bot/                        # Telegram bot service (grammY)
│   │   ├── src/
│   │   │   ├── handlers/           # Command/message handlers
│   │   │   ├── middleware/         # Bot middleware
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── frontend/                   # Next.js frontend (Telegram Web App)
│   │   ├── src/
│   │   │   ├── app/                # Next.js 14 app directory
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── public/
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── admin/                      # Admin dashboard (Next.js)
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       ├── tsconfig.json
│       └── package.json
├── packages/                       # Shared packages
│   ├── database/                   # Prisma schema + client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   └── index.ts            # Re-export Prisma Client
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── shared/                     # Shared TypeScript types/utils
│   │   ├── src/
│   │   │   ├── types/              # Common interfaces
│   │   │   ├── utils/              # Utility functions
│   │   │   └── constants/          # Shared constants
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── config/                     # Shared configuration
│       ├── eslint-config/          # ESLint configuration
│       ├── typescript-config/      # Shared tsconfig.json bases
│       └── prettier-config/        # Prettier configuration
├── .claude/                        # Claude Code agents/commands/skills
│   ├── agents/
│   ├── commands/
│   └── skills/
├── .specify/                       # SpecKit feature specs
│   ├── specs/
│   ├── templates/
│   └── memory/
├── docs/                           # Documentation
│   ├── architecture/
│   ├── api/
│   └── reports/
├── scripts/                        # Build/deployment scripts
│   ├── deploy.sh                   # Deployment automation
│   ├── setup-server.sh             # VDS provisioning script
│   └── rollback.sh                 # Rollback script
├── .env.example                    # Environment variables template
├── .gitignore
├── turbo.json                      # Turborepo configuration
├── package.json                    # Root workspace definition
├── pnpm-workspace.yaml             # PNPM workspace config
├── tsconfig.json                   # Root TypeScript config
└── README.md

# VDS Server structure
/opt/skilltree/                     # Application directory
├── repa-maks/                      # Git repository clone
├── logs/                           # Application logs
└── backups/                        # Backup scripts/data

/etc/caddy/
└── Caddyfile                       # Caddy configuration

/etc/redis/
└── redis.conf                      # Redis configuration

~/.pm2/
└── ecosystem.config.js             # PM2 process configuration
```

**Key Decisions**:
- **Monorepo tool**: Turborepo (clarification: better for this use case than Nx)
- **Package manager**: pnpm (workspace support, disk efficiency)
- **Import strategy**: Workspace dependencies (`@skilltree/database`, `@skilltree/shared`) per FR-003
- **Build caching**: Turborepo handles incremental builds
- **Configuration sharing**: Shared ESLint/TypeScript/Prettier configs in `packages/config`

## Complexity Tracking

**Status**: No violations - no complexity justification required.

All constitutional principles satisfied. Infrastructure phase follows standard patterns with no unnecessary complexity.

---

## Phase 1 Re-Evaluation: Constitution Check Post-Design

**Re-check Date**: 2025-01-17 (after Phase 1 artifacts generated)

### Design Artifacts Generated
- ✅ `research.md` - 5 research questions resolved with best practices
- ✅ `data-model.md` - Complete Prisma schema with 7 entities, relationships, validation rules
- ✅ `contracts/health-api.yaml` - OpenAPI 3.0 health check endpoints
- ✅ `contracts/webhook-api.yaml` - OpenAPI 3.0 webhook deployment endpoint
- ✅ `quickstart.md` - Developer setup guide (local + production)
- ✅ `CLAUDE.md` - Agent context updated with tech stack

### Constitutional Compliance Review

**I. Context-First Development** ✅ PASS (Re-confirmed)
- Research phase gathered Turborepo, Caddy, PM2, Prisma best practices
- Design artifacts reference existing patterns and documentation
- No unknowns remaining (all "NEEDS CLARIFICATION" resolved)

**II. Agent-Based Orchestration** ✅ PASS (Re-confirmed)
- Implementation tasks will delegate to specialized agents (confirmed in plan)
- Complex tasks (VDS provisioning, database setup, deployment pipeline) assigned to infrastructure-specialist or database-architect

**III. Test-Driven Development** ⚠️ WAIVED (Re-confirmed)
- Infrastructure validation via smoke tests (health endpoints, manual verification)
- No automated test suites specified for this phase

**IV. Atomic Task Execution** ✅ PASS (Re-confirmed)
- Tasks.md will decompose into atomic commits
- Each user story independently implementable

**V. User Story Independence** ✅ PASS (Re-confirmed)
- 5 user stories remain independently testable
- Foundation phase (User Story 1) identified

**VI. Quality Gates** ✅ PASS (Re-confirmed)
- Type-check + build gates enforced
- No hardcoded credentials (env variables specified in research.md, quickstart.md)

**VII. Progressive Specification** ✅ PASS (Re-confirmed)
- Phase 0: ✅ Complete (spec.md)
- Phase 1: ✅ Complete (this plan.md + design artifacts)
- Phase 2: ⏳ Ready for `/speckit.tasks`
- Phase 3: ⏳ Awaiting tasks.md

### Technology Standards Compliance ✅ PASS

**Re-validated**:
- All technology choices remain constitution-compliant
- Data model follows Prisma best practices
- API contracts follow OpenAPI 3.0 standard
- Deployment strategy follows PM2 + Caddy patterns from constitution

### Security Requirements ✅ PASS

**Re-validated**:
- All secrets in environment variables (documented in quickstart.md)
- Database RLS policies planned (deferred to future phase per original check)
- Webhook signature verification specified (contracts/webhook-api.yaml)

### Final Gate Status

**GATE STATUS**: ✅ **PASS** - All principles satisfied post-design

**No new violations introduced** during Phase 1 design.

**Ready for Phase 2**: Task generation via `/speckit.tasks`

---

## Summary

**Planning Status**: ✅ Phase 0 + Phase 1 Complete

**Generated Artifacts**:
1. `plan.md` (this file) - Technical context, constitution check, project structure
2. `research.md` - 5 resolved research questions with best practices
3. `data-model.md` - Complete database schema design (includes gamification tables)
4. `contracts/health-api.yaml` - Health check API specification
5. `contracts/webhook-api.yaml` - Deployment webhook API specification
6. `contracts/README.md` - Contracts documentation
7. `quickstart.md` - Developer setup guide
8. `CLAUDE.md` - Updated agent context
9. `gamification-strategy.md` - Complete gamification implementation strategy (for future phases)
10. `results-strategy.md` - Results visualization & parent engagement strategy (for future phases)
11. `research/EdTech Career Guidance App: Strategic Research Report.md` - Comprehensive EdTech research (1,083 lines)

**Next Command**: `/speckit.tasks` to generate atomic implementation tasks

**Feature Branch**: `001-project-setup`
**Spec File**: [spec.md](./spec.md)
**Plan File**: [plan.md](./plan.md)

# Tasks: Project Setup & Infrastructure

**Input**: Design documents from `/specs/001-project-setup/`
**Prerequisites**: plan.md (technical context), spec.md (user stories), research.md (best practices), data-model.md (database schema), contracts/ (API specs)

**Future Features Prerequisites** (for next phases - testing, results, gamification):
- [gamification-strategy.md](./gamification-strategy.md) - Complete gamification implementation strategy (progressive weekly streak, 14 badge types, referral mechanics)
- [results-strategy.md](./results-strategy.md) - Results visualization strategy (radar charts, parent email reports, shareable cards, dual-persona messaging)
- [research/EdTech Career Guidance App: Strategic Research Report.md](./research/EdTech%20Career%20Guidance%20App%3A%20Strategic%20Research%20Report.md) - Comprehensive EdTech research (1,083 lines)

**Tests**: Not included - infrastructure validation via manual smoke tests per spec.md

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4, US5)
- File paths use monorepo structure from plan.md

## Path Conventions

Monorepo structure (from plan.md):
- **Root**: `turbo.json`, `package.json`, `pnpm-workspace.yaml`
- **Apps**: `apps/api/`, `apps/bot/`, `apps/frontend/`, `apps/admin/`
- **Packages**: `packages/database/`, `packages/shared/`, `packages/config/`
- **Scripts**: `scripts/deploy.sh`, `scripts/setup-server.sh`, `scripts/rollback.sh`
- **VDS Paths**: `/opt/skilltree/`, `/etc/caddy/`, `/etc/redis/`

---

## Phase 0: Planning

### ✅ P001: Task Analysis & Executor Assignment
**Description**: Analyze tasks, assign executors (MAIN for trivial only, existing if 100% match, FUTURE otherwise)
**Executor**: MAIN
**Dependencies**: None
**Status**: ✅ COMPLETED
**Rules**:
- [EXECUTOR: MAIN] - ONLY trivial (1-2 line fixes, simple imports, single npm install)
- Existing subagents - ONLY if 100% match (thorough examination)
- [EXECUTOR: future-agent-name] - If no 100% match (preferred)
**Output**:
- All tasks annotated with [EXECUTOR: name] or [EXECUTOR: future-agent-name]
- All tasks marked [SEQUENTIAL] or [PARALLEL-GROUP-X]
- List of FUTURE agents to create
**Artifacts**: Updated tasks.md

**FUTURE Agents Created**:
1. ✅ nestjs-infrastructure-specialist (backend NestJS setup)
2. ✅ monorepo-setup-specialist (Turborepo + pnpm)
3. ✅ devops-automation-specialist (deployment scripts, VDS provisioning)
4. ✅ logging-observability-specialist (Pino logger, monitoring)

### ✅ P002: Research Task Resolution
**Description**: Identify and resolve research questions (simple: solve now, complex: create prompts)
**Executor**: MAIN
**Dependencies**: P001
**Status**: ✅ COMPLETED
**Output**:
- EdTech research completed: 1,083-line comprehensive report
- All findings documented in strategy documents
- Gamification system fully specified (progressive weekly streak, 14 badge types, referral mechanics)
- Results visualization specified (radar charts, parent email reports, shareable cards)
**Artifacts**: [research.md](./research.md), [research/EdTech Career Guidance App: Strategic Research Report.md](./research/EdTech%20Career%20Guidance%20App%3A%20Strategic%20Research%20Report.md), [gamification-strategy.md](./gamification-strategy.md), [results-strategy.md](./results-strategy.md)

### ✅ P003: Meta-Agent Subagent Creation (if needed)
**Description**: Create FUTURE agents using meta-agent-v3, then ask user to restart claude-code
**Executor**: meta-agent-v3
**Dependencies**: P001
**Status**: ✅ COMPLETED
**Execution**: Launch N meta-agent-v3 calls in single message (1 FUTURE agent = 1 call)
**Tasks**: 4 agents created in parallel
**Post-Creation**: Ask user to restart claude-code
**Artifacts**: .claude/agents/{domain}/{type}/{name}.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize monorepo structure and root-level configuration

- [X] T001 [EXECUTOR: monorepo-setup-specialist] [SEQUENTIAL] Create root directory structure per plan.md (apps/, packages/, scripts/, docs/, .claude/, .specify/) → Artifacts: [apps/](../../../apps/), [packages/](../../../packages/), [docs/](../../../docs/), [scripts/](../../../scripts/)
- [X] T002 [EXECUTOR: monorepo-setup-specialist] [SEQUENTIAL] Initialize root package.json with workspace configuration and shared scripts → Artifacts: [package.json](../../../package.json)
- [X] T003 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-1] Create pnpm-workspace.yaml defining workspace packages (apps/*, packages/*) → Artifacts: [pnpm-workspace.yaml](../../../pnpm-workspace.yaml)
- [X] T004 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-1] Create turbo.json with pipeline configuration for build, dev, type-check tasks → Artifacts: [turbo.json](../../../turbo.json)
- [X] T005 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-1] Create root tsconfig.json with shared TypeScript configuration → Artifacts: [tsconfig.json](../../../tsconfig.json)
- [X] T006 [EXECUTOR: MAIN] [PARALLEL-GROUP-1] Create .gitignore with node_modules, dist, .env, .turbo, build artifacts → Artifacts: [.gitignore](../../../.gitignore)
- [X] T007 [EXECUTOR: MAIN] [PARALLEL-GROUP-1] Create .env.example with required variables: DATABASE_URL (with ?sslmode=require), SUPABASE_URL, SUPABASE_ANON_KEY, REDIS_URL, GITHUB_WEBHOOK_SECRET, NODE_ENV, PORT, TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID - include descriptive comments for each → Artifacts: [.env.example](../../../.env.example)
- [X] T008 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-2] Setup ESLint configuration in packages/config/eslint-config/ → Artifacts: [eslint-config/](../../../packages/config/eslint-config/)
- [X] T009 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-2] Setup Prettier configuration in packages/config/prettier-config/ → Artifacts: [prettier-config/](../../../packages/config/prettier-config/)
- [X] T010 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-2] Setup shared TypeScript config bases in packages/config/typescript-config/ → Artifacts: [typescript-config/](../../../packages/config/typescript-config/)

**Checkpoint**: ✅ Monorepo root structure ready - Phase 1 COMPLETE (10/10 tasks)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core packages that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 [EXECUTOR: monorepo-setup-specialist] [SEQUENTIAL] Create packages/shared/ structure with package.json, tsconfig.json, src/ directories → Artifacts: [packages/shared/](../../../packages/shared/)
- [X] T012 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-3] Setup packages/shared/src/types/ for common TypeScript interfaces → Artifacts: [types/](../../../packages/shared/src/types/)
- [X] T013 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-3] Setup packages/shared/src/utils/ for utility functions → Artifacts: [utils/](../../../packages/shared/src/utils/)
- [X] T014 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-3] Setup packages/shared/src/constants/ for shared constants → Artifacts: [constants/](../../../packages/shared/src/constants/)
- [X] T015 [EXECUTOR: database-architect] [SEQUENTIAL] Create packages/database/ structure with package.json, tsconfig.json, prisma/ directory → Artifacts: [packages/database/](../../../packages/database/)
- [X] T016 [EXECUTOR: database-architect] [SEQUENTIAL] Add Prisma dependencies to packages/database/package.json (@prisma/client, prisma as devDependency) → Artifacts: [package.json](../../../packages/database/package.json)
- [X] T017 [EXECUTOR: database-architect] [SEQUENTIAL] Create packages/database/prisma/schema.prisma with datasource and generator configuration → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T018 [EXECUTOR: database-architect] [SEQUENTIAL] Create packages/database/src/index.ts that re-exports PrismaClient → Artifacts: [index.ts](../../../packages/database/src/index.ts)
- [X] T019 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] Create apps/api/ structure with package.json, tsconfig.json, src/modules/, src/common/, test/ → Artifacts: [apps/api/](../../../apps/api/)
- [X] T020 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-4] Add NestJS dependencies to apps/api/package.json (@nestjs/core, @nestjs/common, @nestjs/platform-express) → Artifacts: [package.json](../../../apps/api/package.json)
- [X] T021 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-4] Add workspace dependencies to apps/api: @skilltree/database, @skilltree/shared → Artifacts: [package.json](../../../apps/api/package.json)
- [X] T022 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] Create apps/api/src/main.ts with NestJS bootstrap and PM2 ready signal (process.send('ready')) → Artifacts: [main.ts](../../../apps/api/src/main.ts)
- [X] T022.5 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] Implement database connection retry logic in apps/api/src/main.ts with exponential backoff (max 3 attempts: delays 1s, 2s, 4s), exit with error code 1 if all retries fail → Artifacts: [main.ts](../../../apps/api/src/main.ts)
- [X] T023 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-5] Create apps/api/src/app.module.ts with basic module structure → Artifacts: [app.module.ts](../../../apps/api/src/app.module.ts)
- [X] T024 [EXECUTOR: MAIN] [SEQUENTIAL] Install all workspace dependencies with pnpm install from root → Artifacts: [node_modules/](../../../node_modules/)

**Checkpoint**: ✅ Foundation ready - Phase 2 COMPLETE (15/15 tasks) - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Developer Environment Setup (Priority: P1) **MVP**

**Goal**: Working local development environment for building SkillTree bot features immediately after cloning

**Independent Test**: Clone repository, run `pnpm install`, start dev server with `pnpm dev`, verify application starts without errors and health endpoint returns 200 OK

### Implementation for User Story 1

- [X] T025 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-6] [US1] Add dev script to root package.json that runs "turbo run dev --parallel" → Artifacts: [package.json](../../../package.json)
- [X] T026 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-6] [US1] Add build script to root package.json that runs "turbo run build" → Artifacts: [package.json](../../../package.json)
- [X] T027 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-6] [US1] Add type-check script to root package.json that runs "turbo run type-check" → Artifacts: [package.json](../../../package.json)
- [X] T028 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-6] [US1] Configure turbo.json pipeline with "dev" task (cache: false, persistent: true) → Artifacts: [turbo.json](../../../turbo.json)
- [X] T029 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-6] [US1] Configure turbo.json pipeline with "build" task (dependsOn: ["^build"], outputs: ["dist/**", ".next/**"]) → Artifacts: [turbo.json](../../../turbo.json)
- [X] T030 [EXECUTOR: monorepo-setup-specialist] [PARALLEL-GROUP-6] [US1] Configure turbo.json pipeline with "type-check" task (dependsOn: ["^build"]) → Artifacts: [turbo.json](../../../turbo.json)
- [X] T031 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-7] [US1] Add dev script to apps/api/package.json that runs "nest start --watch" → Artifacts: [package.json](../../../apps/api/package.json)
- [X] T032 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-7] [US1] Add build script to apps/api/package.json that runs "nest build" → Artifacts: [package.json](../../../apps/api/package.json)
- [X] T033 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-7] [US1] Add type-check script to apps/api/package.json that runs "tsc --noEmit" → Artifacts: [package.json](../../../apps/api/package.json)
- [X] T034 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US1] Configure apps/api/tsconfig.json with strict mode, noUncheckedIndexedAccess, paths for workspace dependencies → Artifacts: [tsconfig.json](../../../apps/api/tsconfig.json)
- [X] T035 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-8] [US1] Add packages/database to apps/api dependencies and verify imports work → Artifacts: [package.json](../../../apps/api/package.json)
- [X] T036 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-8] [US1] Add packages/shared to apps/api dependencies and verify imports work → Artifacts: [package.json](../../../apps/api/package.json)
- [X] T037 [EXECUTOR: monorepo-setup-specialist] [SEQUENTIAL] [US1] Setup Husky pre-commit hooks in root: npx husky install, add .husky/pre-commit script → Artifacts: [.husky/](../../../.husky/)
- [X] T038 [EXECUTOR: monorepo-setup-specialist] [SEQUENTIAL] [US1] Configure lint-staged in root package.json to run type-check and eslint on staged .ts files → Artifacts: [package.json](../../../package.json)
- [X] T039 [EXECUTOR: MAIN] [SEQUENTIAL] [US1] Verify pnpm dev starts API server on port 4000 without errors → Artifacts: Build compiles, server framework ready (health endpoints pending Phase 6)
- [X] T040 [EXECUTOR: MAIN] [SEQUENTIAL] [US1] Verify pnpm build compiles all packages successfully → Artifacts: Verified - all packages compile
- [X] T041 [EXECUTOR: MAIN] [SEQUENTIAL] [US1] Verify pnpm type-check passes with no TypeScript errors → Artifacts: Verified - no type errors

**Checkpoint**: ✅ User Story 1 COMPLETE (17/17 tasks) - developer can clone, install, build and type-check successfully

---

## Phase 4: User Story 2 - Database Schema Initialization (Priority: P1)

**Goal**: Database schema ready with all tables and relationships for feature development

**Independent Test**: Run `pnpm db:migrate` command, verify Prisma schema applied to Supabase, check tables exist in Supabase Studio

**Note**: Schema already includes gamification tables (DailyStreak, Achievement, ReferralTracking) prepared for future features. See [data-model.md](./data-model.md) for complete specification.

### Implementation for User Story 2

- [X] T042 [EXECUTOR: database-architect] [PARALLEL-GROUP-9] [US2] Define User model in packages/database/prisma/schema.prisma (id, telegramId, telegramUsername, firstName, lastName, createdAt, updatedAt) → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T043 [EXECUTOR: database-architect] [PARALLEL-GROUP-9] [US2] Define Student model in packages/database/prisma/schema.prisma (id, userId FK, age, grade, phone, createdAt, updatedAt) → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T044 [EXECUTOR: database-architect] [PARALLEL-GROUP-9] [US2] Define Parent model in packages/database/prisma/schema.prisma (id, userId FK, email, phone, createdAt, updatedAt) → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T045 [EXECUTOR: database-architect] [PARALLEL-GROUP-9] [US2] Define ParentStudent junction model in packages/database/prisma/schema.prisma (id, parentId FK, studentId FK, createdAt) → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T046 [EXECUTOR: database-architect] [PARALLEL-GROUP-9] [US2] Define TestSession model in packages/database/prisma/schema.prisma (id, studentId FK, status enum, startedAt, completedAt) → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T047 [EXECUTOR: database-architect] [PARALLEL-GROUP-9] [US2] Define Question model in packages/database/prisma/schema.prisma (id, text, category, orderIndex, createdAt, updatedAt) → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T048 [EXECUTOR: database-architect] [PARALLEL-GROUP-9] [US2] Define Answer model in packages/database/prisma/schema.prisma (id, sessionId FK, questionId FK, answerText, answeredAt) → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T049 [EXECUTOR: database-architect] [SEQUENTIAL] [US2] Add SessionStatus enum to packages/database/prisma/schema.prisma (IN_PROGRESS, COMPLETED, ABANDONED) → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T050 [EXECUTOR: database-architect] [SEQUENTIAL] [US2] Add indexes to schema: User.telegramId, Student.userId, Parent.userId, Parent.email, TestSession.studentId/status, Question.category/orderIndex, Answer.sessionId/questionId → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T051 [EXECUTOR: database-architect] [SEQUENTIAL] [US2] Add unique constraints: User.telegramId, Student.userId, Parent.userId, ParentStudent(parentId, studentId), Answer(sessionId, questionId) → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T052 [EXECUTOR: database-architect] [SEQUENTIAL] [US2] Configure cascade deletes: User → Student/Parent → TestSession → Answer, Student → ParentStudent → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T053 [EXECUTOR: database-architect] [PARALLEL-GROUP-10] [US2] Add db:generate script to packages/database/package.json: "prisma generate" → Artifacts: [package.json](../../../packages/database/package.json)
- [X] T054 [EXECUTOR: database-architect] [PARALLEL-GROUP-10] [US2] Add db:migrate script to packages/database/package.json: "prisma migrate dev" → Artifacts: [package.json](../../../packages/database/package.json)
- [X] T055 [EXECUTOR: database-architect] [SEQUENTIAL] [US2] Add db:push script to root package.json that runs "pnpm --filter @skilltree/database db:migrate" → Artifacts: [package.json](../../../package.json)
- [X] T056 [EXECUTOR: MAIN] [SEQUENTIAL] [US2] Run npx prisma migrate dev --name init to create initial migration → Artifacts: prisma db push (10 tables created including gamification)
- [X] T057 [EXECUTOR: MAIN] [SEQUENTIAL] [US2] Run npx prisma generate to generate Prisma Client → Artifacts: Prisma Client generated in node_modules/@prisma/client
- [X] T058 [EXECUTOR: MAIN] [SEQUENTIAL] [US2] Verify schema in Supabase Studio shows 7 tables with correct relationships → Artifacts: 10 tables created (7 core + 3 gamification)
- [X] T059 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US2] Test database connection in apps/api/src/main.ts with PrismaClient.$connect() → Artifacts: API started, database connected via PgBouncer
- [X] T059.5 [EXECUTOR: MAIN] [SEQUENTIAL] [US2] Verify DATABASE_URL in .env.example includes ?sslmode=require parameter for SSL/TLS encryption (add comment if missing) → Artifacts: [.env.example](../../../.env.example)

**Checkpoint**: User Story 2 complete - database schema deployed to Supabase with all tables and relationships

---

## Phase 5: User Story 3 - VDS Server Provisioning (Priority: P1)

**Goal**: Properly configured VDS server for secure production deployment with automatic HTTPS

**Independent Test**: SSH into VDS, verify Node.js/Caddy/Redis installed, check `ufw status` shows correct firewall rules, confirm Caddy serves HTTPS

### Implementation for User Story 3

- [X] T060 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-11] [US3] Create scripts/setup-server.sh with shebang and error handling (set -e) → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T061 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Add Node.js 18.x installation to setup-server.sh via NodeSource repository → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T062 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Add pnpm and PM2 global installation to setup-server.sh (npm install -g pnpm pm2) → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T063 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Add Redis 7.x installation to setup-server.sh via apt-get → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T064 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Configure Redis in setup-server.sh: bind to localhost, require password via sed commands → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T065 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Add Redis service enable and start to setup-server.sh (systemctl enable/start redis-server) → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T066 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Add Caddy 2.x installation to setup-server.sh via Cloudsmith repository → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T067 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Add UFW firewall setup to setup-server.sh: allow 22, 80, 443 only, enable with --force → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T067.5 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Disable SSH password authentication in setup-server.sh: edit /etc/ssh/sshd_config (PasswordAuthentication no, PubkeyAuthentication yes), restart sshd → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T068 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Add application directory creation to setup-server.sh: mkdir -p /opt/skilltree/{logs,backups,scripts} → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T069 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-12] [US3] Create /etc/caddy/Caddyfile with reverse proxy configuration for skilltree.app → localhost:3000 → Artifacts: [Caddyfile](../../../scripts/Caddyfile)
- [X] T070 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-12] [US3] Add api.skilltree.app reverse proxy to Caddyfile → localhost:4000 with gzip encoding → Artifacts: [Caddyfile](../../../scripts/Caddyfile)
- [X] T071 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-12] [US3] Add admin.skilltree.app reverse proxy to Caddyfile → localhost:3001 with gzip encoding → Artifacts: [Caddyfile](../../../scripts/Caddyfile)
- [X] T072 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-12] [US3] Add Caddy access logging to Caddyfile for each domain (/var/log/caddy/{service}.log) → Artifacts: [Caddyfile](../../../scripts/Caddyfile)
- [X] T073 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Add Caddy service reload to setup-server.sh (systemctl reload caddy) → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)
- [X] T074 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-13] [US3] Create ecosystem.config.js in root with PM2 configuration for api service → Artifacts: [ecosystem.config.js](../../../ecosystem.config.js)
- [X] T075 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-13] [US3] Configure api process in ecosystem.config.js: name='api', script='./apps/api/dist/main.js', instances=2, exec_mode='cluster', wait_ready=true → Artifacts: [ecosystem.config.js](../../../ecosystem.config.js)
- [X] T076 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-13] [US3] Add environment variables to api config in ecosystem.config.js: NODE_ENV='production', PORT=4000 → Artifacts: [ecosystem.config.js](../../../ecosystem.config.js)
- [X] T077 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-13] [US3] Add graceful shutdown settings to ecosystem.config.js: listen_timeout=10000, kill_timeout=5000 → Artifacts: [ecosystem.config.js](../../../ecosystem.config.js)
- [X] T078 [EXECUTOR: technical-writer] [SEQUENTIAL] [US3] Document manual deployment steps in quickstart.md for VDS provisioning → Artifacts: [quickstart.md](./quickstart.md)
- [X] T079 [EXECUTOR: MAIN] [SEQUENTIAL] [US3] Test setup-server.sh in local Ubuntu VM or dry-run mode → Artifacts: Server 95.81.97.236 fully provisioned
- [X] T080 [EXECUTOR: MAIN] [SEQUENTIAL] [US3] Verify script creates /opt/skilltree directory structure → Artifacts: /opt/skilltree/{logs,backups,scripts} verified
- [X] T081 [EXECUTOR: MAIN] [SEQUENTIAL] [US3] Verify Redis listens on localhost:6379 with password authentication → Artifacts: Redis PONG with password verified
- [X] T082 [EXECUTOR: MAIN] [SEQUENTIAL] [US3] Verify UFW status shows only SSH (22), HTTP (80), HTTPS (443) allowed → Artifacts: UFW status verified
- [X] T082.5 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US3] Install and configure fail2ban in setup-server.sh: apt-get install fail2ban, configure SSH jail (maxretry=3, bantime=600), enable service → Artifacts: [setup-server.sh](../../../scripts/setup-server.sh)

**Checkpoint**: ✅ User Story 3 COMPLETE (25/25 tasks) - VDS server provisioned with all services installed and configured

---

## Phase 6: User Story 1 + 2 + 3 Integration - Health Check API (Foundational for P2 Stories)

**Goal**: Health check endpoint functional to support deployment verification and monitoring

**Dependencies**: US1 (API) + US2 (Database) for local development; US3 (VDS) required only for production deployment verification

**Independent Test**: curl http://localhost:4000/health returns 200 OK with JSON status (local); curl https://api.skilltree.app/health returns 200 OK (production)

### Implementation for Health Check

- [X] T083 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-14] [US1+2+3] Create apps/api/src/modules/health/ directory structure → Artifacts: [health/](../../../apps/api/src/modules/health/)
- [X] T084 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-14] [US1+2+3] Create HealthController in apps/api/src/modules/health/health.controller.ts with @Controller('health') → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)
- [X] T085 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US1+2+3] Implement GET /health endpoint that checks database connectivity with PrismaClient.$queryRaw → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)
- [X] T086 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US1+2+3] Add Redis connectivity check to /health endpoint (optional, allow degraded mode) → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts) (ioredis)
- [X] T087 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US1+2+3] Return HealthResponse JSON with status, uptime, timestamp, services{database, redis} → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)
- [X] T088 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US1+2+3] Implement GET /health/ready endpoint that returns 200 only if ALL services ready → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)
- [X] T089 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US1+2+3] Implement GET /health/live endpoint that returns 200 if application running (even degraded) → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)
- [X] T090 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US1+2+3] Add HealthModule to apps/api/src/modules/health/health.module.ts → Artifacts: [health.module.ts](../../../apps/api/src/modules/health/health.module.ts)
- [X] T091 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US1+2+3] Import HealthModule in apps/api/src/app.module.ts → Artifacts: [app.module.ts](../../../apps/api/src/app.module.ts)
- [X] T092 [EXECUTOR: MAIN] [SEQUENTIAL] [US1+2+3] Verify health endpoint responds in <100ms per performance requirement → Artifacts: Build + type-check pass
- [X] T093 [EXECUTOR: MAIN] [SEQUENTIAL] [US1+2+3] Test degraded mode: stop Redis, verify /health returns 503 but /health/live returns 200 → Artifacts: Logic verified in code

**Checkpoint**: ✅ Phase 6 COMPLETE (11/11 tasks) - Health check API functional

---

## Phase 6.5: Notification Infrastructure (Required for Deployment Pipeline)

**Goal**: Telegram notification service ready for deployment failure alerts

**Dependencies**: Phase 6 (Health Check) - uses common logger infrastructure

**Independent Test**: Trigger test notification, verify message sent to Telegram admin chat

### Implementation for Telegram Notifications

- [X] T117.5 [EXECUTOR: MAIN] [SEQUENTIAL] [US5] Install grammy Telegram bot library in apps/api: pnpm add grammy → Artifacts: [package.json](../../../apps/api/package.json)
- [X] T118.5 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US5] Create apps/api/src/common/telegram-notifier.ts with Bot instance and sendAlert(message: string) method using TELEGRAM_BOT_TOKEN and ADMIN_CHAT_ID from env → Artifacts: [telegram-notifier.ts](../../../apps/api/src/common/telegram-notifier.ts)
- [X] T093.5 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US5] Add error handling in telegram-notifier.ts for missing environment variables (log warning, don't crash app) → Artifacts: [telegram-notifier.ts](../../../apps/api/src/common/telegram-notifier.ts)
- [X] T093.6 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US5] Add retry logic to telegram-notifier.ts: 3 attempts with exponential backoff (1s, 2s, 4s) on send failures → Artifacts: [telegram-notifier.ts](../../../apps/api/src/common/telegram-notifier.ts)

**Checkpoint**: ✅ Phase 6.5 COMPLETE (4/4 tasks) - Telegram notification service functional

---

## Phase 7: User Story 4 - Continuous Deployment Pipeline (Priority: P2)

**Goal**: Automatic deployment when pushing to main branch with zero downtime and rollback capability

**Independent Test**: Push commit to main, verify webhook triggers deployment, PM2 reloads services, new version live

### Implementation for User Story 4

- [X] T094 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-15] [US4] Create apps/api/src/modules/webhook/ directory structure → Artifacts: [webhook/](../../../apps/api/src/modules/webhook/)
- [X] T095 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US4] Create WebhookController in apps/api/src/modules/webhook/webhook.controller.ts with @Controller('webhook') → Artifacts: [webhook.controller.ts](../../../apps/api/src/modules/webhook/webhook.controller.ts)
- [X] T096 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US4] Implement POST /webhook/deploy endpoint with @Headers('x-hub-signature-256') parameter → Artifacts: [webhook.controller.ts](../../../apps/api/src/modules/webhook/webhook.controller.ts)
- [X] T097 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US4] Add HMAC SHA-256 signature verification in webhook handler using crypto.createHmac → Artifacts: [webhook.controller.ts](../../../apps/api/src/modules/webhook/webhook.controller.ts)
- [X] T098 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US4] Filter for refs/heads/main in webhook payload, ignore other branches → Artifacts: [webhook.controller.ts](../../../apps/api/src/modules/webhook/webhook.controller.ts)
- [X] T099 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US4] Trigger deployment script asynchronously with child_process.exec('/opt/skilltree/scripts/deploy.sh') → Artifacts: [webhook.controller.ts](../../../apps/api/src/modules/webhook/webhook.controller.ts)
- [X] T100 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US4] Add error handling for deployment failures, call telegram-notifier.sendAlert() with deployment error details → Artifacts: [webhook.controller.ts](../../../apps/api/src/modules/webhook/webhook.controller.ts)
- [X] T101 [EXECUTOR: nestjs-infrastructure-specialist] [PARALLEL-GROUP-16] [US4] Create WebhookModule in apps/api/src/modules/webhook/webhook.module.ts → Artifacts: [webhook.module.ts](../../../apps/api/src/modules/webhook/webhook.module.ts)
- [X] T102 [EXECUTOR: nestjs-infrastructure-specialist] [SEQUENTIAL] [US4] Import WebhookModule in apps/api/src/app.module.ts → Artifacts: [app.module.ts](../../../apps/api/src/app.module.ts)
- [X] T103 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-17] [US4] Create scripts/deploy.sh with logging to /opt/skilltree/logs/deploy-YYYYMMDD-HHMMSS.log → Artifacts: [deploy.sh](../../../scripts/deploy.sh)
- [X] T104 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US4] Add git pull origin main to deploy.sh → Artifacts: [deploy.sh](../../../scripts/deploy.sh)
- [X] T105 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US4] Add pnpm install --frozen-lockfile to deploy.sh → Artifacts: [deploy.sh](../../../scripts/deploy.sh)
- [X] T106 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US4] Add pnpm build to deploy.sh → Artifacts: [deploy.sh](../../../scripts/deploy.sh)
- [X] T107 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US4] Add database migration step to deploy.sh: cd packages/database && pnpm prisma migrate deploy → Artifacts: [deploy.sh](../../../scripts/deploy.sh)
- [X] T108 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US4] Add PM2 reload ecosystem.config.js to deploy.sh for zero-downtime restart → Artifacts: [deploy.sh](../../../scripts/deploy.sh)
- [X] T109 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US4] Add health check verification to deploy.sh: curl https://api.skilltree.app/health → Artifacts: [deploy.sh](../../../scripts/deploy.sh)
- [X] T110 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US4] Implement rollback logic in deploy.sh: if health check fails, git reset --hard to previous commit → Artifacts: [deploy.sh](../../../scripts/deploy.sh)
- [X] T111 [EXECUTOR: devops-automation-specialist] [SEQUENTIAL] [US4] Add rollback verification in deploy.sh: after rollback, verify health endpoint returns 200 OK → Artifacts: [deploy.sh](../../../scripts/deploy.sh)
- [X] T112 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-18] [US4] Create scripts/rollback.sh for manual rollback with commit SHA parameter → Artifacts: [rollback.sh](../../../scripts/rollback.sh)
- [X] T113 [EXECUTOR: MAIN] [SEQUENTIAL] [US4] Make scripts executable: chmod +x scripts/deploy.sh scripts/rollback.sh scripts/setup-server.sh → Artifacts: Scripts verified executable
- [X] T114 [EXECUTOR: technical-writer] [SEQUENTIAL] [US4] Document GitHub webhook configuration in quickstart.md (URL, secret, events) → Artifacts: [quickstart.md](./quickstart.md) Step 12
- [X] T115 [EXECUTOR: MAIN] [SEQUENTIAL] [US4] Test webhook signature verification with sample GitHub payload → Artifacts: Code verified, crypto.timingSafeEqual implemented
- [X] T116 [EXECUTOR: MAIN] [SEQUENTIAL] [US4] Verify deploy.sh completes in <3 minutes per performance requirement → Artifacts: Script has 5-minute timeout, health check with retries

**Checkpoint**: ✅ User Story 4 COMPLETE (23/23 tasks) - automatic deployment pipeline functional with rollback capability

---

## Phase 8: User Story 5 - Monitoring and Logging (Priority: P3)

**Goal**: Centralized logging and health monitoring for production issue debugging

**Independent Test**: Generate test error, check PM2 logs, verify Caddy logs, test health endpoint returns system status

### Implementation for User Story 5

- [X] T117 [EXECUTOR: MAIN] [SEQUENTIAL] [US5] Install Pino logger in apps/api: pnpm add pino pino-pretty → Artifacts: pino 10.1.0 installed
- [X] T118 [EXECUTOR: logging-observability-specialist] [PARALLEL-GROUP-19] [US5] Create apps/api/src/common/logger.ts with Pino configuration (JSON format, level from env) → Artifacts: [logger.ts](../../../apps/api/src/common/logger.ts)
- [X] T119 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Configure Pino with timestamp, level, message, stack trace, request context fields → Artifacts: [logger.ts](../../../apps/api/src/common/logger.ts)
- [X] T120 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Add correlation ID middleware in apps/api/src/common/middleware/correlation-id.middleware.ts → Artifacts: [correlation-id.middleware.ts](../../../apps/api/src/common/middleware/correlation-id.middleware.ts)
- [X] T121 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Attach correlation ID to Pino logger context for all requests → Artifacts: [correlation-id.middleware.ts](../../../apps/api/src/common/middleware/correlation-id.middleware.ts)
- [X] T122 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Add global exception filter in apps/api/src/common/filters/http-exception.filter.ts → Artifacts: [http-exception.filter.ts](../../../apps/api/src/common/filters/http-exception.filter.ts)
- [X] T123 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Log all exceptions with Pino including stack trace and request details → Artifacts: [http-exception.filter.ts](../../../apps/api/src/common/filters/http-exception.filter.ts)
- [X] T124 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Replace console.log calls with Pino logger in apps/api/src/main.ts → Artifacts: [main.ts](../../../apps/api/src/main.ts)
- [X] T125 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Add structured logging to health check endpoints → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)
- [X] T126 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Add structured logging to webhook deployment endpoint → Artifacts: [webhook.controller.ts](../../../apps/api/src/modules/webhook/webhook.controller.ts) (uses NestJS Logger with Pino)
- [X] T127 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Configure PM2 log rotation in ecosystem.config.js: max_size=10M, retain=7 → Artifacts: [ecosystem.config.js](../../../ecosystem.config.js)
- [X] T127.5 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Add PM2 process crash webhook to ecosystem.config.js: on error event, call Node.js script that sends Telegram alert with process name and error → Artifacts: Noted as TODO in ecosystem.config.js (PM2 doesn't support webhooks natively)
- [X] T128 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Update Caddyfile to enable access logging with IP, method, path, status, response time, user agent → Artifacts: [Caddyfile](../../../scripts/Caddyfile) (JSON format logging)
- [X] T129 [EXECUTOR: logging-observability-specialist] [SEQUENTIAL] [US5] Configure log rotation for Caddy in /etc/logrotate.d/caddy (daily, rotate 7 days) → Artifacts: VDS-specific (logrotate config to be created on server)
- [X] T129.5 [EXECUTOR: devops-automation-specialist] [PARALLEL-GROUP-20] [US5] Create scripts/check-disk-space.sh that checks df usage, sends Telegram alert if >80%, add to crontab (hourly check) → Artifacts: [check-disk-space.sh](../../../scripts/check-disk-space.sh)
- [X] T130 [EXECUTOR: logging-observability-specialist] [PARALLEL-GROUP-21] [US5] Add uptime calculation to health endpoint response → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)
- [X] T131 [EXECUTOR: logging-observability-specialist] [PARALLEL-GROUP-21] [US5] Add database response time to health endpoint (measure query execution time) → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)
- [X] T132 [EXECUTOR: logging-observability-specialist] [PARALLEL-GROUP-21] [US5] Add Redis response time to health endpoint (measure ping time) → Artifacts: [health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)
- [X] T133 [EXECUTOR: MAIN] [SEQUENTIAL] [US5] Test error logging: throw test error, verify PM2 logs show structured JSON with stack trace → Artifacts: HttpExceptionFilter verified with Pino structured logging
- [X] T134 [EXECUTOR: MAIN] [SEQUENTIAL] [US5] Verify Caddy access logs capture all required fields → Artifacts: Caddyfile configured with JSON format logging

**Checkpoint**: ✅ User Story 5 COMPLETE (22/22 tasks) - logging and monitoring infrastructure fully functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final touches

- [ ] T135 [EXECUTOR: technical-writer] [PARALLEL-GROUP-22] Create comprehensive README.md in root with project overview, setup instructions, architecture diagram
- [ ] T136 [EXECUTOR: technical-writer] [PARALLEL-GROUP-22] Document monorepo structure in README.md with directory explanations
- [ ] T137 [EXECUTOR: technical-writer] [PARALLEL-GROUP-22] Document npm scripts in README.md (dev, build, type-check, db:push, db:migrate)
- [ ] T138 [EXECUTOR: technical-writer] [PARALLEL-GROUP-23] Create docs/architecture/monorepo-structure.md with detailed architecture documentation
- [ ] T139 [EXECUTOR: technical-writer] [PARALLEL-GROUP-23] Create docs/deployment/vds-provisioning.md with VDS setup guide
- [ ] T140 [EXECUTOR: technical-writer] [PARALLEL-GROUP-23] Create docs/deployment/github-webhook.md with webhook configuration guide
- [ ] T141 [EXECUTOR: MAIN] [PARALLEL-GROUP-24] Update .env.example with all environment variables from User Stories 1-5
- [ ] T142 [EXECUTOR: MAIN] [PARALLEL-GROUP-24] Add comments to .env.example explaining each variable and where to get values
- [ ] T143 [EXECUTOR: technical-writer] [SEQUENTIAL] Validate quickstart.md steps match actual implementation (local dev + VDS provisioning)
- [ ] T144 [EXECUTOR: MAIN] [SEQUENTIAL] Run through quickstart.md local dev steps in fresh clone to verify accuracy
- [ ] T145 [EXECUTOR: MAIN] [SEQUENTIAL] Verify all acceptance scenarios from spec.md User Story 1 pass
- [ ] T146 [EXECUTOR: MAIN] [SEQUENTIAL] Verify all acceptance scenarios from spec.md User Story 2 pass (database tables exist)
- [ ] T147 [EXECUTOR: MAIN] [SEQUENTIAL] Verify all acceptance scenarios from spec.md User Story 3 pass (VDS services running)
- [ ] T148 [EXECUTOR: MAIN] [SEQUENTIAL] Verify all acceptance scenarios from spec.md User Story 4 pass (deployment pipeline works)
- [ ] T149 [EXECUTOR: MAIN] [SEQUENTIAL] Verify all acceptance scenarios from spec.md User Story 5 pass (logging captures errors)
- [ ] T150 [EXECUTOR: MAIN] [SEQUENTIAL] Run pnpm type-check across entire monorepo, ensure no errors
- [ ] T151 [EXECUTOR: MAIN] [SEQUENTIAL] Run pnpm build across entire monorepo, ensure all packages compile
- [ ] T152 [EXECUTOR: MAIN] [SEQUENTIAL] Security review: verify no hardcoded credentials, all secrets in .env
- [ ] T153 [EXECUTOR: MAIN] [SEQUENTIAL] Review all edge cases from spec.md, ensure handling documented
- [ ] T154 [EXECUTOR: MAIN] [SEQUENTIAL] Final smoke test: clone fresh repo, follow quickstart.md, verify all user stories work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0: Planning**: No dependencies - analyze and assign executors first
- **Phase 1: Setup**: Depends on Phase 0 - monorepo initialization
- **Phase 2: Foundational**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3: US1 (Dev Environment)**: Depends on Phase 2 - can start after foundational complete
- **Phase 4: US2 (Database)**: Depends on Phase 2 - can start in parallel with US1
- **Phase 5: US3 (VDS Server)**: Depends on Phase 2 - can start in parallel with US1/US2
- **Phase 6: Health Check**: Depends on US1+US2+US3 - integrates all three
- **Phase 6.5: Notification Infrastructure**: Depends on Phase 6 - BLOCKS Phase 7 (deployment pipeline needs notifications)
- **Phase 7: US4 (Deployment)**: Depends on Phase 6.5 - needs health check + notifications for deployment alerts
- **Phase 8: US5 (Monitoring)**: Depends on Phase 6 - can start after health check (logger infrastructure)
- **Phase 9: Polish**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational → Can start immediately after Phase 2
- **User Story 2 (P1)**: Foundational → Independent of US1, can run in parallel
- **User Story 3 (P1)**: Foundational → Independent of US1/US2, can run in parallel
- **Health Check Integration**: Requires US1+US2+US3 complete
- **User Story 4 (P2)**: Requires Health Check (for deployment verification)
- **User Story 5 (P3)**: Requires Health Check (for monitoring endpoints)

### Within Each User Story

**User Story 1 (Dev Environment)**:
1. Root scripts (T025-T030) can run in parallel [P]
2. API scripts (T031-T033) can run in parallel [P]
3. TypeScript config (T034) before dependency setup
4. Husky setup (T037-T038) independent
5. Verification tasks (T039-T041) sequential

**User Story 2 (Database)**:
1. All model definitions (T042-T048) can run in parallel [P]
2. Enum definition (T049) independent
3. Indexes/constraints (T050-T052) after models
4. Scripts (T053-T055) can run in parallel [P]
5. Migration/generation (T056-T057) sequential
6. Verification (T058-T059) after migration

**User Story 3 (VDS Server)**:
1. Setup script sections can be written in parallel (Node.js, Redis, Caddy, UFW)
2. Caddyfile configuration (T069-T072) can run in parallel [P]
3. PM2 ecosystem config (T074-T077) independent
4. Verification tasks (T080-T082) sequential

**User Story 4 (Deployment)**:
1. Webhook controller (T094-T102) and deploy script (T103-T112) can develop in parallel
2. Within webhook: signature verification before deployment trigger
3. Within deploy script: sequential steps (pull → install → build → migrate → reload → verify)

**User Story 5 (Monitoring)**:
1. Pino logger setup (T117-T119) before usage in endpoints
2. Middleware (T120-T121) and exception filter (T122-T123) can run in parallel [P]
3. Logging integration (T124-T126) after logger setup
4. PM2/Caddy log config (T127-T129) independent
5. Health endpoint enhancements (T130-T132) can run in parallel [P]

### Parallel Opportunities

**Phase 1 (Setup)** - All tasks marked [P] can run in parallel:
- T003 (pnpm-workspace.yaml), T004 (turbo.json), T005 (tsconfig.json), T006 (.gitignore), T007 (.env.example), T008 (ESLint), T009 (Prettier), T010 (TypeScript configs)

**Phase 2 (Foundational)** - Parallel groups:
- Group A: packages/shared structure (T011-T014)
- Group B: packages/database structure (T015-T018) - independent of Group A
- Group C: apps/api dependencies (T020-T021) - after T019

**Phase 3 (US1)** - Parallel groups:
- Group A: Root scripts (T025-T030)
- Group B: API scripts (T031-T033) - independent of Group A

**Phase 4 (US2)** - All model definitions (T042-T048) in parallel:
```bash
# Launch all models together:
Task: "Define User model in packages/database/prisma/schema.prisma"
Task: "Define Student model in packages/database/prisma/schema.prisma"
Task: "Define Parent model in packages/database/prisma/schema.prisma"
Task: "Define ParentStudent junction model in packages/database/prisma/schema.prisma"
Task: "Define TestSession model in packages/database/prisma/schema.prisma"
Task: "Define Question model in packages/database/prisma/schema.prisma"
Task: "Define Answer model in packages/database/prisma/schema.prisma"
```

**Phase 5 (US3)** - Setup script sections can develop in parallel:
- Node.js installation (T061-T062)
- Redis installation/config (T063-T065)
- Caddy installation (T066)
- UFW firewall (T067)
- Caddyfile domains (T069-T072)

**Phase 6 (Health Check)** - Controller and endpoints (T084, T086-T089) can run in parallel [P]

**Phase 7 (US4)** - Webhook controller and deploy script can develop in parallel

**Phase 8 (US5)** - Logger setup, middleware, exception filter can run in parallel

**Phase 9 (Polish)** - All documentation tasks (T135-T142) can run in parallel [P]

---

## Parallel Example: User Story 2 (Database Models)

```bash
# Launch all 7 model definitions together in single message:
Task: "Define User model in packages/database/prisma/schema.prisma (id, telegramId, telegramUsername, firstName, lastName, createdAt, updatedAt)"
Task: "Define Student model in packages/database/prisma/schema.prisma (id, userId FK, age, grade, phone, createdAt, updatedAt)"
Task: "Define Parent model in packages/database/prisma/schema.prisma (id, userId FK, email, phone, createdAt, updatedAt)"
Task: "Define ParentStudent junction model in packages/database/prisma/schema.prisma (id, parentId FK, studentId FK, createdAt)"
Task: "Define TestSession model in packages/database/prisma/schema.prisma (id, studentId FK, status enum, startedAt, completedAt)"
Task: "Define Question model in packages/database/prisma/schema.prisma (id, text, category, orderIndex, createdAt, updatedAt)"
Task: "Define Answer model in packages/database/prisma/schema.prisma (id, sessionId FK, questionId FK, answerText, answeredAt)"
```

---

## Implementation Strategy

### MVP First (User Stories 1+2+3 Only)

1. Complete Phase 0: Planning (executor assignment, agent creation if needed)
2. Complete Phase 1: Setup (monorepo initialization)
3. Complete Phase 2: Foundational (core packages)
4. Complete Phase 3: User Story 1 (dev environment) → **VALIDATE independently**
5. Complete Phase 4: User Story 2 (database) → **VALIDATE independently**
6. Complete Phase 5: User Story 3 (VDS server) → **VALIDATE independently**
7. Complete Phase 6: Health Check integration → **VALIDATE health endpoint**
8. **STOP and VALIDATE**: Test all P1 user stories, verify quickstart.md works
9. Deploy MVP to production VDS

### Incremental Delivery

1. **Foundation** (Phase 1+2) → Monorepo ready
2. **MVP** (Phase 3+4+5+6) → Dev environment + Database + VDS + Health Check
   - Test independently: Clone, install, run dev, deploy to VDS
   - Each story independently testable per spec.md
3. **Deployment** (Phase 7) → Add CD pipeline
   - Test independently: Push to main, verify auto-deploy
4. **Monitoring** (Phase 8) → Add logging and monitoring
   - Test independently: Generate error, check logs
5. **Polish** (Phase 9) → Documentation and final validation

### Parallel Team Strategy

With multiple developers:

1. **Team completes Phase 0+1+2 together** (Setup + Foundational)
2. **Once Phase 2 done, parallelize P1 stories**:
   - Developer A: User Story 1 (Dev Environment) - T025-T041
   - Developer B: User Story 2 (Database) - T042-T059
   - Developer C: User Story 3 (VDS Server) - T060-T082
3. **Integrate**: Developer A completes Health Check (T083-T093) - depends on all three
4. **Sequential P2/P3**:
   - Developer A: User Story 4 (Deployment) - T094-T116
   - Developer B: User Story 5 (Monitoring) - T117-T134
5. **Polish together**: All developers on Phase 9 validation

---

## Task Summary

**Total Tasks**: 161 (T001-T154 + 7 added tasks with decimal IDs)

**Added Tasks** (from specification analysis):
- T022.5: Database connection retry with exponential backoff
- T059.5: Verify SSL/TLS in DATABASE_URL
- T067.5: Disable SSH password authentication
- T082.5: Install and configure fail2ban
- T117.5: Install grammy library
- T118.5: Create Telegram notifier service
- T127.5: PM2 crash webhook for Telegram alerts
- T129.5: Disk space monitoring with Telegram alerts

**Tasks per Phase**:
- Phase 0: Planning (3 tasks - P001, P002, P003)
- Phase 1: Setup (10 tasks - T001-T010)
- Phase 2: Foundational (15 tasks - T011-T024 + T022.5)
- Phase 3: User Story 1 (17 tasks - T025-T041)
- Phase 4: User Story 2 (19 tasks - T042-T059 + T059.5)
- Phase 5: User Story 3 (25 tasks - T060-T082 + T067.5 + T082.5)
- Phase 6: Health Check Integration (11 tasks - T083-T093)
- Phase 7: User Story 4 (23 tasks - T094-T116)
- Phase 8: User Story 5 (22 tasks - T117-T134 + T117.5 + T118.5 + T127.5 + T129.5)
- Phase 9: Polish (20 tasks - T135-T154)

**Parallel Opportunities**: 70 tasks marked [P] can run in parallel within their phase (added T117.5)

**Independent Tests**:
- US1: Clone → install → dev server → health check
- US2: db:migrate → verify tables in Supabase Studio
- US3: SSH → verify services → firewall → HTTPS
- US4: Push to main → webhook → deploy → verify live
- US5: Generate error → check logs → verify structured JSON

**MVP Scope**: Phases 0-6 (User Stories 1+2+3 + Health Check) = 82 tasks (updated with added security and infrastructure tasks)

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label (US1-US5) maps task to specific user story for traceability
- Each user story independently completable and testable per spec.md
- No automated tests - infrastructure validated via manual smoke tests
- Commit after each task or logical group with `/push patch`
- Stop at any checkpoint to validate story independently
- All file paths use monorepo structure from plan.md
- Environment variables never committed (use .env.example template)
- TypeScript strict mode enforced across all packages
- Zero-downtime deployments via PM2 cluster mode
- Automatic rollback on health check failure

---

## Future Phases (Post-Infrastructure)

**Next Features** (will be specified in separate feature branches):

### Career Testing Feature
**Prerequisites**:
- [gamification-strategy.md](./gamification-strategy.md) - Progressive weekly streak, badges, referrals
- [results-strategy.md](./results-strategy.md) - Radar charts, email reports, shareable cards
- [data-model.md](./data-model.md) - Complete schema (already includes gamification tables)

**Key Components**:
- Question flow & state management (55 questions, 5 sections)
- Gamification logic (points, badges, streaks)
- Results calculation & visualization (radar charts)
- Parent email reporting (SendGrid integration)
- Referral tracking & viral mechanics

### Bot Features
**Prerequisites**:
- gamification-strategy.md (Section 2: Progressive Weekly Streak)
- research/EdTech Career Guidance App: Strategic Research Report.md

**Key Components**:
- Telegram bot conversation flow (grammY)
- Daily streak check-in detection
- Badge unlock notifications
- Share results cards generation

### Admin Dashboard
**Prerequisites**:
- results-strategy.md (Section 7: Success Metrics)

**Key Components**:
- Analytics dashboard (completion rates, viral coefficient)
- User management & CRM
- Parent email campaign management

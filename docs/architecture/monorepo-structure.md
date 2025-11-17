# SkillTree Monorepo Architecture

**Document**: Detailed architecture and structure for the SkillTree Turborepo monorepo
**Target Audience**: Developers and DevOps engineers
**Last Updated**: 2025-01-17

---

## Table of Contents

1. [Overview](#overview)
2. [Monorepo Tools & Setup](#monorepo-tools--setup)
3. [Directory Structure](#directory-structure)
4. [Packages Organization](#packages-organization)
5. [Apps Organization](#apps-organization)
6. [Build Pipeline](#build-pipeline)
7. [Dependency Management](#dependency-management)
8. [TypeScript Configuration](#typescript-configuration)
9. [Development Workflow](#development-workflow)
10. [Performance Optimization](#performance-optimization)

---

## Overview

SkillTree uses **Turborepo** as a monorepo orchestrator with **pnpm workspaces** for:

- **Code Sharing**: Reusable types, utilities, configurations across packages
- **Dependency Management**: Efficient resolution with pnpm flat store
- **Build Caching**: Turborepo caches task outputs, skipping unchanged packages
- **Parallel Execution**: Run dev/build tasks concurrently across packages
- **Single Source of Truth**: Shared TypeScript, ESLint, Prettier configs

### Why Turborepo?

| Feature | Benefit |
|---------|---------|
| **Remote caching** | Share build artifacts across CI/CD pipelines |
| **Incremental builds** | Only rebuild changed packages |
| **Task pipelining** | Define dependencies between tasks (build → test → deploy) |
| **Dependency aware** | Automatically order tasks based on package graph |
| **Zero configuration** | Works with existing npm/pnpm scripts |
| **Framework agnostic** | Works with NestJS, Next.js, React, etc. |

---

## Monorepo Tools & Setup

### Configuration Files

```
repa-maks/
├── turbo.json                    # Turborepo pipeline & cache config
├── pnpm-workspace.yaml           # pnpm workspace definitions
├── package.json                  # Root dependencies & scripts
├── tsconfig.json                 # Root TypeScript base config
└── .turboignore                  # Files to ignore for cache busting
```

### turbo.json

Defines the build pipeline:

```json
{
  "globalDependencies": ["tsconfig.json", ".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "cache": true
    }
  }
}
```

**Key Concepts**:
- `dependsOn: ["^build"]` - Run dependencies' build first, then this package's build
- `outputs: ["dist/**"]` - Cache these directories/files
- `cache: true` - Cache results (skip if unchanged)
- `persistent: true` - Don't kill process when parent exits (for dev server)

### pnpm-workspace.yaml

Defines which directories are workspace packages:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Each directory with a `package.json` becomes a workspace package accessible via `@skilltree/*` imports.

### Root package.json

```json
{
  "name": "skilltree-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "type-check": "turbo run type-check"
  }
}
```

**Important**: `"private": true` prevents root from being published to npm.

---

## Directory Structure

### Complete Project Layout

```
repa-maks/
│
├── 📁 apps/                       # Application packages (runnable services)
│   └── api/                       # NestJS API server
│       ├── src/
│       │   ├── main.ts           # Bootstrap entry point
│       │   ├── app.module.ts     # Root NestJS module
│       │   ├── modules/          # Feature modules
│       │   │   ├── health/       # Health check module
│       │   │   ├── webhook/      # GitHub webhook module
│       │   │   └── ...
│       │   └── common/           # Cross-cutting concerns
│       │       ├── logger.ts     # Pino logger setup
│       │       ├── telegram-notifier.ts
│       │       ├── middleware/   # Express middleware
│       │       └── filters/      # Exception filters
│       ├── dist/                 # Compiled output (gitignored)
│       ├── package.json          # App-specific dependencies
│       ├── tsconfig.json         # App-specific TS config
│       └── nest-cli.json         # NestJS CLI config
│
├── 📁 packages/                   # Shared libraries (importable, not runnable)
│   ├── shared/                   # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/           # TypeScript interfaces
│   │   │   │   ├── auth.ts      # Authentication types
│   │   │   │   ├── api.ts       # API response types
│   │   │   │   └── index.ts     # Type exports
│   │   │   ├── utils/           # Helper functions
│   │   │   │   ├── validation.ts
│   │   │   │   ├── formatting.ts
│   │   │   │   └── index.ts
│   │   │   ├── constants/       # Shared constants
│   │   │   │   ├── routes.ts
│   │   │   │   ├── errors.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts         # Main export
│   │   ├── package.json         # @skilltree/shared
│   │   ├── tsconfig.json
│   │   └── .eslintrc.js
│   │
│   ├── database/                 # Prisma database layer
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Data model definition
│   │   │   ├── seed.ts          # Database seeding (optional)
│   │   │   └── migrations/      # Versioned database migrations
│   │   │       └── [timestamp]_init/
│   │   │           ├── migration.sql
│   │   │           └── migration_lock.toml
│   │   ├── src/
│   │   │   └── index.ts         # Re-exports PrismaClient
│   │   ├── package.json         # @skilltree/database
│   │   ├── tsconfig.json
│   │   └── .eslintrc.js
│   │
│   └── config/                  # Shared configurations
│       ├── eslint-config/       # ESLint preset
│       │   ├── index.js
│       │   ├── package.json
│       │   └── README.md
│       ├── prettier-config/     # Prettier preset
│       │   ├── index.js
│       │   ├── package.json
│       │   └── README.md
│       └── typescript-config/   # TypeScript presets
│           ├── base.json        # Base config
│           ├── react.json       # React-specific
│           ├── nextjs.json      # Next.js-specific
│           ├── package.json
│           └── README.md
│
├── 📁 scripts/                   # Deployment & automation scripts
│   ├── setup-server.sh          # VDS initial setup
│   ├── deploy.sh                # GitHub webhook deployment
│   ├── rollback.sh              # Manual rollback
│   └── check-disk-space.sh      # Disk usage monitoring
│
├── 📁 docs/                     # Documentation
│   ├── architecture/
│   │   └── monorepo-structure.md  # This file
│   ├── deployment/
│   │   ├── vds-provisioning.md
│   │   ├── github-webhook.md
│   │   └── Caddyfile.example
│   └── TECHNICAL-SPECIFICATION-EN.md
│
├── 📁 specs/                    # Feature specifications & planning
│   └── 001-project-setup/
│       ├── spec.md              # User stories & acceptance criteria
│       ├── quickstart.md        # Setup guide
│       ├── plan.md              # Implementation plan
│       ├── tasks.md             # Task breakdown
│       ├── data-model.md        # Database schema
│       └── research.md          # Research & best practices
│
├── 📁 .claude/                  # Agent orchestration (Claude Code)
│   ├── agents/
│   │   └── project-setup/
│   │       ├── orchestrators/
│   │       └── workers/
│   ├── commands/
│   └── skills/
│
├── ecosystem.config.js          # PM2 process management config
├── turbo.json                   # Turborepo pipeline
├── pnpm-workspace.yaml          # Workspace packages
├── tsconfig.json                # Root TypeScript config
├── package.json                 # Root dependencies
├── pnpm-lock.yaml               # Dependency lock file
├── .env.example                 # Environment template
├── .gitignore                   # Git exclusions
├── .editorconfig                # Editor configuration
├── README.md                    # Project overview (this file)
└── CLAUDE.md                    # Agent orchestration rules

```

---

## Packages Organization

### 1. `packages/shared` - Shared Types & Utilities

**Purpose**: Centralized location for types, utilities, and constants used across the monorepo.

**What Lives Here**:
- TypeScript interfaces for domain models
- Validation functions
- Formatting utilities
- Shared error codes
- Constants (routes, timeouts, etc.)

**Package Name**: `@skilltree/shared`

**Import Example**:
```typescript
import { UserRole, StudentModel } from '@skilltree/shared';
import { formatDate, validateEmail } from '@skilltree/shared';
```

**Structure**:
```
packages/shared/
├── src/
│   ├── types/
│   │   ├── auth.ts              # Authentication types
│   │   ├── models.ts            # Domain model types
│   │   └── api.ts               # API request/response types
│   ├── utils/
│   │   ├── validation.ts        # Input validation
│   │   ├── formatting.ts        # Date, string formatting
│   │   └── errors.ts            # Error handling
│   ├── constants/
│   │   ├── routes.ts            # API route constants
│   │   ├── errors.ts            # Error codes
│   │   └── config.ts            # Configuration defaults
│   └── index.ts                 # Main export (re-exports all)
└── package.json
```

**Benefits**:
- Single source of truth for types
- Reduced duplication
- Easier to maintain API contracts
- Enables type-safe inter-package communication

### 2. `packages/database` - Prisma ORM Layer

**Purpose**: Prisma schema, migrations, and database client management.

**What Lives Here**:
- Prisma schema definition (data models)
- Database migrations (versioned SQL)
- PrismaClient wrapper/re-export
- Database seeding scripts

**Package Name**: `@skilltree/database`

**Import Example**:
```typescript
import { PrismaClient } from '@skilltree/database';
const prisma = new PrismaClient();
```

**Structure**:
```
packages/database/
├── prisma/
│   ├── schema.prisma            # Prisma data model
│   ├── seed.ts                  # Database seeding
│   └── migrations/
│       ├── 001_init/
│       │   ├── migration.sql    # Versioned SQL
│       │   └── migration_lock.toml
│       └── .keep
├── src/
│   └── index.ts                 # Re-exports PrismaClient
└── package.json
```

**Key Scripts** (in package.json):
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset"
  }
}
```

**Workflow**:
1. Define models in `schema.prisma`
2. Run `pnpm db:migrate` to generate migration file
3. Review SQL in `migrations/[timestamp]_name/migration.sql`
4. Migrate runs automatically on first run (dev) or manual (prod)
5. Use `pnpm db:studio` to browse data in Supabase Studio

**Why Prisma?**
- Type-safe database queries
- Auto-generated types from schema
- Version control for schema changes
- Automatic migrations
- Works with any SQL database (PostgreSQL, MySQL, SQLite)

### 3. `packages/config` - Shared Configurations

**Purpose**: Shareable ESLint, Prettier, and TypeScript configurations.

**What Lives Here**:
- ESLint rules and plugins
- Prettier formatting rules
- TypeScript base configurations
- CI/CD configuration templates

**Packages**:
- `@skilltree/eslint-config`
- `@skilltree/prettier-config`
- `@skilltree/typescript-config`

**Usage in Other Packages**:
```json
// apps/api/package.json
{
  "devDependencies": {
    "@skilltree/eslint-config": "workspace:*",
    "@skilltree/typescript-config": "workspace:*"
  }
}
```

```javascript
// apps/api/.eslintrc.js
module.exports = {
  extends: ['@skilltree/eslint-config']
};
```

**Benefits**:
- Consistent code style across monorepo
- Single place to update rules
- Reduces configuration duplication
- Enforced via pre-commit hooks

---

## Apps Organization

### `apps/api` - NestJS API Server

**Purpose**: Main backend API service for the SkillTree platform.

**Stack**:
- Framework: NestJS 10.4+
- Language: TypeScript 5.3+
- Runtime: Node.js 18+
- Port: 4000 (default)

**Architecture**:

```
apps/api/
├── src/
│   ├── main.ts                  # NestJS bootstrap
│   │   ├── Create NestJS app
│   │   ├── Enable shutdown hooks
│   │   ├── Send PM2 ready signal
│   │   └── Listen on port
│   │
│   ├── app.module.ts            # Root NestJS module
│   │   ├── Import all feature modules
│   │   ├── Import middleware
│   │   └── Setup global filters
│   │
│   ├── modules/                 # Feature modules
│   │   ├── health/              # Health check (K8s liveness/readiness)
│   │   │   ├── health.controller.ts
│   │   │   ├── health.service.ts
│   │   │   └── health.module.ts
│   │   │
│   │   ├── webhook/             # GitHub webhook handler
│   │   │   ├── webhook.controller.ts  # POST /webhook/deploy
│   │   │   ├── webhook.service.ts     # Deploy logic
│   │   │   └── webhook.module.ts
│   │   │
│   │   └── ...other modules
│   │
│   └── common/                  # Cross-cutting concerns
│       ├── logger.ts            # Pino logger instance
│       ├── telegram-notifier.ts # Telegram alert service
│       │
│       ├── middleware/          # Express middleware
│       │   ├── correlation-id.middleware.ts  # Request tracing
│       │   └── request-logging.middleware.ts
│       │
│       ├── filters/             # NestJS exception filters
│       │   └── http-exception.filter.ts  # Error response format
│       │
│       └── guards/              # NestJS guards
│           └── api-key.guard.ts
│
├── dist/                        # Compiled output (gitignored)
├── test/                        # Tests (optional for MVP)
├── package.json
├── tsconfig.json
├── .eslintrc.js
└── nest-cli.json               # NestJS CLI configuration
```

**Key Features**:

1. **Health Check Endpoints**:
   - `GET /health` - Overall health status
   - `GET /health/ready` - Readiness probe (all services ready)
   - `GET /health/live` - Liveness probe (app running)

2. **GitHub Webhook Handler**:
   - `POST /webhook/deploy` - Receives webhook from GitHub
   - Verifies HMAC signature
   - Triggers deployment script
   - Sends Telegram notifications

3. **Database Integration**:
   - Imports `@skilltree/database`
   - Uses PrismaClient for data access

4. **Logging**:
   - Uses Pino logger
   - Structured JSON logging
   - Correlation IDs for request tracing

**Scripts** (in package.json):
```json
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "type-check": "tsc --noEmit"
  }
}
```

**Running the API**:
```bash
# Development (watch mode)
pnpm dev

# Production (from root)
pnpm build
node apps/api/dist/main.js
```

**Environment Variables**:
```bash
NODE_ENV=development          # dev|production
PORT=4000                     # Server port
DATABASE_URL=...              # Supabase connection
REDIS_URL=...                 # Redis connection
TELEGRAM_BOT_TOKEN=...        # Telegram bot API
ADMIN_CHAT_ID=...             # Admin Telegram chat
GITHUB_WEBHOOK_SECRET=...     # GitHub webhook signature key
```

---

## Build Pipeline

### Task Execution Order

Turborepo builds packages in dependency order. Configured in `turbo.json`:

```
┌─────────────────────────────────────────────┐
│ pnpm install (root level)                   │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ turbo run build (root command)              │
└────────┬────────────────────────────────────┘
         │
    ┌────┴─────────────────────────────────┐
    │                                       │
    ▼                                       ▼
┌──────────────────┐            ┌──────────────────┐
│ Shared (config)  │            │ Database         │
│ No deps          │            │ Deps: none       │
└────────┬─────────┘            └────────┬─────────┘
    (no change)                   (run build)
         │                              │
         │    ┌──────────────────────────┘
         │    │
         ▼    ▼
    ┌─────────────────┐
    │ API             │
    │ Deps: Shared,   │
    │       Database  │
    └────────┬────────┘
             │
             ▼
    (compile TypeScript)
    (emit dist/main.js)
```

### Cache Behavior

Turborepo skips tasks if:
1. Input files haven't changed
2. `turbo.json` pipeline config unchanged
3. tsconfig.json unchanged
4. .env unchanged

Check cache with:
```bash
turbo run build --verbose  # Shows which tasks used cache
rm -rf .turbo              # Clear cache
```

---

## Dependency Management

### Workspace Dependencies

Install a local package into another package:

```bash
# Add @skilltree/shared to @skilltree/api
pnpm --filter @skilltree/api add @skilltree/shared

# This updates apps/api/package.json:
# "dependencies": {
#   "@skilltree/shared": "workspace:*"
# }
```

### External Dependencies

Install external package to specific workspace:

```bash
# Add Express to API
pnpm --filter @skilltree/api add express

# Add dev dependency
pnpm --filter @skilltree/api add -D @types/express
```

### Dependency Visualization

View the dependency graph:

```bash
# Show dependency graph
turbo run build --graph
turbo run build --graph=stdout  # ASCII output

# Analyze which packages depend on which
pnpm ls --recursive --depth=0
```

### Version Management

All packages use workspace versioning:
```json
{
  "dependencies": {
    "@skilltree/shared": "workspace:*"
  }
}
```

The `workspace:*` prefix means:
- Always use local version during development
- On publish, converts to actual semver version
- Prevents version mismatch between local packages

---

## TypeScript Configuration

### Root tsconfig.json

Base configuration used by all packages:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", ".turbo"]
}
```

**Key Enforcements**:
- `strict: true` - Strictest type checking
- No implicit any
- Require return types
- Check unused variables

### Package-Specific Overrides

Each package extends root config with overrides:

```json
// apps/api/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./src",
    "lib": ["ES2020"],
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      { "name": "@nestjs/swagger/plugin" }
    ]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### Shared Config Packages

Reusable TypeScript configurations:

```json
// packages/config/typescript-config/base.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

Other packages extend it:
```json
{
  "extends": "@skilltree/typescript-config/base.json"
}
```

---

## Development Workflow

### Setting Up Development Environment

```bash
# 1. Clone repo
git clone git@github.com:skilltree/repa-maks.git
cd repa-maks

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
nano .env  # Add Supabase credentials

# 4. Setup database
pnpm db:generate
pnpm db:migrate

# 5. Start development servers
pnpm dev
```

### Development Workflow

**Single Package Development**:
```bash
# Work on API package only
pnpm --filter @skilltree/api dev

# Run scripts in package
pnpm --filter @skilltree/api build
pnpm --filter @skilltree/api test
```

**All Packages**:
```bash
# Start all dev servers (parallel)
pnpm dev

# Build all packages
pnpm build

# Type-check all packages
pnpm type-check

# Run lint across all
pnpm lint
```

### Adding New Packages

Create a new shared library:

```bash
# Create directory structure
mkdir -p packages/my-package/src

# Create package.json
cat > packages/my-package/package.json <<EOF
{
  "name": "@skilltree/my-package",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@skilltree/typescript-config": "workspace:*"
  }
}
EOF

# Create tsconfig
cat > packages/my-package/tsconfig.json <<EOF
{
  "extends": "@skilltree/typescript-config/base.json",
  "include": ["src/**/*"]
}
EOF

# Add to other packages
pnpm --filter @skilltree/api add @skilltree/my-package
```

### Pre-commit Hooks

Husky runs checks before commits:

```bash
# Configured in root package.json lint-staged
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

View hooks:
```bash
cat .husky/pre-commit
```

### Code Review Checklist

Before creating pull request:

```bash
# 1. Type check
pnpm type-check

# 2. Build
pnpm build

# 3. Lint
pnpm lint

# 4. Test (if applicable)
pnpm test

# 5. Check Git status
git status

# 6. Run pre-commit hooks manually
husky run pre-commit
```

---

## Performance Optimization

### Caching Strategy

**What Turborepo Caches**:
- Compilation outputs (`dist/`, `.next/`)
- Build artifacts
- Type-check results

**What It Doesn't Cache**:
- `node_modules/` (managed by pnpm)
- `.env` (environment specific)
- Runtime state

**Invalidate Cache When**:
- Source files change (`src/**/*`)
- Dependencies change (`package.json`, `pnpm-lock.yaml`)
- Configuration changes (`turbo.json`, `tsconfig.json`)

**Cache Location**:
```bash
# Local cache
.turbo/cache/

# Remote cache (optional, for CI/CD)
# Configured in vercel.json or turbo.json
```

**Commands**:
```bash
# View cache hits
turbo run build --verbose

# Clear local cache
rm -rf .turbo

# Disable cache (force rebuild)
turbo run build --no-cache
```

### Parallel Execution

**Root commands run in parallel by default**:

```bash
# These run concurrently (different packages)
pnpm dev     # API, frontend, admin all start together
pnpm build   # Build all packages in parallel (respecting deps)
```

**Control parallelism**:
```bash
# Limit parallel tasks (useful for CI/CD with memory limits)
turbo run build --concurrency=2

# Disable parallelism (sequential)
turbo run build --no-parallel
```

### Bundle Size Optimization

**Install analyzer**:
```bash
pnpm add -D @nestjs/webpack
```

**Analyze NestJS bundle**:
```bash
nest build --webpack --analyze
```

**Reduce Dependencies**:
- Use `pnpm ls` to find unused packages
- Replace heavy packages with lighter alternatives
- Lazy load optional dependencies

### Monorepo Structure Performance

**Good Practices**:
✅ Keep packages small and focused
✅ Minimize circular dependencies
✅ Use workspace: dependencies (not versions)
✅ Cache build outputs with Turborepo
✅ Use pnpm for efficient node_modules

**Anti-patterns to Avoid**:
❌ Monolithic packages (split into smaller ones)
❌ Circular imports (A → B → A)
❌ Shared mutable state between packages
❌ Duplicating configs in each package

---

## Debugging

### Check Package Installation

```bash
# List installed workspace packages
pnpm ls --recursive --depth=0

# Check specific package
pnpm --filter @skilltree/api ls
```

### Trace Module Resolution

```bash
# Verbose output shows module resolution
pnpm --filter @skilltree/api run build --verbose

# Check if import paths work
node -e "require('@skilltree/shared')"
```

### Examine Built Files

```bash
# Check what was compiled
ls -la apps/api/dist/

# Compare against source
diff -r apps/api/src apps/api/dist
```

### Monitor Turbo Cache

```bash
# Enable Turborepo debug mode
TURBO_LOG_VERBOSITY=debug pnpm build

# Show cache locations
find .turbo/cache -type f | head -20
```

---

## References

- **Turborepo Docs**: https://turbo.build/repo/docs
- **pnpm Workspaces**: https://pnpm.io/workspaces
- **TypeScript Project References**: https://www.typescriptlang.org/docs/handbook/project-references.html
- **NestJS Architecture**: https://docs.nestjs.com/modules
- **Prisma Schema**: https://www.prisma.io/docs/concepts/components/prisma-schema

---

**Last Updated**: 2025-01-17
**Maintained By**: Development Team

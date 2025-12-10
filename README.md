# SkillTree

> EdTech gamification platform for skill development with Telegram integration

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.4-red?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PM2](https://img.shields.io/badge/PM2-Runtime-2B037A?logo=pm2&logoColor=white)](https://pm2.keymetrics.io/)
[![Caddy](https://img.shields.io/badge/Caddy-2.x-1F88C0?logo=caddy&logoColor=white)](https://caddyserver.com/)

## Overview

SkillTree is a comprehensive EdTech platform designed to gamify skill development through daily streaks, achievements, radar chart visualizations, and Telegram bot integration. Built as a Turborepo monorepo with TypeScript and NestJS, the platform delivers a scalable, type-safe architecture for educational gamification.

### Key Features

- **Progressive Gamification**: Weekly streak system (Day 1: +1pt, Day 2: +2pts, ..., Day 7: +7pts)
- **Achievement System**: 14 unique badge types for milestones and accomplishments
- **Visual Analytics**: Radar chart visualizations with Chart.js/QuickChart API
- **Telegram Integration**: Interactive bot built with grammY framework
- **Email Reporting**: Automated weekly progress reports via SendGrid/Mailgun
- **Referral Tracking**: Built-in referral system with reward mechanics
- **Shareable Cards**: Visual achievement cards using Canvas API/PDFKit

### Tech Stack

**Backend**:
- NestJS 10.4+ (REST API framework)
- TypeScript 5.3+ (strict mode enabled)
- Prisma ORM (type-safe database layer)
- grammY 1.38+ (Telegram bot framework)
- Pino (structured JSON logging)

**Infrastructure**:
- PostgreSQL 15+ (Supabase Cloud)
- Redis 7+ (caching & rate limiting)
- PM2 (process management, zero-downtime deployments)
- Caddy 2.x (reverse proxy, automatic HTTPS)

**DevOps**:
- Turborepo (monorepo orchestration with build caching)
- pnpm (fast, efficient package manager)
- GitHub Webhooks (automated deployment pipeline)
- VDS/FirstVDS (production hosting)

## Architecture

SkillTree is built as a **Turborepo monorepo** with pnpm workspaces for efficient dependency management and incremental builds.

```
┌─────────────────────────────────────────────────────────────┐
│                      Caddy 2.x Reverse Proxy                 │
│          (Automatic HTTPS + Load Balancing + Gzip)           │
└───┬────────────────────────┬────────────────────────────────┘
    │                        │
    ▼                        ▼
┌─────────┐            ┌─────────────┐
│ Frontend│            │  Admin UI   │
│ (Next.js)│           │  (Next.js)  │
│ Port 3000│           │  Port 3001  │
└─────────┘            └─────────────┘
    │                        │
    └────────┬───────────────┘
             ▼
    ┌──────────────────┐
    │   NestJS API     │────────┐
    │   (Port 4000)    │        │
    │  PM2 Cluster (2) │        │
    └────┬──────┬──────┘        │
         │      │               │
         ▼      ▼               ▼
    ┌─────────────┐      ┌──────────────┐
    │ PostgreSQL  │      │ Telegram Bot │
    │  (Supabase) │      │   (grammY)   │
    └─────────────┘      └──────────────┘
         │
         ▼
    ┌─────────────┐
    │   Redis     │
    │ (localhost) │
    └─────────────┘
```

## Monorepo Structure

```
repa-maks/
├── apps/
│   └── api/                    # NestJS API server (port 4000)
│       ├── src/
│       │   ├── main.ts         # Bootstrap entry point
│       │   ├── app.module.ts   # Root NestJS module
│       │   ├── modules/        # Feature modules
│       │   │   ├── health/     # Health check endpoints
│       │   │   ├── webhook/    # GitHub webhook handler
│       │   │   └── ...
│       │   └── common/         # Cross-cutting concerns
│       │       ├── logger.ts   # Pino logger
│       │       └── telegram-notifier.ts
│       └── dist/               # Compiled output
│
├── packages/
│   ├── database/               # Prisma ORM & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Data models (10 tables)
│   │   │   └── migrations/     # Versioned SQL migrations
│   │   └── src/
│   │       └── index.ts        # PrismaClient export
│   │
│   ├── shared/                 # Shared types & utilities
│   │   └── src/
│   │       ├── types/          # TypeScript interfaces
│   │       ├── utils/          # Helper functions
│   │       └── constants/      # Shared constants
│   │
│   └── config/                 # Shared configurations
│       ├── eslint-config/      # ESLint preset
│       ├── prettier-config/    # Prettier preset
│       └── typescript-config/  # TypeScript base configs
│
├── scripts/                    # Deployment automation
│   ├── setup-server.sh         # VDS initial provisioning
│   ├── deploy.sh               # GitHub webhook deployment
│   └── rollback.sh             # Manual rollback script
│
├── docs/                       # Documentation
│   ├── architecture/           # System design docs
│   │   └── monorepo-structure.md
│   ├── deployment/             # Production deployment guides
│   │   ├── vds-provisioning.md
│   │   └── github-webhook.md
│   └── reports/                # Quality & health reports
│
├── specs/                      # Feature specifications
│   └── 001-project-setup/
│       ├── spec.md             # User stories & acceptance criteria
│       ├── quickstart.md       # Setup guide (15 min)
│       ├── tasks.md            # Task breakdown
│       └── data-model.md       # Database schema
│
├── ecosystem.config.js         # PM2 process management
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml         # Workspace packages
└── package.json                # Root dependencies & scripts
```

For detailed architecture documentation, see [docs/architecture/monorepo-structure.md](docs/architecture/monorepo-structure.md).

## Quick Start

### Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **pnpm**: 8+ (install: `npm install -g pnpm`)
- **Git**: 2.30+
- **Supabase Account**: Free tier (https://supabase.com)

### Local Development Setup

```bash
# 1. Clone repository
git clone git@github.com:skilltree/repa-maks.git
cd repa-maks

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env
nano .env  # Add your Supabase credentials

# 4. Setup database
pnpm --filter @skilltree/database db:generate
pnpm --filter @skilltree/database db:migrate

# 5. Start development servers
pnpm dev
```

**Verify Setup**:
```bash
# Check health endpoint
curl http://localhost:4000/health

# Expected response:
{
  "status": "healthy",
  "uptime": 10,
  "services": {
    "database": { "status": "connected", "responseTime": 15 },
    "redis": { "status": "connected", "responseTime": 2 }
  }
}
```

For detailed setup instructions, see [specs/001-project-setup/quickstart.md](specs/001-project-setup/quickstart.md).

## npm Scripts

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in development mode (watch mode) |
| `pnpm build` | Build all packages for production (uses Turborepo cache) |
| `pnpm type-check` | Run TypeScript type checking across all packages |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm test` | Run all tests |

### Database Operations

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma Client from schema |
| `pnpm db:migrate` | Create and apply database migrations |
| `pnpm db:push` | Push schema changes to database (dev only, no migration files) |
| `pnpm db:studio` | Open Prisma Studio database GUI |

**Full script reference**:
```bash
# Equivalent to: pnpm --filter @skilltree/database db:generate
pnpm db:generate

# Equivalent to: pnpm --filter @skilltree/database db:migrate
pnpm db:migrate

# Equivalent to: pnpm --filter @skilltree/database db:push
pnpm db:push

# Equivalent to: pnpm --filter @skilltree/database db:studio
pnpm db:studio
```

### Package-Specific Operations

```bash
# Run script in specific package
pnpm --filter @skilltree/api dev
pnpm --filter @skilltree/api build
pnpm --filter @skilltree/api test

# Add dependency to specific package
pnpm --filter @skilltree/api add express
pnpm --filter @skilltree/api add -D @types/express
```

### Cleanup

```bash
# Clean all build artifacts and node_modules
pnpm clean

# Clear Turborepo cache
rm -rf .turbo
```

## Environment Variables

Create a `.env` file in the project root with the following variables. See [.env.example](.env.example) for detailed descriptions.

### Database Configuration (Supabase)

```bash
# Transaction pooler (port 6543) - for application queries
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"

# Session pooler (port 5432) - required for Prisma migrations
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# Supabase project URL and API key
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

**How to get Supabase credentials**:
1. Go to https://supabase.com/dashboard
2. Create new project (or use existing)
3. Settings → Database → Connection string (use both "Transaction pooling" and "Session pooling")
4. Settings → API → Project URL and anon key

### Redis Configuration

```bash
# Local development
REDIS_URL="redis://localhost:6379"

# Production (with password)
REDIS_URL="redis://:skilltree_redis_2024@localhost:6379"
```

### GitHub Webhook (Deployment Pipeline)

```bash
# Shared secret for webhook signature verification
# Generate with: openssl rand -hex 32
GITHUB_WEBHOOK_SECRET=""
```

Configure in GitHub: Repository → Settings → Webhooks → Secret

### Telegram Bot (Future Phase)

```bash
# Get from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=""

# Admin chat ID for deployment notifications
# Get from: Send message to bot, then curl https://api.telegram.org/bot<TOKEN>/getUpdates
ADMIN_CHAT_ID=""
```

### Application Configuration

```bash
NODE_ENV="development"  # development | production | test
PORT=4000               # API server port
```

## Database Schema

The platform uses **10 tables** with gamification features:

**Core Tables**:
- `User` - User accounts
- `Student` - Student profiles
- `Parent` - Parent profiles
- `ParentStudent` - Parent-student relationships

**Testing**:
- `TestSession` - Test attempts and results
- `Question` - Test questions
- `Answer` - Student answers

**Gamification**:
- `DailyStreak` - Daily activity tracking
- `Achievement` - Badge/achievement records
- `ReferralTracking` - Referral system

For detailed schema documentation, see [specs/001-project-setup/data-model.md](specs/001-project-setup/data-model.md).

## Health Endpoints

The API provides three health check endpoints for monitoring and orchestration:

```bash
# Full health status (database, Redis, uptime)
GET /health

# Kubernetes liveness probe (is app running?)
GET /health/live

# Kubernetes readiness probe (is app ready to serve traffic?)
GET /health/ready
```

### Example Response (`GET /health`)

```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-01-17T12:00:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "responseTime": 15
    },
    "redis": {
      "status": "connected",
      "responseTime": 2
    }
  }
}
```

**Status values**:
- `healthy` - All services operational
- `degraded` - Some non-critical services unavailable (e.g., Redis)
- `unhealthy` - Critical services unavailable (e.g., database)

## Deployment

### Production VDS Server

SkillTree is deployed on FirstVDS (Ubuntu 22.04 LTS) with:

- **SSH Access**: `ssh -i ~/.ssh/claude_deploy deploy@95.81.97.236`
- **User**: `deploy` (passwordless sudo)
- **App Directory**: `/opt/skilltree/`
- **Installed Services**: Node.js 18, pnpm, PM2, Redis 7, Caddy 2.x
- **Security**: UFW firewall (ports 22, 80, 443), fail2ban, key-only SSH

### Automated Deployment Pipeline

Deployments are triggered via GitHub webhook on push to `main` branch:

1. **GitHub** sends webhook to `POST /webhook/deploy` (HMAC signed)
2. **API** verifies signature and spawns deployment script
3. **Deployment script** executes:
   - `git pull origin main`
   - `pnpm install --frozen-lockfile`
   - `pnpm build`
   - `pnpm db:migrate` (Prisma migrations)
   - `pm2 reload ecosystem.config.js` (zero-downtime)
   - Health check verification
   - Rollback on failure
4. **Telegram notification** sent to admin chat

### Manual Deployment

```bash
# SSH into server
ssh -i ~/.ssh/claude_deploy deploy@95.81.97.236

# Navigate to app directory
cd /opt/skilltree/repa-maks

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build all packages
pnpm build

# Run database migrations
pnpm --filter @skilltree/database db:migrate

# Reload services (zero-downtime)
pm2 reload ecosystem.config.js

# Verify deployment
pm2 status
curl https://api.skilltree.app/health
```

### Deployment Documentation

For detailed deployment guides:
- **VDS Server Provisioning**: [docs/deployment/vds-provisioning.md](docs/deployment/vds-provisioning.md)
- **GitHub Webhook Setup**: [docs/deployment/github-webhook.md](docs/deployment/github-webhook.md)

## Monitoring & Logs

### PM2 Process Management

```bash
# View service status
pm2 status

# Monitor CPU & memory usage (interactive)
pm2 monit

# View logs (all services)
pm2 logs

# View logs (specific service)
pm2 logs api

# Restart services (with downtime)
pm2 restart all

# Reload services (zero-downtime)
pm2 reload all
```

### Log Files (Production)

Logs are stored in `/opt/skilltree/logs/`:

- `api-combined.log` - All API logs (stdout + stderr)
- `api-out.log` - Standard output only
- `api-error.log` - Error output only
- `deploy-YYYYMMDD-HHMMSS.log` - Deployment logs

**Log rotation**: Automatic (max 10MB per file, retain 7 days)

### Health Monitoring

```bash
# Check API health
curl https://api.skilltree.app/health

# Check Caddy status
systemctl status caddy

# Check Redis status
redis-cli ping

# Check Caddy logs
journalctl -u caddy -f

# Check database connection
pnpm --filter @skilltree/database db:studio
```

## Development Workflow

### Adding New Features

1. Create feature branch: `git checkout -b feature/my-feature`
2. Implement changes in appropriate package
3. Run type check: `pnpm type-check`
4. Run build: `pnpm build`
5. Test locally: `pnpm dev`
6. Commit changes: `git commit -m "feat: add my feature"`
7. Push to remote: `git push origin feature/my-feature`
8. Create pull request

### Working with Packages

```bash
# Add external dependency to specific package
pnpm --filter @skilltree/api add express

# Add dev dependency
pnpm --filter @skilltree/api add -D @types/express

# Add workspace dependency (local package)
pnpm --filter @skilltree/api add @skilltree/shared
```

### Database Changes

```bash
# 1. Edit Prisma schema
nano packages/database/prisma/schema.prisma

# 2. Create migration
pnpm --filter @skilltree/database db:migrate

# 3. Review generated SQL
cat packages/database/prisma/migrations/[timestamp]_name/migration.sql

# 4. Migrations are automatically applied via deployment pipeline
```

## Troubleshooting

### Build Errors

```bash
# Clear Turborepo cache
rm -rf .turbo

# Clean node_modules and reinstall
rm -rf node_modules && pnpm install

# Clear all build artifacts
pnpm clean
```

### Database Connection Issues

```bash
# Test connection with Prisma Studio
pnpm --filter @skilltree/database db:studio

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Verify Supabase project is active
# Go to: https://supabase.com/dashboard
```

### Health Check Fails

```bash
# Check if API is running
curl http://localhost:4000/health

# Check PM2 status (production)
pm2 status

# Check logs
pm2 logs api

# Restart services
pm2 restart all
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Start Redis (Ubuntu/Debian)
sudo systemctl start redis-server

# Start Redis (macOS)
brew services start redis
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open pull request

### Code Standards

- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Conventional Commits for commit messages
- Type check must pass before commit
- Build must pass before commit

## License

MIT License - see [LICENSE](LICENSE) file for details

## Documentation

- **Monorepo Architecture**: [docs/architecture/monorepo-structure.md](docs/architecture/monorepo-structure.md)
- **Quickstart Guide**: [specs/001-project-setup/quickstart.md](specs/001-project-setup/quickstart.md)
- **Data Model**: [specs/001-project-setup/data-model.md](specs/001-project-setup/data-model.md)
- **VDS Provisioning**: [docs/deployment/vds-provisioning.md](docs/deployment/vds-provisioning.md)
- **GitHub Webhook**: [docs/deployment/github-webhook.md](docs/deployment/github-webhook.md)

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Current Version**: 0.1.9
**Last Updated**: 2025-12-10
**Status**: Active Development

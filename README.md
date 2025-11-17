# SkillTree: AI-Powered Career Guidance Telegram Bot

A comprehensive monorepo infrastructure for the SkillTree bot platform - providing Telegram-based career guidance with AI-powered assessments, real-time feedback, and family engagement tools.

## Quick Links

- **Setup Guide**: See [QUICKSTART.md](./specs/001-project-setup/quickstart.md) (15 min local dev | 30 min VDS provisioning)
- **Architecture**: See [docs/architecture/monorepo-structure.md](./docs/architecture/monorepo-structure.md)
- **Deployment**: See [docs/deployment/vds-provisioning.md](./docs/deployment/vds-provisioning.md)
- **Webhook Configuration**: See [docs/deployment/github-webhook.md](./docs/deployment/github-webhook.md)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Getting Started](#getting-started)
6. [Available Scripts](#available-scripts)
7. [Architecture](#architecture)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

SkillTree is a Telegram bot platform designed to:

- **Student Assessment**: Interactive career aptitude tests with AI analysis
- **Parent Engagement**: Real-time feedback and student progress tracking
- **Admin Dashboard**: Centralized management of tests, questions, and analytics
- **Automatic Scaling**: Zero-downtime deployments with PM2 clustering
- **Production Ready**: HTTPS, Redis caching, structured logging, health monitoring

**Key Features**:
- TypeScript 5+ with strict type checking
- NestJS microservices architecture
- Prisma ORM with Supabase Cloud PostgreSQL
- Telegram bot framework (grammY)
- Redis caching and rate limiting
- Caddy 2.x automatic HTTPS
- PM2 process management with clustering
- Structured logging with Pino
- GitHub webhook CI/CD pipeline
- Health checks and monitoring endpoints

---

## Tech Stack

### Frontend & Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ LTS |
| Language | TypeScript | 5.3+ |
| Monorepo | Turborepo | 1.11+ |
| Package Manager | pnpm | 8+ |
| API Framework | NestJS | 10.4+ |
| Bot Framework | grammY | (latest) |
| ORM | Prisma | 5+ |

### Database & Cache
| Component | Technology | Version |
|-----------|-----------|---------|
| Database | PostgreSQL (Supabase Cloud) | 15+ |
| Cache | Redis | 7+ |
| Connection Pool | pgBouncer | (Supabase) |

### DevOps & Infrastructure
| Component | Technology | Version |
|-----------|-----------|---------|
| Web Server | Caddy | 2.x |
| Process Manager | PM2 | (latest) |
| Reverse Proxy | Caddy | 2.x |
| Logging | Pino | (structured JSON) |
| Firewall | UFW | (Linux) |
| Intrusion Detection | fail2ban | (optional) |

---

## Project Structure

```
repa-maks/
├── apps/                              # Application packages
│   └── api/                          # NestJS API server (port 4000)
│       ├── src/
│       │   ├── main.ts               # Bootstrap + PM2 ready signal
│       │   ├── app.module.ts         # Root NestJS module
│       │   ├── modules/
│       │   │   ├── health/           # Health check endpoints
│       │   │   ├── webhook/          # GitHub webhook handler
│       │   │   └── ...
│       │   └── common/
│       │       ├── logger.ts         # Pino logger
│       │       ├── telegram-notifier.ts  # Telegram alerts
│       │       ├── middleware/       # Express middleware
│       │       └── filters/          # Exception handling
│       ├── dist/                     # Compiled output
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                          # Shared libraries
│   ├── shared/                       # Shared utilities & types
│   │   ├── src/
│   │   │   ├── types/               # TypeScript interfaces
│   │   │   ├── utils/               # Helper functions
│   │   │   └── constants/           # Shared constants
│   │   └── package.json
│   ├── database/                     # Prisma database layer
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Data model
│   │   │   └── migrations/          # Database migrations
│   │   ├── src/
│   │   │   └── index.ts             # PrismaClient export
│   │   └── package.json
│   └── config/                      # Shared configurations
│       ├── eslint-config/
│       ├── prettier-config/
│       └── typescript-config/
│
├── scripts/                          # Deployment & automation
│   ├── setup-server.sh              # VDS provisioning (Node, Redis, Caddy)
│   ├── deploy.sh                    # CI/CD deployment script
│   ├── rollback.sh                  # Manual rollback script
│   └── check-disk-space.sh          # Disk monitoring
│
├── docs/                            # Documentation
│   ├── architecture/
│   │   └── monorepo-structure.md   # Detailed architecture
│   ├── deployment/
│   │   ├── vds-provisioning.md     # VDS setup guide
│   │   └── github-webhook.md       # Webhook configuration
│   └── TECHNICAL-SPECIFICATION-EN.md
│
├── specs/001-project-setup/         # Feature specification
│   ├── spec.md                      # User stories & acceptance criteria
│   ├── quickstart.md                # Setup guide (15 min local | 30 min prod)
│   ├── plan.md                      # Implementation plan
│   ├── tasks.md                     # Task breakdown (T001-T154)
│   ├── data-model.md                # Database schema
│   └── research.md                  # Best practices & research
│
├── ecosystem.config.js              # PM2 configuration (clustering, logging)
├── turbo.json                       # Turborepo pipeline config
├── pnpm-workspace.yaml              # Workspace definitions
├── tsconfig.json                    # Root TypeScript config
├── .env.example                     # Environment variables template
├── .gitignore                       # Git exclusions
├── CLAUDE.md                        # Agent orchestration rules
└── package.json                     # Root dependencies & scripts
```

---

## Prerequisites

### Local Development
- **Node.js**: 18+ LTS ([nodejs.org](https://nodejs.org))
- **pnpm**: 8+ (install: `npm install -g pnpm`)
- **Git**: 2.30+
- **Supabase Account**: Free tier ([supabase.com](https://supabase.com))

### VDS Server Provisioning (Production)
- **Hosting**: FirstVDS or similar (Ubuntu 22.04 LTS, 4GB RAM, 2 CPU, 50GB SSD)
- **Domains**: DNS configured for:
  - `skilltree.app`
  - `api.skilltree.app`
  - `admin.skilltree.app`
- **Access**: SSH with key authentication (password auth disabled)

---

## Getting Started

### 1. Clone Repository

```bash
git clone git@github.com:skilltree/repa-maks.git
cd repa-maks
```

### 2. Install Dependencies

```bash
pnpm install
```

Expected: ~30-60 seconds with no errors

### 3. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with your Supabase credentials
nano .env
```

See [.env.example](./.env.example) for required variables:
- `DATABASE_URL`: Supabase PostgreSQL connection
- `SUPABASE_URL`: Supabase API URL
- `SUPABASE_ANON_KEY`: Supabase public key
- `REDIS_URL`: Redis connection (localhost:6379 for dev)
- `GITHUB_WEBHOOK_SECRET`: GitHub webhook signing key
- `TELEGRAM_BOT_TOKEN`: Telegram bot API token
- `ADMIN_CHAT_ID`: Telegram admin chat ID

### 4. Setup Database

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations (creates tables in Supabase)
pnpm db:migrate
```

Expected: 7 tables created in Supabase (users, students, parents, etc.)

### 5. Start Development Servers

```bash
pnpm dev
```

Expected output:
```
@skilltree/api:dev: API server running on http://localhost:4000
```

### 6. Verify Setup

```bash
# In another terminal:
curl http://localhost:4000/health

# Expected response:
{
  "status": "healthy",
  "uptime": 10,
  "timestamp": "2025-01-17T12:00:00.000Z",
  "services": {
    "database": { "status": "connected", "responseTime": 15 },
    "redis": { "status": "disconnected" }
  }
}
```

**Note**: Redis disconnected is OK for local dev (runs in degraded mode). To enable Redis locally:
```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server && sudo systemctl start redis
```

---

## Available Scripts

### Development

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start all services in watch mode (Turborepo parallel) |
| `pnpm build` | Compile all packages for production |
| `pnpm type-check` | Run TypeScript type checking across monorepo |
| `pnpm lint` | Run ESLint across all packages |

### Database

| Command | Purpose |
|---------|---------|
| `pnpm db:generate` | Generate Prisma Client from schema |
| `pnpm db:migrate` | Run pending migrations (dev environment) |
| `pnpm db:push` | Deploy schema to Supabase (no migration file) |
| `pnpm db:studio` | Open Supabase Studio in browser |

### Monorepo Management

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install workspace dependencies |
| `pnpm clean` | Remove all build artifacts and node_modules |
| `turbo run build --filter=@skilltree/api` | Build specific package |

---

## Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────┐
│   Client Layer                           │
│   ├─ Telegram Bot (grammY client)       │
│   ├─ Frontend Web (future)               │
│   └─ Admin Dashboard (future)            │
└──────────────────┬───────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Caddy 2.x         │
        │  Reverse Proxy     │
        │  HTTPS/TLS         │
        └──────────┬──────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│  API   │  │  Admin   │  │Frontend  │
│ :4000  │  │  :3001   │  │  :3000   │
└────┬───┘  └────┬─────┘  └────┬─────┘
     │            │             │
     └────────────┼─────────────┘
                  │
        ┌─────────▼─────────┐
        │  PostgreSQL DB    │
        │  (Supabase)       │
        └───────────────────┘
                  △
        ┌─────────┴─────────┐
        │                   │
    ┌───▼──┐         ┌─────▼───┐
    │Redis │         │Telegram  │
    │:6379 │         │Bot API   │
    └──────┘         └──────────┘
```

### Deployment Architecture (VDS)

```
GitHub Main Branch Push
         │
         ▼
GitHub Webhook Payload (HMAC signed)
         │
         ▼
    ┌─────────────────┐
    │ API /webhook/deploy endpoint
    │ - Verify HMAC signature
    │ - Spawn deployment script
    └─────────────┬───┘
                  │
    ┌─────────────▼──────────────┐
    │  /opt/skilltree/deploy.sh  │
    │  1. git pull origin main   │
    │  2. pnpm install --frozen  │
    │  3. pnpm build             │
    │  4. Prisma migrate         │
    │  5. PM2 reload (zero down) │
    │  6. Health check verify    │
    │  7. Rollback if fail       │
    └─────────────┬──────────────┘
                  │
    ┌─────────────▼──────────────┐
    │  PM2 Cluster (2 instances) │
    │  - Graceful reload         │
    │  - Zero downtime           │
    │  - Process crash recovery  │
    └─────────────┬──────────────┘
                  │
    ┌─────────────▼──────────────┐
    │  Caddy Reverse Proxy       │
    │  - Auto HTTPS/TLS          │
    │  - Gzip compression        │
    │  - Access logging          │
    └────────────────────────────┘
```

---

## Deployment

### Local Development

See [QUICKSTART.md - Part 1](./specs/001-project-setup/quickstart.md#part-1-local-development-setup) for detailed steps:

1. Clone repository
2. Install dependencies with `pnpm install`
3. Configure `.env` with Supabase credentials
4. Run `pnpm db:migrate` to setup database
5. Start dev server with `pnpm dev`
6. Verify health endpoint: `curl http://localhost:4000/health`

**Time**: ~15 minutes

### Production VDS Deployment

See [docs/deployment/vds-provisioning.md](./docs/deployment/vds-provisioning.md) for step-by-step VDS setup including:

1. VDS provisioning (Node.js, pnpm, PM2)
2. Redis installation with authentication
3. Caddy 2.x setup for automatic HTTPS
4. UFW firewall configuration (SSH, HTTP, HTTPS only)
5. fail2ban intrusion detection
6. PM2 ecosystem configuration (clustering, logging)
7. GitHub webhook configuration

**Time**: ~30 minutes

### Continuous Deployment

See [docs/deployment/github-webhook.md](./docs/deployment/github-webhook.md) for:

1. GitHub webhook setup
2. HMAC signature verification
3. Automatic deployment on push to main
4. Zero-downtime reload with PM2
5. Automatic rollback on failure
6. Telegram notifications

**Deployment Flow**:
```
Push to main → GitHub webhook → API /webhook/deploy
→ deploy.sh → Build → Migrate → PM2 reload → Health check → Live ✓
```

---

## Troubleshooting

### Installation Issues

**Problem**: `pnpm: command not found`
```bash
# Solution: Install pnpm globally
npm install -g pnpm
```

**Problem**: `permission denied` error on node_modules
```bash
# Solution: Fix ownership
sudo chown -R $USER:$USER ~/.pnpm-store
sudo chown -R $USER:$USER node_modules
```

### Database Issues

**Problem**: Cannot connect to Supabase
```bash
# Check .env has correct DATABASE_URL
cat .env | grep DATABASE_URL

# Verify connection string format:
# postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?sslmode=require
```

**Problem**: Tables already exist
```bash
# Reset database (WARNING: deletes all data)
pnpm db:reset
```

### Health Endpoint Issues

**Problem**: `/health` returns 503
```bash
# Check API logs
pm2 logs api

# Check database is accessible
pnpm db:studio

# Check environment variables
cat .env
```

**Problem**: Redis unavailable (OK for dev)
```bash
# This is normal for local development
# API runs in degraded mode without Redis

# To enable Redis:
brew services start redis  # macOS
# or
sudo systemctl start redis-server  # Ubuntu
```

### Build Issues

**Problem**: Build fails with TypeScript errors
```bash
# Run type-check to see errors
pnpm type-check

# Clear cache and rebuild
rm -rf .turbo
pnpm build
```

**Problem**: Turbo cache issues
```bash
# Clear Turborepo cache
pnpm clean
pnpm install
pnpm build
```

### Deployment Issues

**Problem**: GitHub webhook not triggering
```bash
# Verify webhook secret matches
# Go to GitHub: Settings → Webhooks → Edit → Show recent deliveries

# Check deployment logs on VDS
tail -f /opt/skilltree/logs/deploy-*.log
```

**Problem**: PM2 reload fails
```bash
# Check PM2 status
pm2 status

# View PM2 logs
pm2 logs

# Force restart if needed
pm2 restart all
```

**Problem**: Caddy HTTPS not working
```bash
# Verify domains point to server
dig skilltree.app

# Check Caddy status
systemctl status caddy

# View Caddy logs
journalctl -u caddy -f
```

---

## Security

### No Hardcoded Credentials

All secrets are stored in `.env` (git-ignored). Never commit:
- Database passwords
- API keys (Supabase, Telegram)
- Webhook secrets
- Redis passwords

Use `.env.example` as template with placeholders.

### Environment Variables

All required variables are documented in [.env.example](./.env.example) with:
- Variable name
- Description
- Example value format
- Where to obtain the value

### SSH Security (VDS)

Production VDS has:
- SSH key-based authentication only (password disabled)
- UFW firewall (only SSH, HTTP, HTTPS allowed)
- fail2ban intrusion detection
- Rate limiting on login attempts

---

## Development Guidelines

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig.json)
- No implicit `any` types
- All dependencies properly typed

Run type-check before committing:
```bash
pnpm type-check
```

### Code Quality

- ESLint configuration in `packages/config/eslint-config/`
- Prettier auto-formatting
- Husky pre-commit hooks
- lint-staged for staged files only

### Commit Conventions

Follow conventional commits:
```bash
git commit -m "feat: add health endpoint

- Added GET /health endpoint
- Database connectivity check
- Redis status reporting

🤖 Generated with Claude Code"
```

### Adding Dependencies

Use workspace packages for internal dependencies:
```bash
# Add shared package to API
pnpm --filter @skilltree/api add @skilltree/shared

# Import in code
import { MyType } from '@skilltree/shared';
```

---

## Learning Resources

- **Turborepo**: [turborepo.org/docs](https://turbo.build/repo/docs)
- **NestJS**: [docs.nestjs.com](https://docs.nestjs.com)
- **Prisma**: [prisma.io/docs](https://www.prisma.io/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Caddy**: [caddyserver.com/docs](https://caddyserver.com/docs)
- **PM2**: [pm2.keymetrics.io](https://pm2.keymetrics.io)

---

## Support & Issues

For issues and questions:

1. Check [QUICKSTART.md](./specs/001-project-setup/quickstart.md#troubleshooting) troubleshooting section
2. Review relevant documentation in `/docs`
3. Check existing GitHub issues
4. Create new issue with:
   - Description of problem
   - Steps to reproduce
   - Error messages (full logs)
   - Environment details (Node version, OS, etc.)

---

## Project Status

**Current Phase**: 001-project-setup (Infrastructure & foundations)

**Completed**:
- ✅ Monorepo structure with Turborepo
- ✅ TypeScript 5+ configuration
- ✅ NestJS API framework
- ✅ Prisma ORM with Supabase
- ✅ Package management (pnpm workspace)
- ✅ Dev server setup (watch mode, hot reload)
- ✅ Database schema with 7 core tables
- ✅ Health check endpoints
- ✅ GitHub webhook integration
- ✅ PM2 process management (clustering)
- ✅ Caddy reverse proxy setup
- ✅ VDS provisioning scripts
- ✅ Telegram notifications
- ✅ Structured logging (Pino)

**Next Steps**:
- Feature development (User Stories)
- Bot implementation
- Frontend dashboard
- Admin panel
- Advanced monitoring

---

## License

SkillTree - Proprietary

**Last Updated**: 2025-01-17

# Research: Project Setup & Infrastructure

**Feature**: 001-project-setup
**Date**: 2025-01-17
**Status**: Complete

## 📚 Detailed Research Reports

### EdTech & Gamification Strategy

For comprehensive research on EdTech career guidance best practices, gamification mechanics, UX/UI patterns, and viral growth strategies, see:

**[EdTech Career Guidance App: Strategic Research Report](./research/EdTech%20Career%20Guidance%20App%3A%20Strategic%20Research%20Report.md)**

This 1,083-line research report covers:
- ✅ Testing UX/UI best practices (16Personalities, CareerExplorer, YouScience)
- ✅ AI analysis & personalization (radar charts, progressive disclosure)
- ✅ Engagement & conversion (dual-persona emails, free trial lessons)
- ✅ Telegram-specific features (Mini Apps, referral systems, inline keyboards)
- ✅ Gamification mechanics (points, badges, streaks, easter eggs)
- ✅ Anti-patterns & UX red flags to avoid
- ✅ MVP development roadmap with budget breakdown (~6,000₽)
- ✅ Prioritized feature matrix with wow-effect scores

**Key Findings**:
- Challenge-based gamification improves performance by **89%**
- Progress indicators make users willing to wait **3x longer**
- Radar charts have **9/10 wow-effect** score
- Referral systems critical for viral growth (target coefficient >1.0)
- MVP can be built in **1 month** with minimal infrastructure costs

**Related Documents**:
- [gamification-strategy.md](./gamification-strategy.md) - Detailed implementation strategy based on research
- [results-strategy.md](./results-strategy.md) - Results visualization, radar charts, parent email reports
- [data-model.md](./data-model.md) - Database schema including gamification tables

---

## Research Questions

### Q1: Turborepo Workspace Configuration Best Practices

**Context**: Need to configure Turborepo for monorepo with 4 apps (api, bot, frontend, admin) and 3 shared packages (database, shared, config).

**Decision**: Use pnpm workspaces with Turborepo pipeline configuration

**Rationale**:
- Turborepo works best with pnpm for workspace dependencies (faster installs, better caching)
- Pipeline configuration in turbo.json defines build order and dependencies
- Shared packages built first, then apps can import from them
- Turborepo remote caching optional (local caching sufficient for MVP)

**Configuration Approach**:
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}

// pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Key Patterns**:
- Use `^build` to indicate "build dependencies first"
- Persistent tasks (dev servers) with `cache: false`
- Output directories specified for proper caching
- Workspace protocol: `"@skilltree/database": "workspace:*"` in package.json

**References**:
- Turborepo documentation: https://turbo.build/repo/docs
- pnpm workspaces: https://pnpm.io/workspaces

---

### Q2: Caddy Automatic HTTPS Configuration for Multiple Domains

**Context**: Need Caddy to serve 3 domains with automatic HTTPS: skilltree.app (frontend), api.skilltree.app (API), admin.skilltree.app (admin).

**Decision**: Use Caddyfile with simple domain-based routing

**Rationale**:
- Caddy 2.x automatic HTTPS requires only domain names in Caddyfile
- Let's Encrypt certificates obtained automatically when domains resolve to server IP
- Reverse proxy to local services (PM2-managed Node.js apps)
- HTTP/2 enabled by default for performance

**Configuration Approach**:
```Caddyfile
# Frontend (Telegram Web App)
skilltree.app {
    reverse_proxy localhost:3000
    encode gzip
    log {
        output file /var/log/caddy/frontend.log
    }
}

# API Backend
api.skilltree.app {
    reverse_proxy localhost:4000
    encode gzip
    log {
        output file /var/log/caddy/api.log
    }
}

# Admin Dashboard
admin.skilltree.app {
    reverse_proxy localhost:3001
    encode gzip
    log {
        output file /var/log/caddy/admin.log
    }
}
```

**Prerequisites**:
- DNS A records pointing domains to VDS IP address
- Firewall allows ports 80, 443 (UFW configuration)
- Caddy installed as systemd service

**Testing Strategy**:
- Use Let's Encrypt staging environment first to avoid rate limits
- Switch to production CA after verifying configuration works
- Command: `caddy adapt --config /etc/caddy/Caddyfile` to validate syntax

**References**:
- Caddy automatic HTTPS: https://caddyserver.com/docs/automatic-https
- Caddyfile tutorial: https://caddyserver.com/docs/caddyfile-tutorial

---

### Q3: PM2 Ecosystem Configuration for Zero-Downtime Deployments

**Context**: Need PM2 to run 4 Node.js services (api, bot, frontend, admin) with cluster mode for zero-downtime reloads.

**Decision**: Use ecosystem.config.js with cluster mode and graceful shutdown

**Rationale**:
- Cluster mode runs multiple instances per service (distribute load across CPU cores)
- `pm2 reload ecosystem.config.js` gracefully restarts: start new instances → wait for ready → kill old instances
- Zero dropped requests during deployment
- Instance count: 2 per service on 2-core VDS (allows one instance to handle requests during reload)

**Configuration Approach**:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api',
      script: './apps/api/dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'bot',
      script: './apps/bot/dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'frontend',
      script: './apps/frontend/.next/standalone/server.js',
      instances: 2,
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'admin',
      script: './apps/admin/.next/standalone/server.js',
      instances: 2,
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
```

**Key Parameters**:
- `wait_ready: true`: PM2 waits for `process.send('ready')` signal before considering app started
- `listen_timeout`: Max time to wait for ready signal (10s)
- `kill_timeout`: Graceful shutdown timeout before SIGKILL (5s)
- `instances: 2`: Run 2 instances per service (minimum for zero-downtime)

**Application Code Requirements**:
```typescript
// Send ready signal after server starts listening
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  if (process.send) {
    process.send('ready');
  }
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Received SIGINT, graceful shutdown...');
  await server.close();
  await database.disconnect();
  process.exit(0);
});
```

**References**:
- PM2 cluster mode: https://pm2.keymetrics.io/docs/usage/cluster-mode/
- PM2 graceful shutdown: https://pm2.keymetrics.io/docs/usage/signals-clean-restart/

---

### Q4: Prisma Schema Design for Core Entities

**Context**: Need database schema for users, students, parents, test sessions, questions, and answers.

**Decision**: Use Prisma schema with normalized relationships and proper indexing

**Rationale**:
- Prisma generates type-safe client automatically from schema
- Migrations tracked in version control
- RLS policies (future) enforce data isolation
- Foreign keys ensure referential integrity

**Schema Approach**:
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             String    @id @default(cuid())
  telegramId     BigInt    @unique
  telegramUsername String?
  firstName      String?
  lastName       String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relations
  student        Student?
  parent         Parent?

  @@index([telegramId])
}

model Student {
  id             String    @id @default(cuid())
  userId         String    @unique
  age            Int
  grade          Int
  phone          String?

  // Relations
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  testSessions   TestSession[]
  parentRelations ParentStudent[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([userId])
}

model Parent {
  id             String    @id @default(cuid())
  userId         String    @unique
  email          String?
  phone          String?

  // Relations
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  children       ParentStudent[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([userId])
  @@index([email])
}

model ParentStudent {
  id             String    @id @default(cuid())
  parentId       String
  studentId      String

  parent         Parent    @relation(fields: [parentId], references: [id], onDelete: Cascade)
  student        Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  createdAt      DateTime  @default(now())

  @@unique([parentId, studentId])
  @@index([parentId])
  @@index([studentId])
}

model TestSession {
  id             String    @id @default(cuid())
  studentId      String
  status         SessionStatus @default(IN_PROGRESS)
  startedAt      DateTime  @default(now())
  completedAt    DateTime?

  // Relations
  student        Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  answers        Answer[]

  @@index([studentId])
  @@index([status])
}

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

model Question {
  id             String    @id @default(cuid())
  text           String
  category       String
  orderIndex     Int

  // Relations
  answers        Answer[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([category])
  @@index([orderIndex])
}

model Answer {
  id             String    @id @default(cuid())
  sessionId      String
  questionId     String
  answerText     String
  answeredAt     DateTime  @default(now())

  // Relations
  session        TestSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question       Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, questionId])
  @@index([sessionId])
  @@index([questionId])
}
```

**Key Design Decisions**:
- `cuid()` for primary keys (URL-safe, collision-resistant)
- `BigInt` for Telegram user IDs (exceeds JavaScript number max)
- Cascade deletes for dependent data (user deleted → student/parent deleted → sessions/answers deleted)
- Junction table `ParentStudent` for many-to-many (one parent can have multiple children, one student can have multiple parents)
- Indexes on foreign keys and frequently queried fields

**Migration Strategy**:
1. Create initial migration: `npx prisma migrate dev --name init`
2. Test locally with Supabase dev database
3. Deploy to production: `npx prisma migrate deploy`
4. Generate Prisma Client: `npx prisma generate` (included in build step)

**References**:
- Prisma schema: https://www.prisma.io/docs/concepts/components/prisma-schema
- Prisma with Supabase: https://supabase.com/docs/guides/integrations/prisma

---

### Q5: GitHub Webhook Deployment Pipeline Implementation

**Context**: Need automatic deployment when pushing to main branch (GitHub → VDS webhook → deploy script).

**Decision**: Use GitHub webhook with shared secret for authentication, bash deployment script

**Rationale**:
- GitHub webhooks are reliable, low-latency event delivery
- Shared secret (HMAC SHA-256) prevents unauthorized deployment triggers
- Bash script handles deployment steps: pull, install, build, migrate, reload
- Automatic rollback on failure with health check verification

**Implementation Approach**:

**1. GitHub Webhook Configuration**:
- URL: `https://api.skilltree.app/webhook/deploy`
- Content type: `application/json`
- Secret: Random 32-character string (stored in GitHub settings and VDS .env)
- Events: Push events only (filter for `main` branch in handler)

**2. Webhook Handler (NestJS)**:
```typescript
// apps/api/src/modules/webhook/webhook.controller.ts
import { Controller, Post, Headers, Body, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Controller('webhook')
export class WebhookController {
  @Post('deploy')
  async handleDeploy(
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    // Verify GitHub signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const hash = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== hash) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Filter for main branch pushes
    if (payload.ref !== 'refs/heads/main') {
      return { message: 'Ignored: not main branch' };
    }

    // Trigger deployment script (non-blocking)
    execAsync('/opt/skilltree/scripts/deploy.sh').catch(err => {
      console.error('Deployment failed:', err);
      // Send Telegram notification here
    });

    return { message: 'Deployment triggered' };
  }
}
```

**3. Deployment Script**:
```bash
#!/bin/bash
# /opt/skilltree/scripts/deploy.sh

set -e  # Exit on error

LOG_FILE="/opt/skilltree/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
REPO_DIR="/opt/skilltree/repa-maks"
HEALTH_URL="https://api.skilltree.app/health"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting deployment..."

cd "$REPO_DIR"

# Save current commit for rollback
PREVIOUS_COMMIT=$(git rev-parse HEAD)
log "Previous commit: $PREVIOUS_COMMIT"

# Pull latest changes
log "Pulling latest changes..."
git pull origin main

# Install dependencies
log "Installing dependencies..."
pnpm install --frozen-lockfile

# Build all packages
log "Building..."
pnpm build

# Run database migrations
log "Running migrations..."
cd packages/database
pnpm prisma migrate deploy
cd ../..

# Reload PM2 processes (zero-downtime)
log "Reloading PM2..."
pm2 reload ecosystem.config.js

# Wait for services to be ready
sleep 5

# Health check
log "Running health check..."
if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
  log "Health check passed. Deployment successful!"
  # Send success notification
else
  log "Health check failed. Rolling back..."

  # Rollback to previous commit
  git reset --hard "$PREVIOUS_COMMIT"
  pnpm install --frozen-lockfile
  pnpm build
  pm2 reload ecosystem.config.js

  sleep 5

  # Verify rollback
  if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    log "Rollback successful. Health check passed."
    # Send rollback notification
  else
    log "CRITICAL: Rollback failed. Manual intervention required!"
    # Send critical alert
  fi

  exit 1
fi
```

**4. Telegram Notification Integration** (future enhancement):
```typescript
// Notify on deployment events
async function sendTelegramNotification(message: string) {
  const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
  await bot.api.sendMessage(process.env.ADMIN_CHAT_ID, message);
}

// Call in deployment script success/failure handlers
```

**Security Considerations**:
- Webhook secret stored in environment variables (never committed)
- HMAC SHA-256 signature verification prevents spoofed requests
- Deployment script runs with limited user permissions (not root)
- Health check timeout to detect broken deployments early

**References**:
- GitHub webhooks: https://docs.github.com/en/developers/webhooks-and-events/webhooks
- PM2 reload: https://pm2.keymetrics.io/docs/usage/process-management/#reload

---

## Summary

**Research Complete**: All unknowns from Technical Context resolved.

**Key Technologies Confirmed**:
- **Monorepo**: Turborepo + pnpm workspaces
- **Reverse Proxy**: Caddy 2.x with automatic HTTPS
- **Process Manager**: PM2 cluster mode (2 instances per service)
- **Database**: Prisma + PostgreSQL (Supabase)
- **Deployment**: GitHub webhook → bash script → PM2 reload

**Best Practices Identified**:
- Workspace dependencies for cross-package imports
- Graceful shutdown handlers in all services
- Health check verification after deployment
- Automatic rollback on failed health check
- Structured logging with correlation IDs

**No Complex Research Required**: All technologies are well-documented, standard tools. Implementation can proceed with confidence.

**Ready for Phase 1**: Data model design, API contracts, and quickstart guide.

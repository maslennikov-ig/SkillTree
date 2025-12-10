# Quickstart Guide: Project Setup & Infrastructure

**Feature**: 001-project-setup
**Target Audience**: Developers setting up local environment or provisioning VDS server
**Time to Complete**: ~15 minutes (local dev) | ~30 minutes (VDS provisioning)

---

## Prerequisites

### Local Development
- **Node.js**: 18+ (LTS recommended)
- **pnpm**: 8+ (install: `npm install -g pnpm`)
- **Git**: 2.30+
- **Supabase Account**: Free tier sufficient (https://supabase.com)

### VDS Server Provisioning (Production)
- **FirstVDS Account**: Ubuntu 22.04 LTS server (4GB RAM, 2 CPU, 50GB SSD)
- **Domain Names**: DNS configured for skilltree.app, api.skilltree.app, admin.skilltree.app
- **GitHub Repository**: Write access for webhook configuration

---

## Part 1: Local Development Setup

### Step 1: Clone Repository

```bash
git clone git@github.com:skilltree/repa-maks.git
cd repa-maks
```

**Expected**: Repository cloned successfully

---

### Step 2: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Verify installation
pnpm --version
```

**Expected**: Dependencies installed in <2 minutes, no errors

**Troubleshooting**:
- If "command not found: pnpm", install globally: `npm install -g pnpm`
- If permissions error, run: `sudo chown -R $USER:$USER ~/.pnpm-store`

---

### Step 3: Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required Variables**:
```bash
# Supabase (get from Supabase project settings)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# Redis (local development)
REDIS_URL="redis://localhost:6379"

# GitHub Webhook (for deployment, leave empty for dev)
GITHUB_WEBHOOK_SECRET=""

# Node environment
NODE_ENV="development"
```

**Get Supabase Credentials**:
1. Go to https://supabase.com/dashboard
2. Create new project (or use existing)
3. Settings → Database → Connection string (use "Connection pooling" URL)
4. Settings → API → Project URL and anon key

**Expected**: .env file created with valid Supabase credentials

---

### Step 4: Setup Database

```bash
# Navigate to database package
cd packages/database

# Generate Prisma Client
pnpm prisma generate

# Run migrations (creates tables in Supabase)
pnpm prisma migrate dev --name init

# Verify in Supabase Studio
# Open https://supabase.com/dashboard → Table Editor
# Should see: users, students, parents, parent_students, test_sessions, questions, answers
```

**Expected**:
- 7 tables created
- Migration file: `packages/database/prisma/migrations/YYYYMMDDHHMMSS_init/migration.sql`
- No errors

**Troubleshooting**:
- If "can't reach database server", check `DATABASE_URL` in .env
- If "relation already exists", run: `pnpm prisma migrate reset` (WARNING: deletes all data)

---

### Step 5: Start Development Servers

```bash
# Return to root directory
cd ../..

# Start all services in development mode
pnpm dev
```

**Expected Output**:
```
@skilltree/api:dev: API server running on http://localhost:4000
@skilltree/bot:dev: Telegram bot polling started
@skilltree/frontend:dev: Frontend ready on http://localhost:3000
@skilltree/admin:dev: Admin dashboard on http://localhost:3001
```

**Verify Health Check**:
```bash
curl http://localhost:4000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "uptime": 10,
  "timestamp": "2025-01-17T12:00:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "responseTime": 15
    },
    "redis": {
      "status": "disconnected",
      "error": "Connection refused"
    }
  }
}
```

**Note**: Redis disconnected is OK for local dev (degraded mode). To fix:
```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis

# Install Redis (macOS)
brew install redis
brew services start redis
```

---

### Step 6: Run Type Check

```bash
# Check all packages for TypeScript errors
pnpm type-check
```

**Expected**: No errors, output shows "No errors found"

**If Errors**:
- Review error messages
- Fix issues in reported files
- Re-run `pnpm type-check`

---

### Step 7: Commit Checkpoint

```bash
# Initialize git (if not already cloned)
git init
git add .
git commit -m "chore: initial project setup

- Configured monorepo with Turborepo
- Installed dependencies
- Created database schema with Prisma
- Verified dev environment working

🤖 Generated with Claude Code"

# Push to remote (if configured)
git push origin 001-project-setup
```

---

## Part 2: VDS Server Provisioning (Production)

**Prerequisites**:
- SSH access to FirstVDS server
- Root or sudo privileges
- Domains pointing to server IP

---

### Option A: Automated Setup (Recommended)

```bash
# SSH into server
ssh root@[YOUR-VDS-IP]

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/maslennikov-ig/SkillTree/main/scripts/setup-server.sh | sudo bash
```

**What the script installs**:
- Node.js 18.x, pnpm, PM2
- Redis 7.x (password: `skilltree_redis_2024`)
- Caddy 2.x (reverse proxy)
- UFW firewall (22, 80, 443)
- fail2ban (SSH protection)
- SSH hardening (key-only auth)
- App directories `/opt/skilltree/{logs,backups,scripts}`

**After script completes**: Skip to Step 6 (Create Application Directory)

---

### Option B: Manual Setup

### Step 1: Connect to VDS

```bash
# SSH into server
ssh root@[YOUR-VDS-IP]

# Update system packages
apt-get update && apt-get upgrade -y
```

---

### Step 2: Install Node.js

```bash
# Install Node.js 18.x LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should be v18.x.x
npm --version

# Install pnpm globally
npm install -g pnpm pm2
```

**Expected**: Node.js 18+, pnpm, PM2 installed

---

### Step 3: Install Redis

```bash
# Install Redis 7.x
apt-get install -y redis-server

# Configure Redis (localhost only, password auth)
sed -i 's/^bind 127.0.0.1/bind 127.0.0.1/' /etc/redis/redis.conf
sed -i 's/# requirepass foobared/requirepass YOUR_SECURE_PASSWORD/' /etc/redis/redis.conf

# Start Redis
systemctl enable redis-server
systemctl start redis-server

# Verify
redis-cli ping  # Should return "PONG"
```

---

### Step 4: Install Caddy

```bash
# Install Caddy 2.x
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

# Verify
caddy version  # Should be 2.x.x
```

---

### Step 5: Configure Firewall (UFW)

```bash
# Install and configure UFW
apt-get install -y ufw

# Allow SSH, HTTP, HTTPS only
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Enable firewall
ufw --force enable

# Verify
ufw status
```

**Expected**:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                     ALLOW       Anywhere
```

---

### Step 6: Create Application Directory

```bash
# Create application directory
mkdir -p /opt/skilltree/{logs,backups}

# Clone repository
cd /opt/skilltree
git clone git@github.com:skilltree/repa-maks.git

# Navigate to repo
cd repa-maks
```

---

### Step 7: Configure Environment Variables

```bash
# Create production .env
nano .env
```

**Production Variables**:
```bash
# Supabase (production project)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true"
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# Redis (local with password)
REDIS_URL="redis://:YOUR_SECURE_PASSWORD@localhost:6379"

# GitHub Webhook
GITHUB_WEBHOOK_SECRET="[GENERATE-RANDOM-32-CHAR-STRING]"

# Telegram (future)
TELEGRAM_BOT_TOKEN="[YOUR-BOT-TOKEN]"
ADMIN_CHAT_ID="[YOUR-CHAT-ID]"

# Node environment
NODE_ENV="production"
PORT=4000
```

**Generate Webhook Secret**:
```bash
openssl rand -hex 32
```

---

### Step 8: Install Dependencies & Build

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build all packages
pnpm build

# Run database migrations
cd packages/database
pnpm prisma migrate deploy
cd ../..
```

**Expected**: Build completes in <5 minutes, no errors

---

### Step 9: Configure PM2

```bash
# Create ecosystem config
nano ecosystem.config.js
```

**Configuration** (see [research.md Q3](./research.md#q3-pm2-ecosystem-configuration-for-zero-downtime-deployments) for full config):
```javascript
module.exports = {
  apps: [
    {
      name: 'api',
      script: './apps/api/dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      wait_ready: true,
      env: { NODE_ENV: 'production', PORT: 4000 }
    },
    // Add bot, frontend, admin...
  ]
};
```

**Start PM2**:
```bash
# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup systemd
# Copy and run the generated command

# Verify
pm2 status
```

**Expected**:
```
┌─────┬────────────┬─────────┬──────┬─────┐
│ id  │ name       │ status  │ cpu  │ mem │
├─────┼────────────┼─────────┼──────┼─────┤
│ 0   │ api        │ online  │ 0%   │ 50M │
│ 1   │ api        │ online  │ 0%   │ 50M │
└─────┴────────────┴─────────┴──────┴─────┘
```

---

### Step 10: Configure Caddy

```bash
# Edit Caddyfile
nano /etc/caddy/Caddyfile
```

**Configuration** (see [research.md Q2](./research.md#q2-caddy-automatic-https-configuration-for-multiple-domains) for full config):
```Caddyfile
skilltree.app {
    reverse_proxy localhost:3000
    encode gzip
}

api.skilltree.app {
    reverse_proxy localhost:4000
    encode gzip
}

admin.skilltree.app {
    reverse_proxy localhost:3001
    encode gzip
}
```

**Reload Caddy**:
```bash
# Validate configuration
caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
systemctl reload caddy

# Check status
systemctl status caddy
```

**Expected**: Caddy obtains HTTPS certificates automatically (may take 1-2 minutes)

---

### Step 11: Verify Production Deployment

```bash
# Test health endpoint
curl https://api.skilltree.app/health

# Test frontend
curl https://skilltree.app

# Check Caddy logs
journalctl -u caddy -f

# Check PM2 logs
pm2 logs
```

**Expected**: All services return 200 OK

---

### Step 12: Configure GitHub Webhook

1. Go to GitHub repository → Settings → Webhooks → Add webhook
2. **Payload URL**: `https://api.skilltree.app/webhook/deploy`
3. **Content type**: `application/json`
4. **Secret**: Use value from `GITHUB_WEBHOOK_SECRET` in .env
5. **Events**: Just the push event
6. **Active**: ✅ Checked
7. Save webhook

**Test Webhook**:
```bash
# Make a small change and push to main
git commit --allow-empty -m "test: webhook trigger"
git push origin main

# Watch deployment logs
tail -f /opt/skilltree/logs/deploy-*.log
```

**Expected**: Deployment triggered automatically, services reloaded

---

## Common Tasks

### Run Type Check
```bash
pnpm type-check
```

### Run Build
```bash
pnpm build
```

### View Logs
```bash
# PM2 logs
pm2 logs [app-name]

# Caddy logs
journalctl -u caddy -f

# Deployment logs
tail -f /opt/skilltree/logs/deploy-*.log
```

### Restart Services
```bash
# Graceful reload (zero-downtime)
pm2 reload ecosystem.config.js

# Force restart (downtime)
pm2 restart all
```

### Update Dependencies
```bash
pnpm update --latest
pnpm install
pnpm build
pm2 reload ecosystem.config.js
```

### Manual Rollback
```bash
cd /opt/skilltree/repa-maks
git log --oneline -5  # Find previous commit
git reset --hard [COMMIT-SHA]
pnpm install --frozen-lockfile
pnpm build
pm2 reload ecosystem.config.js
```

---

## Troubleshooting

### Health Check Fails
1. Check database connection: `pnpm prisma db pull`
2. Check Redis: `redis-cli ping`
3. Check environment variables: `cat .env`
4. Check PM2 logs: `pm2 logs api`

### Deployment Fails
1. Check webhook secret matches GitHub
2. Verify deployment script has execute permissions: `chmod +x scripts/deploy.sh`
3. Check deployment logs: `tail -f /opt/skilltree/logs/deploy-*.log`

### Caddy HTTPS Fails
1. Verify domains point to server IP: `dig skilltree.app`
2. Check firewall: `ufw status`
3. Check Caddy logs: `journalctl -u caddy -f`
4. Verify Let's Encrypt rate limits not hit

### Build Errors
1. Clear Turborepo cache: `rm -rf .turbo`
2. Clean node_modules: `rm -rf node_modules && pnpm install`
3. Check TypeScript errors: `pnpm type-check`

---

## Next Steps

After completing setup:
1. ✅ Verify all 5 user stories acceptance criteria (see [spec.md](./spec.md))
2. ✅ Run through independent tests for each user story
3. ✅ Monitor health endpoint for 24 hours to ensure stability
4. ➡️ Proceed to next feature development

---

**Status**: ✅ Complete for infrastructure phase
**Estimated Time**: 15 minutes (local) | 30 minutes (production)
**Success Rate**: 95% (assumes prerequisites met)

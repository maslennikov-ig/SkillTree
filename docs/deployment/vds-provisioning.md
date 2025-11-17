# VDS Server Provisioning Guide

**Document**: Complete guide for setting up a production VDS server for SkillTree deployment
**Target Audience**: DevOps engineers, system administrators
**Server Type**: FirstVDS or similar (Ubuntu 22.04 LTS, 4GB RAM, 2 CPU, 50GB SSD)
**Time to Complete**: ~30-45 minutes
**Last Updated**: 2025-01-17

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Initial Setup](#server-initial-setup)
3. [System Security](#system-security)
4. [Install Runtime & Tools](#install-runtime--tools)
5. [Install Redis](#install-redis)
6. [Install Caddy](#install-caddy)
7. [Firewall Configuration](#firewall-configuration)
8. [Application Setup](#application-setup)
9. [PM2 Configuration](#pm2-configuration)
10. [Caddy Configuration](#caddy-configuration)
11. [Verification Steps](#verification-steps)
12. [Troubleshooting](#troubleshooting)
13. [Maintenance](#maintenance)

---

## Prerequisites

### VDS Requirements

- **OS**: Ubuntu 22.04 LTS (focal)
- **RAM**: 4GB minimum (2GB for app, 1GB for Redis, 1GB buffer)
- **CPU**: 2 cores minimum
- **Storage**: 50GB SSD minimum
- **Network**: Public IP address
- **Access**: SSH root or sudo privileges
- **Connection**: Stable internet (for package downloads)

### DNS Prerequisites

All domains must point to your VDS IP address **before** starting Caddy:

```bash
# Check DNS resolution
dig skilltree.app
dig api.skilltree.app
dig admin.skilltree.app

# Should return your VDS IP in ANSWER section
# If not resolved yet, update DNS at your registrar
```

### GitHub Repository Access

- SSH key configured on VDS
- Repository write access (for webhook configuration)
- GitHub account with admin permissions

### Environment Variables

Prepare these values before starting:
- Supabase DATABASE_URL
- Supabase SUPABASE_URL and SUPABASE_ANON_KEY
- Redis password (generate new: `openssl rand -hex 32`)
- GitHub webhook secret (generate: `openssl rand -hex 32`)
- Telegram bot token
- Telegram admin chat ID

---

## Server Initial Setup

### Step 1: Connect to VDS

```bash
# SSH into server using private key
ssh -i ~/.ssh/id_rsa root@YOUR_VDS_IP

# Or if using password (first time)
ssh root@YOUR_VDS_IP
```

### Step 2: Update System

```bash
# Update package lists
apt-get update

# Upgrade all packages
apt-get upgrade -y

# Install essential tools
apt-get install -y build-essential curl wget git nano unzip
```

**Expected**: Upgrade completes in 2-3 minutes

### Step 3: Set Hostname

```bash
# Set descriptive hostname
hostnamectl set-hostname skilltree-prod-01

# Verify
hostnamectl
```

### Step 4: Configure System Limits

```bash
# Edit system limits
nano /etc/security/limits.conf

# Add at end of file:
# skilltree soft nofile 65536
# skilltree hard nofile 65536
# skilltree soft nproc 65536
# skilltree hard nproc 65536

# Save (Ctrl+O, Enter, Ctrl+X)
```

### Step 5: Setup Swap (Optional but Recommended)

```bash
# Check current swap
free -h

# If swap is 0, create 2GB swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verify
free -h
```

---

## System Security

### Step 1: SSH Key Authentication

**On your local machine (already done if you SSH'd):**

```bash
# SSH key should already be configured on VDS
# Verify public key is in authorized_keys
cat ~/.ssh/id_rsa.pub
```

**On VDS server:**

```bash
# Verify SSH key is configured
cat ~/.ssh/authorized_keys

# Should contain your public key
# If empty, paste your public key:
nano ~/.ssh/authorized_keys
# Paste: ssh-rsa AAAA...
# Save and exit
```

### Step 2: Disable SSH Password Authentication

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Change these lines (find and replace):
# OLD: PasswordAuthentication yes
# NEW: PasswordAuthentication no
#
# OLD: #PubkeyAuthentication yes
# NEW: PubkeyAuthentication yes
#
# Optional - change default SSH port for extra security:
# Port 2222  (Remember to allow in firewall!)

# Save (Ctrl+O, Enter, Ctrl+X)

# Test config syntax before restarting
sshd -t

# Reload SSH daemon
systemctl reload ssh
```

**WARNING**: Test SSH connection before closing terminal to ensure you can reconnect!

### Step 3: Setup Automatic Security Updates

```bash
# Install unattended-upgrades
apt-get install -y unattended-upgrades apt-listchanges

# Enable automatic updates
dpkg-reconfigure unattended-upgrades

# Verify it's enabled
systemctl status unattended-upgrades

# Optional: Configure to email on updates
# nano /etc/apt/apt.conf.d/50unattended-upgrades
```

---

## Install Runtime & Tools

### Step 1: Install Node.js 18.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Install Node.js and npm
apt-get install -y nodejs

# Verify installation
node --version     # Should be v18.x.x
npm --version      # Should be 9.x.x
```

**Expected**: Installation completes in 1-2 minutes

### Step 2: Install pnpm Globally

```bash
# Install pnpm (fast, efficient package manager)
npm install -g pnpm

# Verify installation
pnpm --version     # Should be 8.x.x

# Set pnpm store location (optional but recommended)
pnpm config set store-dir /var/cache/pnpm-store
```

### Step 3: Install PM2 Globally

```bash
# Install PM2 (process manager)
npm install -g pm2

# Verify
pm2 --version

# Setup PM2 to auto-start on reboot
pm2 startup systemd -u root --hp /root

# Copy and paste the output command:
# Example: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# Save PM2 process list
pm2 save
```

**Note**: Copy and paste the `pm2 startup` output command if shown!

---

## Install Redis

### Step 1: Install Redis Server

```bash
# Install Redis 7.x
apt-get install -y redis-server

# Verify installation
redis-server --version  # Should be Redis 7.x

# Check status
systemctl status redis-server
```

### Step 2: Configure Redis Security

```bash
# Backup original config
cp /etc/redis/redis.conf /etc/redis/redis.conf.bak

# Edit Redis config
nano /etc/redis/redis.conf

# Find and modify these settings:
# OLD: # requirepass foobared
# NEW: requirepass YOUR_SECURE_PASSWORD
#
# OLD: bind 127.0.0.1 ::1
# NEW: bind 127.0.0.1
#
# OLD: port 6379
# NEW: port 6379
#
# Optional for extra security:
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Save (Ctrl+O, Enter, Ctrl+X)
```

**Generate Secure Password**:
```bash
# Use strong password (32 chars)
openssl rand -hex 32

# Store this in production .env as REDIS_URL:
# redis://:PASSWORD@localhost:6379
```

### Step 3: Start Redis

```bash
# Apply configuration by restarting
systemctl restart redis-server

# Verify status
systemctl status redis-server

# Test connection
redis-cli

# Inside redis-cli:
> PING
# Should return: PONG

> AUTH YOUR_SECURE_PASSWORD
# Should return: OK

> EXIT
```

### Step 4: Enable Redis on Boot

```bash
# Enable auto-start
systemctl enable redis-server

# Verify it's enabled
systemctl is-enabled redis-server
# Should output: enabled
```

---

## Install Caddy

### Step 1: Add Caddy Repository

```bash
# Install dependencies
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https

# Add Cloudsmith GPG key
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | \
  gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

# Add Caddy repository
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | \
  tee /etc/apt/sources.list.d/caddy-stable.list

# Update package list
apt-get update
```

### Step 2: Install Caddy

```bash
# Install Caddy
apt-get install -y caddy

# Verify installation
caddy version  # Should be v2.x.x

# Check status
systemctl status caddy
```

### Step 3: Create Log Directory

```bash
# Create Caddy logs directory
mkdir -p /var/log/caddy

# Set permissions
chown caddy:caddy /var/log/caddy
chmod 755 /var/log/caddy
```

---

## Firewall Configuration

### Step 1: Install UFW

```bash
# Install UFW firewall
apt-get install -y ufw

# Check status
ufw status
```

### Step 2: Configure UFW Rules

```bash
# Allow SSH (DO THIS FIRST or you'll lose access!)
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Optional: If using non-standard SSH port
# ufw allow 2222/tcp

# Deny all other incoming traffic
ufw default deny incoming
ufw default allow outgoing

# Enable firewall
ufw enable
# Type 'y' when prompted

# Verify rules
ufw status
```

**Expected Output**:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                     ALLOW       Anywhere
22/tcp (v6)                ALLOW       Anywhere (v6)
80/tcp (v6)                ALLOW       Anywhere (v6)
443/tcp (v6)               ALLOW       Anywhere (v6)
```

### Step 3: Install fail2ban (Optional but Recommended)

```bash
# Install fail2ban (intrusion detection)
apt-get install -y fail2ban

# Create local config
nano /etc/fail2ban/jail.local

# Add SSH protection:
[DEFAULT]
bantime = 600
maxretry = 3

[sshd]
enabled = true
maxretry = 3
bantime = 3600

# Save (Ctrl+O, Enter, Ctrl+X)

# Start fail2ban
systemctl start fail2ban
systemctl enable fail2ban

# Verify
systemctl status fail2ban
```

---

## Application Setup

### Step 1: Create Application Directory

```bash
# Create skilltree directory
mkdir -p /opt/skilltree/{logs,backups}

# Set permissions
chmod 755 /opt/skilltree
chmod 755 /opt/skilltree/logs
chmod 755 /opt/skilltree/backups
```

### Step 2: Clone Repository

```bash
# Navigate to skilltree directory
cd /opt/skilltree

# Clone repository (replace with your repo URL)
git clone git@github.com:skilltree/repa-maks.git

# Navigate into repo
cd repa-maks

# Verify current branch
git status
```

### Step 3: Create Environment File

```bash
# Create production .env file
nano .env
```

**Add these variables**:
```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?sslmode=require&pgbouncer=true"
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# Redis (local with password)
REDIS_URL="redis://:YOUR_REDIS_PASSWORD@localhost:6379"

# GitHub Webhook
GITHUB_WEBHOOK_SECRET="[32-CHAR-SECRET]"

# Telegram Notifications
TELEGRAM_BOT_TOKEN="[YOUR-BOT-TOKEN]"
ADMIN_CHAT_ID="[YOUR-CHAT-ID]"

# Node environment
NODE_ENV="production"
PORT=4000
```

**Get Supabase Credentials**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → Database → Connection string
4. Use "Connection pooling" option (has ?pgbouncer=true)
5. Copy connection string

**Generate Webhook Secret**:
```bash
openssl rand -hex 32
```

### Step 4: Install Dependencies

```bash
# Install all dependencies
pnpm install --frozen-lockfile

# This might take 2-3 minutes
```

**Expected**: Installation completes without errors

### Step 5: Build Application

```bash
# Build all packages
pnpm build

# This compiles TypeScript and creates dist/ directories
```

**Expected**: Build completes in 1-2 minutes

### Step 6: Setup Database

```bash
# Navigate to database package
cd packages/database

# Run migrations
pnpm prisma migrate deploy

# Return to root
cd ../..
```

**Expected**: Migrations apply successfully (or "already applied" message)

---

## PM2 Configuration

### Step 1: Create ecosystem.config.js

**Ensure file exists at root** `/opt/skilltree/repa-maks/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      // API Service
      name: 'skilltree-api',
      script: './apps/api/dist/main.js',

      // Clustering
      instances: 2,           // 2 processes for 2 CPU
      exec_mode: 'cluster',   // Use cluster mode
      wait_ready: true,       // Wait for process.send('ready')
      listen_timeout: 10000,  // Max time to listen

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },

      // Graceful shutdown
      kill_timeout: 5000,     // Wait 5s before kill
      max_memory_restart: '500M',

      // Crash webhook (optional - sends Telegram alert)
      error_file: '/opt/skilltree/logs/api-error.log',
      out_file: '/opt/skilltree/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  // Log rotation settings
  output: '/opt/skilltree/logs/pm2-output.log',
  error: '/opt/skilltree/logs/pm2-error.log',

  // Node interpreter (optional)
  interpreter: '/usr/bin/node'
};
```

**Important Settings**:
- `instances: 2` - Cluster mode with 2 processes for HA
- `wait_ready: true` - API sends ready signal from main.ts
- `listen_timeout: 10000` - Max 10s to become ready
- `kill_timeout: 5000` - Max 5s for graceful shutdown
- `max_memory_restart: '500M'` - Restart if uses >500MB

### Step 2: Start PM2

```bash
# Navigate to app directory
cd /opt/skilltree/repa-maks

# Start services using ecosystem config
pm2 start ecosystem.config.js

# Save PM2 process list (for reboot)
pm2 save

# View running processes
pm2 status
```

**Expected Status Output**:
```
┌─────────────────────────┬────┬──────┬──────────┐
│ name                    │ id │ mode │ status   │
├─────────────────────────┼────┼──────┼──────────┤
│ skilltree-api           │ 0  │ fork │ online   │
│ skilltree-api           │ 1  │ fork │ online   │
└─────────────────────────┴────┴──────┴──────────┘
```

### Step 3: View Logs

```bash
# Watch real-time logs
pm2 logs skilltree-api

# View specific log file
tail -f /opt/skilltree/logs/api-out.log

# View errors
tail -f /opt/skilltree/logs/api-error.log
```

### Step 4: Setup PM2 Startup

```bash
# Generate startup script
pm2 startup systemd -u root --hp /root

# Run the output command (if shown)
# Copy-paste the generated command

# Verify it's enabled
pm2 startup
```

---

## Caddy Configuration

### Step 1: Create Caddyfile

```bash
# Edit Caddy configuration
nano /etc/caddy/Caddyfile

# Clear default content and add:
```

**Caddyfile Content**:

```caddyfile
# Global settings
{
    email admin@skilltree.app
    admin localhost:2019
}

# API Domain
api.skilltree.app {
    # Reverse proxy to API
    reverse_proxy localhost:4000

    # Enable compression
    encode gzip

    # Access logging
    log {
        output file /var/log/caddy/api.skilltree.app.log
        format json
    }

    # Headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}

# Frontend Domain (future)
skilltree.app {
    reverse_proxy localhost:3000
    encode gzip

    log {
        output file /var/log/caddy/skilltree.app.log
        format json
    }
}

# Admin Domain (future)
admin.skilltree.app {
    reverse_proxy localhost:3001
    encode gzip

    log {
        output file /var/log/caddy/admin.skilltree.app.log
        format json
    }
}
```

### Step 2: Validate Configuration

```bash
# Check Caddyfile syntax
caddy validate --config /etc/caddy/Caddyfile

# Should output: "Configuration is valid"
```

### Step 3: Reload Caddy

```bash
# Reload Caddy (no downtime)
systemctl reload caddy

# Verify status
systemctl status caddy

# Check Caddy logs
journalctl -u caddy -f
```

**Expected**: Caddy obtains HTTPS certificates from Let's Encrypt (takes 1-2 minutes)

### Step 4: Verify HTTPS

```bash
# Test API endpoint
curl https://api.skilltree.app/health

# Should return JSON response with 200 OK
# If domain not resolving, update DNS first
```

---

## Verification Steps

### Step 1: Check All Services

```bash
# Check if all services are running
systemctl status caddy
systemctl status redis-server
pm2 status

# Expected: all showing "active" or "online"
```

### Step 2: Test Health Endpoint

```bash
# Test via HTTPS (requires valid DNS)
curl https://api.skilltree.app/health

# Test via localhost (if DNS not yet working)
curl http://localhost:4000/health

# Expected response:
# {
#   "status": "healthy",
#   "uptime": 30,
#   "timestamp": "2025-01-17T12:00:00.000Z",
#   "services": {
#     "database": { "status": "connected", "responseTime": 15 },
#     "redis": { "status": "connected", "responseTime": 5 }
#   }
# }
```

### Step 3: Check Database Connection

```bash
# Test Prisma connection
cd /opt/skilltree/repa-maks
npx prisma db execute --stdin << 'EOF'
SELECT 1;
EOF

# Expected: "Success"
```

### Step 4: Check Redis Connection

```bash
# Test Redis
redis-cli -a YOUR_REDIS_PASSWORD ping

# Expected: PONG
```

### Step 5: Check Firewall

```bash
# View firewall rules
ufw status

# Test port connectivity from local machine
ssh -v root@YOUR_VDS_IP  # Should work
ssh -v -p 2222 root@YOUR_VDS_IP  # Only if changed SSH port

# Test HTTP/HTTPS (should redirect)
curl -I http://api.skilltree.app
# Should redirect to HTTPS

curl -I https://api.skilltree.app
# Should return 200 or 404 (OK as long as connected)
```

### Step 6: Check Logs

```bash
# PM2 logs (application)
pm2 logs skilltree-api

# Caddy logs (web server)
journalctl -u caddy -f

# Redis logs (if enabled)
tail -f /var/log/redis/redis-server.log

# System logs (errors)
journalctl -f
```

### Step 7: Disk Space

```bash
# Check disk usage
df -h

# Expected: >10GB available

# Check inodes
df -i

# Expected: >100k available
```

---

## Troubleshooting

### DNS Not Resolving

**Problem**: `curl https://api.skilltree.app` fails with "Name or service not known"

**Solution**:
```bash
# Check DNS from VDS
dig @8.8.8.8 api.skilltree.app

# Check your registrar's DNS settings
# Should point to: YOUR_VDS_IP

# Wait for propagation (can take up to 24 hours)
# Meanwhile, test via IP:
curl -H "Host: api.skilltree.app" https://YOUR_VDS_IP

# Or test locally:
curl http://localhost:4000/health
```

### Caddy HTTPS Certificate Not Obtained

**Problem**: Caddy running but HTTPS still shows "untrusted certificate"

**Solution**:
```bash
# Check Caddy logs
journalctl -u caddy -f

# Common issues:
# 1. DNS not resolving (see above)
# 2. Port 80/443 blocked by firewall
# 3. Let's Encrypt rate limits hit

# Check firewall
ufw status
# Ensure 80 and 443 allowed

# Force Caddy to reload
systemctl reload caddy

# Wait 2-3 minutes for cert generation
```

### PM2 Crash on Startup

**Problem**: `pm2 status` shows process "crashed"

**Solution**:
```bash
# View crash logs
pm2 logs skilltree-api

# Check if dist/ was built
ls -la apps/api/dist/

# If missing, rebuild:
pnpm build

# Check environment variables
cat .env | grep -v "^#"

# Check database connectivity
curl http://localhost:4000/health
pm2 logs

# Manually test API startup
node apps/api/dist/main.js

# Watch for errors
```

### Redis Connection Refused

**Problem**: Health endpoint shows Redis "disconnected"

**Solution**:
```bash
# Check if Redis is running
systemctl status redis-server

# Restart Redis
systemctl restart redis-server

# Test connection
redis-cli -a YOUR_PASSWORD ping

# Verify password in .env
cat .env | grep REDIS_URL

# Check if password is correct
redis-cli -a WRONG_PASSWORD ping
# Should fail if password wrong

# Monitor Redis
redis-cli -a YOUR_PASSWORD
> INFO server
> INFO stats
```

### High Memory Usage

**Problem**: Server is slow or running out of memory

**Solution**:
```bash
# Check memory
free -h

# Check which process uses most memory
ps aux --sort=-%mem | head

# Check Node process memory
pm2 monit

# Check Redis memory
redis-cli -a YOUR_PASSWORD info memory

# Reduce Node memory:
# Edit ecosystem.config.js
# max_memory_restart: '300M'

# Reduce Redis memory:
# Edit /etc/redis/redis.conf
# maxmemory 256mb

# Increase server RAM (contact hosting provider)
```

### Disk Space Running Out

**Problem**: Disk full or almost full

**Solution**:
```bash
# Check disk usage
du -sh /opt/skilltree/*

# Check logs size
du -sh /opt/skilltree/logs

# Clear old logs
find /opt/skilltree/logs -name "*.log" -mtime +30 -delete

# Check Caddy cache
du -sh /var/cache/caddy

# Cleanup PM2
pm2 monit

# Enable log rotation
# Edit ecosystem.config.js (already configured)
```

---

## Maintenance

### Regular Tasks

#### Daily
```bash
# Monitor health
curl https://api.skilltree.app/health

# Check disk usage
df -h
```

#### Weekly
```bash
# Review logs for errors
journalctl -p err -S "1 week ago"

# Check PM2 status
pm2 status

# Restart services if needed
pm2 gracefulReload all
```

#### Monthly
```bash
# Update system packages
apt-get update && apt-get upgrade -y

# Check security updates
unattended-upgrade -d

# Review failed login attempts
fail2ban-client status sshd
```

#### Quarterly
```bash
# Update dependencies
cd /opt/skilltree/repa-maks
git pull origin main
pnpm update
pnpm build
pm2 gracefulReload all
```

### Backup Strategy

```bash
# Backup database (handled by Supabase)
# Verify in Supabase dashboard: Settings → Backups

# Backup application files
tar -czf /opt/skilltree/backups/app-$(date +%Y%m%d).tar.gz \
  /opt/skilltree/repa-maks \
  --exclude node_modules \
  --exclude dist \
  --exclude .git

# Keep last 4 backups
find /opt/skilltree/backups -name "app-*.tar.gz" -mtime +30 -delete

# Backup Redis data (optional)
redis-cli -a YOUR_PASSWORD BGSAVE

# List backups
ls -lh /opt/skilltree/backups/
```

### Monitoring Commands

```bash
# Real-time monitoring
pm2 monit

# Log monitoring
pm2 logs -f

# Caddy admin API
curl http://localhost:2019/config/

# Redis CLI
redis-cli -a PASSWORD
> INFO
> DBSIZE

# System monitoring
htop    # Interactive process monitor
nethogs # Network usage by process
iotop   # Disk I/O by process
```

---

## Security Checklist

- ✅ SSH key authentication enabled
- ✅ SSH password authentication disabled
- ✅ UFW firewall configured (22, 80, 443 only)
- ✅ fail2ban intrusion detection enabled
- ✅ Redis password authentication enabled
- ✅ Redis binds to localhost only
- ✅ All secrets in .env (not committed to Git)
- ✅ Caddy auto-HTTPS certificates (Let's Encrypt)
- ✅ Application logging to files (not stdout)
- ✅ PM2 monitoring and auto-restart enabled

---

## Performance Optimization

### Node.js

```bash
# Set production flags
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=1024"

# Already set in ecosystem.config.js
```

### Redis

```bash
# Optimize Redis for production
# In /etc/redis/redis.conf:
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Caddy

```bash
# Already optimized with:
# - Gzip compression
# - HTTP/2
# - Connection pooling
```

### System

```bash
# Increase file descriptors
ulimit -n 65536

# Make permanent (already done in limits.conf)
```

---

## References

- **Ubuntu Server Docs**: https://ubuntu.com/server/docs
- **Node.js Production Best Practices**: https://nodejs.org/en/docs/guides/nodejs-web-application-security/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start
- **Caddy Documentation**: https://caddyserver.com/docs
- **Redis Security**: https://redis.io/docs/management/security/
- **UFW Firewall**: https://ubuntu.com/server/docs/security-ufw

---

**Last Updated**: 2025-01-17
**Tested On**: Ubuntu 22.04 LTS
**Maintainer**: DevOps Team

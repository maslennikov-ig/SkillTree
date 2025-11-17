# GitHub Webhook Configuration Guide

**Document**: Complete guide for setting up GitHub webhook for CI/CD deployment
**Target Audience**: DevOps engineers, repository maintainers
**Prerequisites**: VDS provisioned with API running on port 4000, GitHub repository write access
**Last Updated**: 2025-01-17

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Webhook Testing](#webhook-testing)
5. [Deployment Flow](#deployment-flow)
6. [Troubleshooting](#troubleshooting)
7. [Security Best Practices](#security-best-practices)

---

## How It Works

### Deployment Flow Diagram

```
┌─────────────────────┐
│  Developer          │
│  git push main      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Repository  │
│  - Receives push    │
│  - Verifies webhook │
│  - Sends payload    │
└──────────┬──────────┘
           │
           ▼ HTTPS POST (HMAC-SHA256 signed)
┌──────────────────────────────────────────────┐
│  VDS Server                                  │
│  Caddy (reverse proxy) → localhost:4000      │
│                                              │
│  API endpoint: POST /webhook/deploy          │
│  1. Verify HMAC signature                    │
│  2. Check ref is refs/heads/main             │
│  3. Spawn deploy.sh asynchronously           │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Deployment Script (/opt/skilltree/deploy.sh)│
│  1. cd /opt/skilltree/repa-maks              │
│  2. git pull origin main                     │
│  3. pnpm install --frozen-lockfile           │
│  4. pnpm build                               │
│  5. pnpm db:migrate                          │
│  6. pm2 reload ecosystem.config.js (zero DT) │
│  7. curl /health check                       │
│  8. On failure: auto-rollback                │
│  Logs: /opt/skilltree/logs/deploy-*.log      │
└──────────┬───────────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼ Success     ▼ Failure
   ✅ Live      🔄 Rollback
  (New code)    (Old code)
```

### Security Model

- **HMAC-SHA256 Signature**: Every webhook is signed with your secret
- **Signature Verification**: API verifies signature before executing deploy
- **Branch Filter**: Only `main` branch triggers deployment (ignore other branches)
- **No Credentials**: GitHub webhook never contains your database password
- **Encrypted Transport**: All communication via HTTPS

---

## Prerequisites

### GitHub Setup
- Repository ownership or admin access
- GitHub account with verified email
- Repository is public or webhook configured with personal access token

### VDS Setup
- VDS running with API on port 4000
- Caddy reverse proxy working
- `api.skilltree.app` domain resolving to VDS IP
- `/webhook/deploy` endpoint implemented in API
- `deploy.sh` script exists and is executable

### Environment
- `GITHUB_WEBHOOK_SECRET` set in `.env` on VDS (32-char random string)
- Generated via: `openssl rand -hex 32`

---

## Step-by-Step Setup

### Step 1: Generate Webhook Secret

**On your VDS server:**

```bash
# Generate 32-character random secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo $WEBHOOK_SECRET

# Output example:
# a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6

# Copy this value - you'll need it for GitHub webhook setup
```

**Add to .env file on VDS:**

```bash
# On VDS:
nano /opt/skilltree/repa-maks/.env

# Add or update:
GITHUB_WEBHOOK_SECRET="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6"
```

**Verify the webhook endpoint is running:**

```bash
# Test that API is responding
curl https://api.skilltree.app/health

# Should return JSON with status "healthy"
```

### Step 2: Access GitHub Webhook Settings

1. Navigate to GitHub repository
2. Go to **Settings** (top navigation)
3. Click **Webhooks** (left sidebar under "Code, planning, and automation")
4. Click **Add webhook** (top right)

### Step 3: Configure Webhook

**Webhook Settings Form**:

| Field | Value |
|-------|-------|
| **Payload URL** | `https://api.skilltree.app/webhook/deploy` |
| **Content type** | `application/json` |
| **Secret** | `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2...` (from Step 1) |
| **SSL verification** | ✅ Enable SSL verification |
| **Active** | ✅ Active |

**Events to trigger on**:
- ☑️ **Push events** (REQUIRED - deploy on every push to main)
- ☐ Pull requests (uncheck)
- ☐ Issues (uncheck)
- ☐ Others (uncheck)

### Step 4: Save Webhook

1. Scroll to bottom of form
2. Click **Add webhook** button
3. You'll see the webhook listed in the webhooks page
4. Green checkmark (✅) = successfully created

---

## Webhook Testing

### Step 1: Verify Webhook Configuration

```bash
# On GitHub, in the webhook details, you should see:
# - Recent Deliveries section (bottom)
# - First delivery will likely be a test

# Click on the most recent delivery to see:
# - HTTP status code (200 = success)
# - Request headers (includes X-Hub-Signature-256)
# - Request payload (JSON)
# - Response body
```

### Step 2: Manual Webhook Test

**Method 1: GitHub UI Test**

1. Go to webhook settings page
2. Scroll to "Recent Deliveries"
3. Find the most recent delivery
4. Click "Redeliver" button
5. Check the response (should be 202 Accepted)

**Method 2: Manual curl Test**

```bash
# Generate HMAC signature locally
WEBHOOK_SECRET="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6"

# Create test payload (minimal)
PAYLOAD='{"ref":"refs/heads/main","repository":{"full_name":"skilltree/repa-maks"}}'

# Generate signature
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.*= //')"

echo "Signature: $SIGNATURE"

# Send test webhook to VDS
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -d "$PAYLOAD" \
  https://api.skilltree.app/webhook/deploy

# Expected response:
# {"status":"deployment_triggered","message":"Deploying..."}
```

### Step 3: Verify Deployment Occurred

```bash
# Check deployment logs on VDS
tail -f /opt/skilltree/logs/deploy-*.log

# Check PM2 logs
pm2 logs skilltree-api

# Verify new version is live
curl https://api.skilltree.app/health

# Check git status on VDS
cd /opt/skilltree/repa-maks
git status
git log --oneline -5
```

### Step 4: Test End-to-End

**Make a test commit and push**:

```bash
# On your local machine
git commit --allow-empty -m "test: webhook deployment trigger"
git push origin main
```

**Watch deployment happen**:

```bash
# On VDS, tail logs
tail -f /opt/skilltree/logs/deploy-*.log

# In another window, check health endpoint
for i in {1..10}; do
  curl -s https://api.skilltree.app/health | jq '.services.database.status'
  sleep 5
done
```

**Expected sequence**:
1. Push accepted on GitHub
2. Webhook sent to VDS (within 30 seconds)
3. Deploy script starts (logs appear)
4. Services restart (health endpoint might return 503 briefly)
5. Services back up (health returns 200)

---

## Deployment Flow

### Automatic Deployment Process

**When code is pushed to main branch:**

1. **GitHub detects push**
   - Branch: refs/heads/main
   - Commits: user's changes

2. **GitHub sends webhook**
   - POST to https://api.skilltree.app/webhook/deploy
   - Headers: X-Hub-Signature-256 (HMAC signature)
   - Body: JSON payload (repo info, commits, ref)

3. **API receives webhook**
   - Endpoint: POST /webhook/deploy
   - Verifies HMAC signature against GITHUB_WEBHOOK_SECRET
   - Checks that ref is refs/heads/main (ignores other branches)
   - Spawns deploy.sh asynchronously
   - Returns 202 Accepted immediately

4. **Deployment script runs**
   ```bash
   #!/bin/bash
   set -e

   LOG_FILE="/opt/skilltree/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

   {
     echo "=== Deployment started at $(date) ==="

     cd /opt/skilltree/repa-maks

     # Step 1: Pull latest code
     git pull origin main

     # Step 2: Install dependencies
     pnpm install --frozen-lockfile

     # Step 3: Build all packages
     pnpm build

     # Step 4: Run migrations
     cd packages/database
     pnpm prisma migrate deploy
     cd ../..

     # Step 5: Zero-downtime reload
     pm2 reload ecosystem.config.js

     # Step 6: Health check
     for i in {1..30}; do
       if curl -f https://api.skilltree.app/health > /dev/null 2>&1; then
         echo "Health check passed"
         exit 0
       fi
       echo "Health check attempt $i/30..."
       sleep 2
     done

     # Health check failed - rollback
     echo "ERROR: Health check failed, rolling back..."
     git reset --hard HEAD~1
     pnpm install --frozen-lockfile
     pnpm build
     pm2 reload ecosystem.config.js

     # Verify rollback
     sleep 5
     curl -f https://api.skilltree.app/health || exit 1

     echo "Rollback successful"

   } 2>&1 | tee "$LOG_FILE"
   ```

5. **Zero-downtime reload**
   - PM2 signals old processes gracefully
   - New processes start listening
   - Old processes exit after timeout
   - No downtime for connected clients

6. **Health check verification**
   - Deploy script polls /health endpoint
   - If returns 200, deployment successful
   - If returns 503 or timeout, auto-rollback triggered

7. **Notification (optional)**
   - Send Telegram alert to ADMIN_CHAT_ID
   - Include: deployment status, duration, git hash

---

## Troubleshooting

### Webhook Not Triggered

**Symptom**: Push to main but no deployment happens

**Check these:**

```bash
# 1. Verify webhook is active on GitHub
# Go to Settings → Webhooks → Check "Active" checkbox

# 2. Check recent deliveries on GitHub
# Settings → Webhooks → Click webhook → Recent Deliveries
# Should see POST request with green checkmark

# 3. Verify domain resolves
dig api.skilltree.app
nslookup api.skilltree.app

# 4. Test domain from VDS
curl https://api.skilltree.app/health

# 5. Check API logs for webhook requests
pm2 logs skilltree-api | grep webhook
```

### Webhook Returns Error (5xx)

**Symptom**: GitHub shows red X on webhook delivery

**Solutions:**

```bash
# 1. Check if API is running
pm2 status | grep skilltree-api

# 2. Check API logs for errors
pm2 logs skilltree-api -n 50

# 3. Check if endpoint exists
curl -X POST https://api.skilltree.app/webhook/deploy \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main"}'

# 4. Check environment variables on VDS
grep GITHUB_WEBHOOK_SECRET /opt/skilltree/repa-maks/.env

# 5. Check disk space (might prevent deployment)
df -h /opt/skilltree

# 6. Check if deploy script is executable
ls -la /opt/skilltree/repa-maks/scripts/deploy.sh
chmod +x /opt/skilltree/repa-maks/scripts/deploy.sh
```

### Deployment Fails Halfway

**Symptom**: Webhook triggered but deployment script fails

**Debug:**

```bash
# 1. Check deployment logs
tail -f /opt/skilltree/logs/deploy-*.log

# 2. Check the error (likely one of these)
# - git pull failed (network issue)
# - pnpm install failed (dependency error)
# - pnpm build failed (TypeScript error)
# - pnpm migrate failed (database issue)
# - pm2 reload failed (config error)

# 3. For git pull errors
cd /opt/skilltree/repa-maks
git status
git fetch origin
git log origin/main -1

# 4. For build errors
pnpm type-check
pnpm build

# 5. For database errors
cd packages/database
pnpm prisma db execute --stdin < <(echo "SELECT 1;")

# 6. For PM2 reload errors
pm2 status
pm2 logs -n 100
```

### Auto-Rollback Triggered

**Symptom**: Deployment started but rolled back automatically

**Why it happened:**
- Health endpoint returned 503
- Health check failed for 30 attempts (60 seconds)
- Database connection broken
- Redis connection broken
- API crash on startup

**Resolution:**

```bash
# 1. Check which commit failed
git log --oneline -5

# 2. Check health endpoint
curl https://api.skilltree.app/health

# 3. Check database connection
cd packages/database
pnpm prisma db execute --stdin < <(echo "SELECT 1;")

# 4. Check Redis connection
redis-cli -a PASSWORD ping

# 5. Check environment variables
cat .env | grep DATABASE_URL
cat .env | grep REDIS_URL

# 6. Fix the issue, then manually redeploy
cd /opt/skilltree/repa-maks
git pull origin main
pnpm install --frozen-lockfile
pnpm build
cd packages/database
pnpm prisma migrate deploy
cd ../..
pm2 reload ecosystem.config.js

# 7. Verify deployment
curl https://api.skilltree.app/health
```

### Secret Mismatch Error

**Symptom**: "Signature verification failed" in logs

**Cause**: GitHub secret doesn't match VDS GITHUB_WEBHOOK_SECRET

**Fix:**

```bash
# 1. Get secret currently on VDS
grep GITHUB_WEBHOOK_SECRET /opt/skilltree/repa-maks/.env

# 2. Generate new secret
openssl rand -hex 32

# 3. Update .env on VDS
nano /opt/skilltree/repa-maks/.env
# Replace GITHUB_WEBHOOK_SECRET value

# 4. Update GitHub webhook
# Go to Settings → Webhooks → Edit webhook
# Paste new secret in "Secret" field
# Save webhook

# 5. Test by redelivering a recent webhook
# Settings → Webhooks → Recent Deliveries → Redeliver
```

---

## Security Best Practices

### 1. Secret Management

✅ **DO:**
- Generate 32-character random secret: `openssl rand -hex 32`
- Store in `.env` (git-ignored)
- Rotate secret every 90 days
- Use same secret across all webhook retries

❌ **DON'T:**
- Commit secret to git
- Reuse same secret for multiple webhooks
- Use weak secrets like "secret123"
- Share secret over Slack or email (use password manager)

### 2. Signature Verification

```bash
# API MUST verify signature before executing deploy
# In Node.js:

const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${hash}`),
    Buffer.from(signature)
  );
}

// ALWAYS use timingSafeEqual to prevent timing attacks
```

### 3. Branch Filtering

```bash
# Only deploy on refs/heads/main
# Ignore other branches (refs/heads/dev, refs/heads/feature/*)

if (payload.ref !== 'refs/heads/main') {
  return 202; // Accept but don't deploy
}
```

### 4. HTTPS Only

✅ Use HTTPS for webhook URL (https://api.skilltree.app/webhook/deploy)
✅ Enable SSL verification on GitHub webhook
❌ Never use HTTP (unencrypted)

### 5. Restrict Deploy Command

```bash
# Deploy script should run as limited user (not root)
# In production, consider:

# 1. Dedicated deployment user
useradd -m deployer
chown -R deployer:deployer /opt/skilltree

# 2. Restrict sudo for deployment script only
# In /etc/sudoers:
# deployer ALL = (ALL) NOPASSWD: /opt/skilltree/scripts/deploy.sh

# 3. API should run as non-root user
# In ecosystem.config.js:
# user: 'skilltree',  // Run as unprivileged user
```

### 6. Audit Logging

```bash
# Log all webhook requests (even failed ones)
# In deploy.sh:

LOG_FILE="/opt/skilltree/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
{
  echo "Webhook received from GitHub"
  echo "Payload: $PAYLOAD"
  echo "Signature: $SIGNATURE"
  echo "Verification: $VERIFIED"
  # ... rest of deployment
} | tee "$LOG_FILE"

# Rotate logs to prevent disk fill
find /opt/skilltree/logs -name "deploy-*.log" -mtime +30 -delete
```

### 7. Rate Limiting

```bash
# Consider rate limiting to prevent abuse
// In NestJS controller:

@Post('/webhook/deploy')
@UseInterceptors(RateLimitInterceptor)  // 10 requests per minute
handleDeployment(req) {
  // ...
}
```

---

## Webhook Payload Example

**What GitHub sends to your endpoint:**

```json
{
  "ref": "refs/heads/main",
  "before": "abc123...",
  "after": "def456...",
  "repository": {
    "id": 123456789,
    "name": "repa-maks",
    "full_name": "skilltree/repa-maks",
    "private": true,
    "owner": {
      "name": "skilltree",
      "email": "team@skilltree.app"
    },
    "html_url": "https://github.com/skilltree/repa-maks"
  },
  "pusher": {
    "name": "developer",
    "email": "dev@skilltree.app"
  },
  "commits": [
    {
      "id": "def456...",
      "message": "feat: add new feature",
      "author": {
        "name": "developer",
        "email": "dev@skilltree.app"
      },
      "timestamp": "2025-01-17T12:00:00Z"
    }
  ]
}
```

**Headers GitHub sends:**

```
Host: api.skilltree.app
User-Agent: GitHub-Hookshot/abc123
X-GitHub-Event: push
X-GitHub-Delivery: 12345678-1234-1234-1234-123456789012
X-Hub-Signature-256: sha256=abc123...
X-GitHub-Hook-ID: 123456789
X-GitHub-Hook-Installation-Target-ID: 987654321
X-GitHub-Hook-Installation-Target-Type: repository
Content-Type: application/json
Content-Length: 5000
```

**Important headers:**
- `X-GitHub-Event: push` - Type of webhook
- `X-Hub-Signature-256: sha256=...` - HMAC signature (VERIFY THIS!)

---

## Advanced: Custom Notifications

### Send Telegram Alert on Deployment

```bash
# In deploy.sh, after successful deployment:

SUCCESS=true
if curl -f https://api.skilltree.app/health > /dev/null 2>&1; then
  TELEGRAM_MSG="✅ Deployment successful\n$(git log -1 --pretty=format:'%h - %s')"
else
  TELEGRAM_MSG="❌ Deployment failed - rollback triggered"
  SUCCESS=false
fi

# Send Telegram notification
curl -s -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage \
  -d chat_id=${ADMIN_CHAT_ID} \
  -d text="${TELEGRAM_MSG}" \
  -d parse_mode="HTML" > /dev/null

if [ "$SUCCESS" = true ]; then
  exit 0
else
  exit 1
fi
```

---

## Testing Checklist

Before going to production:

- [ ] Webhook secret generated and stored in .env
- [ ] GitHub webhook configured with correct payload URL
- [ ] GitHub webhook uses application/json content type
- [ ] SSL verification enabled on webhook
- [ ] Webhook set to "Active"
- [ ] Only "Push events" selected
- [ ] Deploy script is executable (`chmod +x deploy.sh`)
- [ ] Manual curl test succeeds
- [ ] Deployment logs are created and readable
- [ ] Health endpoint works after deployment
- [ ] Rollback triggered if health check fails
- [ ] Telegram notifications sent (if configured)
- [ ] Old deployments cleaned up (logs retention)

---

## References

- **GitHub Webhook Docs**: https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks
- **GitHub Webhook Security**: https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks
- **HMAC SHA-256**: https://en.wikipedia.org/wiki/HMAC
- **PM2 Zero-Downtime Reload**: https://pm2.keymetrics.io/docs/usage/cluster-mode

---

**Last Updated**: 2025-01-17
**Tested With**: GitHub API v2024, PM2 5.x, Caddy 2.x
**Security Level**: Production-Ready

# API Contracts

**Feature**: 001-project-setup
**Date**: 2025-01-17

## Overview

This directory contains OpenAPI 3.0 specifications for infrastructure-related API endpoints.

## Contracts

### 1. Health Check API (`health-api.yaml`)

**Purpose**: System health monitoring and readiness probes

**Endpoints**:
- `GET /health` - Comprehensive health status (database, Redis, uptime)
- `GET /health/ready` - Readiness probe (all services must be ready)
- `GET /health/live` - Liveness probe (application running check)

**Use Cases**:
- Deployment health verification after PM2 reload
- Uptime monitoring (UptimeRobot, Pingdom)
- Kubernetes-style probes (future containerization)
- Load balancer health checks (future)

**Performance Requirements**:
- Response time: <100ms (specified in FR-016)
- Database check: <50ms
- Redis check: <10ms

**Implementation Notes**:
- `/health/ready` returns 503 if ANY service disconnected
- `/health/live` returns 200 even if Redis disconnected (degraded mode)
- Structured logging for all health check failures

---

### 2. Webhook API (`webhook-api.yaml`)

**Purpose**: GitHub webhook integration for automated deployment

**Endpoints**:
- `POST /webhook/deploy` - Handle GitHub push events

**Security**:
- HMAC SHA-256 signature verification using `X-Hub-Signature-256` header
- Shared secret stored in `GITHUB_WEBHOOK_SECRET` environment variable
- Reject requests with invalid signatures (401 Unauthorized)

**Deployment Logic**:
1. Verify signature
2. Filter for `refs/heads/main` (ignore other branches)
3. Trigger deployment script asynchronously
4. Return 200 immediately (non-blocking)

**Implementation Notes**:
- Webhook handler runs deployment script in background (`child_process.exec`)
- Deployment failures logged and sent via Telegram notification
- Rollback triggered automatically on health check failure

---

## Validation

Validate contracts using Swagger Editor or Redocly CLI:

```bash
# Using Redocly
npm install -g @redocly/cli
redocly lint contracts/health-api.yaml
redocly lint contracts/webhook-api.yaml

# Using Swagger CLI
npm install -g @apidevtools/swagger-cli
swagger-cli validate contracts/health-api.yaml
swagger-cli validate contracts/webhook-api.yaml
```

## Code Generation

Generate TypeScript types from OpenAPI specs (optional):

```bash
# Using openapi-typescript
npm install -g openapi-typescript
openapi-typescript contracts/health-api.yaml -o packages/shared/src/types/health-api.ts
openapi-typescript contracts/webhook-api.yaml -o packages/shared/src/types/webhook-api.ts
```

## Testing

Example test cases:

**Health Check**:
```bash
# Should return 200 with healthy status
curl https://api.skilltree.app/health

# Should return 200 even if Redis down (liveness)
curl https://api.skilltree.app/health/live

# Should return 503 if database down (readiness)
curl https://api.skilltree.app/health/ready
```

**Webhook** (requires valid signature):
```bash
# Simulate GitHub webhook (generate signature first)
curl -X POST https://api.skilltree.app/webhook/deploy \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=<signature>" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main","repository":{"name":"repa-maks"}}'
```

## Future Contracts

Additional contracts will be added in future features:
- `telegram-bot-api.yaml` - Telegram bot webhook endpoints
- `students-api.yaml` - Student profile management
- `sessions-api.yaml` - Test session management
- `admin-api.yaml` - Admin dashboard API

---

**Status**: ✅ Complete for infrastructure phase
**Next Phase**: Implementation via `/speckit.tasks` and `/speckit.implement`

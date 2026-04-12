---
id: skilltree-3
title: "Configure SendPulse API credentials on VDS server"
type: task
status: open
priority: 2
labels: [sendpulse, email, vds, configuration]
created: 2026-03-27T13:32:00Z
---

## Description

EmailService logs "SendPulse credentials not configured - email service disabled" on startup because `SENDPULSE_API_USER_ID` and `SENDPULSE_API_SECRET` environment variables are not set on the VDS server.

This causes the "Отправить родителям" button in the Telegram bot to fail with "Произошла ошибка" — the email-report endpoint at `POST /results/:sessionId/email-report` works correctly code-wise, it just needs SendPulse to be configured.

## Steps

1. **Get SendPulse API keys** from the customer (API User ID + API Secret from https://login.sendpulse.com/settings/#api)
2. **Add credentials to `.env`** on VDS server:
   ```bash
   ssh -i ~/.ssh/claude_deploy deploy@95.81.97.236
   # Add to /opt/skilltree/repa-maks/.env:
   SENDPULSE_API_USER_ID=<api_user_id>
   SENDPULSE_API_SECRET=<api_secret>
   ```
3. **Restart API**:
   ```bash
   cd /opt/skilltree/repa-maks && pm2 restart api
   ```
4. **Verify** email works — check API logs for "SendPulse initialized" instead of "credentials not configured":
   ```bash
   pm2 logs api --lines 20
   ```

## Context

- VDS server: `95.81.97.236` (user: `deploy`, key: `~/.ssh/claude_deploy`)
- App directory: `/opt/skilltree/repa-maks/`
- SendPulse free tier: 12K emails/month
- The code is fully implemented — this is purely a configuration/credentials task

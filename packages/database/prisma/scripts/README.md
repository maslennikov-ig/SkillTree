# Database Maintenance Scripts

This directory contains utility scripts for database maintenance and compliance operations.

## check-retention.ts

**Purpose**: Implements FR-038 (3-Year Data Retention Policy) by identifying users whose retention period has expired.

**Requirements**:
- DATABASE_URL environment variable must be set (or loaded from .env)
- Prisma client must be generated (`pnpm db:generate`)

**Usage**:

```bash
# Standard human-readable report
pnpm db:check-retention

# Dry-run mode (informational only, no action taken)
pnpm db:check-retention --dry-run

# JSON output for machine processing
pnpm db:check-retention --json

# Combine flags
pnpm db:check-retention --dry-run --json
```

**Output Formats**:

**Standard Output**:
```
=== Data Retention Check Report ===
Timestamp: 2025-12-29T10:00:00.000Z
Mode: DRY-RUN

Expired Users: 5
Oldest Expiration: 2025-01-15
Newest Expiration: 2025-12-28

User IDs:
- clxyz123... (expired: 2025-01-15, days overdue: 348)
- clxyz456... (expired: 2025-03-20, days overdue: 284)

Action Required: Run anonymize-users.ts to process these users
```

**JSON Output**:
```json
{
  "status": "success",
  "timestamp": "2025-12-29T10:00:00.000Z",
  "summary": {
    "totalExpired": 5,
    "oldestExpiration": "2025-01-15T00:00:00.000Z",
    "newestExpiration": "2025-12-28T00:00:00.000Z"
  },
  "expiredUsers": [
    {
      "userId": "clxyz123...",
      "telegramId": "123456789",
      "retentionExpiresAt": "2025-01-15T00:00:00.000Z",
      "createdAt": "2022-01-15T00:00:00.000Z",
      "daysExpired": 348
    }
  ]
}
```

**What It Checks**:
- Queries `User` table for records where `retentionExpiresAt` is NOT NULL AND `retentionExpiresAt < NOW()`
- Reports total count, date range, and detailed user information
- Provides actionable guidance for next steps

**Next Steps**:
After running this script and identifying expired users, run `anonymize-users.ts` to process the expiration by anonymizing user data according to GDPR/data retention requirements.

---

## anonymize-users.ts

**Purpose**: Anonymizes user data for users with expired retention periods.

**Status**: To be implemented (T131)

**Usage**:
```bash
pnpm db:anonymize
```

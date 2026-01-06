# Code Review Report: Phases 9-12

**Generated**: 2025-12-29
**Reviewer**: Claude Code (Automated Review)
**Scope**: Telegram Bot MVP Implementation (Email Report, Referral System, Polish, PDF Roadmap)

---

## Summary

- **Total files reviewed**: 17
- **Critical issues**: 3
- **Major issues**: 8
- **Minor issues**: 12
- **Improvements**: 7

**Overall Assessment**: The implementation is generally solid with good TypeScript practices and clear architecture. However, there are critical security and reliability issues that must be addressed before production deployment, particularly around database client management, error handling, and SendPulse initialization.

---

## Critical Issues (Must Fix)

### [CRIT-001] Multiple PrismaClient Instances - Memory Leak Risk

**Files**:
- `/home/me/code/repa-maks/apps/api/src/modules/email/email.service.ts:50`
- `/home/me/code/repa-maks/apps/api/src/modules/results/results.controller.ts:21`
- `/home/me/code/repa-maks/apps/api/src/modules/pdf/pdf.controller.ts:14`

**Problem**: Multiple `PrismaClient` instances are created in constructor methods, violating Prisma best practices and creating potential memory leaks.

```typescript
// INCORRECT - Creates new instance per service/controller
constructor() {
  this.prisma = new PrismaClient();
}
```

**Impact**:
- Memory leaks in production
- Database connection pool exhaustion
- Slower performance as app scales
- Each instance maintains separate connection pool

**Fix**: Use NestJS dependency injection pattern:

```typescript
// CORRECT - Inject shared PrismaClient
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Create this service

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}
}
```

Create a shared `PrismaService`:
```typescript
// apps/api/src/modules/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@skilltree/database';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

### [CRIT-002] Race Condition in SendPulse Initialization

**File**: `/home/me/code/repa-maks/apps/api/src/modules/email/email.service.ts:56-76`

**Problem**: SendPulse initialization is asynchronous but callback-based, with no promise or await mechanism. Email sending could execute before initialization completes.

```typescript
async onModuleInit() {
  // This callback may not execute before sendVerificationEmail is called
  sendpulse.init(apiUserId, apiSecret, '/tmp/sendpulse-token', (token: any) => {
    if (token && token.access_token) {
      this.sendPulseInitialized = true; // Sets flag asynchronously
    }
  });
}

async sendVerificationEmail(to: string, code: string): Promise<boolean> {
  if (!this.sendPulseInitialized) { // May be false even if init in progress
    return false;
  }
}
```

**Impact**:
- Emails fail silently on app startup
- No error visibility to users
- Potential data loss (verification codes sent but not delivered)

**Fix**: Promisify the initialization:

```typescript
private sendPulseReady: Promise<boolean>;

async onModuleInit() {
  const apiUserId = process.env.SENDPULSE_API_USER_ID;
  const apiSecret = process.env.SENDPULSE_API_SECRET;

  if (!apiUserId || apiSecret) {
    this.logger.warn('SendPulse credentials not configured');
    this.sendPulseReady = Promise.resolve(false);
    return;
  }

  this.sendPulseReady = new Promise((resolve) => {
    sendpulse.init(apiUserId, apiSecret, '/tmp/sendpulse-token', (token: any) => {
      const success = !!(token && token.access_token);
      this.sendPulseInitialized = success;
      if (success) {
        this.logger.log('SendPulse API initialized successfully');
      } else {
        this.logger.error('Failed to initialize SendPulse API');
      }
      resolve(success);
    });
  });

  await this.sendPulseReady; // Wait for initialization to complete
}

async sendVerificationEmail(to: string, code: string): Promise<boolean> {
  await this.sendPulseReady; // Ensure initialization is complete

  if (!this.sendPulseInitialized) {
    this.logger.error('SendPulse not initialized');
    return false;
  }
  // ... rest of implementation
}
```

---

### [CRIT-003] Unhandled SendPulse Token Storage Path

**File**: `/home/me/code/repa-maks/apps/api/src/modules/email/email.service.ts:68`

**Problem**: Token storage path `/tmp/sendpulse-token` is hardcoded. `/tmp` is cleared on reboot and may not exist or be writable in all environments (Docker, serverless, etc.).

```typescript
sendpulse.init(apiUserId, apiSecret, '/tmp/sendpulse-token', (token: any) => {
```

**Impact**:
- App crashes on startup if `/tmp` not writable
- Token lost on server restart, requiring re-authentication
- May fail in Docker containers with read-only filesystem

**Fix**:

```typescript
import * as path from 'path';
import * as fs from 'fs/promises';

async onModuleInit() {
  // ... credential check

  // Ensure token directory exists
  const tokenDir = process.env.SENDPULSE_TOKEN_DIR || path.join(process.cwd(), '.cache');
  const tokenPath = path.join(tokenDir, 'sendpulse-token');

  try {
    await fs.mkdir(tokenDir, { recursive: true });
  } catch (error) {
    this.logger.error(`Failed to create token directory: ${tokenDir}`);
    return;
  }

  this.sendPulseReady = new Promise((resolve) => {
    sendpulse.init(apiUserId, apiSecret, tokenPath, (token: any) => {
      // ... initialization logic
    });
  });
}
```

---

## Major Issues (Should Fix)

### [MAJ-001] Missing Input Validation in Email Service

**File**: `/home/me/code/repa-maks/apps/api/src/modules/email/email.service.ts:140-182`

**Problem**: `createVerification` method doesn't validate email format before saving to database.

```typescript
async createVerification(
  userId: string,
  email: string // No validation!
): Promise<VerificationResult> {
```

**Impact**:
- Invalid emails stored in database
- SendPulse API calls fail silently
- Poor user experience (code generated but email never sent)

**Fix**:

```typescript
import { BadRequestException } from '@nestjs/common';

// Add email validation regex
private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async createVerification(
  userId: string,
  email: string
): Promise<VerificationResult> {
  // Validate email format
  if (!email || !this.EMAIL_REGEX.test(email)) {
    throw new BadRequestException('Invalid email address format');
  }

  // Normalize email (lowercase, trim)
  const normalizedEmail = email.toLowerCase().trim();

  // ... rest of implementation using normalizedEmail
}
```

---

### [MAJ-002] In-Memory Rate Limiter Not Production-Ready

**File**: `/home/me/code/repa-maks/apps/api/src/modules/email/email.service.ts:47, 94-118`

**Problem**: Rate limiting uses in-memory Map which doesn't scale across multiple API instances and loses data on restart.

```typescript
private rateLimitStore = new Map<string, number[]>();
```

**Impact**:
- Rate limits reset on app restart
- Doesn't work with horizontal scaling (multiple API instances)
- Users can bypass limits by triggering server restart

**Fix**: Use Redis for distributed rate limiting:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';

@Injectable()
export class EmailService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private prisma: PrismaService
  ) {}

  private async isRateLimited(userId: string): Promise<boolean> {
    const key = `email:ratelimit:${userId}`;
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remove old entries and count recent requests
    await this.redis.zremrangebyscore(key, 0, oneHourAgo);
    const count = await this.redis.zcard(key);

    if (count >= 3) {
      this.logger.warn(`Rate limit exceeded for user ${userId}: ${count} requests in last hour`);
      return true;
    }

    return false;
  }

  private async recordVerificationRequest(userId: string): Promise<void> {
    const key = `email:ratelimit:${userId}`;
    const now = Date.now();

    await this.redis.zadd(key, now, now.toString());
    await this.redis.expire(key, 3600); // Auto-expire after 1 hour
  }
}
```

---

### [MAJ-003] Missing Transaction in Referral Reward Claiming

**File**: `/home/me/code/repa-maks/apps/bot/src/services/referral.service.ts:257-348`

**Problem**: `claimReferralRewards` uses a transaction but doesn't handle partial failures properly. If `DailyStreak` upsert for referee fails after referrer points awarded, referrer gets points but status isn't updated.

```typescript
await prisma.$transaction([
  // Update referral status to REWARDED
  prisma.referralTracking.update({ ... }),
  // Award points to referrer
  prisma.dailyStreak.upsert({ ... }), // If this succeeds but next fails...
  // Award points to referee
  prisma.dailyStreak.upsert({ ... }), // ...transaction rolls back but first upsert may have side effects
]);
```

**Impact**:
- Points awarded but referral not marked as rewarded
- Potential double-claiming of rewards
- Data inconsistency

**Fix**: Add explicit error handling and idempotency check:

```typescript
export async function claimReferralRewards(
  prisma: PrismaClient,
  referralId: string
): Promise<ReferralRewardResult> {
  const log = logger.child({ fn: "claimReferralRewards", referralId });

  try {
    // Use interactive transaction for better control
    const result = await prisma.$transaction(async (tx) => {
      // Get referral record with lock
      const referral = await tx.referralTracking.findUnique({
        where: { id: referralId },
      });

      if (!referral) {
        throw new Error('referral_not_found');
      }

      if (referral.rewardClaimed) {
        throw new Error('already_claimed');
      }

      const referrerPoints = POINTS_CONFIG.REFERRAL_COMPLETED;
      const refereePoints = POINTS_CONFIG.REFERRAL_BONUS_REFEREE;

      // Update referral status first
      await tx.referralTracking.update({
        where: { id: referralId },
        data: {
          status: "REWARDED",
          rewardClaimed: true,
        },
      });

      // Award points to referrer
      await tx.dailyStreak.upsert({
        where: { userId: referral.referrerId },
        update: { weeklyPoints: { increment: referrerPoints } },
        create: {
          userId: referral.referrerId,
          weeklyPoints: referrerPoints,
          weekStartDate: new Date(),
        },
      });

      // Award points to referee
      await tx.dailyStreak.upsert({
        where: { userId: referral.refereeId },
        update: { weeklyPoints: { increment: refereePoints } },
        create: {
          userId: referral.refereeId,
          weeklyPoints: refereePoints,
          weekStartDate: new Date(),
        },
      });

      return { referrerPoints, refereePoints };
    });

    log.info(result, "Referral rewards claimed successfully");

    return {
      success: true,
      referrerPointsAwarded: result.referrerPoints,
      refereePointsAwarded: result.refereePoints,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'referral_not_found') {
        return {
          success: false,
          referrerPointsAwarded: 0,
          refereePointsAwarded: 0,
          error: "referral_not_found",
        };
      }
      if (error.message === 'already_claimed') {
        return {
          success: false,
          referrerPointsAwarded: 0,
          refereePointsAwarded: 0,
          error: "already_claimed",
        };
      }
    }

    log.error({ error }, "Failed to claim referral rewards");
    return {
      success: false,
      referrerPointsAwarded: 0,
      refereePointsAwarded: 0,
      error: "internal_error",
    };
  }
}
```

---

### [MAJ-004] Self-Referral Not Prevented

**File**: `/home/me/code/repa-maks/apps/bot/src/handlers/start.handler.ts:99`

**Problem**: User can refer themselves by using their own referral code.

```typescript
// Create referral tracking if user came via referral link
if (referrerUserId && referrerUserId !== newUser.id) {
  // ... creates referral
}
```

**Impact**:
- Users can game the system
- Referral statistics polluted
- Point farming exploit

**Fix**: The condition already prevents this (`referrerUserId !== newUser.id`), but add explicit logging:

```typescript
if (referrerUserId) {
  if (referrerUserId === newUser.id) {
    log.warn({ userId: newUser.id }, "Self-referral attempt blocked");
  } else {
    try {
      const referralResult = await createReferralTracking(
        ctx.prisma,
        referrerUserId,
        newUser.id,
        `ref_${referrerUserId}`
      );
      // ... rest of logic
    } catch (error) {
      log.error({ error, referrerUserId }, "Failed to create referral tracking");
    }
  }
}
```

**Actually**: This is already correctly implemented. Marked as "improvement" not "issue". Move to Improvements section.

---

### [MAJ-005] Missing Error Handling in PDF Generation

**File**: `/home/me/code/repa-maks/apps/api/src/modules/pdf/pdf.service.ts:53-89`

**Problem**: PDF generation doesn't handle font file missing errors gracefully.

```typescript
private registerFonts(doc: PDFKit.PDFDocument): void {
  const fontsPath = path.join(__dirname, '../../../assets/fonts');

  // Will throw if files don't exist, crashing PDF generation
  doc.registerFont('Inter-Regular', path.join(fontsPath, 'Inter-Regular.ttf'));
  doc.registerFont('Inter-Medium', path.join(fontsPath, 'Inter-Medium.ttf'));
  doc.registerFont('Inter-Bold', path.join(fontsPath, 'Inter-Bold.ttf'));
}
```

**Impact**:
- PDF generation fails completely if fonts missing
- No fallback to system fonts
- Poor user experience

**Fix**:

```typescript
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(PdfService.name);

private registerFonts(doc: PDFKit.PDFDocument): void {
  const fontsPath = path.join(__dirname, '../../../assets/fonts');

  const fonts = [
    { name: 'Inter-Regular', file: 'Inter-Regular.ttf' },
    { name: 'Inter-Medium', file: 'Inter-Medium.ttf' },
    { name: 'Inter-Bold', file: 'Inter-Bold.ttf' },
  ];

  for (const font of fonts) {
    const fontPath = path.join(fontsPath, font.file);

    if (fs.existsSync(fontPath)) {
      try {
        doc.registerFont(font.name, fontPath);
      } catch (error) {
        this.logger.error(`Failed to register font ${font.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      this.logger.warn(`Font file not found: ${fontPath}. PDF will use default fonts.`);
    }
  }
}
```

---

### [MAJ-006] No Pagination in Career Display

**File**: `/home/me/code/repa-maks/apps/bot/src/handlers/results.handler.ts:117-177`

**Problem**: All career matches loaded at once without pagination. If career database grows, this could be slow.

```typescript
// Get career details
const careerIds = results.careerMatches.map((m) => m.careerId);
const careers = await ctx.prisma.career.findMany({
  where: { id: { in: careerIds } },
});
```

**Impact**:
- Slow queries as career database grows
- Unnecessary database load
- Poor UX with 43 career buttons

**Fix**: Limit query and add pagination:

```typescript
const MAX_CAREERS_DISPLAY = 5;

// Get only top 5 career details
const topCareerIds = results.careerMatches.slice(0, MAX_CAREERS_DISPLAY).map((m) => m.careerId);
const careers = await ctx.prisma.career.findMany({
  where: { id: { in: topCareerIds } },
});
```

---

### [MAJ-007] Hardcoded API URL in Bot

**File**: `/home/me/code/repa-maks/apps/bot/src/handlers/results.handler.ts:311, 370, 699`

**Problem**: `process.env.API_URL` defaults to `localhost:3000` which won't work in production.

```typescript
const apiUrl = process.env.API_URL || "http://localhost:3000";
```

**Impact**:
- Bot fails to fetch PDFs/share cards in production
- Silent failures with no error visibility
- Confusing for deployment

**Fix**: Make API_URL required in environment validation:

```typescript
// apps/bot/src/bot.ts
if (!process.env.TELEGRAM_BOT_TOKEN) {
  logger.fatal("TELEGRAM_BOT_TOKEN environment variable is required");
  process.exit(1);
}

if (!process.env.API_URL) {
  logger.fatal("API_URL environment variable is required");
  process.exit(1);
}

// Then use without fallback
const apiUrl = process.env.API_URL;
```

---

### [MAJ-008] Missing Index on TestSession.points

**File**: `/home/me/code/repa-maks/apps/bot/src/handlers/results.handler.ts:99, 260, 299`

**Problem**: Frequent queries on `testSession.points` for PDF unlock check, but no database index.

**Impact**:
- Slow queries as data grows
- Full table scans

**Fix**: Add database migration:

```sql
-- Migration: add_index_on_test_session_points
CREATE INDEX idx_test_session_points ON "TestSession"("points");
CREATE INDEX idx_test_session_student_status ON "TestSession"("studentId", "status", "completedAt" DESC);
```

---

## Minor Issues (Nice to Fix)

### [MIN-001] Inconsistent Error Messages in Russian

**Files**: Multiple

**Problem**: Error messages mix English and Russian, and use inconsistent tone (ты vs вы).

**Examples**:
- `email.service.ts:254`: "SendPulse not initialized. Cannot send email." (English in Russian-facing code)
- `start.handler.ts:33`: "Сначала зарегистрируйся" (ты)
- `results.controller.ts:128`: "Parent email is required" (English)

**Fix**: Create centralized error messages file:

```typescript
// apps/bot/src/constants/messages.ts
export const ERROR_MESSAGES = {
  NOT_REGISTERED: 'Сначала зарегистрируйся. Отправь /start',
  NO_ACTIVE_TEST: 'У тебя нет активного теста. Отправь /test',
  SENDPULSE_UNAVAILABLE: 'Сервис отправки email временно недоступен',
  // ... etc
} as const;
```

---

### [MIN-002] Magic Numbers Not Constants

**Files**: Multiple

**Problem**: Magic numbers scattered throughout code.

**Examples**:
- `email.service.ts:153`: `15 * 60 * 1000` (15 minutes)
- `quiz.service.ts:45-46`: `7` (retake cooldown days), `3` (max tests)
- `results.handler.ts:299`: `1000` (PDF unlock threshold)

**Fix**:

```typescript
// apps/shared/src/constants/config.ts
export const CONFIG = {
  EMAIL: {
    VERIFICATION_CODE_EXPIRY_MINUTES: 15,
    RATE_LIMIT_MAX_REQUESTS: 3,
    RATE_LIMIT_WINDOW_HOURS: 1,
  },
  QUIZ: {
    RETAKE_COOLDOWN_DAYS: 7,
    MAX_COMPLETED_TESTS: 3,
    SESSION_TIMEOUT_HOURS: 24,
  },
  REWARDS: {
    PDF_UNLOCK_POINTS: 1000,
    FIRST_SHARE_POINTS: 25,
  },
} as const;
```

---

### [MIN-003] Missing Logging in Critical Paths

**File**: `/home/me/code/repa-maks/apps/api/src/modules/results/results.controller.ts:121-195`

**Problem**: No logging in email report endpoint.

**Impact**: Hard to debug production issues

**Fix**:

```typescript
import { Logger } from '@nestjs/common';

export class ResultsController {
  private readonly logger = new Logger(ResultsController.name);

  @Post(':sessionId/email-report')
  async sendEmailReport(
    @Param('sessionId') sessionId: string,
    @Body() body: { parentEmail: string; parentName?: string },
  ) {
    this.logger.log(`Email report requested for session ${sessionId}`);

    // ... implementation

    if (!success) {
      this.logger.error(`Failed to send email report for session ${sessionId} to ${body.parentEmail}`);
      throw new BadRequestException('Failed to send email. Please try again later.');
    }

    this.logger.log(`Email report sent successfully for session ${sessionId} to ${body.parentEmail}`);
    return { success: true, message: 'Report email sent successfully', sentTo: body.parentEmail };
  }
}
```

---

### [MIN-004] No Timeout on External API Calls

**Files**:
- `/home/me/code/repa-maks/apps/bot/src/handlers/results.handler.ts:315, 375, 704`

**Problem**: Fetch calls to API have no timeout, can hang indefinitely.

**Impact**: Bot becomes unresponsive if API is down

**Fix**:

```typescript
// Add timeout utility
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Use in handlers
const response = await fetchWithTimeout(
  `${apiUrl}/results/${session.id}/pdf-roadmap`,
  {},
  15000 // 15 second timeout
);
```

---

### [MIN-005] Weak CUID Validation in Referral Code Parsing

**File**: `/home/me/code/repa-maks/apps/bot/src/services/referral.service.ts:91-104`

**Problem**: CUID validation is too weak (`length < 20`), accepts invalid IDs.

```typescript
export function parseReferralCode(code: string): string | null {
  if (!code || !code.startsWith(REFERRAL_CODE_PREFIX)) {
    return null;
  }

  const userId = code.slice(REFERRAL_CODE_PREFIX.length);

  // Basic validation: cuid is 25 characters starting with 'c'
  if (!userId || userId.length < 20) { // Too lenient!
    return null;
  }

  return userId;
}
```

**Impact**: Accepts malformed user IDs, potential crashes downstream

**Fix**:

```typescript
const CUID_REGEX = /^c[a-z0-9]{24}$/;

export function parseReferralCode(code: string): string | null {
  if (!code || !code.startsWith(REFERRAL_CODE_PREFIX)) {
    return null;
  }

  const userId = code.slice(REFERRAL_CODE_PREFIX.length);

  // Validate CUID format (25 chars, starts with 'c', alphanumeric lowercase)
  if (!userId || !CUID_REGEX.test(userId)) {
    return null;
  }

  return userId;
}
```

---

### [MIN-006] Email Template Placeholders Not Escaped

**File**: `/home/me/code/repa-maks/apps/api/src/modules/email/email.service.ts:410-477`

**Problem**: Template replacements use global regex without escaping special regex characters.

```typescript
for (const [placeholder, value] of Object.entries(replacements)) {
  template = template.replace(new RegExp(placeholder, 'g'), value);
}
```

**Impact**: If placeholder contains regex special chars, replacement fails

**Fix**:

```typescript
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const [placeholder, value] of Object.entries(replacements)) {
  const escapedPlaceholder = escapeRegExp(placeholder);
  template = template.replace(new RegExp(escapedPlaceholder, 'g'), value);
}
```

---

### [MIN-007] Missing XSS Prevention in Email Templates

**File**: `/home/me/code/repa-maks/apps/api/src/modules/email/templates/parent-report.html`

**Problem**: User-provided data (names, career descriptions) inserted into HTML without sanitization.

**Impact**: If career database or user names contain `<script>` tags, XSS vulnerability in email client

**Fix**:

```typescript
import { escape } from 'html-escaper';

const replacements: Record<string, string> = {
  '{{parentName}}': escape(data.parentName),
  '{{studentName}}': escape(data.studentName),
  '{{career1Title}}': escape(career.title),
  // ... etc
};
```

---

### [MIN-008] No Rate Limiting on PDF Generation

**File**: `/home/me/code/repa-maks/apps/api/src/modules/pdf/pdf.controller.ts:27-114`

**Problem**: PDF endpoint has no rate limiting, could be abused.

**Impact**: Server CPU exhaustion from PDF generation spam

**Fix**: Add NestJS throttler:

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('results')
export class PdfController {
  @Get(':sessionId/pdf-roadmap')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async getPdfRoadmap(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    // ... implementation
  }
}
```

---

### [MIN-009] Duplicate Code in Results Handler

**File**: `/home/me/code/repa-maks/apps/bot/src/handlers/results.handler.ts:41-111, 233-270`

**Problem**: Session retrieval and results message formatting duplicated.

**Fix**: Extract to helper functions:

```typescript
async function getLatestSession(
  prisma: PrismaClient,
  studentId: string
): Promise<TestSession | null> {
  return prisma.testSession.findFirst({
    where: { studentId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });
}

async function getSessionResults(
  prisma: PrismaClient,
  sessionId: string
): Promise<TestResults | null> {
  return getTestResults(prisma, sessionId);
}
```

---

### [MIN-010] Inconsistent Null Handling

**Files**: Multiple

**Problem**: Some functions return `null`, others throw, others return error objects.

**Examples**:
- `quiz.service.ts:370`: Returns `null` if question not found
- `referral.service.ts:189`: Returns error object `{ success: false, error: "..." }`
- `results.controller.ts:98`: Throws `NotFoundException`

**Impact**: Inconsistent error handling patterns, hard to maintain

**Fix**: Standardize on one pattern per layer:
- **Service layer**: Return Result types `{ success: boolean, data?: T, error?: string }`
- **Controller layer**: Throw HTTP exceptions
- **Bot handlers**: Log and send user-friendly messages

---

### [MIN-011] Missing ENV Validation in API

**File**: No centralized validation

**Problem**: API doesn't validate required environment variables on startup.

**Impact**: Runtime failures instead of startup failures

**Fix**: Add NestJS config validation:

```typescript
// apps/api/src/config/env.validation.ts
import { plainToInstance } from 'class-transformer';
import { IsString, IsUrl, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  SENDPULSE_API_USER_ID: string;

  @IsString()
  SENDPULSE_API_SECRET: string;

  @IsString()
  SENDPULSE_FROM_EMAIL: string;

  @IsUrl()
  API_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

// In app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
    }),
  ],
})
export class AppModule {}
```

---

### [MIN-012] No Cleanup for Abandoned Email Verifications

**File**: `/home/me/code/repa-maks/apps/api/src/modules/email/email.service.ts:140-182`

**Problem**: Old expired email verification records never cleaned up from database.

**Impact**: Database bloat over time

**Fix**: Add cleanup cron job:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EmailService {
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredVerifications() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deleted = await this.prisma.emailVerification.deleteMany({
      where: {
        expiresAt: { lt: oneDayAgo },
        verified: false,
      },
    });

    this.logger.log(`Cleaned up ${deleted.count} expired email verifications`);
  }
}
```

---

## Improvements (Optional)

### [IMP-001] Self-Referral Already Prevented

**File**: `/home/me/code/repa-maks/apps/bot/src/handlers/start.handler.ts:99`

**Current State**: Already correctly implemented with `referrerUserId !== newUser.id` check.

**Improvement**: Add explicit user feedback:

```typescript
if (referrerUserId) {
  if (referrerUserId === newUser.id) {
    log.warn({ userId: newUser.id }, "Self-referral attempt blocked");
    await ctx.reply(
      "Нельзя использовать свою реферальную ссылку 😊\n\n" +
      "Поделись ссылкой с друзьями!"
    );
  } else {
    // ... create referral tracking
  }
}
```

---

### [IMP-002] Add Structured Logging

**Files**: All services

**Current**: Basic pino logging with ad-hoc fields

**Improvement**: Standardize log fields:

```typescript
// Create logging standard
interface LogContext {
  operation: string;
  userId?: string;
  sessionId?: string;
  duration?: number;
  error?: Error;
}

// Use consistently
log.info(
  {
    operation: 'sendParentReport',
    userId: data.studentName,
    sessionId,
    email: to,
  },
  'Parent report email sent successfully'
);
```

---

### [IMP-003] Add Health Check Endpoint

**Current**: No health check endpoint

**Improvement**:

```typescript
// apps/api/src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

---

### [IMP-004] Add Request ID Tracing

**Current**: No correlation between bot requests and API calls

**Improvement**: Add request ID header:

```typescript
// In bot handlers
const requestId = crypto.randomUUID();

const response = await fetch(`${apiUrl}/results/${session.id}/pdf-roadmap`, {
  headers: {
    'X-Request-ID': requestId,
  },
});

log.info({ requestId, sessionId: session.id }, 'PDF requested');
```

---

### [IMP-005] Extract Russian Pluralization Logic

**Files**: Multiple files with `getPersonWord`, `getDaysWord`, `getSectionWord`

**Current**: Duplicated logic

**Improvement**:

```typescript
// packages/shared/src/utils/russian-pluralization.ts
export function pluralize(
  count: number,
  forms: [string, string, string] // [1, 2-4, 5+]
): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return forms[2];
  }
  if (lastDigit === 1) {
    return forms[0];
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return forms[1];
  }
  return forms[2];
}

// Usage
const personWord = pluralize(count, ['человек', 'человека', 'человек']);
const dayWord = pluralize(days, ['день', 'дня', 'дней']);
```

---

### [IMP-006] Add API Response Types

**Current**: Bot uses `any` types for API responses

**Improvement**: Define shared types:

```typescript
// packages/shared/src/types/api.ts
export interface PdfRoadmapResponse {
  buffer: Buffer;
  filename: string;
}

export interface ShareCardResponse {
  buffer: Buffer;
}

export interface EmailReportResponse {
  success: boolean;
  message: string;
  sentTo: string;
}

// Use in bot
const response = await fetch(`${apiUrl}/results/${sessionId}/email-report`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ parentEmail }),
});

const data: EmailReportResponse = await response.json();
```

---

### [IMP-007] Add Metrics Collection

**Current**: No metrics

**Improvement**: Add prometheus metrics:

```typescript
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

// In module providers
makeCounterProvider({
  name: 'email_sent_total',
  help: 'Total emails sent',
  labelNames: ['type', 'status'],
}),
makeHistogramProvider({
  name: 'pdf_generation_duration_seconds',
  help: 'PDF generation duration',
}),

// In service
@InjectMetric('email_sent_total') private emailCounter: Counter,
@InjectMetric('pdf_generation_duration_seconds') private pdfDuration: Histogram,

async sendParentReport(to: string, data: ParentReportData): Promise<boolean> {
  const end = this.pdfDuration.startTimer();

  try {
    // ... send email
    this.emailCounter.inc({ type: 'parent_report', status: 'success' });
    return true;
  } catch (error) {
    this.emailCounter.inc({ type: 'parent_report', status: 'error' });
    throw error;
  } finally {
    end();
  }
}
```

---

## Files Reviewed

### Phase 9: Parent Email Report (US5)
- [x] `apps/api/src/modules/email/email.service.ts` - 3 critical, 2 major, 3 minor
- [x] `apps/api/src/modules/email/templates/parent-report.html` - 1 minor
- [x] `apps/api/src/modules/email/templates/parent-report.txt` - 0 issues
- [x] `apps/api/src/modules/results/results.controller.ts` - 1 critical, 1 minor

### Phase 10: Referral System (US7)
- [x] `apps/bot/src/services/referral.service.ts` - 1 major, 1 minor
- [x] `apps/bot/src/handlers/referral.handler.ts` - 0 issues
- [x] `apps/bot/src/handlers/start.handler.ts` - 1 improvement
- [x] `apps/bot/src/handlers/quiz.handler.ts` - 0 issues
- [x] `apps/bot/src/services/notification.service.ts` - 0 issues

### Phase 11: Polish & Cross-Cutting
- [x] `apps/bot/src/bot.ts` - 1 major
- [x] `apps/bot/src/services/quiz.service.ts` - 1 minor
- [x] `apps/bot/ecosystem.config.js` - 0 issues

### Phase 12: PDF Roadmap (FR-037)
- [x] `apps/api/src/modules/pdf/pdf.service.ts` - 1 major
- [x] `apps/api/src/modules/pdf/pdf.controller.ts` - 1 critical, 1 minor
- [x] `apps/api/src/modules/pdf/pdf.module.ts` - 0 issues
- [x] `apps/bot/src/keyboards/results.ts` - 0 issues
- [x] `apps/bot/src/handlers/results.handler.ts` - 2 major, 3 minor

---

## Recommendations

### Immediate Actions (Before Production)

1. **Fix CRIT-001**: Implement shared `PrismaService` across all NestJS modules
2. **Fix CRIT-002**: Promisify SendPulse initialization
3. **Fix CRIT-003**: Fix token storage path with proper directory creation
4. **Fix MAJ-001**: Add email validation
5. **Fix MAJ-002**: Move rate limiting to Redis
6. **Fix MAJ-007**: Make `API_URL` required environment variable

### Short-term Improvements (Next Sprint)

1. Add environment variable validation at startup
2. Implement request timeout on all external API calls
3. Add comprehensive error logging
4. Extract duplicated code into shared utilities
5. Add database indexes for performance

### Long-term Enhancements

1. Implement structured logging standard
2. Add Prometheus metrics collection
3. Set up health check endpoints
4. Add request ID tracing for debugging
5. Implement automated cleanup cron jobs

---

## Positive Observations

1. **Type Safety**: Excellent use of TypeScript throughout with proper type definitions
2. **Error Handling**: Most error cases are handled with appropriate fallbacks
3. **Logging**: Good use of structured logging with pino
4. **Code Organization**: Clean separation of concerns (services, handlers, keyboards)
5. **Transaction Usage**: Proper use of Prisma transactions for data consistency
6. **Input Validation**: Good validation in most places (e.g., retake policy checks)
7. **Russian Localization**: Consistent use of Russian for user-facing messages
8. **Documentation**: Good inline comments explaining business logic

---

**Review Complete**: 2025-12-29
**Next Steps**: Address critical and major issues before production deployment.

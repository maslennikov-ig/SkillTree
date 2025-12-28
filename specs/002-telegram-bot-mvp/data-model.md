# Data Model: SkillTree Telegram Bot MVP

**Feature**: `002-telegram-bot-mvp` | **Date**: 2025-12-28 | **Status**: Phase 1 Complete

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER DOMAIN                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐       1:1      ┌───────────┐       1:N     ┌──────────────┐ │
│   │   User   │───────────────▶│  Student  │──────────────▶│ TestSession  │ │
│   └──────────┘                └───────────┘               └──────────────┘ │
│        │                            │                            │          │
│        │ 1:1                        │                            │ 1:N      │
│        ▼                            │                            ▼          │
│   ┌──────────┐                      │ M:N              ┌─────────────────┐ │
│   │  Parent  │◀─────────────────────┘                  │     Answer      │ │
│   └──────────┘      ParentStudent                      └─────────────────┘ │
│        │                                                         │          │
│        │ 1:N                                                     │ N:1      │
│        ▼                                                         ▼          │
│   ┌─────────────────┐                                    ┌──────────────┐  │
│   │EmailVerification│                                    │   Question   │  │
│   └─────────────────┘                                    └──────────────┘  │
│                                                                  │          │
│                                                                  │ 1:N      │
│                                                                  ▼          │
│                                                         ┌────────────────┐ │
│                                                         │QuestionOption  │ │
│                                                         └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           GAMIFICATION DOMAIN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐       1:1      ┌─────────────┐                               │
│   │   User   │───────────────▶│ DailyStreak │                               │
│   └──────────┘                └─────────────┘                               │
│        │                                                                     │
│        │ 1:N                  ┌─────────────────────┐                       │
│        └─────────────────────▶│    Achievement      │                       │
│        │                      └─────────────────────┘                       │
│        │ 1:N (referrer)                                                     │
│        │ 1:N (referee)        ┌─────────────────────┐                       │
│        └─────────────────────▶│ ReferralTracking    │                       │
│                               └─────────────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            RESULTS DOMAIN                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐     1:1     ┌──────────────┐                             │
│   │ TestSession  │────────────▶│  TestResult  │                             │
│   └──────────────┘             └──────────────┘                             │
│                                       │                                      │
│                                       │ references                           │
│                                       ▼                                      │
│                                ┌──────────────┐                             │
│                                │    Career    │                             │
│                                └──────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          PARENT LINKING DOMAIN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────┐     1:1      ┌────────────────┐                             │
│   │  Student  │─────────────▶│ ParentLinkCode │                             │
│   └───────────┘              └────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Definitions

### User (existing, no changes)

Base entity linking Telegram identity to application profiles.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Internal identifier |
| telegramId | BigInt | UNIQUE, NOT NULL | Telegram user ID |
| telegramUsername | String | NULL | @username if set |
| firstName | String | NULL | Telegram first name |
| lastName | String | NULL | Telegram last name |
| createdAt | DateTime | NOT NULL | Account creation |
| updatedAt | DateTime | NOT NULL | Last update |

**Relations**: Student (1:1), Parent (1:1), DailyStreak (1:1), Achievement (1:N), ReferralTracking (1:N as referrer/referee)

---

### Student (existing, no changes)

Student profile with age/grade data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Internal identifier |
| userId | String | FK→User, UNIQUE | Link to User |
| age | Int | NOT NULL, 14-18 | Student age |
| grade | Int | NOT NULL, 8-11 | School grade |
| phone | String | NULL | Optional phone |
| createdAt | DateTime | NOT NULL | Profile creation |
| updatedAt | DateTime | NOT NULL | Last update |

**Relations**: User (N:1), TestSession (1:N), ParentStudent (M:N junction)

**Validation Rules**:
- age: 14 ≤ age ≤ 18
- grade: 8 ≤ grade ≤ 11

---

### Parent (existing, needs extension)

Parent profile with email verification.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Internal identifier |
| userId | String | FK→User, UNIQUE | Link to User |
| email | String | NULL | Parent email (encrypted at rest) |
| **emailVerified** | **Boolean** | **DEFAULT false** | **NEW: Email verification status** |
| phone | String | NULL | Optional phone |
| createdAt | DateTime | NOT NULL | Profile creation |
| updatedAt | DateTime | NOT NULL | Last update |

**Relations**: User (N:1), ParentStudent (1:N junction)

**Validation Rules**:
- email: Valid email format if provided
- email: Must be verified before sending reports

---

### TestSession (existing, needs extension)

Active or completed test session with FSM state.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Session identifier |
| studentId | String | FK→Student, NOT NULL | Owner student |
| status | SessionStatus | NOT NULL, DEFAULT IN_PROGRESS | Session state |
| **currentStep** | **Int** | **DEFAULT 0** | **NEW: FSM instruction pointer (0-54)** |
| **answeredJSON** | **Json** | **DEFAULT {}** | **NEW: Answers as {questionId: value}** |
| **reminderSentAt** | **DateTime** | **NULL** | **NEW: 12h reminder tracking** |
| startedAt | DateTime | NOT NULL | Session start |
| completedAt | DateTime | NULL | Completion time |
| points | Int | DEFAULT 0 | Points earned |
| badges | Json | DEFAULT [] | Badges earned |
| completionTimeMinutes | Int | NULL | Duration if completed |
| shareCount | Int | DEFAULT 0 | Times shared |
| createdAt | DateTime | NOT NULL | Record creation |
| updatedAt | DateTime | NOT NULL | Last answer/activity |

**Relations**: Student (N:1), Answer (1:N), TestResult (1:1)

**State Transitions**:
```
IN_PROGRESS → COMPLETED (all 55 questions answered)
IN_PROGRESS → ABANDONED (24h timeout OR manual cancel OR new session started)
```

**Validation Rules**:
- currentStep: 0 ≤ currentStep ≤ 55
- Only one IN_PROGRESS session per student at a time

---

### Question (existing, needs extension)

Question bank entry with RIASEC scoring.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Question identifier |
| text | String | NOT NULL | Question text (Russian) |
| category | String | NOT NULL | Legacy category field |
| questionType | QuestionType | NOT NULL | MC/RATING/BINARY/OPEN |
| difficulty | Int | DEFAULT 3, 1-3 | Difficulty level |
| sectionNumber | Int | NOT NULL, 1-5 | Section (1-5) |
| orderIndex | Int | NOT NULL, 1-55 | Global order |
| **primaryDimension** | **String** | **NOT NULL** | **NEW: R/I/A/S/E/C** |
| **riasecWeights** | **Json** | **NULL** | **NEW: {R:0, I:1, A:0.3...}** |
| **isEasterEgg** | **Boolean** | **DEFAULT false** | **NEW: Hidden achievement trigger** |
| **hint** | **String** | **NULL** | **NEW: Easter egg hint text** |
| createdAt | DateTime | NOT NULL | Record creation |
| updatedAt | DateTime | NOT NULL | Last update |

**Relations**: Answer (1:N), QuestionOption (1:N)

**Indexes**: category, orderIndex, sectionNumber

---

### QuestionOption (NEW)

Multiple choice options with RIASEC scoring.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Option identifier |
| questionId | String | FK→Question, NOT NULL | Parent question |
| text | String | NOT NULL | Option text with emoji |
| emoji | String | NULL | Leading emoji |
| value | String | NOT NULL | Answer value for storage |
| scores | Json | NOT NULL | RIASECScores object |
| order | Int | NOT NULL | Display order |

**Relations**: Question (N:1)

**Indexes**: questionId

**Example scores**:
```json
{"R": 1.0, "I": 0.2, "A": 0, "S": 0, "E": 0, "C": 0}
```

---

### Answer (existing, no changes)

Individual question response.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Answer identifier |
| sessionId | String | FK→TestSession, NOT NULL | Parent session |
| questionId | String | FK→Question, NOT NULL | Answered question |
| answerText | String | NOT NULL | Selected value or text |
| answeredAt | DateTime | NOT NULL | Answer timestamp |

**Relations**: TestSession (N:1), Question (N:1)

**Unique Constraint**: (sessionId, questionId) - one answer per question per session

---

### Career (NEW)

Career database with RIASEC profiles for matching.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Career identifier |
| title | String | NOT NULL | English title |
| titleRu | String | NOT NULL | Russian title |
| description | String | NOT NULL | Career description |
| riasecProfile | Json | NOT NULL | RIASECScores object |
| salaryMin | Int | NOT NULL | Minimum salary (RUB/month) |
| salaryMax | Int | NOT NULL | Maximum salary (RUB/month) |
| salarySource | String | NOT NULL | Data source (e.g., "hh.ru 2024") |
| category | String | NOT NULL | technology/creative/business/etc. |
| requiredSkills | String[] | NOT NULL | Skill list |
| educationPath | String[] | NOT NULL | Education recommendations |
| universities | String[] | NOT NULL | Recommended universities |
| outlook | CareerOutlook | NOT NULL | GROWING/STABLE/DECLINING |
| demandLevel | DemandLevel | NOT NULL | HIGH/MEDIUM/LOW |

**Indexes**: category

**Example riasecProfile**:
```json
{"R": 30, "I": 90, "A": 35, "S": 25, "E": 30, "C": 75}
```

---

### TestResult (NEW)

Calculated results for a completed session.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Result identifier |
| sessionId | String | FK→TestSession, UNIQUE | Completed session |
| riasecProfile | Json | NOT NULL | Calculated RIASECScores |
| topCareers | Json | NOT NULL | CareerMatch[] array |
| personalityType | String | NOT NULL | Archetype (e.g., "Технический аналитик") |
| hollandCode | String | NOT NULL | Top-3 code (e.g., "RIC") |
| radarChartUrl | String | NULL | Cached chart URL |
| shareCardUrl | String | NULL | Cached share card URL |
| createdAt | DateTime | NOT NULL | Result generation time |

**Relations**: TestSession (1:1)

**Example topCareers**:
```json
[
  {"careerId": "...", "correlation": 0.85, "matchPercentage": 93, "matchCategory": "Best Fit"},
  {"careerId": "...", "correlation": 0.72, "matchPercentage": 86, "matchCategory": "Great Fit"}
]
```

---

### EmailVerification (NEW)

4-digit email verification codes for parents.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Verification identifier |
| userId | String | NOT NULL | User requesting verification |
| email | String | NOT NULL | Email to verify |
| code | String | NOT NULL | 4-digit code |
| expiresAt | DateTime | NOT NULL | Expiry (15 minutes) |
| verified | Boolean | DEFAULT false | Verification status |
| createdAt | DateTime | NOT NULL | Request time |

**Indexes**: userId, code

**Validation Rules**:
- code: Exactly 4 digits
- expiresAt: createdAt + 15 minutes
- Max 3 verification attempts per hour per user

---

### ParentLinkCode (NEW)

6-character codes for parent-student linking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Code identifier |
| studentId | String | FK→Student, UNIQUE | Student generating code |
| code | String | UNIQUE, NOT NULL | 6-char alphanumeric |
| expiresAt | DateTime | NOT NULL | Expiry (24 hours) |
| createdAt | DateTime | NOT NULL | Generation time |

**Indexes**: code

**Validation Rules**:
- code: 6 uppercase alphanumeric characters
- expiresAt: createdAt + 24 hours
- One active code per student at a time

---

### DailyStreak (existing, no changes)

Weekly streak tracking for gamification.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Streak identifier |
| userId | String | FK→User, UNIQUE | User tracking |
| currentDay | Int | DEFAULT 0, 0-7 | Current week day (0=not started) |
| weeklyPoints | Int | DEFAULT 0 | Points this week |
| weekStartDate | DateTime | NOT NULL | Monday 00:00 Moscow time |
| lastCheckIn | DateTime | NULL | Last activity |
| longestStreak | Int | DEFAULT 0 | Best streak ever |
| totalCheckIns | Int | DEFAULT 0 | Total active days |
| createdAt | DateTime | NOT NULL | Record creation |
| updatedAt | DateTime | NOT NULL | Last update |

**Relations**: User (1:1)

**State Transitions**:
```
Daily check-in:
  currentDay++ (max 7)
  weeklyPoints += currentDay
  lastCheckIn = now()

Miss a day:
  currentDay = 1 (restart)

Weekly reset (Monday 00:00 MSK):
  currentDay = 0
  weeklyPoints = 0
  weekStartDate = this Monday
```

---

### Achievement (existing, no changes)

Earned badges/achievements.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Achievement identifier |
| userId | String | FK→User, NOT NULL | Earning user |
| badgeType | BadgeType | NOT NULL | Badge enum value |
| metadata | Json | NULL | Additional context |
| earnedAt | DateTime | NOT NULL | Award time |

**Relations**: User (N:1)

**Unique Constraint**: (userId, badgeType) - one badge per type per user

**BadgeType Enum**:
```
Progress: BRONZE_EXPLORER, SILVER_SEEKER, GOLD_ACHIEVER, PLATINUM_MASTER
Behavior: SPEED_DEMON, THOUGHTFUL_ANALYST
Streak: STREAK_3_DAYS, STREAK_7_DAYS
Referral: REFERRAL_BRONZE, REFERRAL_SILVER, REFERRAL_GOLD
Easter: NIGHT_OWL, EARLY_BIRD, DETECTIVE
```

---

### ReferralTracking (existing, no changes)

Referral relationship and status.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (cuid) | PK | Tracking identifier |
| referrerId | String | FK→User, NOT NULL | Referring user |
| refereeId | String | FK→User, NOT NULL | Referred user |
| referralCode | String | UNIQUE, NOT NULL | Tracking code |
| status | ReferralStatus | NOT NULL | PENDING/COMPLETED/REWARDED |
| rewardClaimed | Boolean | DEFAULT false | Reward status |
| createdAt | DateTime | NOT NULL | Referral start |
| convertedAt | DateTime | NULL | Completion time |

**Relations**: User (N:1 as referrer), User (N:1 as referee)

**State Transitions**:
```
PENDING → COMPLETED (referee completes test)
COMPLETED → REWARDED (points awarded to both parties)
```

---

## Enums

### SessionStatus (existing)
```
IN_PROGRESS  // Active test session
COMPLETED    // All questions answered
ABANDONED    // Timed out or cancelled
```

### QuestionType (existing)
```
MULTIPLE_CHOICE   // 2-4 options with emoji
RATING_SCALE      // 1-5 star rating
VISUAL_SELECTION  // Image-based (future)
OPEN_ENDED        // Free text
BINARY_CHOICE     // Yes/No
```

### BadgeType (existing)
```
BRONZE_EXPLORER    // 25% complete
SILVER_SEEKER      // 50% complete
GOLD_ACHIEVER      // 75% complete
PLATINUM_MASTER    // 100% complete
SPEED_DEMON        // <10 min completion
THOUGHTFUL_ANALYST // Detailed open-ended answers
STREAK_3_DAYS      // 3-day streak
STREAK_7_DAYS      // Perfect week
REFERRAL_BRONZE    // 3 completed referrals
REFERRAL_SILVER    // 5 completed referrals
REFERRAL_GOLD      // 10 completed referrals
NIGHT_OWL          // Test 11pm-2am
EARLY_BIRD         // Test 5am-7am
DETECTIVE          // Found Easter egg hint
```

### ReferralStatus (existing)
```
PENDING    // Referee signed up, test not completed
COMPLETED  // Referee completed test
REWARDED   // Points awarded
```

### CareerOutlook (NEW)
```
GROWING    // Increasing demand
STABLE     // Steady demand
DECLINING  // Decreasing demand
```

### DemandLevel (NEW)
```
HIGH    // High job availability
MEDIUM  // Moderate job availability
LOW     // Limited job availability
```

---

## Type Definitions (TypeScript)

```typescript
// packages/shared/src/types/riasec.ts

export type RIASECType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RIASECScores {
  R: number; // Realistic: 0-100
  I: number; // Investigative: 0-100
  A: number; // Artistic: 0-100
  S: number; // Social: 0-100
  E: number; // Enterprising: 0-100
  C: number; // Conventional: 0-100
}

export interface CareerMatch {
  careerId: string;
  correlation: number;      // -1 to 1 (Pearson r)
  matchPercentage: number;  // 0-100
  matchCategory: 'Best Fit' | 'Great Fit' | 'Good Fit' | 'Poor Fit';
}

export interface RIASECNorms {
  mean: number;
  sd: number;
}

// From O*NET teen population estimates
export const RIASEC_NORMS: Record<RIASECType, RIASECNorms> = {
  R: { mean: 16.5, sd: 9.2 },
  I: { mean: 20.3, sd: 8.8 },
  A: { mean: 21.1, sd: 9.5 },
  S: { mean: 24.7, sd: 8.5 },
  E: { mean: 21.4, sd: 9.0 },
  C: { mean: 17.8, sd: 8.9 }
};
```

```typescript
// packages/shared/src/types/gamification.ts

export interface PointsConfig {
  QUESTION_ANSWERED: 10;
  SECTION_COMPLETED: 100;
  TEST_COMPLETED: 500;
  SHARE_RESULTS: 25;
  REFERRAL_COMPLETED: 50;
  REFERRAL_BONUS_REFEREE: 25;
  EASTER_EGG_FOUND: 30;
  DAILY_STREAK: (day: number) => number; // day 1=1, day 2=2, etc.
}

export interface UnlockableFeature {
  points: number;
  feature: string;
  description: string;
}

export const FEATURE_UNLOCKS: UnlockableFeature[] = [
  { points: 500, feature: 'CAREER_COMPARISON', description: 'Compare 2 careers side-by-side' },
  { points: 1000, feature: 'PDF_ROADMAP', description: 'Downloadable career development plan' },
  { points: 2000, feature: 'FREE_CONSULTATION', description: '15-min call with career expert' },
  { points: 5000, feature: 'PREMIUM_INSIGHTS', description: 'Lifetime access to advanced analytics' },
  { points: 10000, feature: 'MENTOR_SESSION', description: '1-hour personal career mentor call' },
];
```

---

## Migration Plan

### Migration 1: Add FSM fields to TestSession

```sql
ALTER TABLE "TestSession" ADD COLUMN "currentStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TestSession" ADD COLUMN "answeredJSON" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "TestSession" ADD COLUMN "reminderSentAt" TIMESTAMP;
```

### Migration 2: Extend Question model

```sql
ALTER TABLE "Question" ADD COLUMN "primaryDimension" VARCHAR(1);
ALTER TABLE "Question" ADD COLUMN "riasecWeights" JSONB;
ALTER TABLE "Question" ADD COLUMN "isEasterEgg" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Question" ADD COLUMN "hint" TEXT;
```

### Migration 3: Create new tables

```sql
-- QuestionOption
CREATE TABLE "QuestionOption" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "emoji" TEXT,
  "value" TEXT NOT NULL,
  "scores" JSONB NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE
);
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- Career
CREATE TABLE "Career" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "titleRu" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "riasecProfile" JSONB NOT NULL,
  "salaryMin" INTEGER NOT NULL,
  "salaryMax" INTEGER NOT NULL,
  "salarySource" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "requiredSkills" TEXT[] NOT NULL,
  "educationPath" TEXT[] NOT NULL,
  "universities" TEXT[] NOT NULL,
  "outlook" TEXT NOT NULL,
  "demandLevel" TEXT NOT NULL,
  CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Career_category_idx" ON "Career"("category");

-- TestResult
CREATE TABLE "TestResult" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "riasecProfile" JSONB NOT NULL,
  "topCareers" JSONB NOT NULL,
  "personalityType" TEXT NOT NULL,
  "hollandCode" TEXT NOT NULL,
  "radarChartUrl" TEXT,
  "shareCardUrl" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TestResult_sessionId_key" UNIQUE ("sessionId"),
  CONSTRAINT "TestResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE
);

-- EmailVerification
CREATE TABLE "EmailVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");
CREATE INDEX "EmailVerification_code_idx" ON "EmailVerification"("code");

-- ParentLinkCode
CREATE TABLE "ParentLinkCode" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentLinkCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ParentLinkCode_studentId_key" UNIQUE ("studentId"),
  CONSTRAINT "ParentLinkCode_code_key" UNIQUE ("code"),
  CONSTRAINT "ParentLinkCode_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
);
CREATE INDEX "ParentLinkCode_code_idx" ON "ParentLinkCode"("code");
```

### Migration 4: Extend Parent model

```sql
ALTER TABLE "Parent" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
```

---

## Seed Data Requirements

1. **Questions**: 55 questions from `riasec-seed-data.ts`
2. **QuestionOptions**: ~200 options (4 per MC question)
3. **Careers**: 43 careers from `riasec-seed-data.ts`

Seed script location: `packages/database/prisma/seed.ts`

---

**Document Status**: Complete
**Next**: Generate API contracts (contracts/)

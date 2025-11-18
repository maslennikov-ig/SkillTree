# Data Model: Project Setup & Infrastructure

**Feature**: 001-project-setup
**Date**: 2025-01-17
**Status**: Phase 1 - Design Complete

## Overview

Core database schema for SkillTree application supporting:
- User authentication (Telegram-based)
- Student and parent profiles
- Parent-student relationships (many-to-many)
- Test session tracking
- Question bank
- Answer storage
- **Gamification system** (points, badges, streaks)
- **Referral tracking** (viral growth mechanics)
- **Achievement system** (milestone rewards)

## Entity Relationship Diagram

```
┌─────────────┐
│    User     │──────┐
│ (Telegram)  │      │
└──────┬──────┘      │
       │             │
       ├─────────┐   │
       │         │   │
┌──────▼─────┐ ┌▼─────────┐
│  Student   │ │  Parent  │
└──────┬─────┘ └┬─────────┘
       │        │
       │ ┌──────▼────────┐
       │ │ ParentStudent │ (Junction)
       │ └───────────────┘
       │
       ├──────────────────────┐
       │                      │
┌──────▼────────┐      ┌─────▼────────┐
│ TestSession   │      │ DailyStreak  │ (Gamification)
└──────┬────────┘      └──────────────┘
       │
       ├───────────────┐
       │               │
┌──────▼────────┐     ┌▼───────────┐     ┌────────────┐
│    Answer     │     │Achievement │────►│ Question   │
└───────────────┘     └────────────┘     └─────┬──────┘
                                               │
                      ┌────────────────────────┘
                      │
               ┌──────▼──────────┐
               │ ReferralTracking│
               └─────────────────┘
```

## Entities

### User

**Purpose**: Core authentication entity linked to Telegram account

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal user ID |
| `telegramId` | BigInt | UNIQUE, NOT NULL | Telegram user ID (from bot API) |
| `telegramUsername` | String | NULLABLE | Telegram @username (optional) |
| `firstName` | String | NULLABLE | First name from Telegram profile |
| `lastName` | String | NULLABLE | Last name from Telegram profile |
| `createdAt` | DateTime | DEFAULT now() | Account creation timestamp |
| `updatedAt` | DateTime | AUTO UPDATE | Last modification timestamp |

**Relationships**:
- One-to-One with Student (optional)
- One-to-One with Parent (optional)

**Indexes**:
- `telegramId` (UNIQUE) - Fast lookup by Telegram ID

**Validation Rules**:
- `telegramId` must be positive BigInt (Telegram user IDs are always positive)
- User can be EITHER student OR parent (enforced at application level, not DB)

**State Transitions**: None (static profile data)

---

### Student

**Purpose**: Student profile with test-taking capabilities

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal student ID |
| `userId` | String | FOREIGN KEY, UNIQUE | Reference to User.id |
| `age` | Int | NOT NULL | Student age (14-18 typical range) |
| `grade` | Int | NOT NULL | School grade (8-11 in Russia) |
| `phone` | String | NULLABLE | Student phone number (optional) |
| `createdAt` | DateTime | DEFAULT now() | Profile creation timestamp |
| `updatedAt` | DateTime | AUTO UPDATE | Last modification timestamp |

**Relationships**:
- One-to-One with User (CASCADE DELETE)
- One-to-Many with TestSession
- Many-to-Many with Parent (via ParentStudent junction)

**Indexes**:
- `userId` - Fast lookup by user

**Validation Rules**:
- `age` must be between 10 and 25 (reasonable range)
- `grade` must be between 1 and 11
- `phone` format: +7 (XXX) XXX-XX-XX (Russian format) - validated at application level

**Business Rules**:
- Student can have multiple parents
- Student can start multiple test sessions
- Deleting user cascades to student and all related data

---

### Parent

**Purpose**: Parent profile for accessing student results and contact

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal parent ID |
| `userId` | String | FOREIGN KEY, UNIQUE | Reference to User.id |
| `email` | String | NULLABLE | Parent email for lead generation |
| `phone` | String | NULLABLE | Parent phone for lead generation |
| `createdAt` | DateTime | DEFAULT now() | Profile creation timestamp |
| `updatedAt` | DateTime | AUTO UPDATE | Last modification timestamp |

**Relationships**:
- One-to-One with User (CASCADE DELETE)
- Many-to-Many with Student (via ParentStudent junction)

**Indexes**:
- `userId` - Fast lookup by user
- `email` - Fast lookup for CRM integration

**Validation Rules**:
- `email` must be valid email format (validated at application level)
- `phone` format: +7 (XXX) XXX-XX-XX (Russian format)
- At least one contact method (email OR phone) should be provided (soft validation)

**Security**:
- Email stored encrypted at rest (future: Supabase RLS policy)
- Phone stored hashed for fraud detection (future)
- Parent can only access their own children's data (enforced by RLS policies)

---

### ParentStudent (Junction Table)

**Purpose**: Many-to-many relationship between parents and students

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal relation ID |
| `parentId` | String | FOREIGN KEY | Reference to Parent.id |
| `studentId` | String | FOREIGN KEY | Reference to Student.id |
| `createdAt` | DateTime | DEFAULT now() | Relationship creation timestamp |

**Relationships**:
- Many-to-One with Parent (CASCADE DELETE)
- Many-to-One with Student (CASCADE DELETE)

**Indexes**:
- `parentId` - Fast lookup of all parent's children
- `studentId` - Fast lookup of all student's parents
- UNIQUE constraint on `(parentId, studentId)` - Prevent duplicate relationships

**Business Rules**:
- One parent can have multiple children
- One student can have multiple parents (divorced families, guardians)
- Deleting parent removes all relationships (does NOT delete students)
- Deleting student removes all relationships (does NOT delete parents)

---

### TestSession

**Purpose**: Tracks individual test-taking sessions for career guidance

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal session ID |
| `studentId` | String | FOREIGN KEY | Reference to Student.id |
| `status` | SessionStatus | ENUM, DEFAULT IN_PROGRESS | Session state |
| `startedAt` | DateTime | DEFAULT now() | Session start timestamp |
| `completedAt` | DateTime | NULLABLE | Session completion timestamp |
| `points` | Int | DEFAULT 0 | Total points earned (gamification) |
| `badges` | Json | DEFAULT [] | Array of earned badge IDs |
| `completionTimeMinutes` | Int | NULLABLE | Time taken to complete (in minutes) |
| `shareCount` | Int | DEFAULT 0 | Number of times results shared |

**SessionStatus Enum**:
- `IN_PROGRESS` - Student actively answering questions
- `COMPLETED` - All questions answered, results generated
- `ABANDONED` - Session started but not completed (timeout or user quit)

**Relationships**:
- Many-to-One with Student (CASCADE DELETE)
- One-to-Many with Answer

**Indexes**:
- `studentId` - Fast lookup of student's sessions
- `status` - Fast filtering by session state

**Validation Rules**:
- `completedAt` must be NULL when status is IN_PROGRESS
- `completedAt` must be NOT NULL when status is COMPLETED or ABANDONED
- `completedAt` must be >= `startedAt`

**State Transitions**:
```
IN_PROGRESS → COMPLETED (all questions answered)
IN_PROGRESS → ABANDONED (timeout or user quit)
COMPLETED → [FINAL STATE]
ABANDONED → [FINAL STATE]
```

**Business Rules**:
- Student can have multiple sessions (retake tests)
- Session timeout: 24 hours (after 24h, status auto-set to ABANDONED by cron job)
- Cannot modify answers after status = COMPLETED

---

### Question

**Purpose**: Question bank for career guidance test

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal question ID |
| `text` | String | NOT NULL | Question text (Russian) |
| `category` | String | NOT NULL | Question category (e.g., "interests", "skills") |
| `questionType` | QuestionType | ENUM, DEFAULT MULTIPLE_CHOICE | Question format type |
| `difficulty` | Int | DEFAULT 3 | Difficulty level (1-5) for strategic pacing |
| `sectionNumber` | Int | NOT NULL | Section number (1-5) |
| `orderIndex` | Int | NOT NULL | Display order (1, 2, 3...) |
| `createdAt` | DateTime | DEFAULT now() | Question creation timestamp |
| `updatedAt` | DateTime | AUTO UPDATE | Last modification timestamp |

**QuestionType Enum**:
- `MULTIPLE_CHOICE` - Standard multiple choice (2-4 options)
- `RATING_SCALE` - 1-5 star rating
- `VISUAL_SELECTION` - Image-based choice
- `OPEN_ENDED` - Free text response (limit to 2-3 per test)
- `BINARY_CHOICE` - Yes/No or True/False

**Relationships**:
- One-to-Many with Answer

**Indexes**:
- `category` - Fast filtering by category
- `orderIndex` - Fast ordering for sequential display

**Validation Rules**:
- `text` max length: 500 characters
- `category` must be one of predefined categories (enforced at application level)
- `orderIndex` must be unique per category (enforced at application level)

**Business Rules**:
- Questions are predefined (seeded in database, not user-generated)
- Deleting question does NOT delete associated answers (soft delete recommended)
- Question text can be updated without affecting existing answers

---

### Answer

**Purpose**: Stores student responses to questions during test sessions

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal answer ID |
| `sessionId` | String | FOREIGN KEY | Reference to TestSession.id |
| `questionId` | String | FOREIGN KEY | Reference to Question.id |
| `answerText` | String | NOT NULL | Free-text answer from student |
| `answeredAt` | DateTime | DEFAULT now() | Answer submission timestamp |

**Relationships**:
- Many-to-One with TestSession (CASCADE DELETE)
- Many-to-One with Question (CASCADE DELETE)

**Indexes**:
- `sessionId` - Fast lookup of all answers in a session
- `questionId` - Fast lookup of all responses to a question
- UNIQUE constraint on `(sessionId, questionId)` - One answer per question per session

**Validation Rules**:
- `answerText` max length: 2000 characters (Telegram message limit: 4096, but answers should be concise)
- Cannot update answer after session status = COMPLETED

**Business Rules**:
- Student can skip questions (no answer record created)
- Student can revise answer before completing session (UPDATE existing answer)
- Deleting session cascades to all answers

---

### DailyStreak (Gamification)

**Purpose**: Tracks daily engagement streaks and progressive weekly bonuses

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal streak ID |
| `userId` | String | FOREIGN KEY, UNIQUE | Reference to User.id |
| `currentDay` | Int | DEFAULT 0 | Current day in weekly cycle (0-7) |
| `weeklyPoints` | Int | DEFAULT 0 | Accumulated points this week |
| `weekStartDate` | DateTime | NOT NULL | Monday of current week |
| `lastCheckIn` | DateTime | NULLABLE | Last activity timestamp |
| `longestStreak` | Int | DEFAULT 0 | Longest consecutive days (all-time record) |
| `totalCheckIns` | Int | DEFAULT 0 | Total number of check-ins (lifetime) |
| `createdAt` | DateTime | DEFAULT now() | Record creation timestamp |
| `updatedAt` | DateTime | AUTO UPDATE | Last modification timestamp |

**Relationships**:
- One-to-One with User (CASCADE DELETE)

**Indexes**:
- `userId` (UNIQUE) - Fast lookup by user
- `weekStartDate` - Fast filtering for weekly leaderboards

**Validation Rules**:
- `currentDay` must be between 0 and 7
- `weeklyPoints` must be >= 0 and <= 28 (1+2+3+4+5+6+7 maximum)
- `weekStartDate` must be a Monday
- `lastCheckIn` must be <= current time

**Business Logic** (Progressive Weekly Bonus):
```
Day 1 (Monday): User activity → +1 point
Day 2 (Tuesday): User activity → +2 points
Day 3 (Wednesday): User activity → +3 points
Day 4 (Thursday): User activity → +4 points
Day 5 (Friday): User activity → +5 points
Day 6 (Saturday): User activity → +6 points
Day 7 (Sunday): User activity → +7 points

Monday (new week): Reset currentDay=0, weeklyPoints=0, update weekStartDate
```

**Qualifying Activities**:
- Answer at least 1 question in test
- View career recommendations
- Share results with friend
- Use referral link
- Complete any meaningful interaction (not just /start)

**State Transitions**:
```
New Week → currentDay=0, weeklyPoints=0
Daily Check-in → currentDay++, weeklyPoints+=currentDay
Missed Day → Streak broken (visual indicator, but weekly cycle continues)
```

---

### Achievement (Gamification)

**Purpose**: Tracks earned badges and milestone achievements

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal achievement ID |
| `userId` | String | FOREIGN KEY | Reference to User.id |
| `badgeType` | BadgeType | ENUM, NOT NULL | Type of badge earned |
| `metadata` | Json | NULLABLE | Additional data (e.g., time, score) |
| `earnedAt` | DateTime | DEFAULT now() | Achievement timestamp |

**BadgeType Enum**:
- `BRONZE_EXPLORER` - 25% test completion
- `SILVER_SEEKER` - 50% test completion
- `GOLD_ACHIEVER` - 75% test completion
- `PLATINUM_MASTER` - 100% test completion
- `SPEED_DEMON` - Completed test in <10 minutes
- `THOUGHTFUL_ANALYST` - Took time on open-ended questions
- `STREAK_3_DAYS` - 3-day activity streak
- `STREAK_7_DAYS` - 7-day perfect week
- `REFERRAL_BRONZE` - 3 successful referrals
- `REFERRAL_SILVER` - 5 successful referrals
- `REFERRAL_GOLD` - 10 successful referrals
- `NIGHT_OWL` - Took test between 11pm-2am
- `EARLY_BIRD` - Took test between 5am-7am
- `DETECTIVE` - Found hidden easter egg

**Relationships**:
- Many-to-One with User (CASCADE DELETE)

**Indexes**:
- `userId` - Fast lookup of user's achievements
- `badgeType` - Fast filtering by badge type
- UNIQUE constraint on `(userId, badgeType)` - One badge of each type per user

**Validation Rules**:
- Cannot manually create achievements (must be earned through system logic)
- Cannot delete achievements once earned (permanent record)

**Business Rules**:
- Achievements are cumulative (never lost)
- Some achievements can trigger rewards (unlock content, free consultation)
- Display as visual badges/stickers in Telegram

---

### ReferralTracking (Viral Growth)

**Purpose**: Tracks referral relationships and rewards

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PRIMARY KEY, CUID | Internal referral ID |
| `referrerId` | String | FOREIGN KEY | User who sent referral (User.id) |
| `refereeId` | String | FOREIGN KEY | User who was referred (User.id) |
| `referralCode` | String | NOT NULL | Unique referral code (e.g., "ref_abc123") |
| `status` | ReferralStatus | ENUM, DEFAULT PENDING | Referral state |
| `rewardClaimed` | Boolean | DEFAULT false | Whether referrer claimed reward |
| `createdAt` | DateTime | DEFAULT now() | Referral timestamp |
| `convertedAt` | DateTime | NULLABLE | When referee completed qualifying action |

**ReferralStatus Enum**:
- `PENDING` - Referee clicked link but not completed test
- `COMPLETED` - Referee completed test
- `REWARDED` - Both users received rewards

**Relationships**:
- Many-to-One with User (referrer) - CASCADE DELETE
- Many-to-One with User (referee) - CASCADE DELETE

**Indexes**:
- `referrerId` - Fast lookup of user's referrals
- `refereeId` - Fast lookup of who referred a user
- `referralCode` (UNIQUE) - Fast lookup by code

**Validation Rules**:
- `referrerId` cannot equal `refereeId` (cannot self-refer)
- `referralCode` must be unique globally
- `convertedAt` must be >= `createdAt`

**Business Logic**:
```
Referral Link Format: t.me/skilltreebot?start=ref_[userId]

Reward Tiers:
- 3 completed referrals → Unlock "Career Comparison" feature
- 5 completed referrals → Free 15-min consultation
- 10 completed referrals → Premium insights lifetime access

Both Parties Benefit:
- Referrer: +50 bonus points per completed referral
- Referee: +25 welcome bonus points
```

**State Transitions**:
```
PENDING → COMPLETED (referee completes test)
COMPLETED → REWARDED (rewards distributed to both users)
```

---

## Database Constraints

### Foreign Keys
- All foreign keys use CASCADE DELETE for dependent data
- Parent → ParentStudent → Student (deleting parent removes relationship, NOT student)
- User → Student → TestSession → Answer (deleting user cascades through entire chain)

### Unique Constraints
- `User.telegramId` - One Telegram account per user
- `Student.userId` - One student profile per user
- `Parent.userId` - One parent profile per user
- `ParentStudent(parentId, studentId)` - No duplicate parent-student relationships
- `Answer(sessionId, questionId)` - One answer per question per session

### Indexes Strategy
- Index all foreign keys for JOIN performance
- Index frequently queried fields (status, category, email)
- Avoid over-indexing (only 9 indexes total for 7 tables)

---

## Data Volume Estimates

**MVP Phase (first 3 months)**:
- Users: 500
- Students: 400 (80% students, 20% parents)
- Parents: 100
- ParentStudent relations: 150 (some parents have multiple children)
- TestSessions: 600 (1.5 sessions per student on average)
- Questions: 55 (predefined question bank with 5 sections)
- Answers: 30,000 (50 questions per session × 600 sessions)
- **DailyStreaks**: 500 (1 per user)
- **Achievements**: 2,000 (average 4 badges per user)
- **ReferralTracking**: 300 (assuming 30% viral coefficient)

**Storage Estimate**:
- Total rows: ~34,000
- Estimated size: ~65 MB (well under Supabase free tier 500 MB limit)

**Query Performance Goals**:
- Lookup user by telegramId: <10ms
- Load test session with answers: <50ms
- Load student profile with sessions: <30ms

---

## Migration Strategy

### Initial Migration (001_init)
```sql
-- Generated by Prisma from schema.prisma
-- Creates all tables, relationships, indexes, enums
```

**Steps**:
1. Run `npx prisma migrate dev --name init` in development
2. Test schema with sample data
3. Deploy to production: `npx prisma migrate deploy`
4. Seed initial question bank (separate seed script)

### Future Migrations
- Use Prisma schema changes → generate migration → test → deploy
- Never manually edit migrations (use Prisma workflow)
- Backup database before production migrations (Supabase automatic backups)

---

## Security Considerations

### Row-Level Security (RLS) - Future Phase

**Not implemented in infrastructure phase**, but planned:

```sql
-- Students can only read their own data
CREATE POLICY student_select_own ON students
  FOR SELECT USING (user_id = auth.uid());

-- Parents can only read their children's data
CREATE POLICY parent_select_children ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN parents p ON ps.parent_id = p.id
      WHERE ps.student_id = students.id
        AND p.user_id = auth.uid()
    )
  );

-- Test sessions readable only by student or their parents
CREATE POLICY session_select_authorized ON test_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = test_sessions.student_id
        AND (
          s.user_id = auth.uid()  -- Student themselves
          OR EXISTS (              -- Or their parent
            SELECT 1 FROM parent_students ps
            JOIN parents p ON ps.parent_id = p.id
            WHERE ps.student_id = s.id
              AND p.user_id = auth.uid()
          )
        )
    )
  );
```

### Data Encryption
- Database connection: SSL/TLS (Supabase default)
- Parent email: Consider encryption at rest (future)
- Phone numbers: Consider hashing for fraud detection (future)

---

## Prisma Schema File

Location: `packages/database/prisma/schema.prisma`

See [research.md Q4](./research.md#q4-prisma-schema-design-for-core-entities) for complete schema definition.

---

## Status

**Design Phase**: ✅ Complete
**Implementation Phase**: ⏳ Pending (tasks.md generation)

**Next Steps**:
1. Create `packages/database/` structure
2. Write `schema.prisma` file
3. Generate initial migration
4. Test schema locally
5. Deploy to production Supabase

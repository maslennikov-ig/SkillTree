# Feature Specification: SkillTree Telegram Bot MVP

**Feature Branch**: `002-telegram-bot-mvp`
**Created**: 2025-12-28
**Status**: Draft
**Input**: Technical requirements for career guidance Telegram bot for teenagers 14-17

## User Scenarios & Testing

### User Story 1 - Student Takes Career Assessment (Priority: P1)

A teenager (14-17 years old) starts the SkillTree bot for the first time. They register as a student, providing their age and grade. They then take the 55-question career assessment test, answering questions across 5 sections. The test takes 12-15 minutes. After each section, they see celebration messages and earn badges. Upon completion, they receive their RIASEC career profile with a radar chart visualization and top 5 career recommendations.

**Independent Test**: Student can complete full 55-question test and receive personalized career results with radar chart

**Acceptance Scenarios**:

1. **Given** a new user starts the bot, **When** they select "I'm a student" and provide age/grade, **Then** they are registered as a student and see the student main menu
2. **Given** a registered student, **When** they start the test, **Then** they see questions one at a time with progress indicator (e.g., "Question 12/55 | Section 2/5 | 22%")
3. **Given** a student answers all 55 questions, **When** the test completes, **Then** they see their personality archetype, radar chart, and top 5 career matches with match percentages
4. **Given** a student is mid-test, **When** they close the app and return later (within 24 hours), **Then** they can resume from where they left off using /resume

---

### User Story 2 - Student Earns Gamification Rewards (Priority: P1)

As a student progresses through the test, they earn points for each question answered (+10), section completion bonuses (+100), and test completion bonus (+500). They unlock badges at 25%, 50%, 75%, and 100% completion (Bronze, Silver, Gold, Platinum). Special Easter egg badges are hidden throughout. Weekly streaks award progressive points (Day 1: +1, Day 2: +2, ... Day 7: +7).

**Independent Test**: Student accumulates points and unlocks badges during test progression

**Acceptance Scenarios**:

1. **Given** a student answers a question, **When** the answer is saved, **Then** they earn +10 points
2. **Given** a student completes section 1 (11 questions), **When** they see the celebration message, **Then** they receive +100 bonus points and Bronze Explorer badge
3. **Given** a student finishes the entire test, **When** results are shown, **Then** they receive +500 completion bonus and Platinum Master badge
4. **Given** a student is active for 7 consecutive days, **When** they check their streak, **Then** they see progressive daily bonuses (1+2+3+4+5+6+7 = 28 points total)

---

### User Story 3 - Student Shares Results (Priority: P1)

After completing the test, a student can share their results in multiple ways: generate a shareable image card (1080x1080 for Instagram/Stories), share their referral link to invite friends, or send results to parents via email.

**Independent Test**: Student can generate and share a visual results card

**Acceptance Scenarios**:

1. **Given** a student has completed the test, **When** they tap "Share" button, **Then** they receive a 1080x1080 PNG image with their personality type, radar chart, and top career
2. **Given** a student shares their referral link, **When** a friend uses the link and completes the test, **Then** the original student receives +50 points and the friend receives +25 bonus points
3. **Given** a student opts to share with parents, **When** they enter a valid parent email, **Then** a professional email report is sent with their results

---

### User Story 4 - Parent Registration and Linking (Priority: P2)

A parent starts the bot and registers as a parent, providing their email (with 4-digit verification). They then link to their child using a unique code. Once linked, they can view their child's test results and receive detailed email reports.

**Independent Test**: Parent can register, verify email, and link to their child's account

**Acceptance Scenarios**:

1. **Given** a new user starts the bot, **When** they select "I'm a parent" and provide email, **Then** they receive a 4-digit verification code to that email
2. **Given** a parent enters the correct verification code, **When** the code is valid and not expired, **Then** their email is verified and saved
3. **Given** a student generates a link code (/linkcode), **When** a parent enters it via /link <code>, **Then** the parent-child relationship is established and both are notified
4. **Given** a linked parent, **When** their child completes a test, **Then** the parent can opt to receive a detailed email report

---

### User Story 5 - Parent Receives Professional Email Report (Priority: P2)

After a student completes the test, if a parent is linked or the student opts to send results to a parent email, a professional email report is generated. The report uses formal language, includes the radar chart, top career matches with salary projections, and a call-to-action for consultation booking.

**Independent Test**: Parent receives professionally formatted email with complete test results

**Acceptance Scenarios**:

1. **Given** a student completes the test with a linked parent, **When** parent report is triggered, **Then** an email is sent with formal language ("Вы", statistics, evidence-based recommendations)
2. **Given** a parent email report, **When** opened, **Then** it contains the radar chart image, top 3 careers with salary ranges, strengths list, and development areas
3. **Given** a parent email report, **When** the parent clicks the CTA, **Then** they are directed to the consultation booking page

---

### User Story 6 - Test Resume After Interruption (Priority: P1)

A student can be interrupted during the test (app closes, phone dies, network issues). The system saves progress after every question. Within 24 hours, they can resume from exactly where they left off. After 24 hours, the session expires.

**Independent Test**: Student can close app mid-test and resume at the same question

**Acceptance Scenarios**:

1. **Given** a student is on question 23, **When** they close the app, **Then** their progress (all 22 previous answers) is saved to the database
2. **Given** a student with an active session returns within 24 hours, **When** they use /resume, **Then** they continue from question 23
3. **Given** a student with a session older than 24 hours, **When** they try to resume, **Then** they are informed the session expired and offered to start fresh
4. **Given** a student returns after 12 hours, **When** they message the bot, **Then** they receive a reminder: "You stopped at question 23. Continue?"

---

### User Story 7 - Referral System (Priority: P2)

Students can earn points and unlock features by referring friends. Each student has a unique referral link (t.me/skilltreebot?start=ref_<userId>). When a referred friend completes the test, both parties are rewarded. Milestones unlock premium features.

**Independent Test**: Referral link tracks conversions and awards points correctly

**Acceptance Scenarios**:

1. **Given** a student, **When** they request their referral link, **Then** they receive a personalized link with their user ID
2. **Given** a new user clicks a referral link, **When** they complete registration, **Then** a pending referral is tracked
3. **Given** a referred user completes the test, **When** the test is done, **Then** the referrer gets +50 points and referee gets +25 points
4. **Given** a student with 3 completed referrals, **When** checking their rewards, **Then** they unlock the Career Comparison feature

---

### User Story 8 - Insight Teasers During Test (Priority: P1)

To maintain engagement during the 55-question test, students receive insight teasers after sections 2, 3, and 4. These teasers reveal partial findings (e.g., "Your Investigative score: 78/100 - above average!") to motivate completion.

**Independent Test**: Student sees personalized insight teaser after section 2

**Acceptance Scenarios**:

1. **Given** a student completes section 2 (40%), **When** the celebration appears, **Then** it includes a teaser about their emerging profile ("Strong analytical thinking detected")
2. **Given** a student completes section 3 (60%), **When** the celebration appears, **Then** it shows a specific RIASEC dimension score (e.g., "Investigative: 78/100")
3. **Given** a student completes section 4 (80%), **When** the celebration appears, **Then** it teases "Your top career is about to be revealed..."

---

### User Story 9 - User Requests Data Deletion (Priority: P3)

A user wants to exercise their "right to be forgotten" per 152-ФЗ. They can request complete deletion of their data through /deletedata command. The system requires 2-step confirmation to prevent accidental deletion.

**Independent Test**: User can request and confirm data deletion, receiving confirmation of successful removal

**Acceptance Scenarios**:

1. **Given** a registered user, **When** they send /deletedata, **Then** they see a warning message with confirmation button
2. **Given** a user views the deletion warning, **When** they click "Confirm Deletion", **Then** they receive a 6-digit confirmation code
3. **Given** a user receives confirmation code, **When** they enter the correct code within 5 minutes, **Then** all their data is deleted and they receive confirmation
4. **Given** data deletion is confirmed, **When** the operation completes, **Then** all User, Student/Parent, TestSession, TestResult, Achievement, Streak, and Referral records are removed
5. **Given** a deleted user, **When** they start the bot again, **Then** they are treated as a new user

---

### User Story 10 - PDF Career Roadmap Download (Priority: P2)

A student who has earned 1000+ points can download a personalized PDF career roadmap. The PDF includes their RIASEC profile, top career matches, development steps, and recommended universities.

**Independent Test**: Student with 1000+ points can download PDF with personalized career development plan

**Acceptance Scenarios**:

1. **Given** a student with <1000 points, **When** they request PDF roadmap, **Then** they see "Earn X more points to unlock"
2. **Given** a student with 1000+ points and completed test, **When** they tap "Download PDF Roadmap", **Then** they receive a PDF file in chat
3. **Given** a PDF roadmap, **When** opened, **Then** it contains: radar chart, personality type, top 5 careers with salaries, development steps, university recommendations
4. **Given** the PDF file, **When** checked for quality, **Then** Russian text renders correctly with Inter font and radar chart is embedded as image

---

### Edge Cases

- What happens when a student tries to start a new test while one is in progress?
  - System shows choice: "Continue existing test" or "Start fresh" (abandons current)
- What happens if a student wants to retake the test?
  - Allowed after 7-day cooldown, maximum 3 retakes total
- What happens when rate limits are exceeded?
  - System responds: "Too many requests. Please wait a minute." (10 answers/min, 20 commands/min)
- What happens if email verification code expires?
  - Code expires after 15 minutes, user can request a new code
- What happens if parent enters wrong link code?
  - Error message shown, can retry unlimited times
- What happens during network failure while answering?
  - Auto-save ensures last answer is persisted; resume works
- What happens when user data is 3 years old?
  - Data is automatically anonymized (PII replaced with hashes), test results preserved for analytics

## Requirements

### Functional Requirements

#### Registration & Onboarding
- **FR-001**: System MUST allow users to start the bot via /start command
- **FR-002**: System MUST distinguish between Student and Parent roles during registration
- **FR-003**: System MUST collect age (14-17, 18+) and grade (8-11) from students
- **FR-004**: System MUST collect and verify email from parents using 4-digit codes
- **FR-005**: System MUST support parent-child linking via unique 6-character codes

#### Career Assessment Test
- **FR-006**: System MUST present exactly 55 questions across 5 sections
- **FR-007**: System MUST support multiple question types (multiple choice with emoji, rating scale 1-5, binary choice, open-ended text)
- **FR-008**: System MUST show progress after each question (question number, section, percentage)
- **FR-009**: System MUST auto-save progress after every question
- **FR-010**: System MUST support session resume within 24-hour window
- **FR-011**: System MUST mark sessions as abandoned after 24 hours of inactivity
- **FR-012**: System MUST send reminder after 12 hours of inactivity

#### Results & Visualization
- **FR-013**: System MUST calculate RIASEC profile using O*NET normative data
- **FR-014**: System MUST generate radar chart visualization using 6 RIASEC dimensions
- **FR-015**: System MUST match user profile to careers using Pearson correlation algorithm
- **FR-016**: System MUST display top 5 career matches with match percentages
- **FR-017**: System MUST determine personality archetype from top 2 RIASEC dimensions
- **FR-018**: System MUST generate shareable image cards (1080x1080 PNG)

#### Gamification
- **FR-019**: System MUST award points for questions (+10), sections (+100), completion (+500), sharing results (+25), Easter egg discovery (+30)
- **FR-020**: System MUST unlock badges at 25%, 50%, 75%, 100% completion thresholds (progress badges), plus behavior badges (speed, thoughtful), streak badges (3-day, 7-day), referral badges (3, 5, 10 referrals), and hidden Easter egg badges
- **FR-021**: System MUST track weekly streaks with progressive daily bonuses (Day N = N points)
- **FR-022**: System MUST reset weekly streaks every Monday at midnight Moscow time
- **FR-023**: System MUST track referrals and award bonuses on completion
- **FR-024**: System MUST unlock premium features at point milestones (500, 1000, 2000, 5000, 10000)

#### Parent Engagement
- **FR-025**: System MUST send professional email reports to verified parent emails
- **FR-026**: System MUST use dual-persona messaging (informal for teens, formal for parents)
- **FR-027**: System MUST include consultation CTA in parent emails

#### Bot Commands
- **FR-028**: System MUST respond to all defined commands (/start, /test, /resume, /results, /streak, /achievements, /share, /linkcode, /link, /help, /cancel, /privacy, /deletedata)
- **FR-029**: System MUST display persistent keyboard menu appropriate to user role

#### Data Protection & Privacy
- **FR-030**: System MUST encrypt parent email addresses at rest using PostgreSQL pgcrypto extension (AES-256-CBC with application-managed key stored in environment variable `ENCRYPTION_KEY`)
- **FR-031**: System MUST display consent checkbox during registration with link to privacy policy
- **FR-032**: System MUST require parental confirmation for students under 16 years old before test start via parent email verification flow:
  - Student under 16 enters parent email during registration
  - System sends 4-digit confirmation code to parent email
  - Parent enters code in the bot (or student enters code received from parent)
  - Test start is blocked until parental confirmation is received
  - Confirmation expires after 7 days, requiring re-verification
- **FR-033**: System MUST provide /privacy command showing privacy policy text

#### Observability & Monitoring
- **FR-034**: System MUST log all key events in structured JSON format (Pino): test_started, test_completed, test_abandoned, error, referral_completed
- **FR-035**: System MUST send critical error alerts to admin Telegram chat
- **FR-036**: System MUST track basic metrics: completion rate, average test duration, daily active users

#### PDF Generation
- **FR-037**: System MUST generate downloadable PDF career roadmap with personalized development plan based on test results

#### Data Retention
- **FR-038**: System MUST retain user data for 3 years from last activity
- **FR-039**: System MUST anonymize user data after 3-year retention period
- **FR-040**: System MUST support user data deletion on request (право на забвение)

### Key Entities

- **User**: Base entity with Telegram ID, linked to either Student or Parent, retentionExpiresAt (auto-updated on activity)
- **Student**: Age, grade, total points, current streak data, parentalConsentVerified (for <16)
- **Parent**: Verified email (encrypted with pgcrypto), phone (optional), linked students
- **TestSession**: Current question index, answers JSON, status (ACTIVE/COMPLETED/ABANDONED), timestamps
- **Question**: Text, type, section, RIASEC weights, options (for multiple choice)
- **Career**: Title (RU/EN), RIASEC profile, salary range, category, outlook, demand level
- **TestResult**: RIASEC profile, top careers, personality type, chart URLs
- **Achievement**: Badge type, earned timestamp, trigger event
- **DailyStreak**: Current day (1-7), weekly points, last check-in, longest streak
- **ReferralTracking**: Referrer, referee, status (PENDING/COMPLETED), completion date
- **EmailVerification**: Email, 4-digit code, expiry timestamp (15 min), verified status
- **ParentalConfirmation**: Student ID, parent email, 4-digit code, expiry (7 days), confirmed status (for FR-032)
- **DeletionAuditLog**: User ID (hashed), deletion timestamp, deleted entities count (for compliance)

## Success Criteria

### Measurable Outcomes

- **SC-001**: 70% or more of students who start the test complete all 55 questions (vs industry average 50-60%)
- **SC-002**: Students complete the test in 12-15 minutes average
- **SC-003**: Less than 5% of students abandon during Section 1 (questions 1-11)
- **SC-004**: 30% or more of students who complete the test share their results
- **SC-005**: Viral coefficient reaches 1.0 or higher by month 3 (each user brings 1+ new user)
- **SC-006**: 50% or more of students opt to send results to parent email
- **SC-007**: 40% or more of parent emails are opened
- **SC-008**: 5% or more of parents who receive email book a consultation
- **SC-009**: 50% or more of referral link clicks convert to test completion
- **SC-010**: 30% or more of active users return to view their results again
- **SC-011**: System supports 10,000 concurrent users without degradation
- **SC-012**: Bot responds to user actions within 2 seconds

## Clarifications

### Session 2025-12-28

- Q: Как должны защищаться персональные данные несовершеннолетних (14-17 лет)? → A: Шифрование email, согласие на обработку при регистрации, обязательное подтверждение от родителей для пользователей <16 лет, политика конфиденциальности доступна в боте (/privacy)
- Q: Какие сервисы использовать для графиков и email? → A: **РЕШЕНО** (см. ниже Technical Stack Decisions)
- Q: Какие требования к логированию и мониторингу? → A: Структурированные JSON-логи (Pino), ключевые события (test_started, test_completed, errors), алерты критических ошибок админам через Telegram-бота. Для MVP достаточно Telegram-алертов без отдельной админки
- Q: Что явно НЕ входит в MVP? → A: Платные функции, веб-интерфейс, мобильное приложение, мультиязычность (только RU), групповые тесты, интеграция с ВУЗами, AI-чат с консультантом, видео-консультации, интеграция с hh.ru/SuperJob. **PDF roadmap ВКЛЮЧЁН в MVP**
- Q: Сколько хранить данные пользователей? → A: 3 года — охватывает полный школьный цикл (8-11 класс), затем данные анонимизируются

### Technical Stack Decisions (Research Completed 2025-12-28)

Reference: [SkillTree Bot MVP Technical Stack Recommendations](../../docs/Research/SkillTree%20Bot%20MVP%20Technical%20Stack%20Recommendations.md)

#### Email Service: SendPulse

| Attribute | Value |
|-----------|-------|
| **Provider** | SendPulse (sendpulse.com) |
| **Free Tier** | **12,000 emails/month** (6x more than alternatives) |
| **Paid Pricing** | ~$8.85 for 10,000 emails/month |
| **API** | REST + SMTP + Node.js SDK |
| **Quality Score** | 8.55 (highest among evaluated) |
| **Fallback** | NotiSend (Russian DC, 2K free) if legal concerns arise |

**DNS Requirements**: SPF, DKIM, DMARC records for skilltree.ru domain

#### Chart Generation: Chart.js + @napi-rs/canvas

| Attribute | Value |
|-----------|-------|
| **Library** | chart.js v4.4 + @napi-rs/canvas v0.1.44 |
| **Performance** | 68 ops/sec, 15-25ms per chart |
| **Memory** | ~20-50MB peak |
| **Dependencies** | Zero system deps (prebuilt binaries) |
| **Emoji Support** | ✅ Native color emoji via Noto Color Emoji font |
| **Fallback** | skia-canvas (same API, drop-in replacement) |

**Why not external APIs**: QuickChart.io limits 500-1000/month — exhausted in one busy day

#### Share Card Generation: @napi-rs/canvas (unified stack)

| Attribute | Value |
|-----------|-------|
| **Library** | @napi-rs/canvas (same as charts) |
| **Output** | 1080x1080 PNG |
| **Performance** | ~30ms per card |
| **Fonts Required** | Inter (Regular/Medium/Bold) + Noto Color Emoji |

**Alternative**: Satori + resvg-js (~50ms, JSX syntax if team prefers)

#### Required Font Files

```
assets/fonts/
├── Inter-Regular.ttf
├── Inter-Medium.ttf
├── Inter-Bold.ttf
└── NotoColorEmoji.ttf
```

#### Memory Budget on 2GB VDS

| Component | Peak Memory |
|-----------|-------------|
| Node.js runtime | 80-120MB |
| NestJS application | 50-80MB |
| @napi-rs/canvas | 20-50MB |
| PostgreSQL pool | 20-30MB |
| grammY client | 10-20MB |
| **Total peak** | **~400MB** ✅ |

## Out of Scope (NOT in MVP)

The following features are explicitly excluded from this MVP and deferred to future releases:

- **Monetization**: Paid features, subscriptions, premium tiers
- **Platforms**: Web interface, mobile app (Telegram bot only)
- **Localization**: Multi-language support (Russian only)
- **Advanced Features**:
  - Group/classroom testing
  - University/school integrations
  - AI chat with career consultant
  - Video consultations
  - Job board integrations (hh.ru, SuperJob)

## Assumptions

- Students have Telegram installed and are comfortable using bots
- Parents have access to email and can receive verification codes
- SendPulse API will remain stable (12K free emails/month, Node.js SDK)
- @napi-rs/canvas prebuilt binaries work on Ubuntu 20.04+ without additional system dependencies
- Inter and Noto Color Emoji fonts are sufficient for all Russian text rendering
- RIASEC methodology is culturally appropriate for Russian teenagers
- Career database (43 professions) covers primary interest areas for target demographic
- Long polling mode is sufficient for expected user load (vs webhooks)
- Single bot instance (not cluster) is adequate for MVP traffic
- 55 questions provide sufficient psychometric validity for career guidance
- 2GB RAM VDS can handle ~400MB peak memory usage with comfortable headroom

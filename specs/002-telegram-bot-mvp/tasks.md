# Tasks: SkillTree Telegram Bot MVP

**Input**: Design documents from `/specs/002-telegram-bot-mvp/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/bot-commands.md, contracts/api-endpoints.md, quickstart.md

**Tests**: Not requested in specification. Test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US8)
- Include exact file paths in descriptions

## Path Conventions (from plan.md)

```
apps/bot/src/           # grammY Telegram Bot
apps/api/src/modules/   # NestJS API modules
packages/database/      # Prisma schema
packages/shared/src/    # Shared types
```

---

## Phase 0: Planning

**Purpose**: Prepare for implementation by analyzing requirements, creating necessary agents, and assigning executors.

- [X] P001 [EXECUTOR: MAIN] Analyze all tasks and identify required agent types and capabilities → Identified: grammy-bot-specialist (new), database-architect, nestjs-infrastructure-specialist, typescript-types-specialist, monorepo-setup-specialist
- [X] P002 [EXECUTOR: meta-agent-v3] Create missing agents using meta-agent-v3 → Created: grammy-bot-specialist
- [X] P003 [EXECUTOR: MAIN] Assign executors to all tasks: See annotations below
- [X] P004 [EXECUTOR: MAIN] Resolve research tasks: Research already completed (R-001 to R-006 in plan.md)

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports, single npm install)
- **Existing agents**: ONLY if 100% capability match after thorough examination
- **Agent creation**: Launch all meta-agent-v3 calls in single message for parallel execution
- **After P002**: Must restart claude-code before proceeding to P003

**Artifacts**:
- Updated tasks.md with [EXECUTOR: name], [SEQUENTIAL]/[PARALLEL-GROUP-X] annotations
- .claude/agents/{domain}/{type}/{name}.md (if new agents created)
- research/*.md (if complex research identified)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, bot package structure, dependencies

- [X] T001 [EXECUTOR: MAIN] [SEQUENTIAL] Create apps/bot directory structure per plan.md in apps/bot/src/{handlers,keyboards,services,utils,content} → Artifacts: [apps/bot/src/](../../../apps/bot/src/)
- [X] T002 [EXECUTOR: MAIN] [SEQUENTIAL] Initialize apps/bot/package.json with grammY dependencies per quickstart.md → Artifacts: [package.json](../../../apps/bot/package.json)
- [X] T003 [EXECUTOR: MAIN] [PARALLEL-GROUP-1] Create apps/bot/tsconfig.json extending @skilltree/typescript-config/node.json → Artifacts: [tsconfig.json](../../../apps/bot/tsconfig.json)
- [X] T004 [EXECUTOR: MAIN] [PARALLEL-GROUP-1] Create apps/bot/src/utils/logger.ts with Pino structured logging → Artifacts: [logger.ts](../../../apps/bot/src/utils/logger.ts)
- [X] T005 [EXECUTOR: MAIN] [PARALLEL-GROUP-1] Update turbo.json to add bot#dev and bot#build pipeline configurations → Artifacts: [turbo.json](../../../turbo.json)
- [X] T006 [EXECUTOR: MAIN] [PARALLEL-GROUP-1] Download Inter fonts to apps/api/assets/fonts/ (Inter-Regular.ttf, Inter-Medium.ttf, Inter-Bold.ttf) → Artifacts: [fonts/](../../../apps/api/assets/fonts/)
- [X] T007 [EXECUTOR: MAIN] [PARALLEL-GROUP-1] Download NotoColorEmoji.ttf to apps/api/assets/fonts/ → Artifacts: [NotoColorEmoji.ttf](../../../apps/api/assets/fonts/NotoColorEmoji.ttf)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, core bot setup, shared types - MUST complete before user stories

**CRITICAL**: No user story work can begin until this phase is complete

### 2.1 Database Schema Extensions

- [X] T008 [EXECUTOR: database-architect] Add currentStep, answeredJSON, reminderSentAt fields to TestSession model → Artifacts: [schema.prisma](../../../packages/database/prisma/schema.prisma)
- [X] T009 [EXECUTOR: database-architect] [P] Add primaryDimension, riasecWeights, isEasterEgg, hint fields to Question model
- [X] T010 [EXECUTOR: database-architect] [P] Create QuestionOption model with scores JSON field
- [X] T011 [EXECUTOR: database-architect] [P] Create Career model with riasecProfile, outlook, demandLevel
- [X] T012 [EXECUTOR: database-architect] [P] Create TestResult model with riasecProfile, topCareers, personalityType
- [X] T013 [EXECUTOR: database-architect] [P] Create EmailVerification model with 4-digit code support
- [X] T014 [EXECUTOR: database-architect] [P] Create ParentLinkCode model with 6-char code
- [X] T015 [EXECUTOR: database-architect] [P] Add CareerOutlook and DemandLevel enums
- [X] T016 [EXECUTOR: database-architect] Add emailVerified field to Parent model
- [ ] T017 [EXECUTOR: MAIN] Run prisma migrate dev to apply schema changes (DEFERRED - requires DATABASE_URL)

### 2.2 Seed Data

- [X] T018 Create packages/database/prisma/seed-data/questions.ts with 55 RIASEC questions from riasec-seed-data.ts → Artifacts: [riasec-data.ts](../../../packages/database/prisma/seed-data/riasec-data.ts)
- [X] T019 [P] Create packages/database/prisma/seed-data/careers.ts with 43 careers from riasec-seed-data.ts → Merged into riasec-data.ts
- [X] T020 Update packages/database/prisma/seed.ts to import and seed questions and careers → Artifacts: [seed.ts](../../../packages/database/prisma/seed.ts)
- [ ] T021 Run prisma db seed to populate question bank and career database (DEFERRED - requires DATABASE_URL)

### 2.3 Shared Types

- [X] T022 [EXECUTOR: typescript-types-specialist] [P] Create packages/shared/src/types/riasec.ts with RIASECScores, RIASECType, CareerMatch interfaces → Artifacts: [riasec.ts](../../../packages/shared/src/types/riasec.ts)
- [X] T023 [EXECUTOR: typescript-types-specialist] [P] Create packages/shared/src/types/gamification.ts with PointsConfig, UnlockableFeature, FEATURE_UNLOCKS → Artifacts: [gamification.ts](../../../packages/shared/src/types/gamification.ts)
- [X] T024 [EXECUTOR: typescript-types-specialist] [P] Create packages/shared/src/constants/riasec.ts with RIASEC_NORMS, RIASEC_COLORS, ARCHETYPES → Artifacts: [riasec.ts](../../../packages/shared/src/constants/riasec.ts)

### 2.4 Bot Core Setup

- [X] T025 Create apps/bot/src/bot.ts with grammY Bot instance, MyContext type, Prisma middleware → Artifacts: [bot.ts](../../../apps/bot/src/bot.ts)
- [X] T026 Create apps/bot/src/types/context.ts with extended MyContext interface including quizSession → Artifacts: [context.ts](../../../apps/bot/src/types/context.ts)
- [X] T027 [P] Create apps/bot/src/keyboards/main-menu.ts with Student and Parent persistent keyboards → Artifacts: [main-menu.ts](../../../apps/bot/src/keyboards/main-menu.ts)
- [X] T028 Update root package.json to add bot workspace scripts → Artifacts: [package.json](../../../package.json)

### 2.5 Environment Configuration

- [ ] T029 Add TELEGRAM_BOT_TOKEN, SENDPULSE_*, feature flag env vars to .env.example
- [ ] T030 Create apps/bot/.env.example with bot-specific environment variables

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Student Takes Career Assessment (Priority: P1) MVP

**Goal**: Student completes 55-question test and receives RIASEC profile with career matches

**Independent Test**: Student can complete full 55-question test and receive personalized career results with radar chart

### Implementation for User Story 1

- [ ] T031 Create apps/bot/src/content/questions.ts exporting QUIZ_FLOW array from seed data
- [ ] T032 [P] [US1] Create apps/bot/src/handlers/start.handler.ts with /start command, role selection (Student/Parent)
- [ ] T033 [P] [US1] Create apps/bot/src/services/user.service.ts with createUser, findByTelegramId, createStudent methods
- [ ] T034 [US1] Create apps/bot/src/handlers/quiz.handler.ts with FSM engine (currentStep as instruction pointer)
- [ ] T035 [US1] Implement renderStep function in quiz.handler.ts for question rendering (MC, Rating, Binary, Open)
- [ ] T036 [US1] Implement answer validation and state persistence in quiz.handler.ts (atomic DB updates)
- [ ] T037 [US1] Create apps/bot/src/keyboards/question.ts with dynamic InlineKeyboard builders for question types
- [ ] T038 [US1] Create apps/bot/src/services/quiz.service.ts with startSession, saveAnswer, getQuestion methods
- [ ] T039 [US1] Implement progress tracking in quiz.service.ts (Question X/55 | Section Y/5 | Z%)
- [ ] T040 [US1] Create apps/bot/src/services/results.service.ts with calculateRIASECProfile using Pearson correlation
- [ ] T041 [US1] Implement matchCareers function in results.service.ts using Pearson correlation per O*NET standard
- [ ] T042 [US1] Implement getArchetype function in results.service.ts mapping top-2 dimensions to personality type
- [ ] T043 [US1] Create apps/api/src/modules/results/chart.service.ts with generateRadarChart using @napi-rs/canvas
- [ ] T044 [US1] Register Chart.js components (RadialLinearScale, RadarController, etc.) in chart.service.ts
- [ ] T045 [US1] Create apps/api/src/modules/results/results.controller.ts with GET /results/:sessionId/radar-chart
- [ ] T046 [US1] Create apps/api/src/modules/results/results.service.ts with getResults, getCareers methods
- [ ] T047 [US1] Create apps/api/src/modules/careers/careers.service.ts with listAll, getById methods
- [ ] T048 [US1] Create apps/api/src/modules/careers/careers.controller.ts with GET /careers and GET /careers/:id
- [ ] T049 [US1] Create apps/bot/src/handlers/results.handler.ts with /results command showing radar chart and top careers
- [ ] T050 [US1] Create apps/bot/src/keyboards/results.ts with action buttons (Full Report, Careers, Share, Parent)
- [ ] T051 [US1] Implement test completion flow in quiz.handler.ts with results generation trigger
- [ ] T052 [US1] Create apps/api/src/modules/results/results.module.ts and register in app.module.ts

**Checkpoint**: User Story 1 complete - student can take 55-question test and see results

---

## Phase 4: User Story 6 - Test Resume After Interruption (Priority: P1)

**Goal**: Student can resume test after interruption within 24-hour window

**Independent Test**: Student can close app mid-test and resume at the same question using /resume

### Implementation for User Story 6

- [ ] T053 [US6] Create session timeout middleware in apps/bot/src/bot.ts checking 24h expiry
- [ ] T054 [US6] Implement /resume command in apps/bot/src/handlers/quiz.handler.ts
- [ ] T055 [US6] Implement handleExistingSession logic in quiz.handler.ts (Continue/Start Fresh choice)
- [ ] T056 [US6] Add session abandonment logic (mark ABANDONED after 24h) in bot.ts middleware
- [ ] T057 [US6] Create reminder notification service in apps/bot/src/services/notification.service.ts
- [ ] T058 [US6] Implement 12-hour reminder check and sending in notification.service.ts

**Checkpoint**: User Story 6 complete - session resume works within 24h

---

## Phase 5: User Story 8 - Insight Teasers During Test (Priority: P1)

**Goal**: Student sees insight teasers after sections 2, 3, 4 to maintain engagement

**Independent Test**: Student sees personalized insight teaser after completing section 2

### Implementation for User Story 8

- [ ] T059 [US8] Create apps/bot/src/services/insight.service.ts with generateSectionInsight method
- [ ] T060 [US8] Implement section completion detection in quiz.handler.ts (every 11 questions)
- [ ] T061 [US8] Add section celebration messages with insight teasers in quiz.handler.ts
- [ ] T062 [US8] Implement partial RIASEC calculation for mid-test insights in insight.service.ts
- [ ] T063 [US8] Create section transition flow_continue callback handler in quiz.handler.ts

**Checkpoint**: User Story 8 complete - insight teasers display at sections 2, 3, 4

---

## Phase 6: User Story 2 - Student Earns Gamification Rewards (Priority: P1)

**Goal**: Student earns points and badges during test progression

**Independent Test**: Student accumulates points and unlocks badges during test progression

### Implementation for User Story 2

- [ ] T064 [US2] Create apps/bot/src/services/gamification.service.ts with awardPoints, checkBadgeUnlock methods
- [ ] T065 [US2] Implement point awards in quiz.handler.ts (+10 per question, +100 per section, +500 completion)
- [ ] T066 [US2] Implement badge unlock checks at 25%, 50%, 75%, 100% thresholds in gamification.service.ts
- [ ] T067 [US2] Create apps/bot/src/handlers/streak.handler.ts with /streak and /achievements commands
- [ ] T068 [US2] Create apps/bot/src/services/streak.service.ts with checkIn, getStreakStatus, calculateBonus
- [ ] T069 [US2] Implement weekly streak logic (Day N = N points, reset Monday 00:00 MSK) in streak.service.ts
- [ ] T070 [US2] Add badge notification messages when earned in gamification.service.ts
- [ ] T071 [US2] Create apps/api/src/modules/gamification/gamification.controller.ts with GET /gamification/unlocks
- [ ] T072 [US2] Create apps/api/src/modules/gamification/gamification.service.ts with getUnlockedFeatures method
- [ ] T073 [US2] Implement Easter egg badge detection (NIGHT_OWL 11pm-2am, EARLY_BIRD 5am-7am, DETECTIVE Q33) in gamification.service.ts

**Checkpoint**: User Story 2 complete - points and badges working

---

## Phase 7: User Story 3 - Student Shares Results (Priority: P1)

**Goal**: Student can share results via image card and referral link

**Independent Test**: Student can generate and share a visual results card

### Implementation for User Story 3

- [ ] T074 [US3] Create apps/api/src/modules/results/card.service.ts with generateShareCard method
- [ ] T075 [US3] Implement 1080x1080 PNG generation with radar chart, personality type, top career in card.service.ts
- [ ] T076 [US3] Add dimension-based color scheme selection (getColorsForDimension) in card.service.ts
- [ ] T077 [US3] Create GET /results/:sessionId/share-card endpoint in results.controller.ts
- [ ] T078 [US3] Implement /share command in apps/bot/src/handlers/results.handler.ts
- [ ] T079 [US3] Generate referral link format t.me/skilltreebot?start=ref_{userId} in results.handler.ts
- [ ] T080 [US3] Award +25 points for first share in gamification.service.ts

**Checkpoint**: User Story 3 complete - share card and referral link work

---

## Phase 8: User Story 4 - Parent Registration and Linking (Priority: P2)

**Goal**: Parent can register, verify email, and link to child's account

**Independent Test**: Parent can register, verify email, and link to their child's account

### Implementation for User Story 4

- [ ] T081 [US4] Extend apps/bot/src/handlers/start.handler.ts with parent registration flow
- [ ] T082 [US4] Create apps/bot/src/handlers/parent.handler.ts with /linkcode and /link commands
- [ ] T083 [US4] Create apps/bot/src/services/parent.service.ts with createParent, generateLinkCode, linkChild methods
- [ ] T084 [US4] Implement 6-character alphanumeric code generation in parent.service.ts
- [ ] T085 [US4] Add ParentStudent relation creation logic in parent.service.ts
- [ ] T086 [US4] Create apps/api/src/modules/email/email.service.ts with SendPulse integration
- [ ] T087 [US4] Create apps/api/src/modules/email/email.controller.ts with POST /email/verify and POST /email/confirm
- [ ] T088 [US4] Implement 4-digit verification code generation and validation in email.service.ts
- [ ] T089 [US4] Create email verification conversation flow in parent.handler.ts
- [ ] T090 [US4] Add notification to both parent and student on successful linking in parent.service.ts

**Checkpoint**: User Story 4 complete - parent registration and linking work

---

## Phase 9: User Story 5 - Parent Receives Professional Email Report (Priority: P2)

**Goal**: Parent receives professionally formatted email with complete test results

**Independent Test**: Parent receives professionally formatted email with complete test results

### Implementation for User Story 5

- [ ] T091 [US5] Create apps/api/src/modules/email/templates/parent-report.html with formal Russian content
- [ ] T092 [US5] Create apps/api/src/modules/email/templates/parent-report.txt plain text fallback
- [ ] T093 [US5] Implement sendParentReport method in email.service.ts with SendPulse API
- [ ] T094 [US5] Create POST /results/:sessionId/email-report endpoint in results.controller.ts
- [ ] T095 [US5] Add "Send to parents" button handler in results.handler.ts
- [ ] T096 [US5] Implement dual-persona messaging (formal for parents) in email templates
- [ ] T097 [US5] Add consultation CTA button to parent email template
- [ ] T098 [US5] Create apps/api/src/modules/email/email.module.ts and register in app.module.ts

**Checkpoint**: User Story 5 complete - parent email reports work

---

## Phase 10: User Story 7 - Referral System (Priority: P2)

**Goal**: Students can earn points by referring friends who complete the test

**Independent Test**: Referral link tracks conversions and awards points correctly

### Implementation for User Story 7

- [ ] T099 [US7] Create apps/bot/src/services/referral.service.ts with trackReferral, completeReferral methods
- [ ] T100 [US7] Implement deep link parsing for ref_ parameter in start.handler.ts
- [ ] T101 [US7] Create ReferralTracking record on referral link click (PENDING status) in referral.service.ts
- [ ] T102 [US7] Update referral status to COMPLETED when referee finishes test in quiz.handler.ts
- [ ] T103 [US7] Award +50 points to referrer and +25 to referee on completion in referral.service.ts
- [ ] T104 [US7] Send notification to referrer on successful referral in notification.service.ts
- [ ] T105 [US7] Create apps/bot/src/handlers/referral.handler.ts for referral status display
- [ ] T106 [US7] Implement referral milestone badges (3, 5, 10 referrals) in gamification.service.ts

**Checkpoint**: User Story 7 complete - referral system works

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, rate limiting, deployment configuration

- [ ] T107 [P] Add @grammyjs/ratelimiter middleware in apps/bot/src/bot.ts (20 cmd/min, 10 answers/min)
- [ ] T108 [P] Implement /help command in apps/bot/src/handlers/start.handler.ts
- [ ] T109 [P] Implement /cancel command in apps/bot/src/handlers/quiz.handler.ts
- [ ] T110 [P] Implement /privacy command in apps/bot/src/handlers/start.handler.ts
- [ ] T111 [P] Add graceful shutdown handlers (SIGINT, SIGTERM) in apps/bot/src/bot.ts
- [ ] T112 [P] Create error boundary middleware with Telegram error notifications in bot.ts
- [ ] T113 [P] Update ecosystem.config.js with bot PM2 configuration (single instance, fork mode)
- [ ] T114 Add retake policy validation (7-day cooldown, max 3 tests) in quiz.service.ts
- [ ] T115 [P] Create apps/api/src/modules/gamification/gamification.module.ts and register
- [ ] T116 Implement test validation per FR-030 to FR-033 (data protection, consent, parental confirmation <16)
- [ ] T117 Run type-check and build for apps/bot package
- [ ] T118 Run quickstart.md verification checklist manually
- [ ] T119 Deploy to VDS using PM2 and verify bot responds to /start

---

## Phase 12: PDF Roadmap Generation (FR-037)

**Purpose**: Generate downloadable PDF career roadmap for students with personalized development plan

**Independent Test**: Student with 1000+ points can download personalized PDF career roadmap

### Implementation for FR-037

- [ ] T120 [FR-037] Install pdfkit dependency in apps/api/package.json
- [ ] T121 [FR-037] Create apps/api/src/modules/pdf/pdf.service.ts with PDFKit integration
- [ ] T122 [FR-037] Implement generateCareerRoadmap method with radar chart embedding in pdf.service.ts
- [ ] T123 [FR-037] Create PDF template with sections: profile summary, top careers, development steps, universities
- [ ] T124 [FR-037] Add Inter font registration for Russian text support in pdf.service.ts
- [ ] T125 [FR-037] Create apps/api/src/modules/pdf/pdf.controller.ts with GET /results/:sessionId/pdf-roadmap
- [ ] T126 [FR-037] Create apps/api/src/modules/pdf/pdf.module.ts and register in app.module.ts
- [ ] T127 [FR-037] Add "PDF Roadmap" button handler in apps/bot/src/handlers/results.handler.ts
- [ ] T128 [FR-037] Implement 1000-point unlock check before PDF generation in results.handler.ts
- [ ] T129 [FR-037] Add PDF roadmap endpoint to contracts/api-endpoints.md

**Checkpoint**: FR-037 complete - students with 1000+ points can download PDF roadmap

---

## Phase 13: Data Retention & Privacy (FR-038, FR-039, FR-040)

**Purpose**: Implement 3-year data retention policy, anonymization, and user data deletion rights

**Independent Test**: User can request data deletion; data older than 3 years is automatically anonymized

### Implementation for FR-038 (3-year retention)

- [ ] T130 [FR-038] Create packages/database/prisma/scripts/check-retention.ts to identify expired data
- [ ] T131 [FR-038] Add retentionExpiresAt field to User model (createdAt + 3 years, updated on activity)
- [ ] T132 [FR-038] Run migration to add retentionExpiresAt field to User table

### Implementation for FR-039 (Anonymization)

- [ ] T133 [FR-039] Create packages/database/prisma/scripts/anonymize-users.ts with anonymization logic
- [ ] T134 [FR-039] Implement anonymization: replace telegramId, names, email with hashed placeholders
- [ ] T135 [FR-039] Preserve TestResult data for analytics (keep riasecProfile, remove PII links)
- [ ] T136 [FR-039] Create PM2 cron job config for weekly anonymization check in ecosystem.config.js
- [ ] T137 [FR-039] Add pg_cron alternative SQL migration for Supabase-native scheduling

### Implementation for FR-040 (Data deletion on request)

- [ ] T138 [FR-040] Create apps/bot/src/handlers/privacy.handler.ts with /deletedata command
- [ ] T139 [FR-040] Implement 2-step confirmation flow for data deletion (confirm code via callback)
- [ ] T140 [FR-040] Create apps/api/src/modules/user/user.service.ts deleteUserData method with cascade delete
- [ ] T141 [FR-040] Add deletion audit log entry before removing user data
- [ ] T142 [FR-040] Send confirmation message after successful deletion with timestamp
- [ ] T143 [FR-040] Update contracts/bot-commands.md with /deletedata command specification

**Checkpoint**: FR-038-040 complete - data retention, anonymization, and deletion working

---

## Phase 14: Metrics & Observability (FR-036)

**Purpose**: Track basic engagement metrics for product analytics

**Independent Test**: Admin can view completion rate, average duration, and DAU metrics

### Implementation for FR-036

- [ ] T144 [FR-036] Create apps/api/src/modules/metrics/metrics.service.ts with basic counters
- [ ] T145 [FR-036] Implement trackEvent method for test_started, test_completed, test_abandoned events
- [ ] T146 [FR-036] Create daily aggregation query for completion_rate, avg_duration, dau
- [ ] T147 [FR-036] Create apps/api/src/modules/metrics/metrics.controller.ts with GET /metrics/daily (admin only)
- [ ] T148 [FR-036] Add INTERNAL_ADMIN_TOKEN env var for metrics endpoint authentication
- [ ] T149 [FR-036] Create apps/api/src/modules/metrics/metrics.module.ts and register

**Checkpoint**: FR-036 complete - basic metrics available via internal API

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
- **Polish (Phase 11)**: Depends on all P1 user stories (3, 4, 5, 6) being complete
- **PDF Roadmap (Phase 12)**: Depends on Phase 7 (US3 - results exist), Phase 6 (US2 - points system)
- **Data Retention (Phase 13)**: Depends on Phase 2 (User model exists), can parallel with Phase 12
- **Metrics (Phase 14)**: Depends on Phase 3 (US1 - test events exist), can parallel with Phase 12-13

### User Story Dependencies

| Story | Priority | Dependencies | Notes |
|-------|----------|--------------|-------|
| US1: Career Assessment | P1 | Foundational only | Core MVP |
| US6: Test Resume | P1 | US1 (session exists) | Extension of US1 |
| US8: Insight Teasers | P1 | US1 (quiz flow exists) | Extension of US1 |
| US2: Gamification | P1 | US1 (test flow exists) | Can parallel after T051 |
| US3: Share Results | P1 | US1 (results exist) | Needs chart service |
| US4: Parent Registration | P2 | Foundational only | Independent |
| US5: Parent Email | P2 | US4 (parent exists), US1 (results exist) | Needs both |
| US7: Referral System | P2 | US1 (test completion), US2 (points) | Needs both |
| FR-037: PDF Roadmap | P2 | US2 (points unlock), US1 (results exist) | 1000 pts unlock |
| FR-038-040: Data Retention | P3 | Foundational (User model) | Compliance requirement |
| FR-036: Metrics | P3 | US1 (test events) | Analytics |

### Recommended Execution Order

1. **MVP Path (P1 stories only)**:
   - Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US6) → Phase 5 (US8) → Phase 6 (US2) → Phase 7 (US3)

2. **Full Implementation**:
   - After MVP: Phase 8 (US4) → Phase 9 (US5) → Phase 10 (US7) → Phase 11 (Polish)

### Within Each Phase

- Tasks marked [P] can run in parallel within that phase
- Models before services
- Services before handlers
- Core implementation before integration

---

## Parallel Opportunities

### Phase 2 (Foundational) Parallel Groups

```bash
# Group A: Schema extensions (T009-T015 in parallel)
T009 Question fields, T010 QuestionOption, T011 Career, T012 TestResult,
T013 EmailVerification, T014 ParentLinkCode, T015 Enums

# Group B: Shared types (T022-T024 in parallel)
T022 riasec.ts, T023 gamification.ts, T024 constants/riasec.ts

# Group C: Seed data (T018-T019 in parallel)
T018 questions.ts, T019 careers.ts
```

### Phase 3 (US1) Parallel Groups

```bash
# Group A: Handlers and services (T032-T033 in parallel)
T032 start.handler.ts, T033 user.service.ts

# Group B: API modules (after core bot work)
T043 chart.service.ts, T047 careers.service.ts (parallel)
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US1 - Career Assessment
4. **STOP and VALIDATE**: Test US1 independently - can student complete test and see results?
5. Complete Phase 4: US6 - Resume (natural extension)
6. Complete Phase 5: US8 - Insight Teasers (engagement feature)
7. Complete Phase 6: US2 - Gamification
8. Complete Phase 7: US3 - Share Results
9. **Deploy MVP**: All P1 stories complete

### P2 Stories (Post-MVP)

1. Phase 8: US4 - Parent Registration
2. Phase 9: US5 - Parent Email
3. Phase 10: US7 - Referral System
4. Phase 11: Polish & Deploy full feature

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Tasks | 149 |
| Phase 0 (Planning) | 4 |
| Phase 1 (Setup) | 7 |
| Phase 2 (Foundational) | 23 |
| Phase 3 (US1) | 22 |
| Phase 4 (US6) | 6 |
| Phase 5 (US8) | 5 |
| Phase 6 (US2) | 10 |
| Phase 7 (US3) | 7 |
| Phase 8 (US4) | 10 |
| Phase 9 (US5) | 8 |
| Phase 10 (US7) | 8 |
| Phase 11 (Polish) | 13 |
| Phase 12 (PDF Roadmap) | 10 |
| Phase 13 (Data Retention) | 14 |
| Phase 14 (Metrics) | 6 |
| Parallelizable Tasks | 48 |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story
- Each user story should be independently testable after completion
- Commit after each task with `/push patch`
- Stop at checkpoints to validate story independently
- Database-Driven FSM: currentStep integer in DB, NOT @grammyjs/conversations
- SendPulse for emails (12K free/month)
- Chart.js + @napi-rs/canvas for local chart generation

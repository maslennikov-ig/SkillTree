# Technical Requirements: SkillTree Telegram Bot MVP

**Feature Branch**: `002-telegram-bot-mvp`
**Created**: 2025-01-27
**Updated**: 2025-12-28
**Status**: Research Complete — Ready for Specification
**Complexity**: High (Full feature with gamification, quiz flow, visualization)

---

## 1. Executive Summary

Разработка полнофункционального Telegram бота для профориентационного тестирования школьников 14-17 лет. Бот включает:

- **55-вопросный тест карьерного потенциала** с 5 секциями
- **Полную систему геймификации** (очки, бейджи, стрики, рефералы)
- **Визуализацию результатов** (radar charts, shareable cards)
- **Интеграцию с родителями** (email reports, dual-persona messaging)
- **Viral mechanics** для органического роста

**Ключевые метрики**:
- Completion rate: 70%+ (vs industry 50-60%)
- Viral coefficient: >1.0 к месяцу 3
- Share rate: 30%+
- Parent email opt-in: 50%+

---

## 2. Architecture Overview

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Telegram Platform                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Bot API   │    │ Mini App    │    │ Cloud Storage API   │ │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘ │
└─────────┼──────────────────┼───────────────────────┼────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     apps/bot (grammY)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Conversations│  │   Handlers   │  │    Session/State     │  │
│  │  (quiz flow) │  │  (commands)  │  │    Management        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                     apps/api (NestJS)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Services   │  │ Controllers  │  │     Integrations     │  │
│  │  - Quiz      │  │ - Results    │  │  - SendGrid (email)  │  │
│  │  - Gamify    │  │ - Charts     │  │  - QuickChart (viz)  │  │
│  │  - Results   │  │ - Webhooks   │  │  - Canvas (cards)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                  packages/database (Prisma)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  User, Student, Parent, TestSession, Question, Answer,   │   │
│  │  DailyStreak, Achievement, ReferralTracking              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Supabase Cloud   │
                    │   PostgreSQL      │
                    └───────────────────┘
```

### 2.2 Deployment Model

```
Production VDS (95.81.97.236)
├── PM2 Cluster
│   ├── api (2 instances) - port 4000
│   └── bot (2 instances) - long polling
├── Caddy Reverse Proxy
│   └── api.skilltree.app → localhost:4000
└── Redis 7.x - session cache, rate limiting
```

**Bot Mode**: Long polling (не webhook) для упрощения development и debugging.

---

## 3. Functional Requirements

### 3.1 User Registration & Onboarding

#### FR-001: /start Command Handler
```
Trigger: Пользователь запускает бота или переходит по ссылке
Flow:
1. Проверить существование User по telegramId
2. Если новый:
   - Создать User record
   - Показать welcome message с inline keyboard
   - Предложить выбор роли: "Я студент" | "Я родитель"
3. Если существующий:
   - Показать главное меню
```

#### FR-002: Student Registration
```
Trigger: Пользователь выбирает "Я студент"
Conversation Flow:
1. Запросить возраст (inline keyboard: 14, 15, 16, 17, 18+)
2. Запросить класс (inline keyboard: 8, 9, 10, 11)
3. Создать Student record
4. Показать главное меню студента
```

#### FR-003: Parent Registration
```
Trigger: Пользователь выбирает "Я родитель"
Conversation Flow:
1. Запросить email (text input с валидацией)
2. Опционально: телефон
3. Создать Parent record
4. Показать инструкции по привязке к ребенку
```

#### FR-004: Parent-Student Linking
```
Trigger: Родитель вводит код ребенка
Flow:
1. Студент генерирует уникальный код: /linkcode
2. Родитель вводит код: /link <code>
3. Создать ParentStudent relation
4. Уведомить обоих участников
```

### 3.2 Career Test Flow (Core Feature)

#### FR-005: Test Structure
```
Total: 55 questions, 5 sections, ~12-15 minutes

Section 1: "Начнём знакомство" (Q1-11)
- Difficulty: Easy
- Types: Multiple choice with emoji
- Purpose: Build momentum, low drop-off

Section 2: "Узнаём тебя лучше" (Q12-22)
- Difficulty: Easy-Medium
- Types: Rating scales, multiple choice
- Insight teaser at Q15

Section 3: "Погружаемся глубже" (Q23-33)
- Difficulty: Medium
- Types: Visual selections, rankings
- Insight teaser at Q28
- Easter egg at Q33 (DETECTIVE badge)

Section 4: "Почти у цели" (Q34-44)
- Difficulty: Medium-Hard
- Types: Open-ended (1-2 max), complex choice
- Insight teaser at Q40

Section 5: "Финишная прямая" (Q45-55)
- Difficulty: Easy-Medium
- Types: Quick binary, easy closure
- Countdown messages: "5 left!", "3 left!", etc.
```

#### FR-006: Question Types Implementation
```typescript
enum QuestionType {
  MULTIPLE_CHOICE   // 2-4 варианта с emoji, inline keyboard
  RATING_SCALE      // 1-5 stars, inline keyboard с ⭐
  VISUAL_SELECTION  // Image + caption, inline keyboard
  OPEN_ENDED        // Free text input (max 2-3 per test)
  BINARY_CHOICE     // Yes/No, True/False
}

// Example question rendering:
MULTIPLE_CHOICE:
"Что тебя привлекает больше?
💻 Технологии | 🎨 Искусство | 🔬 Наука | 🤝 Люди"

RATING_SCALE:
"Оцени свой интерес к решению сложных задач:
⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐"
```

#### FR-007: Progress Tracking
```
After each question:
- Update session state (currentQuestion, answers)
- Show progress: "Вопрос 12/55 | Секция 2/5 | 22% ⬛⬛⬜⬜⬜"
- Award points: +10 per question

After each section:
- Celebration message with sticker
- Award badge (Bronze/Silver/Gold/Platinum at 25%/50%/75%/100%)
- Section bonus: +100 points
- Insight teaser (after sections 2, 3, 4)
```

#### FR-008: Auto-Save & Resume
```
State persistence:
- Save after EVERY question to database
- TestSession stores: currentQuestionIndex, answeredQuestions[], partialResults
- /resume command continues from last question
- Session survives bot restart, app close

Timeout handling:
- 24 hours: Mark session ABANDONED
- Send reminder at 12 hours: "Ты остановился на вопросе 23. Продолжить? 🚀"
```

#### FR-009: Section Insight Teasers
```
After Section 2 (40% complete):
"🔍 Интересно...
Твои ответы указывают на:
• Сильное аналитическое мышление
• Интерес к технологиям

Продолжай, чтобы увидеть полный профиль! (33 вопроса осталось)"

After Section 3 (60% complete):
"⭐ Ты на правильном пути!
Твой показатель Investigative: 78/100 — выше среднего! 📊
Что это значит? Узнаешь через 22 вопроса 😉"

After Section 4 (80% complete):
"🎯 Почти готово!
Твоя топ-профессия скоро будет раскрыта...
[Продолжить финальный спринт]"
```

### 3.3 Results & Visualization

#### FR-010: RIASEC Score Calculation

> **Reference**: [RIASEC Research](../../docs/Research/RIASEC%20Career%20Assessment%20System%20for%20Russian%20Teenagers.md)

```typescript
// Holland Code (RIASEC) dimensions:
interface RIASECProfile {
  R: number; // Realistic: 0-100, Hands-on, technical
  I: number; // Investigative: 0-100, Research, analysis
  A: number; // Artistic: 0-100, Creative expression
  S: number; // Social: 0-100, Helping, teaching
  E: number; // Enterprising: 0-100, Leadership, business
  C: number; // Conventional: 0-100, Organization, detail
}

// Normative data (O*NET teen population estimates)
const NORMS = {
  R: { mean: 16.5, sd: 9.2 },
  I: { mean: 20.3, sd: 8.8 },
  A: { mean: 21.1, sd: 9.5 },
  S: { mean: 24.7, sd: 8.5 },
  E: { mean: 21.4, sd: 9.0 },
  C: { mean: 17.8, sd: 8.9 }
};

// Raw score → Percentile normalization
function normalizeToPercentile(rawScore: number, mean: number, sd: number): number {
  const z = (rawScore - mean) / sd;
  return Math.round(zToPercentile(z)); // 0-100
}

// Top 3 dimensions form Holland Code (e.g., "ISA", "RIC")
```

#### FR-010a: Score Interpretation Guidelines

> **Reference**: [results-strategy.md](../001-project-setup/results-strategy.md)

| Score Range | Label | Message (RU) |
|-------------|-------|--------------|
| 80-100 | Superpower | "Это твоя суперсила! 💪" |
| 60-79 | Good Fit | "Отличный потенциал! ⭐" |
| 40-59 | Moderate | "Можно развить 📈" |
| 20-39 | Lower Priority | "Другие области подходят лучше" |
| 0-19 | Minimal | "Фокусируйся на своих сильных сторонах" |

#### FR-010b: Personality Archetypes (12 Types)

Based on top 2 RIASEC dimensions, generate archetype name:

```typescript
const ARCHETYPES: Record<string, { name: string; emoji: string }> = {
  'RI': { name: 'Технический аналитик', emoji: '🔧🔬' },
  'IR': { name: 'Научный практик', emoji: '🔬🔧' },
  'IA': { name: 'Креативный исследователь', emoji: '🔬🎨' },
  'AI': { name: 'Аналитический творец', emoji: '🎨🔬' },
  'AS': { name: 'Творческий коммуникатор', emoji: '🎨🤝' },
  'SA': { name: 'Социальный артист', emoji: '🤝🎨' },
  'SE': { name: 'Лидер-наставник', emoji: '🤝💼' },
  'ES': { name: 'Социальный предприниматель', emoji: '💼🤝' },
  'EC': { name: 'Системный управленец', emoji: '💼📊' },
  'CE': { name: 'Организованный лидер', emoji: '📊💼' },
  'CR': { name: 'Практичный организатор', emoji: '📊🔧' },
  'RC': { name: 'Технический систематик', emoji: '🔧📊' },
};

function getArchetype(profile: RIASECProfile): string {
  const sorted = Object.entries(profile).sort(([,a], [,b]) => b - a);
  const code = sorted[0][0] + sorted[1][0];
  return ARCHETYPES[code]?.name || 'Универсал';
}
```

#### FR-011: Radar Chart Generation
```typescript
// Using QuickChart API (free, no server-side libs needed)
const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
  type: 'radar',
  data: {
    labels: ['Realistic 🔧', 'Investigative 🔬', 'Artistic 🎨',
             'Social 🤝', 'Enterprising 💼', 'Conventional 📊'],
    datasets: [{
      label: 'Твой профиль',
      data: [65, 88, 72, 45, 58, 80],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2
    }]
  },
  options: {
    scale: { ticks: { beginAtZero: true, max: 100 } }
  }
}))}`;

// Send as photo to Telegram
await ctx.replyWithPhoto(chartUrl);
```

#### FR-012: Career Matching Algorithm

> **Reference**: [RIASEC Research](../../docs/Research/RIASEC%20Career%20Assessment%20System%20for%20Russian%20Teenagers.md) — Pearson Correlation (O*NET standard)

```typescript
interface CareerMatch {
  career: Career;
  correlation: number;      // -1 to 1 (Pearson r)
  matchPercentage: number;  // 0-100 (mapped from r)
  matchCategory: 'Best Fit' | 'Great Fit' | 'Good Fit' | 'Poor Fit';
}

// Pearson Correlation (gold standard per O*NET)
function pearsonCorrelation(a: RIASECProfile, b: RIASECProfile): number {
  const dims = ['R', 'I', 'A', 'S', 'E', 'C'];
  const aVals = dims.map(d => a[d]), bVals = dims.map(d => b[d]);
  const aMean = aVals.reduce((x, y) => x + y) / 6;
  const bMean = bVals.reduce((x, y) => x + y) / 6;

  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < 6; i++) {
    const da = aVals[i] - aMean, db = bVals[i] - bMean;
    num += da * db; denA += da * da; denB += db * db;
  }
  return denA && denB ? num / Math.sqrt(denA * denB) : 0;
}

// Map correlation to match percentage
function matchCareers(profile: RIASECProfile, careers: Career[]): CareerMatch[] {
  return careers.map(career => {
    const r = pearsonCorrelation(profile, career.riasecProfile);
    const matchPercentage = Math.round(((r + 1) / 2) * 100);
    const matchCategory = r >= 0.729 ? 'Best Fit' : r >= 0.608 ? 'Great Fit' : r >= 0 ? 'Good Fit' : 'Poor Fit';
    return { career, correlation: r, matchPercentage, matchCategory };
  }).sort((a, b) => b.correlation - a.correlation);
}
```

#### FR-013: Shareable Results Card
```typescript
// Server-side generation with Canvas API
interface ResultsCard {
  dimensions: [1080, 1080];  // Instagram/Stories optimized
  elements: {
    logo: 'top-left, 120x120px';
    radarChart: 'center, 600x600px';
    personalityType: 'Strategic Innovator 🧠';
    topCareer: 'Data Scientist (92% match)';
    cta: 't.me/skilltreebot — Пройди тест!';
  };
  colorScheme: 'based on top dimension';
  // Blue for Investigative, Pink for Artistic, etc.
}

// Generate PNG buffer, send via ctx.replyWithPhoto()
```

#### FR-014: Results Progressive Disclosure
```
Immediate (test completion):
1. "🔍 Анализируем твои 55 ответов..." (animated GIF)
2. Delay 2-3 seconds (anticipation)
3. Reveal personality archetype: "Ты — Strategic Innovator 🧠💡"

Core results (30 seconds):
4. Send radar chart as photo
5. "Твои топ-3 силы: 🧠 Critical Thinking • 🎨 Creativity • 📊 Analysis"

Detailed (on-demand):
6. Inline keyboard:
   [📊 Полный отчёт] [🎓 Карьеры] [💪 Развитие] [📤 Поделиться]

Each button expands to new message with relevant content
```

### 3.4 Gamification System

#### FR-015: Points System
```typescript
// Point economy:
const POINTS = {
  QUESTION_ANSWERED: 10,
  SECTION_COMPLETED: 100,
  TEST_COMPLETED: 500,
  SHARE_RESULTS: 25,
  REFERRAL_COMPLETED: 50,
  REFERRAL_BONUS_REFEREE: 25,
  EASTER_EGG_FOUND: 30,
  DAILY_STREAK: (day: number) => day, // 1,2,3,4,5,6,7
};

// Maximum per test: 55×10 + 5×100 + 500 = 1,550 points
```

#### FR-015a: Point Utility (Unlockables)

> **Reference**: [gamification-strategy.md](../001-project-setup/gamification-strategy.md)

| Points | Unlock | Description |
|--------|--------|-------------|
| 500 | Career Comparison | Compare 2 careers side-by-side |
| 1,000 | PDF Roadmap | Downloadable career development plan |
| 2,000 | Free Consultation | 15-min call with career expert |
| 5,000 | Premium Insights | Lifetime access to advanced analytics |
| 10,000 | Mentor Session | 1-hour personal career mentor call |

```typescript
// Check unlocks
function getUnlockedFeatures(totalPoints: number): string[] {
  const unlocks = [];
  if (totalPoints >= 500) unlocks.push('CAREER_COMPARISON');
  if (totalPoints >= 1000) unlocks.push('PDF_ROADMAP');
  if (totalPoints >= 2000) unlocks.push('FREE_CONSULTATION');
  if (totalPoints >= 5000) unlocks.push('PREMIUM_INSIGHTS');
  if (totalPoints >= 10000) unlocks.push('MENTOR_SESSION');
  return unlocks;
}
```

#### FR-016: Badge System
```typescript
// Progress badges (sent as stickers):
BRONZE_EXPLORER:   25% complete (14 questions)
SILVER_SEEKER:     50% complete (28 questions)
GOLD_ACHIEVER:     75% complete (42 questions)
PLATINUM_MASTER:   100% complete (55 questions)

// Behavior badges:
SPEED_DEMON:       Finished test <10 minutes
THOUGHTFUL_ANALYST: Spent time on open-ended

// Streak badges:
STREAK_3_DAYS:     3 consecutive activity days
STREAK_7_DAYS:     7-day perfect week

// Referral badges:
REFERRAL_BRONZE:   3 completed referrals
REFERRAL_SILVER:   5 completed referrals
REFERRAL_GOLD:     10 completed referrals

// Easter eggs (hidden):
NIGHT_OWL:         Test between 11pm-2am
EARLY_BIRD:        Test between 5am-7am
DETECTIVE:         Found hidden hint at Q33
```

#### FR-017: Weekly Streak System
```typescript
// Progressive bonus mechanic (unique to SkillTree):
Monday:    Activity → +1 point,  Display: "🔥 Day 1! +1 pt. Tomorrow: +2!"
Tuesday:   Activity → +2 points, Display: "🔥 Day 2! +2 pts. Tomorrow: +3!"
Wednesday: Activity → +3 points, Display: "Halfway to perfect week! 💪"
Thursday:  Activity → +4 points
Friday:    Activity → +5 points
Saturday:  Activity → +6 points
Sunday:    Activity → +7 points, Display: "🎉 PERFECT WEEK! +7 pts. Total: 28!"

// Qualifying activities:
- Answer 1+ questions
- View career recommendations
- Share results
- Complete referral action

// Weekly reset: Every Monday 00:00 Moscow time
// Track: currentDay, weeklyPoints, longestStreak
```

#### FR-018: Referral System
```typescript
// Referral link format:
`t.me/skilltreebot?start=ref_${userId}`

// Flow:
1. User A shares link
2. User B clicks, starts bot
3. Bot detects `ref_` parameter
4. Create ReferralTracking(referrerId=A, refereeId=B, status=PENDING)
5. User B completes test
6. Status → COMPLETED
7. Award A: +50 points, notify "🎉 [Name] completed! +50 pts"
8. Award B: +25 welcome bonus

// Milestones:
3 referrals → Unlock Career Comparison feature
5 referrals → Free 15-min consultation
10 referrals → Premium insights lifetime
```

### 3.5 Parent Engagement

#### FR-019: Parent Email Reports

> **Reference**: [results-strategy.md](../001-project-setup/results-strategy.md)

```typescript
// Trigger: After test completion, student opts-in
// "Хочешь отправить результаты родителям? 📧"
// [Да, отправить на email] [Пропустить]

interface ParentEmailReport {
  to: string;
  subject: "[Имя]: Результаты теста карьерного потенциала";
  content: {
    radarChartUrl: string;
    topCareers: CareerMatch[];
    strengths: string[];
    developmentAreas: string[];
    nextSteps: string[];
    ctaButton: "Записаться на консультацию";
  };
}
```

#### FR-019a: Email Validation Flow

```typescript
// 4-digit confirmation code for parent email verification
async function initiateEmailVerification(ctx: Context, email: string) {
  // 1. Validate format
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return ctx.reply("❌ Неверный формат email. Попробуй ещё раз.");
  }

  // 2. Generate 4-digit code
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  // 3. Store pending verification
  await prisma.emailVerification.create({
    data: { email, code, userId: ctx.from.id, expiresAt: addMinutes(new Date(), 15) }
  });

  // 4. Send verification email
  await sendVerificationEmail(email, code);

  // 5. Prompt user
  await ctx.reply("📧 Код подтверждения отправлен на " + email +
    "\nВведи 4-значный код:");
}

// User enters code
async function verifyEmailCode(ctx: Context, inputCode: string) {
  const verification = await prisma.emailVerification.findFirst({
    where: { userId: ctx.from.id, code: inputCode, expiresAt: { gt: new Date() } }
  });

  if (!verification) {
    return ctx.reply("❌ Неверный или истёкший код. Попробуй ещё раз.");
  }

  // Mark verified, send full report
  await prisma.parent.update({
    where: { userId: ctx.from.id },
    data: { email: verification.email, emailVerified: true }
  });

  await sendParentReport(verification.email, ctx.from.id);
  await ctx.reply("✅ Email подтверждён! Отчёт отправлен родителям.");
}
```

#### FR-020: Dual-Persona Messaging
```
FOR TEENS (in bot):
- Tone: Energetic, emoji-heavy, gamified
- "🎮 Level Up! Ты открыл Strategic Innovator!"
- "📤 Поделись с друзьями — кто ты на самом деле?"
- Language: "ты", short sentences

FOR PARENTS (in email):
- Tone: Professional, evidence-based
- "Ваш ребенок показал выдающиеся способности в аналитическом мышлении (88-й процентиль)"
- "Рекомендуемые направления: Data Science (прогнозируемый доход: 150,000-300,000₽/мес)"
- Language: "Вы", longer sentences, statistics
```

### 3.6 Commands & Menu

#### FR-021: Bot Commands
```
/start        - Начать работу с ботом / главное меню
/test         - Начать новый тест
/resume       - Продолжить незавершённый тест
/results      - Посмотреть результаты
/streak       - Статус стрика и очков
/achievements - Список бейджей
/share        - Поделиться результатами
/linkcode     - Получить код для родителя (студент)
/link <code>  - Привязать ребёнка (родитель)
/help         - Справка
/cancel       - Отменить текущее действие
```

#### FR-022: Main Menu (Persistent Keyboard)
```
Student Menu:
┌────────────────────────────────────┐
│  🚀 Начать тест  │  📊 Результаты  │
├────────────────────────────────────┤
│  🔥 Мой стрик    │  🏆 Достижения  │
├────────────────────────────────────┤
│  📤 Поделиться   │  ❓ Помощь      │
└────────────────────────────────────┘

Parent Menu:
┌────────────────────────────────────┐
│  👶 Мои дети     │  📊 Отчёты      │
├────────────────────────────────────┤
│  🔗 Привязать    │  ❓ Помощь      │
└────────────────────────────────────┘
```

---

## 4. Technical Specifications

### 4.1 grammY Bot Setup (FSM Architecture)

> ⚠️ **CRITICAL**: Do NOT use `@grammyjs/conversations` plugin for 55-question flow.
> See [grammY Deep Think Research](../../docs/Deep%20Think/%20grammY%20Conversation%20Architecture%20(Deep%20Think).md) for rationale.

```typescript
// apps/bot/src/bot.ts
import { Bot, Context, InlineKeyboard } from "grammy";
import { PrismaClient, QuizSession } from "@prisma/client";
import { QUIZ_FLOW } from "./content";

const prisma = new PrismaClient();
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// Extended context with quiz session
type MyContext = Context & {
  quizSession?: QuizSession;
};

// MIDDLEWARE: State Loader & Timeout Manager
bot.use(async (ctx: MyContext, next) => {
  if (ctx.from) {
    const session = await prisma.quizSession.findFirst({
      where: { userId: BigInt(ctx.from.id), status: "ACTIVE" },
      orderBy: { updatedAt: 'desc' }
    });

    if (session) {
      // Check 24h timeout
      const hoursInactive = (Date.now() - session.updatedAt.getTime()) / 36e5;

      if (hoursInactive > 24) {
        await prisma.quizSession.update({
          where: { id: session.id },
          data: { status: "ABANDONED" }
        });

        if (ctx.hasCommand("start")) return next();
        return ctx.reply("Сессия истекла. /start чтобы начать заново.");
      }

      ctx.quizSession = session;
    }
  }
  await next();
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

await bot.start();
```

### 4.2 FSM Quiz Engine

> **Pattern**: Instruction Pointer stored in DB, bot is stateless event handler.
> See [grammY Deep Think](../../docs/Deep%20Think/%20grammY%20Conversation%20Architecture%20(Deep%20Think).md) for complete implementation.

```typescript
// apps/bot/src/handlers/quiz.handler.ts
import { QUIZ_FLOW, Question } from "../content";

// THE ENGINE: Main Loop (event-driven, not conversation-based)
bot.on(["message:text", "callback_query:data"], async (ctx: MyContext) => {
  const session = ctx.quizSession;
  if (!session) return; // Not in quiz

  // Ignore flow control buttons
  if (ctx.callbackQuery?.data.startsWith("flow_")) return;

  const currentQ = QUIZ_FLOW[session.currentStep];
  let answer: string | null = null;

  // --- A. Validate Input ---
  if (currentQ.type === 'CALLBACK' && ctx.callbackQuery) {
    answer = ctx.callbackQuery.data;
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: undefined });
  }
  else if (currentQ.type === 'TEXT' && ctx.message?.text) {
    answer = ctx.message.text;
    if (currentQ.validator && !currentQ.validator(answer)) {
      return ctx.reply("Неверный формат. Попробуй ещё раз.");
    }
  }
  else {
    if (currentQ.type === 'CALLBACK') return ctx.reply("Выбери один из вариантов.");
    return;
  }

  if (!answer) return;

  // --- B. Persist State (atomic) ---
  const newAnswers = { ...(session.answers as object), [currentQ.id]: answer };
  const nextStep = session.currentStep + 1;

  await prisma.quizSession.update({
    where: { id: session.id },
    data: { answers: newAnswers, currentStep: nextStep }
  });

  // --- C. Section Transitions ---
  if (nextStep < QUIZ_FLOW.length) {
    // Every 11 questions, show celebration
    if (nextStep > 0 && nextStep % 11 === 0) {
      return ctx.reply(`🎉 Секция ${Math.floor(nextStep / 11)} завершена!`, {
        reply_markup: new InlineKeyboard().text("Продолжить", "flow_resume")
      });
    }
    await renderStep(ctx, nextStep);
  } else {
    // Test completed
    await prisma.quizSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" }
    });
    await ctx.reply("🏆 Тест завершён! Анализирую результаты...");
    await generateResults(session.id, ctx);
  }
});

// Render question at given index
async function renderStep(ctx: Context, index: number) {
  const q = QUIZ_FLOW[index];

  if (q.type === 'CALLBACK') {
    const kb = new InlineKeyboard();
    q.options?.forEach(opt => kb.text(opt.label, opt.value).row());
    await ctx.reply(q.text, { reply_markup: kb });
  } else {
    await ctx.reply(q.text);
  }
}
```

### 4.3 Database Schema Extensions

```prisma
// packages/database/prisma/schema.prisma

// Existing models already have gamification fields ✅
// Add bot session storage:

model BotSession {
  id        String   @id
  data      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([id])
}

// Add question options for multiple choice:
model QuestionOption {
  id         String   @id @default(cuid())
  questionId String
  text       String
  emoji      String?
  value      String   // What gets stored in Answer
  order      Int

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId])
}

// Add career database:
model Career {
  id               String   @id @default(cuid())
  title            String
  titleRu          String
  description      String
  descriptionRu    String
  salaryMin        Int
  salaryMax        Int
  riasecProfile    Json     // { R: 60, I: 90, A: 40, S: 30, E: 50, C: 70 }
  requiredSkills   String[]
  developmentPath  String[]
  category         String

  @@index([category])
}

// Add results storage:
model TestResult {
  id            String   @id @default(cuid())
  sessionId     String   @unique
  riasecProfile Json     // Calculated RIASEC scores
  topCareers    Json     // Array of CareerMatch
  personalityType String
  radarChartUrl String?
  shareCardUrl  String?
  createdAt     DateTime @default(now())

  session TestSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

// Email verification for parents:
model EmailVerification {
  id        String   @id @default(cuid())
  userId    String
  email     String
  code      String   // 4-digit code
  expiresAt DateTime
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([code])
}

// Career outlook enum:
enum CareerOutlook {
  GROWING
  STABLE
  DECLINING
}

enum DemandLevel {
  HIGH
  MEDIUM
  LOW
}
```

### 4.4 API Endpoints (NestJS)

```typescript
// apps/api/src/modules/results/results.controller.ts

@Controller('results')
export class ResultsController {

  @Get(':sessionId/radar-chart')
  async getRadarChart(@Param('sessionId') sessionId: string): Promise<string> {
    // Returns QuickChart URL for radar chart
  }

  @Get(':sessionId/share-card')
  async getShareCard(@Param('sessionId') sessionId: string): Promise<Buffer> {
    // Returns PNG buffer of shareable card
  }

  @Post(':sessionId/email-report')
  async sendEmailReport(
    @Param('sessionId') sessionId: string,
    @Body() dto: { parentEmail: string }
  ): Promise<void> {
    // Sends email via SendGrid
  }

  @Get(':sessionId/careers')
  async getCareerMatches(@Param('sessionId') sessionId: string): Promise<CareerMatch[]> {
    // Returns top 5 career matches
  }
}
```

### 4.5 Services Architecture

```
apps/bot/src/
├── bot.ts                    # Main bot entry
├── conversations/
│   ├── registration.ts       # Student/parent registration
│   ├── quiz.ts              # 55-question test flow
│   └── parent-link.ts       # Parent-student linking
├── handlers/
│   ├── start.handler.ts     # /start command
│   ├── results.handler.ts   # /results, /share
│   ├── streak.handler.ts    # /streak, /achievements
│   └── menu.handler.ts      # Persistent keyboard
├── keyboards/
│   ├── main-menu.ts         # Persistent menu
│   ├── question.ts          # Dynamic question keyboards
│   └── results.ts           # Results action buttons
├── services/
│   ├── user.service.ts      # User/Student/Parent CRUD
│   ├── quiz.service.ts      # Question fetching, answer saving
│   ├── gamification.service.ts  # Points, badges, streaks
│   ├── referral.service.ts  # Referral tracking
│   └── notification.service.ts  # Telegram messages
└── utils/
    ├── formatters.ts        # Message formatting
    └── validators.ts        # Input validation
```

```
apps/api/src/modules/
├── results/
│   ├── results.controller.ts
│   ├── results.service.ts
│   ├── chart.service.ts     # QuickChart integration
│   └── card.service.ts      # Canvas shareable cards
├── email/
│   ├── email.controller.ts
│   ├── email.service.ts     # SendGrid integration
│   └── templates/
│       ├── parent-report.html
│       └── parent-report.txt
├── careers/
│   ├── careers.service.ts   # Career matching algorithm
│   └── careers.data.ts      # Career database seed
└── gamification/
    ├── gamification.service.ts
    ├── streak.service.ts
    └── achievement.service.ts
```

### 4.6 PM2 Configuration

```javascript
// ecosystem.config.js (update)
module.exports = {
  apps: [
    {
      name: 'api',
      script: './apps/api/dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production', PORT: 4000 }
    },
    {
      name: 'bot',
      script: './apps/bot/dist/main.js',
      instances: 1,  // Single instance for long polling
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' }
    }
  ]
};
```

---

## 5. Question Bank Specification

> **Complete Data**: [riasec-seed-data.ts](../../docs/Research/riasec-seed-data.ts) — 55 questions ready for Prisma seed

### 5.1 Question Distribution (RIASEC)

```typescript
// 55 questions = 9 per dimension + 1 buffer
// From riasec-seed-data.ts

const DISTRIBUTION = {
  R: 9, // Realistic
  I: 9, // Investigative
  A: 9, // Artistic
  S: 9, // Social
  E: 9, // Enterprising
  C: 10 // Conventional (includes buffer)
};

// Interleaving: R→I→A→S→E→C rotation (never same dimension consecutively)
// Format mix: 71% MC, 20% Rating, 9% Binary
```

### 5.2 Sample Questions (from seed data)

```typescript
// Q1 (Warm-up, MC):
{
  id: "q1",
  text: "🎮 Выходной! Чем займёшься?",
  type: "MULTIPLE_CHOICE",
  section: 1,
  options: [
    { label: "🔧 Соберу или починю что-нибудь руками", value: "r", scores: { R: 1 } },
    { label: "📚 Посмотрю научное видео или почитаю", value: "i", scores: { I: 1 } },
    { label: "🎨 Порисую, поиграю музыку или посмотрю фильм", value: "a", scores: { A: 1 } },
    { label: "👥 Встречусь с друзьями или помогу кому-то", value: "s", scores: { S: 1 } }
  ]
}

// Q26 (Complex, Rating):
{
  id: "q26",
  text: "⭐ Я люблю следовать чётким инструкциям и правилам",
  type: "RATING",
  section: 3,
  riasecWeights: { C: 1, A: -0.25 } // Cross-loading
}
```

### 5.3 Section Difficulty Pacing

| Section | Questions | Difficulty | Purpose |
|---------|-----------|------------|---------|
| 1 (Q1-11) | Easy | 1 | Warm-up, engagement |
| 2 (Q12-22) | Medium | 2 | Core interest exploration |
| 3 (Q23-33) | Complex | 2-3 | Deep preference analysis |
| 4 (Q34-44) | Medium | 2 | Work style validation |
| 5 (Q45-55) | Easy | 1-2 | Closure, confirmation |

### 5.4 Easter Egg Question Fields

```typescript
// From riasec-seed-data.ts - special question fields
interface Question {
  // ... standard fields ...
  isEasterEgg?: boolean;  // Hidden achievement trigger
  hint?: string;          // Clickable hint that triggers DETECTIVE badge
}

// Q33 Easter Egg Example
{
  id: "q33",
  text: "🤔 Представь, что ты руководишь командой проекта...",
  type: "MULTIPLE_CHOICE",
  section: 3,
  isEasterEgg: true,
  hint: "🔍 Подсказка", // InlineKeyboard button
  // Clicking hint awards DETECTIVE badge (+30 pts)
}

// Easter Egg Detection
bot.callbackQuery("hint_q33", async (ctx) => {
  await awardBadge(ctx.from.id, "DETECTIVE");
  await ctx.answerCallbackQuery("🔍 Бейдж DETECTIVE получен! +30 очков");
});
```

---

## 6. Career Database

> **Complete Data**: [riasec-seed-data.ts](../../docs/Research/riasec-seed-data.ts) — 43 careers ready for Prisma seed

### 6.1 Career Distribution

| Category | Count | Examples |
|----------|-------|----------|
| Technology | 12 (30%) | Дата-сайентист, DevOps, ML-инженер |
| Medicine/Science | 8 (20%) | Врач, Биотехнолог, Фармацевт |
| Creative | 8 (20%) | UX/UI-дизайнер, Режиссёр, Геймдизайнер |
| Business | 8 (20%) | Продакт-менеджер, Маркетолог, Финансист |
| Engineering/Other | 7 (10%) | Инженер, Архитектор, Юрист |

### 6.2 Career Schema (Extended Fields)

```typescript
// From riasec-seed-data.ts - FULL schema
interface Career {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  riasecProfile: RIASECScores;
  salaryMin: number;           // RUB/month
  salaryMax: number;
  salarySource: string;        // "hh.ru 2024", "SuperJob"
  category: CareerCategory;
  requiredSkills: string[];
  educationPath: string[];     // ["Математика", "Онлайн-курсы ML"]
  universities: string[];      // ["МГУ", "МФТИ", "ВШЭ"]
  outlook: 'growing' | 'stable' | 'declining';
  demandLevel: 'high' | 'medium' | 'low';
}
```

### 6.3 Sample Careers

```typescript
const CAREERS = [
  {
    id: "data-scientist",
    titleRu: "Дата-сайентист",
    riasecProfile: { I: 90, C: 75, A: 35, R: 30, E: 30, S: 25 },
    salaryMin: 180000,
    salaryMax: 450000,
    salarySource: "hh.ru 2024",
    universities: ["МГУ", "МФТИ", "ВШЭ", "ИТМО"],
    outlook: "growing",
    demandLevel: "high"
  },
  // ... 42 more careers
];
```

---

## 7. External Integrations

### 7.1 QuickChart API (Radar Charts)

```typescript
// apps/api/src/modules/results/chart.service.ts
import axios from 'axios';

export class ChartService {
  async generateRadarChart(profile: RIASECProfile): Promise<string> {
    const config = {
      type: 'radar',
      data: {
        labels: ['Realistic 🔧', 'Investigative 🔬', 'Artistic 🎨',
                 'Social 🤝', 'Enterprising 💼', 'Conventional 📊'],
        datasets: [{
          label: 'Твой профиль',
          data: [profile.realistic, profile.investigative, profile.artistic,
                 profile.social, profile.enterprising, profile.conventional],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointRadius: 5
        }]
      },
      options: {
        scale: { ticks: { beginAtZero: true, max: 100, stepSize: 20 } },
        plugins: { legend: { display: false } }
      }
    };

    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=600&h=600`;
  }
}
```

### 7.2 SendPulse Email Integration

> **Decision**: SendPulse выбран вместо SendGrid — 12,000 бесплатных писем/месяц (vs 100/день у SendGrid).
> **Reference**: [Tech Stack Research](../../docs/Research/SkillTree%20Bot%20MVP%20Technical%20Stack%20Recommendations.md)

```typescript
// apps/api/src/modules/email/email.service.ts
import sendpulse from 'sendpulse-api';

const API_USER_ID = process.env.SENDPULSE_API_USER_ID!;
const API_SECRET = process.env.SENDPULSE_API_SECRET!;
const TOKEN_STORAGE = '/tmp/';

// Initialize SendPulse client
function initSendPulse(): Promise<void> {
  return new Promise((resolve, reject) => {
    sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export class EmailService {
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      await initSendPulse();
      this.initialized = true;
    }
  }

  async sendParentReport(params: {
    parentEmail: string;
    studentName: string;
    radarChartUrl: string;
    topCareers: CareerMatch[];
  }) {
    await this.ensureInitialized();

    const emailData = {
      html: this.buildParentReportHtml(params),
      text: this.buildParentReportText(params),
      subject: `${params.studentName}: Результаты теста карьерного потенциала`,
      from: {
        name: 'SkillTree',
        email: process.env.SENDPULSE_FROM_EMAIL || 'noreply@skilltree.ru'
      },
      to: [{ email: params.parentEmail }]
    };

    return new Promise((resolve, reject) => {
      sendpulse.smtpSendMail((result: any) => {
        if (result.result) resolve(result);
        else reject(new Error(result.message || 'Email sending failed'));
      }, emailData);
    });
  }

  async sendVerificationCode(email: string, code: string) {
    await this.ensureInitialized();

    const emailData = {
      html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действителен 15 минут.</p>`,
      text: `Ваш код подтверждения: ${code}\nКод действителен 15 минут.`,
      subject: `Код подтверждения: ${code}`,
      from: {
        name: 'SkillTree',
        email: process.env.SENDPULSE_FROM_EMAIL || 'noreply@skilltree.ru'
      },
      to: [{ email }]
    };

    return new Promise((resolve, reject) => {
      sendpulse.smtpSendMail((result: any) => {
        if (result.result) resolve(result);
        else reject(new Error(result.message || 'Email sending failed'));
      }, emailData);
    });
  }

  private buildParentReportHtml(params: {
    studentName: string;
    radarChartUrl: string;
    topCareers: CareerMatch[];
  }): string {
    return `
      <h1>Результаты теста: ${params.studentName}</h1>
      <img src="${params.radarChartUrl}" alt="RIASEC профиль" width="600" />
      <h2>Топ-3 рекомендуемых профессии:</h2>
      <ol>
        ${params.topCareers.slice(0, 3).map(c => `
          <li><strong>${c.career.titleRu}</strong> — совпадение ${c.matchPercentage}%</li>
        `).join('')}
      </ol>
      <p><a href="https://skilltree.app/consultation">Записаться на консультацию</a></p>
    `;
  }

  private buildParentReportText(params: {
    studentName: string;
    topCareers: CareerMatch[];
  }): string {
    return `Результаты теста: ${params.studentName}\n\n` +
      `Топ-3 профессии:\n` +
      params.topCareers.slice(0, 3).map((c, i) =>
        `${i + 1}. ${c.career.titleRu} — ${c.matchPercentage}%`
      ).join('\n') +
      `\n\nЗаписаться на консультацию: https://skilltree.app/consultation`;
  }
}
```

### 7.3 Canvas API (Shareable Cards)

```typescript
// apps/api/src/modules/results/card.service.ts
import { createCanvas, loadImage, registerFont } from 'canvas';

export class CardService {
  async generateShareCard(params: {
    studentName: string;
    personalityType: string;
    topCareer: CareerMatch;
    radarChartUrl: string;
    topDimension: string;
  }): Promise<Buffer> {
    const canvas = createCanvas(1080, 1080);
    const ctx = canvas.getContext('2d');

    // Background gradient based on top dimension
    const colors = this.getColorsForDimension(params.topDimension);
    const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
    gradient.addColorStop(0, colors.light);
    gradient.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Load and draw radar chart
    const radarImage = await loadImage(params.radarChartUrl);
    ctx.drawImage(radarImage, 240, 150, 600, 600);

    // Text overlays
    ctx.font = 'bold 48px Inter';
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    ctx.fillText(`Я — ${params.personalityType}`, 540, 820);

    ctx.font = '32px Inter';
    ctx.fillText(`Топ профессия: ${params.topCareer.titleRu}`, 540, 880);
    ctx.fillText(`Совпадение: ${params.topCareer.matchPercentage}%`, 540, 930);

    // CTA
    ctx.font = '24px Inter';
    ctx.fillStyle = '#6B7280';
    ctx.fillText('t.me/skilltreebot — Узнай свой профиль!', 540, 1020);

    return canvas.toBuffer('image/png');
  }

  private getColorsForDimension(dimension: string) {
    const colorMap = {
      realistic: { light: '#FEF3C7', primary: '#F59E0B' },
      investigative: { light: '#DBEAFE', primary: '#3B82F6' },
      artistic: { light: '#FCE7F3', primary: '#EC4899' },
      social: { light: '#D1FAE5', primary: '#10B981' },
      enterprising: { light: '#EDE9FE', primary: '#8B5CF6' },
      conventional: { light: '#F3F4F6', primary: '#6B7280' },
    };
    return colorMap[dimension] || colorMap.investigative;
  }
}
```

---

## 8. Environment Variables

```bash
# .env.example additions for 002-telegram-bot-mvp

# Telegram Bot
TELEGRAM_BOT_TOKEN=           # From @BotFather
TELEGRAM_BOT_USERNAME=        # e.g., skilltreebot

# SendGrid Email
SENDGRID_API_KEY=             # SendGrid API key
SENDGRID_PARENT_TEMPLATE_ID=  # Dynamic template ID
SENDGRID_FROM_EMAIL=reports@skilltree.app

# QuickChart (optional, uses public API by default)
QUICKCHART_API_KEY=           # For higher rate limits

# Feature Flags
ENABLE_EMAIL_REPORTS=true
ENABLE_SHAREABLE_CARDS=true
ENABLE_REFERRAL_SYSTEM=true

# Gamification
WEEKLY_RESET_CRON=0 0 * * 1   # Every Monday at midnight
SESSION_TIMEOUT_HOURS=24
```

---

## 8a. Edge Cases & Business Rules

### EC-001: Test Retake Policy

```typescript
// Can user take test again after completion?
const RETAKE_POLICY = {
  allowRetake: true,
  cooldownDays: 7,  // Must wait 7 days between tests
  maxRetakes: 3,    // Maximum 3 tests per user
};

async function canStartNewTest(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const completedTests = await prisma.testSession.count({
    where: { student: { userId }, status: 'COMPLETED' }
  });

  if (completedTests >= RETAKE_POLICY.maxRetakes) {
    return { allowed: false, reason: "Достигнут лимит попыток (3 теста)" };
  }

  const lastTest = await prisma.testSession.findFirst({
    where: { student: { userId }, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' }
  });

  if (lastTest) {
    const daysSince = differenceInDays(new Date(), lastTest.completedAt);
    if (daysSince < RETAKE_POLICY.cooldownDays) {
      return { allowed: false, reason: `Подожди ещё ${7 - daysSince} дней` };
    }
  }

  return { allowed: true };
}
```

### EC-002: Concurrent Sessions

```typescript
// Only ONE active session per user allowed
// Starting new test abandons existing session

async function handleExistingSession(ctx: MyContext): Promise<'resume' | 'new' | 'blocked'> {
  if (!ctx.quizSession) return 'new';

  // Show choice
  await ctx.reply("У тебя есть незавершённый тест.", {
    reply_markup: new InlineKeyboard()
      .text("▶️ Продолжить", "flow_resume")
      .row()
      .text("🔄 Начать заново", "flow_new")
  });

  return 'blocked'; // Wait for user choice
}
```

### EC-003: Streak Break Handling

```typescript
// From gamification-strategy.md
// If user misses a day, streak counter resets but weekly cycle continues

async function handleStreakBreak(userId: string) {
  const streak = await prisma.dailyStreak.findUnique({ where: { userId } });

  if (streak && streak.lastCheckIn) {
    const daysSince = differenceInDays(new Date(), streak.lastCheckIn);

    if (daysSince > 1) {
      // Streak broken - reset currentDay but NOT weeklyPoints
      await prisma.dailyStreak.update({
        where: { userId },
        data: {
          currentDay: 1,  // Restart from day 1
          // weeklyPoints continues accumulating
        }
      });

      return {
        broken: true,
        message: `Стрик прерван 💔 Твой лучший стрик: ${streak.longestStreak} дней`
      };
    }
  }
}
```

### EC-004: Rate Limiting

```typescript
// Prevent spam/abuse
const RATE_LIMITS = {
  questionsPerMinute: 10,     // Max 10 answers per minute
  commandsPerMinute: 20,      // Max 20 commands per minute
  emailAttemptsPerHour: 3,    // Max 3 email verification attempts
};

// Using Redis for rate limiting
import { RateLimiter } from '@grammyjs/ratelimiter';

bot.use(new RateLimiter({
  timeFrame: 60000,  // 1 minute
  limit: RATE_LIMITS.commandsPerMinute,
  onLimitExceeded: (ctx) => ctx.reply("⏳ Слишком много запросов. Подожди минуту.")
}));
```

---

## 8b. Analytics Events

### Key Events to Track

| Event | Trigger | Data |
|-------|---------|------|
| `test_started` | User starts test | userId, timestamp |
| `question_answered` | Each answer | questionId, sectionNum, answerTime |
| `section_completed` | End of section | sectionNum, dropOffRate |
| `test_completed` | All 55 answered | totalTime, pointsEarned |
| `test_abandoned` | 24h timeout | lastQuestionId, abandonPoint |
| `badge_earned` | Badge unlocked | badgeType, triggerEvent |
| `results_shared` | Share button clicked | shareMethod (chat/stories/link) |
| `referral_clicked` | Referral link opened | referrerId, source |
| `referral_completed` | Referee finishes test | referrerId, refereeId |
| `email_sent` | Parent report sent | emailId, openTracking |

### Drop-Off Analytics

```typescript
// Track where users abandon test
async function trackDropOff(sessionId: string) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: { answers: true }
  });

  const abandonPoint = session.answers.length;
  const abandonSection = Math.floor(abandonPoint / 11) + 1;

  await analytics.track('test_abandoned', {
    userId: session.studentId,
    abandonPoint,
    abandonSection,
    timeSpent: differenceInMinutes(session.updatedAt, session.startedAt)
  });
}

// Aggregate for reporting
// SELECT abandonSection, COUNT(*) as dropoffs
// FROM analytics WHERE event = 'test_abandoned'
// GROUP BY abandonSection
// ORDER BY abandonSection
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// apps/bot/src/services/__tests__/gamification.service.test.ts
describe('GamificationService', () => {
  describe('calculateStreakBonus', () => {
    it('should return day number as bonus (day 1 = 1 pt)', () => {
      expect(service.calculateStreakBonus(1)).toBe(1);
      expect(service.calculateStreakBonus(7)).toBe(7);
    });
  });

  describe('checkBadgeUnlock', () => {
    it('should unlock BRONZE_EXPLORER at 25% completion', () => {
      const badges = service.checkBadgeUnlock(14, 55);
      expect(badges).toContain('BRONZE_EXPLORER');
    });
  });
});
```

### 9.2 Integration Tests

```typescript
// apps/bot/src/__tests__/quiz.integration.test.ts
describe('Quiz Flow', () => {
  it('should complete 55-question test and generate results', async () => {
    // Simulate user completing test
    // Verify TestSession created with COMPLETED status
    // Verify TestResult generated with RIASEC profile
    // Verify badges awarded
  });
});
```

### 9.3 Manual Testing Checklist

```markdown
## Pre-Release Checklist

### Registration
- [ ] /start creates User record
- [ ] Student registration flow works
- [ ] Parent registration flow works
- [ ] Parent-student linking works

### Quiz Flow
- [ ] All 55 questions display correctly
- [ ] Progress bar updates after each question
- [ ] Section completion messages appear
- [ ] Auto-save works (close and resume)
- [ ] /resume continues from correct question

### Gamification
- [ ] Points awarded for questions (+10)
- [ ] Section bonus awarded (+100)
- [ ] Completion bonus awarded (+500)
- [ ] Badges unlock at correct thresholds
- [ ] Streak tracking works across days
- [ ] Referral tracking works

### Results
- [ ] Radar chart generates correctly
- [ ] Career matches display
- [ ] Shareable card generates
- [ ] Email report sends to parent

### Edge Cases
- [ ] Handle network interruption during quiz
- [ ] Handle session timeout (24h)
- [ ] Handle invalid input gracefully
- [ ] Rate limiting works
```

---

## 10. Deployment Plan

### 10.1 Phase 1: Bot Core (Week 1)
- [ ] apps/bot/ structure setup
- [ ] grammY configuration
- [ ] Session management with Prisma
- [ ] /start, /help commands
- [ ] Registration conversations
- [ ] Main menu keyboard

### 10.2 Phase 2: Quiz Engine (Week 2)
- [ ] Question database seeding (55 questions)
- [ ] Quiz conversation flow
- [ ] Progress tracking
- [ ] Section completion handlers
- [ ] Auto-save mechanism

### 10.3 Phase 3: Results & Visualization (Week 3)
- [ ] RIASEC calculation algorithm
- [ ] Career matching algorithm
- [ ] QuickChart radar integration
- [ ] Canvas shareable cards
- [ ] Results display handlers

### 10.4 Phase 4: Gamification (Week 4)
- [ ] Points system
- [ ] Badge system
- [ ] Weekly streak cron job
- [ ] Achievement notifications
- [ ] Referral system

### 10.5 Phase 5: Parent Integration (Week 5)
- [ ] SendGrid setup
- [ ] Email templates
- [ ] Parent report generation
- [ ] Consultation CTA tracking

### 10.6 Phase 6: Polish & Launch (Week 6)
- [ ] Error handling
- [ ] Rate limiting
- [ ] Logging & monitoring
- [ ] Production deployment
- [ ] User acceptance testing

---

## 11. Success Metrics

### 11.1 Engagement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Completion Rate | 70%+ | completed / started |
| Average Time to Complete | 12-15 min | session duration |
| Section 1 Drop-off | <5% | abandoned at Q1-11 |
| Return Rate | 30%+ | users revisiting results |

### 11.2 Viral Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Share Rate | 30%+ | shares / completions |
| Referral Conversion | 50%+ | completed / clicked |
| Viral Coefficient (M3) | >1.0 | new users / existing |

### 11.3 Parent Engagement

| Metric | Target | Measurement |
|--------|--------|-------------|
| Email Opt-in Rate | 50%+ | opt-ins / completions |
| Email Open Rate | 40%+ | opens / sent |
| Consultation Booking | 5%+ | bookings / emails sent |

---

## 12. Risks & Mitigations

### Risk 1: Quiz Abandonment
**Mitigation**: Progressive disclosure, celebration messages, streaks, insight teasers

### Risk 2: Low Viral Coefficient
**Mitigation**: Shareable cards, referral incentives, social proof ("2,341 students")

### Risk 3: Parent Trust Issues
**Mitigation**: Explainable AI, scientific methodology references, confidence indicators

### Risk 4: Session Data Loss
**Mitigation**: Auto-save after every question, database persistence, /resume command

### Risk 5: Bot Downtime
**Mitigation**: PM2 auto-restart, health monitoring, Telegram notification on crash

---

## 13. Dependencies Summary

### npm Packages (apps/bot)
```json
{
  "grammy": "^1.21.0",
  "@grammyjs/menu": "^1.2.0",
  "@grammyjs/ratelimiter": "^1.2.0",
  "date-fns": "^3.6.0"
}
```

> ⚠️ **Note**: `@grammyjs/conversations` is intentionally NOT used.
> Quiz state is managed via FSM in PostgreSQL. See Section 15.2.

### npm Packages (apps/api - additions)
```json
{
  "@sendgrid/mail": "^8.1.0",
  "canvas": "^2.11.0",
  "chart.js": "^4.4.0"
}
```

### External Services
- Telegram Bot API (free)
- QuickChart.io (free tier: 500 charts/month)
- SendGrid (free tier: 100 emails/day)

---

## 14. References

### Internal Documents
- [gamification-strategy.md](../001-project-setup/gamification-strategy.md)
- [results-strategy.md](../001-project-setup/results-strategy.md)
- [data-model.md](../001-project-setup/data-model.md)
- [EdTech Research Report](../001-project-setup/research/EdTech%20Career%20Guidance%20App%3A%20Strategic%20Research%20Report.md)

### External Documentation
- [grammY Documentation](https://grammy.dev/)
- [grammY Conversations Plugin](https://grammy.dev/plugins/conversations)
- [QuickChart API](https://quickchart.io/documentation/)
- [SendGrid Dynamic Templates](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates)
- [Canvas API (node-canvas)](https://github.com/Automattic/node-canvas)

---

## 15. Research Artifacts

### 15.1 Completed Research Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **RIASEC Career Assessment System** | Scoring methodology, Pearson correlation, O*NET standards | [RIASEC Research](../../docs/Research/RIASEC%20Career%20Assessment%20System%20for%20Russian%20Teenagers.md) |
| **grammY Conversation Architecture** | FSM architecture decision, resumable quiz flow | [grammY Deep Think](../../docs/Deep%20Think/%20grammY%20Conversation%20Architecture%20(Deep%20Think).md) |
| **Комплексное исследование профориентации** | Psychometric standards for 14-17 year olds | [Профориентация Research](../../docs/Research/%23%20%D0%9A%D0%BE%D0%BC%D0%BF%D0%BB%D0%B5%D0%BA%D1%81%D0%BD%D0%BE%D0%B5%20%D0%B8%D1%81%D1%81%D0%BB%D0%B5%D0%B4%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D0%BB%D1%83%D1%87%D1%88%D0%B8%D1%85%20%D0%BF%D1%80%D0%B0%D0%BA%D1%82%D0%B8%D0%BA%20%D0%BF%D1%80%D0%BE%D1%84%D0%BE%D1%80%D0%B8%D0%B5%D0%BD%D1%82%D0%B0%D1%86%D0%B8%D0%B8%20%D0%B4%D0%BB%D1%8F%20%D1%83%D1%87%D0%B0%D1%89%D0%B8%D1%85%D1%81%D1%8F%2014-17%20%D0%BB%D0%B5%D1%82.md) |
| **RIASEC Seed Data** | 55 questions + 43 careers (production-ready TypeScript) | [riasec-seed-data.ts](../../docs/Research/riasec-seed-data.ts) |

### 15.2 Key Research Findings

#### Architecture Decision: FSM over Conversations Plugin

**DO NOT USE** `@grammyjs/conversations` for 55-question quiz flow.

**Reason**: The conversations plugin serializes execution stack. If you deploy a bug fix or restart the server while a user is on Question 10, their serialized state becomes invalid, causing session crash.

**Solution**: Database-Driven Finite State Machine (FSM)
- State is a single integer (`currentStep`) stored in PostgreSQL
- Bot becomes stateless logic that reads the database pointer
- Survives restarts, deployments, device switches

```typescript
// From grammY Deep Think research
model QuizSession {
  id          Int      @id @default(autoincrement())
  userId      BigInt
  currentStep Int      @default(0)  // The instruction pointer
  status      String   @default("ACTIVE")
  answers     Json     @default("{}")
  updatedAt   DateTime @updatedAt
}
```

#### RIASEC Scoring: Pearson Correlation

**Gold standard** per O*NET and academic literature:

```typescript
// From RIASEC Research
function matchCareers(userProfile: RIASECProfile, careerProfile: RIASECProfile): number {
  const r = calculatePearsonCorrelation(userProfile, careerProfile);
  const matchPercentage = ((r + 1) / 2) * 100; // Maps [-1,1] to [0,100]
  return Math.round(matchPercentage);
}
```

**Match Thresholds (O*NET standard)**:
| Category | Correlation (r) | Match % |
|----------|-----------------|---------|
| Best Fit | ≥ 0.729 | ≥ 86% |
| Great Fit | 0.608–0.728 | 80–86% |
| Good Fit | 0.000–0.607 | 50–80% |
| Poor Fit | < 0.000 | < 50% |

#### Question Bank: 55 Questions Ready

From `riasec-seed-data.ts`:
- **55 questions** (9 per dimension + 1 buffer)
- **5 sections** with difficulty pacing
- **Format mix**: 71% MC, 20% rating, 9% binary
- **Russian language** with informal "ты" and emojis
- **Interleaved dimensions**: R→I→A→S→E→C rotation

#### Career Database: 43 Professions

From `riasec-seed-data.ts`:
- **43 careers** with Russian titles
- **RIASEC profiles** for each career
- **Salary ranges** in RUB (from hh.ru 2024 data)
- **Categories**: Technology (30%), Medicine/Science (20%), Creative (20%), Business (20%), Other (10%)

---

**Document Status**: Ready for spec.md generation
**Next Steps**: Create spec.md using speckit.specify

# Bot Commands Contract: SkillTree Telegram Bot

**Feature**: `002-telegram-bot-mvp` | **Date**: 2025-12-28

---

## Command Registry

### Public Commands (shown in menu)

| Command | Description | Role | Handler |
|---------|-------------|------|---------|
| `/start` | Начать работу с ботом | All | `start.handler.ts` |
| `/test` | Начать новый тест | Student | `quiz.handler.ts` |
| `/resume` | Продолжить незавершённый тест | Student | `quiz.handler.ts` |
| `/results` | Посмотреть результаты | Student | `results.handler.ts` |
| `/streak` | Статус стрика и очков | Student | `streak.handler.ts` |
| `/achievements` | Список бейджей | Student | `streak.handler.ts` |
| `/share` | Поделиться результатами | Student | `results.handler.ts` |
| `/linkcode` | Получить код для родителя | Student | `parent.handler.ts` |
| `/link` | Привязать ребёнка (с кодом) | Parent | `parent.handler.ts` |
| `/help` | Справка | All | `start.handler.ts` |
| `/cancel` | Отменить текущее действие | All | `quiz.handler.ts` |
| `/privacy` | Политика конфиденциальности | All | `start.handler.ts` |
| `/deletedata` | Удалить все свои данные | All | `privacy.handler.ts` |

---

## Command Specifications

### /start

**Trigger**: User sends `/start` or clicks bot link

**Flow**:
```
1. Check if User exists by telegramId
2. IF new user:
   - Create User record
   - Show welcome message with role selection
   - InlineKeyboard: ["Я студент", "Я родитель"]
3. IF existing user with active quiz:
   - Show resume prompt
   - InlineKeyboard: ["Продолжить", "Начать заново"]
4. IF existing user without active quiz:
   - Show main menu (ReplyKeyboard)
```

**Deep Link Support**:
```
t.me/skilltreebot?start=ref_<userId>
- Extract referral code
- Create ReferralTracking(status: PENDING)
- Continue normal flow
```

**Response**:
```
NEW USER:
"Привет! Я SkillTree Bot
Помогу тебе определиться с будущей профессией

Кто ты?"
[InlineKeyboard: "Я студент" | "Я родитель"]

RETURNING STUDENT:
"С возвращением, {firstName}!

Готов продолжить?"
[ReplyKeyboard: Main Menu]
```

---

### /test

**Trigger**: Student sends `/test` or taps "Начать тест" button

**Preconditions**:
- User is registered as Student
- No cooldown (7 days between tests)
- Under retake limit (max 3 tests)

**Flow**:
```
1. Check if active session exists
   IF yes: Show resume/restart prompt
2. Check cooldown and retake limits
   IF blocked: Show error with wait time
3. Create new TestSession(status: IN_PROGRESS, currentStep: 0)
4. Award activity points if new day
5. Render first question (Q1)
```

**Response**:
```
SUCCESS:
"Отлично! Начинаем тест

55 вопросов • 5 секций • ~15 минут

Готов?"
[InlineKeyboard: "Поехали! "]
→ Then: Render Q1

COOLDOWN:
"Подожди ещё {N} дней до следующего теста"

LIMIT REACHED:
"Достигнут лимит попыток (3 теста)"
```

---

### /resume

**Trigger**: Student sends `/resume`

**Preconditions**:
- Active TestSession exists (status: IN_PROGRESS)
- Session not expired (< 24 hours)

**Flow**:
```
1. Find active session
2. IF expired (> 24h):
   - Mark session ABANDONED
   - Show expiry message
3. IF active:
   - Render current question (currentStep)
   - Show progress
```

**Response**:
```
SUCCESS:
"Продолжаем! Ты остановился на вопросе {N}/55"
[Progress: Section {S}/5 | {percent}%]
→ Render Question N

EXPIRED:
"Сессия истекла (прошло больше 24 часов)

Начать заново?"
[InlineKeyboard: "Да, начать"]

NO SESSION:
"У тебя нет незавершённого теста"
[InlineKeyboard: "Начать тест"]
```

---

### /results

**Trigger**: Student sends `/results` or taps "Результаты" button

**Preconditions**:
- At least one completed TestSession exists

**Flow**:
```
1. Find latest completed session with TestResult
2. IF no results: Show no-results message
3. IF has results:
   - Generate/retrieve radar chart
   - Show personality archetype
   - Show top 3 careers
   - Show action buttons
```

**Response**:
```
SUCCESS:
"Твой профиль: {archetype} {emoji}

Код: {hollandCode} (например: ISA)

[Radar Chart Image]

Топ-3 профессии:
1. {career1} — {match1}%
2. {career2} — {match2}%
3. {career3} — {match3}%"

[InlineKeyboard:
  "Полный отчёт" | "Все профессии"
  "Поделиться" | "Отправить родителям"
]

NO RESULTS:
"Ты ещё не проходил тест

Пройди, чтобы узнать свой профиль!"
[InlineKeyboard: "Начать тест"]
```

---

### /streak

**Trigger**: Student sends `/streak` or taps "Мой стрик" button

**Flow**:
```
1. Get or create DailyStreak record
2. Calculate today's bonus if applicable
3. Show streak status
```

**Response**:
```
ACTIVE STREAK:
" День {N}/7 | Очков сегодня: +{N}
 Очков за неделю: {weeklyPoints}
 Лучший стрик: {longestStreak} дней
 Всего очков: {totalPoints}

{progressBar}

Завтра: +{N+1} очко!"

BROKEN STREAK:
" Стрик прерван

 Лучший стрик: {longestStreak} дней
 Всего очков: {totalPoints}

Начни сегодня, чтобы получить +1!"
```

---

### /achievements

**Trigger**: Student sends `/achievements` or taps "Достижения" button

**Flow**:
```
1. Get all Achievement records for user
2. Group by category (progress, behavior, streak, referral, easter)
3. Show earned and locked badges
```

**Response**:
```
" Твои достижения ({earned}/{total})

 Прогресс:
{Bronze Explorer} {Silver Seeker} {Gold Achiever} {Platinum Master}

 Стрики:
{Streak 3 Days} {Streak 7 Days}

 Рефералы:
{Referral Bronze} {Referral Silver} {Referral Gold}

 Секретные:
{Night Owl} {Early Bird} {Detective}

Locked badges show as gray/outline"
```

---

### /share

**Trigger**: Student sends `/share` or taps "Поделиться" button

**Preconditions**:
- Completed test with results

**Flow**:
```
1. Generate shareable card (1080x1080)
2. Generate referral link
3. Increment shareCount
4. Award +25 points if first share
```

**Response**:
```
"Твоя карточка готова!

[Share Card Image 1080x1080]

Поделись с друзьями:
t.me/skilltreebot?start=ref_{userId}

За каждого друга, который пройдёт тест:
• Ты получишь +50 очков
• Друг получит +25 бонус"

[InlineKeyboard: "Скопировать ссылку"]
```

---

### /linkcode

**Trigger**: Student sends `/linkcode`

**Preconditions**:
- User is registered as Student

**Flow**:
```
1. Check for existing active ParentLinkCode
2. IF exists and not expired: Return existing
3. IF expired or none: Generate new 6-char code
4. Create ParentLinkCode(expiresAt: now + 24h)
```

**Response**:
```
"Код для родителя:

{CODE}

Родитель должен отправить боту:
/link {CODE}

Код действителен 24 часа"
```

**Code Format**: 6 uppercase alphanumeric (e.g., `A7B3C9`)

---

### /link <code>

**Trigger**: Parent sends `/link ABC123`

**Preconditions**:
- User is registered as Parent
- Code exists and not expired

**Flow**:
```
1. Parse code from message
2. Find ParentLinkCode by code
3. IF not found or expired: Show error
4. IF valid:
   - Create ParentStudent relation
   - Delete ParentLinkCode
   - Notify both parties
```

**Response**:
```
SUCCESS:
"Готово! Теперь ты привязан к {studentName}

Ты будешь получать:
• Уведомления о прохождении теста
• Подробные отчёты о результатах
• Рекомендации по развитию"

To Student:
"Родитель {parentName} теперь привязан к твоему профилю "

INVALID CODE:
"Код не найден или истёк

Попроси ребёнка сгенерировать новый код через /linkcode"
```

---

### /help

**Trigger**: User sends `/help` or taps "Помощь" button

**Response**:
```
" Справка по SkillTree Bot

Я помогу тебе определиться с будущей профессией!

Основные команды:
/test — Начать тест (55 вопросов)
/resume — Продолжить тест
/results — Посмотреть результаты
/streak — Твой стрик и очки
/achievements — Твои бейджи
/share — Поделиться результатами

Для родителей:
/link <код> — Привязать ребёнка

 Вопросы? Пиши @skilltree_support"
```

---

### /cancel

**Trigger**: User sends `/cancel`

**Flow**:
```
1. IF in active quiz session:
   - Save current state
   - Exit quiz mode (but don't abandon)
   - Show main menu
2. IF in conversation (registration, email input):
   - Cancel conversation
   - Return to main menu
3. IF nothing active:
   - Show "nothing to cancel"
```

**Response**:
```
IN QUIZ:
"Прогресс сохранён. Вернись когда захочешь через /resume
[Main Menu]"

IN CONVERSATION:
"Действие отменено
[Main Menu]"

NOTHING:
"Нечего отменять "
```

---

### /privacy

**Trigger**: User sends `/privacy`

**Response**:
```
" Политика конфиденциальности

SkillTree Bot обрабатывает:
• Telegram ID и имя
• Возраст и класс (для студентов)
• Email (для родителей, опционально)
• Ответы на вопросы теста

Мы НЕ передаём данные третьим лицам.
Данные хранятся 3 года, затем анонимизируются.

Соответствие: 152-ФЗ, GDPR

Удалить данные: /deletedata
Полный текст: skilltree.ru/privacy"
```

---

### /deletedata

**Trigger**: User sends `/deletedata`

**Preconditions**:
- User is registered

**Flow**:
```
1. Show warning message with data that will be deleted
2. Display "Confirm Deletion" button
3. On confirm click: generate 6-digit confirmation code
4. User enters code
5. IF correct: delete all user data, send confirmation
6. IF wrong: show error, allow retry
7. Code expires after 5 minutes
```

**Response**:
```
STEP 1 - WARNING:
"⚠️ Удаление данных

Будут безвозвратно удалены:
• Ваш профиль
• Все результаты тестов
• Достижения и очки
• История стриков
• Реферальные данные

Это действие НЕЛЬЗЯ отменить!"

[InlineKeyboard: "Подтвердить удаление" | "Отмена"]

STEP 2 - CODE SENT:
" Для подтверждения введите код:

{6-digit code}

Код действителен 5 минут."

STEP 3 - SUCCESS:
"✅ Данные удалены

Все ваши данные были удалены из системы.
Дата удаления: {timestamp}

Вы можете начать заново через /start"

STEP 3 - ERROR:
" Неверный код

Попробуйте ещё раз или запросите новый через /deletedata"

CANCEL:
"Удаление отменено. Ваши данные сохранены."
```

**Audit**: Each deletion is logged with hashed user ID and timestamp for compliance purposes.

---

## Callback Query Handlers

### Quiz Flow

| Callback Data | Description | Handler |
|---------------|-------------|---------|
| `flow_resume` | Resume from current step | quiz.handler.ts |
| `flow_new` | Start fresh (abandon current) | quiz.handler.ts |
| `flow_continue` | Continue after section celebration | quiz.handler.ts |
| `answer_{value}` | Answer selection | quiz.handler.ts |
| `hint_{questionId}` | Easter egg hint clicked | quiz.handler.ts |

### Role Selection

| Callback Data | Description | Handler |
|---------------|-------------|---------|
| `role_student` | Register as student | start.handler.ts |
| `role_parent` | Register as parent | start.handler.ts |

### Student Registration

| Callback Data | Description | Handler |
|---------------|-------------|---------|
| `age_{14-18}` | Age selection | start.handler.ts |
| `grade_{8-11}` | Grade selection | start.handler.ts |

### Results Actions

| Callback Data | Description | Handler |
|---------------|-------------|---------|
| `results_full` | Show full report | results.handler.ts |
| `results_careers` | Show all career matches | results.handler.ts |
| `results_share` | Generate share card | results.handler.ts |
| `results_parent` | Send to parent email | results.handler.ts |

### Email Verification

| Callback Data | Description | Handler |
|---------------|-------------|---------|
| `email_resend` | Resend verification code | parent.handler.ts |
| `email_change` | Change email address | parent.handler.ts |

### Data Deletion

| Callback Data | Description | Handler |
|---------------|-------------|---------|
| `delete_confirm` | Confirm deletion intent, show code | privacy.handler.ts |
| `delete_cancel` | Cancel deletion process | privacy.handler.ts |

### PDF & Downloads

| Callback Data | Description | Handler |
|---------------|-------------|---------|
| `results_pdf` | Request PDF roadmap download | results.handler.ts |

---

## Persistent Keyboards

### Student Main Menu

```
┌────────────────────────────────────┐
│   Начать тест  │   Результаты  │
├────────────────────────────────────┤
│   Мой стрик    │   Достижения  │
├────────────────────────────────────┤
│   Поделиться   │   Помощь      │
└────────────────────────────────────┘
```

### Parent Main Menu

```
┌────────────────────────────────────┐
│   Мои дети     │   Отчёты      │
├────────────────────────────────────┤
│   Привязать    │   Помощь      │
└────────────────────────────────────┘
```

---

## Rate Limiting

| Action | Limit | Window |
|--------|-------|--------|
| Commands | 20 | 1 minute |
| Quiz answers | 10 | 1 minute |
| Email verification | 3 | 1 hour |
| Share card generation | 5 | 1 hour |

**Exceeded Response**:
```
" Слишком много запросов

Подожди {N} секунд и попробуй снова"
```

---

## Error Handling

### Standard Errors

| Error | Message |
|-------|---------|
| Not registered | "Сначала зарегистрируйся через /start" |
| Wrong role | "Эта команда только для {role}" |
| No permission | "У тебя нет доступа к этой функции" |
| Session expired | "Сессия истекла. Начни заново" |
| Rate limited | "Слишком много запросов" |
| Server error | "Что-то пошло не так  Попробуй позже" |

### Validation Errors

| Error | Message |
|-------|---------|
| Invalid email | " Неверный формат email" |
| Invalid code | " Код не найден или истёк" |
| Invalid age | "Выбери возраст из списка" |
| Empty text | "Напиши что-нибудь " |

---

**Document Status**: Complete
**Next**: Generate API endpoints contract

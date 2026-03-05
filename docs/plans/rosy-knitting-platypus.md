# Plan: Fix Tester Feedback (buttons, duplicate Q35, back navigation)

## Context

Тестер обнаружил 3 проблемы:
1. **Кнопки меню ("Результаты", "Мой стрик", "Поделиться") и команды (/streak, /share) не работают**
2. **Вопрос 35 дублирует вопрос 14**
3. **Нет возможности вернуться к предыдущему вопросу**

---

## Bug 1: Кнопки и команды не работают

### Root Cause

`quizHandler.on("message:text")` в `apps/bot/src/handlers/quiz.handler.ts:211` перехватывает **ВСЕ** текстовые сообщения. Хендлер использует `return` без вызова `next()` на всех ранних выходах (строки 212, 222, 228, 232, 238, 242, 247).

В grammY, если middleware не вызывает `next()`, цепочка останавливается. Поскольку `quizHandler` зарегистрирован **до** `resultsHandler` и `streakHandler` в `bot.ts:202-205`, все текстовые сообщения "проглатываются" и не доходят до нижестоящих хендлеров.

Список "пропуска" (строки 216-223) включает только:
- Команды (`/`)
- "Начать тест", "Продолжить тест", "Помощь"

**Отсутствуют**: "Результаты", "Мой стрик", "Достижения", "Поделиться"

Но даже для "пропускаемых" текстов используется `return` вместо `return next()`, поэтому даже команды `/streak`, `/share` и т.д. блокируются.

### Fix

**Файл**: `apps/bot/src/handlers/quiz.handler.ts`

Заменить ВСЕ ранние `return` в `on("message:text")` хендлере (строки 211-278) на `return next()`. Это обеспечит передачу необработанных сообщений дальше по цепочке middleware.

Конкретные изменения:
1. Добавить параметр `next` в сигнатуру: `async (ctx, next) => {`
2. Строка 212: `if (!ctx.from || !ctx.message?.text) return;` -> `return next();`
3. Строка 222: `return;` -> `return next();`
4. Строка 228: `if (!isStudent(ctx)) return;` -> `return next();`
5. Строка 232: `if (!session) return;` -> `return next();`
6. Строка 238: `return;` -> `return next();`
7. Строка 247: `return;` -> `return next();`

---

## Bug 2: Дубликат вопроса Q35

### Root Cause

Q14 и Q35 - практически одинаковые вопросы про работу с числами/таблицами:
- Q14: "Насколько тебе нравится работать с данными, таблицами, цифрами?" (C, RATING, section 2)
- Q35: "Насколько тебе нравится работать с цифрами и таблицами?" (C, RATING, section 3)

### Fix

**Файл**: `packages/database/prisma/seed-data/riasec-data.ts`

Заменить Q35 новым вопросом по C-dimension, который покрывает ДРУГОЙ аспект (внимание к деталям/точность):

```
{
  id: "q35",
  text: "🔍 Насколько тебе важна точность и внимание к деталям в работе?",
  type: "RATING",
  section: 3,
  orderIndex: 35,
  difficulty: 2,
  primaryDimension: "C",
  // Measures: C (precision, attention to detail)
  ratingRange: {
    min: 1,
    max: 5,
    labels: {
      min: "1 = Не парюсь об этом 🤷",
      max: "5 = Каждая мелочь важна! 🎯",
    },
  },
}
```

После изменения seed-data необходимо пересидить базу данных.

---

## Feature: Кнопка "Назад" в квизе

### Approach

Добавить inline-кнопку "Назад" на каждом вопросе (кроме первого) для возврата к предыдущему вопросу. Архитектура уже поддерживает это:
- `updateSessionStep()` (`apps/bot/src/services/quiz.service.ts:241`) позволяет установить любой шаг
- `saveAnswer()` использует upsert - ответы можно перезаписывать

### Изменения

**1. `apps/bot/src/keyboards/question.ts`**

- Добавить `BACK: "flow_back"` в `CALLBACK_PREFIX`
- В каждой функции построения клавиатуры (`buildMultipleChoiceKeyboard`, `buildRatingKeyboard`, `buildBinaryKeyboard`, `buildOpenTextKeyboard`) добавить необязательный параметр `step: number`
- Если `step > 0`, добавить новую строку с кнопкой "← Назад" (`flow_back`)
- Альтернативный (более чистый) подход: модифицировать `buildQuestionKeyboard()` - после построения клавиатуры, если `step > 0`, добавить `.row().text("← Назад", CALLBACK_PREFIX.BACK)`

**2. `apps/bot/src/handlers/quiz.handler.ts`**

- Добавить callback handler для `CALLBACK_PREFIX.BACK`:
  ```typescript
  quizHandler.callbackQuery(CALLBACK_PREFIX.BACK, async (ctx) => {
    // 1. Получить активную сессию
    // 2. Вычислить previousStep = session.currentStep - 1
    // 3. Проверить что previousStep >= 0
    // 4. Обновить currentStep через updateSessionStep(prisma, sessionId, previousStep)
    // 5. Отрендерить предыдущий вопрос через renderStep(ctx, previousStep, sessionId)
  })
  ```
- Модифицировать вызов `buildQuestionKeyboard()` в `renderStep()` (строка ~410-440), передавая `step` для определения видимости кнопки "Назад"
- Возврат разрешён через границы секций (из секции 3 можно вернуться в секцию 2)
- Edge case: если предыдущий шаг - конец секции, просто отрендерить вопрос этого шага (пропустить celebration screen)

**3. `apps/bot/src/content/questions.ts`** (если нужно)

- Проверить функцию `isStartOfSection()` или добавить её для определения первого вопроса секции (кнопку "Назад" не показываем на первом вопросе теста, step=0)

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/bot/src/handlers/quiz.handler.ts` | Fix `next()` в text handler + добавить back callback |
| `apps/bot/src/keyboards/question.ts` | Добавить `BACK` prefix + кнопку "Назад" |
| `packages/database/prisma/seed-data/riasec-data.ts` | Заменить Q35 |

---

## Verification

1. **Кнопки меню**: запустить бота, нажать "Результаты", "Мой стрик", "Поделиться" - должны реагировать
2. **Команды**: отправить /streak, /share, /results - должны работать
3. **Q35**: пересидить БД, пройти до вопроса 35 - убедиться что текст новый
4. **Кнопка "Назад"**: во время квиза нажать "Назад" - должен показаться предыдущий вопрос, повторный ответ должен перезаписать старый
5. **Type-check**: `pnpm type-check` должен пройти
6. **Build**: `pnpm build` должен пройти

# Plan: Tester Feedback Fixes - SkillTree Bot

**Created**: 2026-01-06
**Status**: IMPLEMENTED - Ready for deploy
**Priority**: P0 (Critical) - Bot is broken for production use

## Implementation Status

| Task | Status |
|------|--------|
| OPEN_TEXT handler (text message) | DONE |
| OPEN_TEXT keyboard (skip button) | DONE |
| OPEN_TEXT question rendering | DONE |
| Skip callback handler | DONE |
| "Я студент" -> "Я ученик" | DONE |
| Type-check | PASSED |
| Build | PASSED |

---

## Summary of Issues from Tester Feedback

| # | Issue | Priority | Root Cause |
|---|-------|----------|------------|
| 1 | Bot freezes at question 25 | P0 | No handler for OPEN_TEXT questions |
| 2 | "Я студент" should be "Я ученик" | P2 | Copy text for 14-17 year target audience |
| 3 | Long answer buttons truncated on mobile | P1 | Telegram 64-char limit for inline buttons |
| 4 | Rating scale 1-5 unclear | P1 | Labels shown but format may be unclear |
| 5 | Question 7 text ends with "..." | P2-INFO | By design (prompts user to complete) |

---

## Issue Details & Solutions

### Issue 1: CRITICAL - Bot Freezes on Question 25 (OPEN_TEXT)

**Root Cause Analysis:**
- Questions q25, q40, q52 have type `OPEN_TEXT` (open-ended text input)
- `buildQuestionKeyboard()` returns empty `InlineKeyboard()` for OPEN_TEXT
- `quiz.handler.ts` ONLY has `callbackQuery(/^answer_/)` handler for button clicks
- **NO handler exists for text messages during quiz!**
- When user types text response, bot ignores it completely

**Evidence from Logs:**
```
12:22:04 - question 24 answered (newTotal: 440)
[SILENCE] - User sent text for q25, bot ignored
```

**Solution:**
Add message handler for OPEN_TEXT questions in `quiz.handler.ts`:
1. Check if user has active session at OPEN_TEXT step
2. Capture `ctx.message.text` as answer
3. Save answer and advance to next question
4. Add "Пропустить" (Skip) button for optional questions

**Files to Modify:**
- `apps/bot/src/handlers/quiz.handler.ts` - Add text message handler
- `apps/bot/src/keyboards/question.ts` - Add skip button for OPEN_TEXT

---

### Issue 2: "Я студент" -> "Я ученик"

**Root Cause:**
Target audience is 14-17 years (school students = "ученики", not "студенты").
"Студент" typically refers to university students in Russian.

**Locations to Change:**
- `apps/bot/src/handlers/start.handler.ts:202` - `🎓 Я студент`
- `apps/bot/src/handlers/start.handler.ts:213` - `🎓 Я студент`
- `apps/bot/src/handlers/start.handler.ts:346-347` - "студент X класса"
- `apps/bot/src/handlers/quiz.handler.ts:81` - "как студент"
- `apps/bot/src/handlers/quiz.handler.ts:147` - "как студент"

**Solution:** Replace all "студент" with "ученик" in user-facing text.

---

### Issue 3: Long Answer Buttons Truncated on Mobile

**Root Cause:**
Telegram InlineKeyboard button text limit is ~64 characters.
Long options get truncated with "..." on mobile devices.

**Examples of Long Texts:**
- "🔬 Провести эксперимент и доказать гипотезу" (42 chars) - OK
- "💬 Выслушаешь и поддержишь эмоционально" (39 chars) - OK
- Most options are within limit

**Investigation Needed:**
- Check exact button texts that truncate
- May be CSS/display issue on specific Telegram clients

**Solution Options:**
1. **Audit all option texts** - ensure <50 chars
2. **Split long options** into two lines using format tricks
3. **Use shorter emoji codes** where possible

---

### Issue 4: Rating Scale 1-5 Unclear

**Current Implementation:**
- Code shows labels: `_${labels.min} — ${labels.max}_` (italic markdown)
- Data has labels like: `"Не моё вообще 😅" — "Обожаю! Это мой вайб 🔥"`

**Problem:**
Labels shown BELOW the buttons, user may not see/understand connection.

**Solution:**
Improve rating question format:
```
🎨 Как ты относишься к творческим занятиям?

1️⃣ — Не моё вообще 😅
5️⃣ — Обожаю! Это мой вайб 🔥

[1️⃣] [2️⃣] [3️⃣] [4️⃣] [5️⃣]
```

---

### Issue 5: Question 7 Text Ends with "..."

**Question:** `🔧 Если что-то сломалось дома, ты...`

**Status:** NOT A BUG - This is intentional design.
The "..." prompts user to complete the sentence by choosing an option.

---

## Implementation Plan

### Phase 1: CRITICAL FIX (P0) - OPEN_TEXT Handler

**Task 1.1:** Add text message handler for OPEN_TEXT questions
- **File:** `apps/bot/src/handlers/quiz.handler.ts`
- **Implementation:**
  ```typescript
  // Handler for text messages during quiz (OPEN_TEXT questions)
  quizHandler.on("message:text", async (ctx) => {
    // 1. Check user has active session
    // 2. Check current question is OPEN_TEXT type
    // 3. Save answer
    // 4. Render next question
  });
  ```

**Task 1.2:** Add "Пропустить" button for OPEN_TEXT
- **File:** `apps/bot/src/keyboards/question.ts`
- **Add:** `buildOpenTextKeyboard()` with skip option

**Task 1.3:** Update `renderStep()` for OPEN_TEXT questions
- Show hint text from question data
- Show "Пропустить" button

### Phase 2: Copy Fixes (P2)

**Task 2.1:** Replace "студент" with "ученик"
- **Files:** `start.handler.ts`, `quiz.handler.ts`
- Simple text replacement

### Phase 3: UX Improvements (P1)

**Task 3.1:** Improve rating scale display format
- **File:** `quiz.handler.ts:renderStep()`
- Show clearer min/max labels

**Task 3.2:** Audit and shorten long button texts
- **File:** `packages/database/prisma/seed-data/riasec-data.ts`
- Ensure all options <50 chars

---

## Execution Model

| Task | Executor | Dependencies |
|------|----------|--------------|
| 1.1 | grammy-bot-specialist | None |
| 1.2 | grammy-bot-specialist | None |
| 1.3 | grammy-bot-specialist | 1.1, 1.2 |
| 2.1 | MAIN (simple text replacement) | None |
| 3.1 | grammy-bot-specialist | 1.3 |
| 3.2 | MAIN (data audit) | None |

**Parallelization:**
- Tasks 1.1 + 1.2 can run in parallel
- Tasks 2.1 + 3.2 can run in parallel
- Task 3.1 depends on Phase 1

---

## Verification Checklist

- [ ] Bot handles text input on q25, q40, q52
- [ ] Quiz flow continues after OPEN_TEXT answers
- [ ] "Пропустить" button works for OPEN_TEXT
- [ ] "Я ученик" shown instead of "Я студент"
- [ ] Rating labels clearly visible
- [ ] All button texts readable on mobile
- [ ] Full quiz completion tested (55 questions)
- [ ] Deploy to VDS and test in production

---

## Risk Assessment

**High Risk:** OPEN_TEXT handler must not break existing callback handlers
**Mitigation:** Add handler AFTER callback handlers (grammY processes in order)

**Medium Risk:** Text replacement may miss some locations
**Mitigation:** Use grep to find all occurrences before/after

---

## Artifacts

After implementation:
- Modified files list
- Test session ID proving full quiz completion
- Screenshot of fixed "Я ученик" button

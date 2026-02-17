/**
 * Quiz Handler for SkillTree Bot
 *
 * Implements the FSM-driven quiz engine:
 * - /test command - starts new quiz session
 * - currentStep as instruction pointer (0-54)
 * - renderStep function for question rendering
 * - Answer callbacks for MC, Rating, Binary question types
 * - Section completion celebrations
 * - Test completion flow with results trigger
 */

import { Composer } from "grammy";
import { OPTION_LETTERS } from "@skilltree/shared";
import type { MyContext } from "../types/context";
import { isStudent, hasActiveQuiz } from "../types/context";
import {
  startSession,
  saveAnswer,
  getQuestionForStep,
  getProgress,
  isEndOfSection,
  isQuizComplete,
  getActiveSession,
  updateSessionStep,
} from "../services/quiz.service";
import {
  buildQuestionKeyboard,
  buildSectionCompleteKeyboard,
  buildResumePromptKeyboard,
  buildMirrorKeyboard,
  parseAnswerCallback,
  formatOptionsAsText,
  CALLBACK_PREFIX,
} from "../keyboards/question";
import {
  TOTAL_QUESTIONS,
  getSectionForStep,
  getSectionCelebration,
} from "../content/questions";
import { BUTTON_TO_COMMAND } from "../keyboards/main-menu";
import {
  calculateRIASECProfile,
  matchCareers,
  saveTestResults,
} from "../services/results.service";
import {
  generateSectionInsight,
  shouldShowInsight,
} from "../services/insight.service";
import {
  awardQuestionPoints,
  awardSectionPoints,
  awardTestCompletionPoints,
  checkBadgeUnlock,
  checkEasterEggBadge,
  getBadgeNotification,
  checkMirrorBadge,
} from "../services/gamification.service";
import {
  analyzeAnswerPattern,
  generateMirrorQuestion,
  getPatternName,
  MIRROR_QUESTION_STEP,
} from "../services/mirror.service";
import {
  completeReferral,
  claimReferralRewards,
  checkReferralMilestoneBadge,
} from "../services/referral.service";
import { sendReferralSuccessNotification } from "../services/notification.service";
import { buildResultsKeyboard } from "../keyboards/results";
import { studentActiveQuizMenu, studentMainMenu } from "../keyboards/main-menu";
import { logger } from "../utils/logger";
import { genderPhrases } from "../utils/gender";

// ============================================================================
// Composer
// ============================================================================

export const quizHandler = new Composer<MyContext>();

// ============================================================================
// /test Command - Start New Quiz
// ============================================================================

async function handleStartTest(ctx: MyContext) {
  if (!ctx.from) return;

  const log = logger.child({ command: "/test", telegramId: ctx.from.id });

  // Check if user is a registered student
  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся как ученик. Отправь /start");
    return;
  }

  try {
    // Check for existing active session
    if (hasActiveQuiz(ctx)) {
      const progress = Math.round(
        (ctx.quizSession.currentStep / TOTAL_QUESTIONS) * 100,
      );
      await ctx.reply(
        `У тебя уже есть незавершённый тест!\n\n` +
          `📊 Прогресс: ${ctx.quizSession.currentStep}/${TOTAL_QUESTIONS} вопросов (${progress}%)\n\n` +
          `Что хочешь сделать?`,
        { reply_markup: buildResumePromptKeyboard() },
      );
      return;
    }

    // Start new session (validates retake policy)
    const result = await startSession(
      ctx.prisma,
      ctx.user.studentId,
      ctx.from.username,
    );

    // Handle retake policy errors
    if (!result.success) {
      log.info(
        { errorType: result.error.type },
        "Quiz start blocked by retake policy",
      );
      await ctx.reply(result.error.message);
      return;
    }

    const session = result.session;
    log.info({ sessionId: session.id }, "New quiz session started");

    // Show intro message with active quiz keyboard
    await ctx.reply(
      `🌳 Отлично! Начинаем тест на профориентацию.\n\n` +
        `📝 Всего ${TOTAL_QUESTIONS} вопросов, 5 секций\n` +
        `⏱ Примерное время: 15-20 минут\n\n` +
        `Отвечай честно — правильных и неправильных ответов нет!\n\n` +
        `💡 _Если отвлечёшься — нажми «Продолжить тест» внизу._`,
      {
        reply_markup: studentActiveQuizMenu,
        parse_mode: "Markdown",
      },
    );

    // Render first question
    await renderStep(ctx, 0, session.id);
  } catch (error) {
    log.error({ error }, "Error starting quiz");
    await ctx.reply("Произошла ошибка при запуске теста. Попробуй позже.");
  }
}

quizHandler.command("test", handleStartTest);

// ============================================================================
// /resume Command - Continue Existing Quiz
// ============================================================================

async function handleResumeTest(ctx: MyContext) {
  if (!ctx.from) return;

  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся как ученик. Отправь /start");
    return;
  }

  try {
    // Check for active session via middleware or fetch fresh
    const session =
      ctx.quizSession ??
      (await getActiveSession(ctx.prisma, ctx.user.studentId));

    if (!session) {
      await ctx.reply(
        "У тебя нет активного теста. Отправь /test чтобы начать новый.",
      );
      return;
    }

    const { text } = getProgress(session.currentStep);

    await ctx.reply(`📚 Продолжаем тест!\n\n${text}`);

    // Render current question
    await renderStep(ctx, session.currentStep, session.id);
  } catch (error) {
    logger.error({ error }, "Error resuming quiz");
    await ctx.reply("Произошла ошибка. Попробуй /test чтобы начать заново.");
  }
}

quizHandler.command("resume", handleResumeTest);

// ============================================================================
// Keyboard Button Handlers (Reply Keyboard)
// ============================================================================

// "Начать тест" button -> same as /test
quizHandler.hears(/^Начать тест$/i, handleStartTest);

// "Продолжить тест" button -> same as /resume
quizHandler.hears(/^Продолжить тест$/i, handleResumeTest);

// ============================================================================
// Text Message Handler for OPEN_TEXT Questions
// ============================================================================

/**
 * Handle text messages during quiz (OPEN_TEXT questions)
 * This handler must come AFTER .hears() handlers to avoid conflicts
 */
quizHandler.on("message:text", async (ctx, next) => {
  if (!ctx.from || !ctx.message?.text) return next();

  // Skip if text is a command or known menu button - pass to downstream handlers
  const text = ctx.message.text;
  if (text.startsWith("/") || text in BUTTON_TO_COMMAND) {
    return next();
  }

  const log = logger.child({ fn: "textAnswer", telegramId: ctx.from.id });

  // Check if user has active quiz - if not, pass to other handlers
  if (!isStudent(ctx)) return next();

  const session =
    ctx.quizSession ?? (await getActiveSession(ctx.prisma, ctx.user.studentId));
  if (!session) return next();

  // Get current question
  const question = await getQuestionForStep(ctx.prisma, session.currentStep);
  if (!question) {
    log.warn({ step: session.currentStep }, "No question found for step");
    return next();
  }

  // Only handle OPEN_TEXT questions - pass others to downstream handlers
  if (question.type !== "OPEN_TEXT") {
    log.debug(
      { type: question.type },
      "Text received but question is not OPEN_TEXT",
    );
    return next();
  }

  try {
    // Save the text answer (limit to 500 chars)
    const nextStep = await saveAnswer(ctx.prisma, session.id, {
      questionId: question.id,
      value: text.substring(0, 500),
    });

    log.info({ questionId: question.id, nextStep }, "OPEN_TEXT answer saved");

    // Award points
    await awardQuestionPoints(ctx.prisma, ctx.user.studentId);

    // Confirm to user
    await ctx.reply(
      `✅ Записано! "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
    );

    // Check for section completion
    if (isEndOfSection(session.currentStep)) {
      await handleSectionComplete(ctx, session.currentStep, session.id);
    } else {
      // Render next question
      await renderStep(ctx, nextStep, session.id);
    }
  } catch (error) {
    log.error({ error }, "Error saving OPEN_TEXT answer");
    await ctx.reply("Произошла ошибка. Попробуй /resume чтобы продолжить.");
  }
});

// ============================================================================
// /abort and /cancel Commands - Abandon Current Quiz
// ============================================================================

/**
 * Handler for abandoning quiz (shared by /abort and /cancel)
 */
async function handleAbandonQuiz(ctx: MyContext): Promise<void> {
  if (!ctx.from) return;

  const log = logger.child({ command: "/cancel", telegramId: ctx.from.id });

  if (!isStudent(ctx) || !hasActiveQuiz(ctx)) {
    await ctx.reply("У тебя нет активного теста.");
    return;
  }

  try {
    const sessionId = ctx.quizSession.id;

    await ctx.prisma.testSession.update({
      where: { id: sessionId },
      data: { status: "ABANDONED" },
    });

    log.info({ sessionId }, "Quiz session abandoned by user");

    // Note: ctx.quizSession will be undefined on next request
    // as middleware reloads session state fresh each time

    await ctx.reply(
      "Тест отменён. Твой прогресс сохранён.\n\nОтправь /test чтобы начать заново.",
    );
  } catch (error) {
    log.error({ error }, "Error aborting quiz");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
}

quizHandler.command("abort", handleAbandonQuiz);
quizHandler.command("cancel", handleAbandonQuiz);

// ============================================================================
// FSM Core: renderStep Function
// ============================================================================

/**
 * Render question for given step
 * This is the FSM "instruction executor"
 */
async function renderStep(
  ctx: MyContext,
  step: number,
  sessionId: string,
): Promise<void> {
  const log = logger.child({ fn: "renderStep", step, sessionId });

  // Check if quiz is complete
  if (isQuizComplete(step)) {
    log.info("Quiz complete, triggering results");
    await handleQuizComplete(ctx, sessionId);
    return;
  }

  // Special handling for Mirror question (Q33)
  if (step === MIRROR_QUESTION_STEP) {
    try {
      log.info("Rendering Mirror question (Q33)");

      // Analyze previous 32 answers
      const pattern = await analyzeAnswerPattern(ctx.prisma, sessionId);
      const mirrorQ = generateMirrorQuestion(pattern);

      // Store correct pattern in answeredJSON for later verification.
      // Using $transaction for atomic read-modify-write to prevent race conditions.
      // Key "_mirrorCorrectPattern" uses underscore prefix to indicate internal metadata
      // (not a question answer). This avoids collision with question IDs like "q33".
      await ctx.prisma.$transaction(async (tx) => {
        const session = await tx.testSession.findUnique({
          where: { id: sessionId },
          select: { answeredJSON: true },
        });
        const answers = (session?.answeredJSON as Record<string, string>) || {};
        await tx.testSession.update({
          where: { id: sessionId },
          data: {
            answeredJSON: {
              ...answers,
              _mirrorCorrectPattern: pattern.patternCode,
            },
          },
        });
      });

      // Build progress info
      const { text: progressText } = getProgress(step);

      // Send mirror question with custom keyboard (add back button if not first step)
      const mirrorKeyboard = buildMirrorKeyboard(mirrorQ.options);
      if (step > 0) {
        mirrorKeyboard.row().text("← Назад", CALLBACK_PREFIX.BACK);
      }
      await ctx.reply(`${progressText}\n\n${mirrorQ.text}`, {
        reply_markup: mirrorKeyboard,
        parse_mode: "Markdown",
      });

      log.info(
        {
          patternCode: pattern.patternCode,
          answeredCount: pattern.answeredCount,
        },
        "Mirror question rendered",
      );
      return;
    } catch (error) {
      log.error(
        { error },
        "Error rendering Mirror question, falling back to static",
      );
      // Fall through to regular question rendering as fallback
    }
  }

  try {
    // Load question from database
    const question = await getQuestionForStep(ctx.prisma, step);

    if (!question) {
      log.error("Question not found for step");
      await ctx.reply("Ошибка: вопрос не найден. Обратитесь в поддержку.");
      return;
    }

    // Build progress info
    const { text: progressText } = getProgress(step);

    // Build question text
    let messageText = `${progressText}\n\n`;
    messageText += `**${question.text}**`;

    // Add options as text for MULTIPLE_CHOICE questions
    if (question.type === "MULTIPLE_CHOICE" && question.options) {
      messageText += `\n\n${formatOptionsAsText(question.options)}`;
    }

    // Add options as text for BINARY questions
    if (question.type === "BINARY" && question.options) {
      messageText += `\n\n${formatOptionsAsText(question.options)}`;
    }

    // Add rating scale labels if applicable
    // Labels already include "1 = " and "5 = " prefix for clarity
    if (question.type === "RATING" && question.ratingRange?.labels) {
      messageText += `\n\n_${question.ratingRange.labels.min}_`;
      messageText += `\n_${question.ratingRange.labels.max}_`;
    }

    // Add hint for OPEN_TEXT questions
    if (question.type === "OPEN_TEXT") {
      if (question.hint) {
        messageText += `\n\n💡 _${question.hint}_`;
      }
      messageText += `\n\n✍️ _Напиши свой ответ (до 500 символов) или нажми «Пропустить»_`;
    }

    // Build keyboard (pass step for back button on step > 0)
    const keyboard = buildQuestionKeyboard(question, step);

    // Add hint button for Easter egg questions
    if (question.isEasterEgg && question.hint) {
      keyboard.row();
      keyboard.text("🔍 Подсказка", `${CALLBACK_PREFIX.HINT}${question.id}`);
    }

    // Send question
    await ctx.reply(messageText, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });

    log.debug(
      { questionId: question.id, type: question.type },
      "Question rendered",
    );
  } catch (error) {
    log.error({ error }, "Error rendering step");
    await ctx.reply("Произошла ошибка. Попробуй /resume чтобы продолжить.");
  }
}

// ============================================================================
// Answer Callback Handlers
// ============================================================================

/**
 * Handle all answer callbacks (MC, Rating, Binary)
 */
quizHandler.callbackQuery(/^answer_/, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!ctx.from) return;

  const log = logger.child({ fn: "answerCallback", telegramId: ctx.from.id });

  // Verify user is a student with active session
  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся. Отправь /start");
    return;
  }

  // Get session from context or fetch
  const session =
    ctx.quizSession ?? (await getActiveSession(ctx.prisma, ctx.user.studentId));

  if (!session) {
    await ctx.reply("У тебя нет активного теста. Отправь /test");
    return;
  }

  try {
    // Parse callback data
    const parsed = parseAnswerCallback(ctx.callbackQuery.data);
    if (!parsed) {
      log.warn({ data: ctx.callbackQuery.data }, "Invalid answer callback");
      return;
    }

    // Get current question ID
    const question = await getQuestionForStep(ctx.prisma, session.currentStep);
    if (!question) {
      log.error(
        { step: session.currentStep },
        "Question not found for current step",
      );
      await ctx.reply("Ошибка: вопрос не найден.");
      return;
    }

    // Save answer and get next step
    const nextStep = await saveAnswer(ctx.prisma, session.id, {
      questionId: question.id,
      value: parsed.value,
    });

    log.debug(
      { questionId: question.id, value: parsed.value, nextStep },
      "Answer saved",
    );

    // Award points for answering question
    try {
      await awardQuestionPoints(ctx.prisma, ctx.user.studentId);

      // Check for Easter egg badges
      const easterEggBadges = await checkEasterEggBadge(
        ctx.prisma,
        ctx.user.studentId,
        {
          questionNumber: session.currentStep + 1,
          answeredAt: new Date(),
          answerValue: parsed.value, // Pass answer for correct answer validation
        },
      );

      // Notify about any new badges earned
      for (const result of easterEggBadges) {
        if (result.isNew && result.badge) {
          const badgeMessage = getBadgeNotification(result.badge);
          await ctx.reply(badgeMessage);
        }
      }
    } catch (error) {
      log.error({ error }, "Error awarding question points");
    }

    // Edit message to show answer was recorded
    await ctx.editMessageText(
      `✅ Ответ записан: ${getAnswerDisplayText(parsed.type, parsed.value, question)}`,
    );

    // Check for section completion
    if (isEndOfSection(session.currentStep)) {
      await handleSectionComplete(ctx, session.currentStep, session.id);
    } else {
      // Render next question
      await renderStep(ctx, nextStep, session.id);
    }
  } catch (error) {
    log.error({ error }, "Error processing answer");
    await ctx.reply("Произошла ошибка. Попробуй /resume чтобы продолжить.");
  }
});

// ============================================================================
// Section Complete Handler
// ============================================================================

async function handleSectionComplete(
  ctx: MyContext,
  step: number,
  sessionId: string,
): Promise<void> {
  const section = getSectionForStep(step);
  const celebration = getSectionCelebration(section);

  // Check if this is the final section
  if (section >= 5) {
    await handleQuizComplete(ctx, sessionId);
    return;
  }

  // Get student gender for personalized messages
  let studentGender: "MALE" | "FEMALE" | "NOT_SPECIFIED" | null = null;
  if (isStudent(ctx)) {
    try {
      const student = await ctx.prisma.student.findUnique({
        where: { id: ctx.user.studentId },
        select: { gender: true },
      });
      studentGender = student?.gender ?? null;
    } catch (error) {
      logger.warn({ error }, "Failed to fetch student gender");
    }
  }

  // Award section completion points
  if (isStudent(ctx)) {
    try {
      await awardSectionPoints(ctx.prisma, ctx.user.studentId, section);

      // Check for badge unlocks
      const progress = Math.round((step / TOTAL_QUESTIONS) * 100);
      const badgeResult = await checkBadgeUnlock(
        ctx.prisma,
        ctx.user.studentId,
        progress,
      );

      if (badgeResult.isNew && badgeResult.badge) {
        const badgeMessage = getBadgeNotification(badgeResult.badge);
        await ctx.reply(badgeMessage);
      }
    } catch (error) {
      logger.error({ error }, "Error awarding section points");
    }
  }

  // Generate insight teaser for sections 2, 3, 4
  let insightText = "";
  if (shouldShowInsight(section)) {
    try {
      const insight = await generateSectionInsight(
        ctx.prisma,
        sessionId,
        section,
      );
      insightText = `\n\n💡 ${insight.message}`;
    } catch (error) {
      logger.error({ error }, "Error generating insight");
    }
  }

  // Show section celebration with gender-specific text
  const nextSection = section + 1;
  const sectionsRemaining = 5 - section;
  const completedVerb = genderPhrases.completed(studentGender);
  const readyText = genderPhrases.ready(studentGender);

  await ctx.reply(
    `🎉 ${celebration}\n\n` +
      `Ты ${completedVerb} секцию ${section}/5!\n` +
      `✨ +100 очков за секцию!` +
      insightText +
      `\n\nОсталось: ${sectionsRemaining} ${getSectionWord(sectionsRemaining)}\n\n` +
      `${readyText} к секции ${nextSection}?`,
    { reply_markup: buildSectionCompleteKeyboard() },
  );
}

// ============================================================================
// Flow Continue Callback (after section celebration)
// ============================================================================

quizHandler.callbackQuery(CALLBACK_PREFIX.CONTINUE, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  const session =
    ctx.quizSession ?? (await getActiveSession(ctx.prisma, ctx.user.studentId));

  if (!session) {
    await ctx.reply("Сессия истекла. Отправь /test чтобы начать заново.");
    return;
  }

  await ctx.editMessageText("Продолжаем! 💪");
  await renderStep(ctx, session.currentStep, session.id);
});

// ============================================================================
// Back Navigation Callback (go to previous question)
// ============================================================================

quizHandler.callbackQuery(CALLBACK_PREFIX.BACK, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!ctx.from) return;

  const log = logger.child({ fn: "goBack", telegramId: ctx.from.id });

  if (!isStudent(ctx)) return;

  const session =
    ctx.quizSession ?? (await getActiveSession(ctx.prisma, ctx.user.studentId));

  if (!session) return;

  const previousStep = session.currentStep - 1;
  if (previousStep < 0) return;

  // Update session step to previous
  await updateSessionStep(ctx.prisma, session.id, previousStep);

  // Update context session
  if (ctx.quizSession) {
    ctx.quizSession.currentStep = previousStep;
  }

  log.info(
    { previousStep, sessionId: session.id },
    "Going back to previous question",
  );

  // Render the previous question
  await renderStep(ctx, previousStep, session.id);
});

// ============================================================================
// Resume/New Session Callbacks (from /test existing session prompt)
// ============================================================================

quizHandler.callbackQuery(CALLBACK_PREFIX.RESUME, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  const session =
    ctx.quizSession ?? (await getActiveSession(ctx.prisma, ctx.user.studentId));

  if (!session) {
    await ctx.editMessageText(
      "Сессия истекла. Отправь /test чтобы начать заново.",
    );
    return;
  }

  const { text } = getProgress(session.currentStep);
  await ctx.editMessageText(`📚 Продолжаем тест!\n\n${text}`);
  await renderStep(ctx, session.currentStep, session.id);
});

quizHandler.callbackQuery(CALLBACK_PREFIX.NEW, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  const log = logger.child({ fn: "startFresh", telegramId: ctx.from.id });

  try {
    // Abandon existing session
    const existingSession =
      ctx.quizSession ??
      (await getActiveSession(ctx.prisma, ctx.user.studentId));

    if (existingSession) {
      await ctx.prisma.testSession.update({
        where: { id: existingSession.id },
        data: { status: "ABANDONED" },
      });
      log.info({ sessionId: existingSession.id }, "Previous session abandoned");
    }

    // Start new session (validates retake policy)
    const result = await startSession(
      ctx.prisma,
      ctx.user.studentId,
      ctx.from.username,
    );

    // Handle retake policy errors
    if (!result.success) {
      log.info(
        { errorType: result.error.type },
        "Quiz start blocked by retake policy",
      );
      await ctx.editMessageText(result.error.message);
      return;
    }

    const session = result.session;
    log.info({ sessionId: session.id }, "New quiz session started (fresh)");

    await ctx.editMessageText(
      `🌳 Начинаем заново!\n\n` +
        `📝 Всего ${TOTAL_QUESTIONS} вопросов, 5 секций\n` +
        `⏱ Примерное время: 15-20 минут\n\n` +
        `Отвечай честно — правильных и неправильных ответов нет!`,
    );

    // Show active quiz keyboard
    await ctx.reply(`💡 _Если отвлечёшься — нажми «Продолжить тест» внизу._`, {
      reply_markup: studentActiveQuizMenu,
      parse_mode: "Markdown",
    });

    await renderStep(ctx, 0, session.id);
  } catch (error) {
    log.error({ error }, "Error starting fresh quiz");
    await ctx.editMessageText("Произошла ошибка. Попробуй /test ещё раз.");
  }
});

// ============================================================================
// Hint Callback (Easter Egg)
// ============================================================================

quizHandler.callbackQuery(/^hint_/, async (ctx) => {
  await ctx.answerCallbackQuery();

  const questionId = ctx.callbackQuery.data.substring(
    CALLBACK_PREFIX.HINT.length,
  );

  try {
    const question = await ctx.prisma.question.findUnique({
      where: { id: questionId },
      select: { hint: true },
    });

    if (question?.hint) {
      await ctx.reply(`💡 ${question.hint}`);
    }
  } catch (error) {
    logger.error({ error, questionId }, "Error fetching hint");
  }
});

// ============================================================================
// Skip Callback (OPEN_TEXT questions)
// ============================================================================

/**
 * Handle skip button for OPEN_TEXT questions
 */
quizHandler.callbackQuery(CALLBACK_PREFIX.SKIP, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  const session =
    ctx.quizSession ?? (await getActiveSession(ctx.prisma, ctx.user.studentId));

  if (!session) {
    await ctx.editMessageText(
      "Сессия истекла. Отправь /test чтобы начать заново.",
    );
    return;
  }

  const question = await getQuestionForStep(ctx.prisma, session.currentStep);
  if (!question) return;

  try {
    // Save empty answer for skipped question
    const nextStep = await saveAnswer(ctx.prisma, session.id, {
      questionId: question.id,
      value: "[ПРОПУЩЕНО]",
    });

    logger.info(
      { sessionId: session.id, questionId: question.id },
      "OPEN_TEXT question skipped",
    );

    await ctx.editMessageText("⏭️ Пропущено");

    // Check for section completion or render next
    if (isEndOfSection(session.currentStep)) {
      await handleSectionComplete(ctx, session.currentStep, session.id);
    } else {
      await renderStep(ctx, nextStep, session.id);
    }
  } catch (error) {
    logger.error({ error }, "Error skipping OPEN_TEXT question");
    await ctx.reply("Произошла ошибка. Попробуй /resume чтобы продолжить.");
  }
});

// ============================================================================
// Mirror Question Callback (Q33)
// ============================================================================

/**
 * Handle Mirror question (Q33) answer
 * Awards DETECTIVE badge if student correctly guesses their pattern
 */
quizHandler.callbackQuery(/^mirror_/, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!ctx.from) return;

  const log = logger.child({ fn: "mirrorCallback", telegramId: ctx.from.id });

  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся. Отправь /start");
    return;
  }

  const session =
    ctx.quizSession ?? (await getActiveSession(ctx.prisma, ctx.user.studentId));

  if (!session) {
    await ctx.reply("У тебя нет активного теста. Отправь /test");
    return;
  }

  try {
    // Parse selected pattern from callback data (mirror_ai -> AI)
    const selectedPattern = ctx.callbackQuery.data
      .replace(CALLBACK_PREFIX.MIRROR, "")
      .toUpperCase();

    // Validate pattern is a valid 2-letter RIASEC code
    const validChars = ["R", "I", "A", "S", "E", "C"];
    const patternChars = selectedPattern.split("");
    const isValidPattern =
      selectedPattern.length === 2 &&
      patternChars.every((c) => validChars.includes(c));

    if (!isValidPattern) {
      log.warn({ selectedPattern }, "Invalid pattern code received");
      await ctx.reply("❌ Неверный ответ. Попробуй снова.");
      return;
    }

    // Get correct pattern from stored answeredJSON
    const sessionData = await ctx.prisma.testSession.findUnique({
      where: { id: session.id },
      select: { answeredJSON: true },
    });
    const answers = (sessionData?.answeredJSON as Record<string, string>) || {};
    const correctPattern = answers._mirrorCorrectPattern || "";

    log.info({ selectedPattern, correctPattern }, "Mirror answer received");

    // Save answer
    const nextStep = await saveAnswer(ctx.prisma, session.id, {
      questionId: "q33",
      value: selectedPattern,
    });

    // Award points for answering
    await awardQuestionPoints(ctx.prisma, ctx.user.studentId);

    // Check for Detective badge
    const badgeResult = await checkMirrorBadge(
      ctx.prisma,
      ctx.user.studentId,
      selectedPattern,
      correctPattern,
    );

    // Edit message to show answer was recorded
    await ctx.editMessageText(
      `✅ Ответ записан: ${getPatternName(selectedPattern)}`,
    );

    // Show reveal message
    if (badgeResult.isNew) {
      await ctx.reply(
        `🕵️ **Браво!** Ты угадал свой профиль!\n\n` +
          `${getPatternName(correctPattern)}\n\n` +
          `🏆 +30 очков и значок «Детектив»!`,
        { parse_mode: "Markdown" },
      );
    } else if (badgeResult.unlocked) {
      // Already had the badge
      await ctx.reply(
        `🕵️ Ты снова угадал свой профиль!\n\n` +
          `${getPatternName(correctPattern)}`,
        { parse_mode: "Markdown" },
      );
    } else {
      await ctx.reply(
        `💡 Интересно! Ты выбрал ${getPatternName(selectedPattern)}, а твой профиль —\n\n` +
          `${getPatternName(correctPattern)}\n\n` +
          `Это тоже ценный инсайт о том, как ты себя видишь!`,
        { parse_mode: "Markdown" },
      );
    }

    // Check for section completion (Q33 is last in Section 3)
    if (isEndOfSection(session.currentStep)) {
      await handleSectionComplete(ctx, session.currentStep, session.id);
    } else {
      await renderStep(ctx, nextStep, session.id);
    }
  } catch (error) {
    log.error({ error }, "Error processing mirror answer");
    await ctx.reply("Произошла ошибка. Попробуй /resume чтобы продолжить.");
  }
});

// ============================================================================
// Quiz Complete Handler
// ============================================================================

async function handleQuizComplete(
  ctx: MyContext,
  sessionId: string,
): Promise<void> {
  const log = logger.child({ fn: "handleQuizComplete", sessionId });

  try {
    // Mark session as completed (if not already by saveAnswer)
    await ctx.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    log.info("Quiz completed");

    // Award completion points and badge
    if (isStudent(ctx)) {
      try {
        await awardTestCompletionPoints(ctx.prisma, ctx.user.studentId);
        const badgeResult = await checkBadgeUnlock(
          ctx.prisma,
          ctx.user.studentId,
          100,
        );
        if (badgeResult.isNew && badgeResult.badge) {
          const badgeMessage = getBadgeNotification(badgeResult.badge);
          await ctx.reply(badgeMessage);
        }
      } catch (error) {
        log.error({ error }, "Error awarding completion points");
      }
    }

    // Show completion message
    await ctx.reply(
      `🎊 Поздравляем! Тест завершён!\n\n` +
        `Ты ответил на все ${TOTAL_QUESTIONS} вопросов.\n` +
        `🏆 +500 очков за завершение теста!\n\n` +
        `⏳ Подожди немного, мы анализируем твои ответы...`,
    );

    // Calculate RIASEC profile
    log.info("Calculating RIASEC profile");
    const profile = await calculateRIASECProfile(ctx.prisma, sessionId);

    // Match careers
    log.info("Matching careers");
    const careerMatches = await matchCareers(ctx.prisma, profile);

    // Save results (returns shareToken for sharing)
    log.info("Saving test results");
    const { shareToken } = await saveTestResults(
      ctx.prisma,
      sessionId,
      profile,
      careerMatches,
    );

    // Get session points for PDF unlock check
    const session = await ctx.prisma.testSession.findUnique({
      where: { id: sessionId },
      select: { points: true },
    });
    const totalPoints = session?.points || 0;

    // Show results summary
    const topCareer = careerMatches[0];
    const topCareerText = topCareer
      ? await getCareerName(ctx, topCareer.careerId)
      : "загружается...";

    // Show results with inline keyboard (includes share buttons)
    await ctx.reply(
      `📊 **Результаты готовы!**\n\n` +
        `${profile.archetype.emoji} **${profile.archetype.name}**\n` +
        `_${profile.archetype.description}_\n\n` +
        `**Код Голланда:** ${profile.topDimensions.join("")}\n` +
        `**Топ профессия:** ${topCareerText} (${topCareer?.matchPercentage ?? 0}%)\n\n` +
        `Нажми кнопку ниже чтобы увидеть подробности!`,
      {
        reply_markup: buildResultsKeyboard({
          pdfUnlocked: totalPoints >= 1000,
          shareToken,
        }),
        parse_mode: "Markdown",
      },
    );

    // Restore main menu (without "Продолжить тест")
    await ctx.reply("Главное меню:", { reply_markup: studentMainMenu });

    log.info(
      { archetype: profile.archetype.code, topCareer: topCareer?.careerId },
      "Results displayed",
    );

    // Process referral completion if user was referred
    if (ctx.user) {
      try {
        const referralResult = await completeReferral(
          ctx.prisma,
          ctx.user.userId,
        );

        if (referralResult.success && referralResult.referralId) {
          log.info(
            {
              referralId: referralResult.referralId,
              referrerId: referralResult.referrerId,
            },
            "Referral completed",
          );

          // Claim rewards for both parties
          const rewardsResult = await claimReferralRewards(
            ctx.prisma,
            referralResult.referralId,
          );

          if (rewardsResult.success) {
            // Notify referee about their bonus
            await ctx.reply(
              `🎁 +${rewardsResult.refereePointsAwarded} очков за регистрацию по реферальной ссылке!`,
            );

            // Check and award referral milestone badges to referrer
            if (referralResult.referrerId) {
              const badgeResult = await checkReferralMilestoneBadge(
                ctx.prisma,
                referralResult.referrerId,
              );

              // Send notification to referrer about successful referral
              if (referralResult.referrerTelegramId) {
                const refereeName =
                  ctx.from?.first_name ?? ctx.from?.username ?? "Друг";
                await sendReferralSuccessNotification(
                  ctx.prisma,
                  ctx.api,
                  referralResult.referrerTelegramId,
                  refereeName,
                  rewardsResult.referrerPointsAwarded,
                  badgeResult.isNew ? badgeResult.badge : undefined,
                );
              }
            }
          }
        }
      } catch (error) {
        // Don't fail quiz completion if referral processing fails
        log.error({ error }, "Error processing referral completion");
      }
    }
  } catch (error) {
    log.error({ error }, "Error completing quiz");
    await ctx.reply(
      "Произошла ошибка. Отправь /results чтобы увидеть результаты.",
    );
  }
}

/**
 * Get career name by ID
 */
async function getCareerName(
  ctx: MyContext,
  careerId: string,
): Promise<string> {
  const career = await ctx.prisma.career.findUnique({
    where: { id: careerId },
    select: { titleRu: true },
  });
  return career?.titleRu ?? "Профессия";
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get display text for answer confirmation
 */
function getAnswerDisplayText(
  type: "mc" | "rating" | "binary",
  value: string,
  question: { options?: Array<{ text: string; value: string }> },
): string {
  switch (type) {
    case "mc": {
      // Find option index and show letter
      const optionIndex =
        question.options?.findIndex((o) => o.value === value) ?? -1;
      if (optionIndex >= 0) {
        const letter = OPTION_LETTERS[optionIndex] || String(optionIndex + 1);
        return letter;
      }
      return value;
    }

    case "rating":
      return `${value}/5`;

    case "binary":
      return value === "yes" ? "Да" : "Нет";

    default:
      return value;
  }
}

/**
 * Get Russian word for "section(s)" with correct declension
 */
function getSectionWord(count: number): string {
  if (count === 1) return "секция";
  if (count >= 2 && count <= 4) return "секции";
  return "секций";
}

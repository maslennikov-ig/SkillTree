/**
 * Results Handler for SkillTree Bot
 *
 * Handles:
 * - /results command - Display RIASEC profile with radar chart
 * - Career browsing callbacks
 * - Share functionality
 * - Send to parent functionality
 */

import { Composer, InputFile, InlineKeyboard } from "grammy";
import type { MyContext } from "../types/context";
import { isStudent } from "../types/context";
import { API_URL } from "../bot";
import {
  getTestResults,
  calculateRIASECProfile,
  matchCareers,
  saveTestResults,
} from "../services/results.service";
import {
  buildResultsKeyboard,
  buildCareersListKeyboard,
  buildCareerDetailKeyboard,
  RESULTS_CALLBACK,
  parseCareerDetailCallback,
} from "../keyboards/results";
import { RIASEC_LABELS } from "@skilltree/shared";
import type { RIASECType } from "@skilltree/shared";
import { logger } from "../utils/logger";

// ============================================================================
// Fetch Utilities
// ============================================================================

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 15000,
): Promise<Response> {
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
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

/**
 * Try to edit the message text; if the message is a photo (no text to edit),
 * fall back to sending a new reply.
 */
async function safeEditOrReply(
  ctx: MyContext,
  text: string,
  options?: Record<string, unknown>,
): Promise<void> {
  try {
    await ctx.editMessageText(text, options);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("there is no text in the message to edit")
    ) {
      await ctx.reply(text, options);
    } else {
      throw error;
    }
  }
}

// ============================================================================
// Composer
// ============================================================================

export const resultsHandler = new Composer<MyContext>();

// ============================================================================
// /results Command
// ============================================================================

async function handleShowResults(ctx: MyContext) {
  if (!ctx.from) return;

  const log = logger.child({ command: "/results", telegramId: ctx.from.id });

  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся как ученик. Отправь /start");
    return;
  }

  try {
    // Get latest completed session
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!session) {
      await ctx.reply(
        "У тебя пока нет результатов. Пройди тест командой /test",
      );
      return;
    }

    // Check if results already exist
    let results = await getTestResults(ctx.prisma, session.id);

    if (!results) {
      // Calculate results (shouldn't happen normally, but handle edge case)
      log.info({ sessionId: session.id }, "Calculating results on demand");

      await ctx.reply("Анализируем твои ответы...");

      const profile = await calculateRIASECProfile(ctx.prisma, session.id);
      const careerMatches = await matchCareers(ctx.prisma, profile);
      await saveTestResults(ctx.prisma, session.id, profile, careerMatches);

      results = await getTestResults(ctx.prisma, session.id);
    }

    if (!results) {
      await ctx.reply("Произошла ошибка при получении результатов.");
      return;
    }

    // Build results message
    const message = formatResultsMessage(results);

    // Check if user has 1000+ points for PDF unlock
    const totalPoints = session.points || 0;
    const keyboard = buildResultsKeyboard({ pdfUnlocked: totalPoints >= 1000 });

    // Try to send share card image with results
    let imageSent = false;
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/results/${session.id}/share-card`,
      );
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        await ctx.replyWithPhoto(new InputFile(buffer, "profile.png"), {
          caption: message,
          reply_markup: keyboard,
          parse_mode: "Markdown",
        });
        imageSent = true;
      }
    } catch (imgError) {
      log.warn({ error: imgError }, "Failed to fetch share card for /results");
    }

    // Fallback to text-only if image failed
    if (!imageSent) {
      await ctx.reply(message, {
        reply_markup: keyboard,
        parse_mode: "Markdown",
      });
    }

    log.info({ sessionId: session.id }, "Results displayed");
  } catch (error) {
    log.error({ error }, "Error displaying results");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
}

resultsHandler.command("results", handleShowResults);

// "Результаты" keyboard button -> same as /results
resultsHandler.hears(/^Результаты$/i, handleShowResults);

// ============================================================================
// View All Careers Callback
// ============================================================================

resultsHandler.callbackQuery(RESULTS_CALLBACK.VIEW_CAREERS, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  try {
    // Get latest completed session
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!session) {
      await safeEditOrReply(
        ctx,
        "Результаты не найдены. Пройди тест командой /test",
      );
      return;
    }

    const results = await getTestResults(ctx.prisma, session.id);

    if (!results || results.careerMatches.length === 0) {
      await safeEditOrReply(ctx, "Профессии не найдены.");
      return;
    }

    // Get career details
    const careerIds = results.careerMatches.map((m) => m.careerId);
    const careers = await ctx.prisma.career.findMany({
      where: { id: { in: careerIds } },
    });

    // Build careers list message
    let message = "**Подходящие профессии:**\n\n";

    for (let i = 0; i < Math.min(5, results.careerMatches.length); i++) {
      const match = results.careerMatches[i];
      if (!match) continue;
      const career = careers.find((c) => c.id === match.careerId);
      if (!career) continue;

      const emoji = getMatchEmoji(match.matchPercentage);
      message += `${emoji} **${career.titleRu}** — ${match.matchPercentage}%\n`;
      message += `${career.category}\n\n`;
    }

    const careerButtons = careers.slice(0, 5).map((c) => ({
      id: c.id,
      titleRu: c.titleRu,
    }));

    await safeEditOrReply(ctx, message, {
      reply_markup: buildCareersListKeyboard(careerButtons),
      parse_mode: "Markdown",
    });
  } catch (error) {
    logger.error({ error }, "Error displaying careers");
    await safeEditOrReply(ctx, "Произошла ошибка.");
  }
});

// ============================================================================
// Career Detail Callback
// ============================================================================

resultsHandler.callbackQuery(/^career_detail_/, async (ctx) => {
  await ctx.answerCallbackQuery();

  const careerId = parseCareerDetailCallback(ctx.callbackQuery.data);
  if (!careerId) return;

  try {
    const career = await ctx.prisma.career.findUnique({
      where: { id: careerId },
    });

    if (!career) {
      await safeEditOrReply(ctx, "Профессия не найдена.");
      return;
    }

    // Build career detail message
    let message = `**${career.titleRu}**\n\n`;
    message += `${career.description}\n\n`;
    message += `**Категория:** ${career.category}\n`;
    message += `**Зарплата:** ${formatSalary(career.salaryMin)} - ${formatSalary(career.salaryMax)} руб.\n`;
    message += `**Спрос:** ${formatDemandLevel(career.demandLevel)}\n`;
    message += `**Перспективы:** ${formatOutlook(career.outlook)}\n\n`;

    if (career.requiredSkills.length > 0) {
      message += `**Навыки:**\n${career.requiredSkills.map((s) => `• ${s}`).join("\n")}\n\n`;
    }

    if (career.educationPath.length > 0) {
      message += `**Образование:**\n${career.educationPath.map((e) => `• ${e}`).join("\n")}\n\n`;
    }

    if (career.universities.length > 0) {
      message += `**ВУЗы:**\n${career.universities
        .slice(0, 3)
        .map((u) => `• ${u}`)
        .join("\n")}`;
    }

    await safeEditOrReply(ctx, message, {
      reply_markup: buildCareerDetailKeyboard(),
      parse_mode: "Markdown",
    });
  } catch (error) {
    logger.error({ error, careerId }, "Error displaying career detail");
    await safeEditOrReply(ctx, "Произошла ошибка.");
  }
});

// ============================================================================
// Back to Results Callback
// ============================================================================

resultsHandler.callbackQuery(RESULTS_CALLBACK.BACK_TO_RESULTS, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  try {
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!session) {
      await safeEditOrReply(ctx, "Результаты не найдены.");
      return;
    }

    const results = await getTestResults(ctx.prisma, session.id);

    if (!results) {
      await safeEditOrReply(ctx, "Результаты не найдены.");
      return;
    }

    const message = formatResultsMessage(results);
    const totalPoints = session.points || 0;

    await safeEditOrReply(ctx, message, {
      reply_markup: buildResultsKeyboard({ pdfUnlocked: totalPoints >= 1000 }),
      parse_mode: "Markdown",
    });
  } catch (error) {
    logger.error({ error }, "Error returning to results");
    await safeEditOrReply(ctx, "Произошла ошибка.");
  }
});

// ============================================================================
// PDF Roadmap Callback
// ============================================================================

resultsHandler.callbackQuery(RESULTS_CALLBACK.PDF_ROADMAP, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  const log = logger.child({
    callback: "pdfRoadmap",
    telegramId: ctx.from?.id,
  });

  try {
    // Get session with total points
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!session) {
      await safeEditOrReply(ctx, "Результаты не найдены. Пройди тест /test");
      return;
    }

    // Check if user has 1000+ points
    const totalPoints = session.points || 0;

    if (totalPoints < 1000) {
      const remaining = 1000 - totalPoints;
      await ctx.answerCallbackQuery({
        text: `Нужно ещё ${remaining} очков для разблокировки PDF`,
        show_alert: true,
      });
      return;
    }

    // User has enough points - fetch PDF from API
    await safeEditOrReply(ctx, "Генерируем PDF-отчёт...");

    const response = await fetchWithTimeout(
      `${API_URL}/results/${session.id}/pdf-roadmap`,
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    await ctx.replyWithDocument(
      new InputFile(
        pdfBuffer,
        `skilltree-roadmap-${session.id.slice(0, 8)}.pdf`,
      ),
      {
        caption:
          "Твой персональный карьерный план!\n\nСохрани и изучи рекомендации.",
      },
    );

    log.info({ sessionId: session.id }, "PDF roadmap sent");
  } catch (error) {
    log.error({ error }, "Error generating PDF roadmap");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
});

// ============================================================================
// Share Callback
// ============================================================================

resultsHandler.callbackQuery(RESULTS_CALLBACK.SHARE, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  const log = logger.child({ callback: "share", telegramId: ctx.from?.id });

  try {
    // Get the latest completed session
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!session) {
      await safeEditOrReply(
        ctx,
        "Результаты не найдены. Пройди тест командой /test",
        { reply_markup: buildResultsKeyboard() },
      );
      return;
    }

    // Generate referral link
    const referralLink = `t.me/skilltreebot?start=ref_${ctx.user.userId}`;

    // Try to fetch share card from API
    let shareCardSent = false;

    try {
      const response = await fetchWithTimeout(
        `${API_URL}/results/${session.id}/share-card`,
      );

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());

        await ctx.replyWithPhoto(new InputFile(buffer, "share-card.png"), {
          caption:
            `Мой RIASEC-профиль!\n\n` +
            `Пройди тест и узнай свои сильные стороны:\n${referralLink}`,
        });

        shareCardSent = true;
        log.info({ sessionId: session.id }, "Share card sent successfully");
      } else {
        log.warn(
          { sessionId: session.id, status: response.status },
          "Failed to fetch share card from API",
        );
      }
    } catch (fetchError) {
      log.error({ error: fetchError }, "Error fetching share card from API");
    }

    // If share card failed, send text fallback
    if (!shareCardSent) {
      await ctx.reply(
        `**Поделись своими результатами!**\n\n` +
          `Отправь эту ссылку друзьям:\n` +
          `${referralLink}\n\n` +
          `Когда друг пройдёт тест, ты получишь бонусные очки!`,
        { parse_mode: "Markdown" },
      );
    }

    // Check if this is the first share and award points
    const isFirstShare = session.shareCount === 0;

    if (isFirstShare) {
      // Update share count
      await ctx.prisma.testSession.update({
        where: { id: session.id },
        data: { shareCount: { increment: 1 } },
      });

      // Award points for first share (+25)
      const pointsAwarded = 25;

      // Update session points
      await ctx.prisma.testSession.update({
        where: { id: session.id },
        data: { points: { increment: pointsAwarded } },
      });

      // Send notification about earned points
      await ctx.reply(
        `🎉 **+${pointsAwarded} очков за первый шеринг!**\n\n` +
          `Когда друг пройдёт тест по твоей ссылке, ты получишь ещё +50 очков!`,
        { parse_mode: "Markdown" },
      );

      log.info(
        { sessionId: session.id, pointsAwarded },
        "First share points awarded",
      );
    } else {
      // Update share count for subsequent shares
      await ctx.prisma.testSession.update({
        where: { id: session.id },
        data: { shareCount: { increment: 1 } },
      });
    }
  } catch (error) {
    log.error({ error }, "Error in share handler");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
});

// ============================================================================
// Share Forward Callback - Send formatted message for forwarding
// ============================================================================

resultsHandler.callbackQuery(RESULTS_CALLBACK.SHARE_FORWARD, async (ctx) => {
  await ctx.answerCallbackQuery("Теперь перешли это сообщение!");

  if (!isStudent(ctx)) return;

  const log = logger.child({
    callback: "shareForward",
    telegramId: ctx.from?.id,
  });

  try {
    // Get the latest completed session with results
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
      include: {
        testResult: true,
      },
    });

    if (!session || !session.testResult) {
      await ctx.reply("Результаты не найдены. Пройди тест командой /test");
      return;
    }

    const result = session.testResult;
    const shareToken = result.shareToken;
    const hollandCode = result.hollandCode;
    const personalityType = result.personalityType;

    // Get top careers names
    const topCareers = result.topCareers as Array<{
      careerId: string;
      matchPercentage: number;
    }>;
    const careerIds = topCareers.slice(0, 3).map((c) => c.careerId);

    const careers = await ctx.prisma.career.findMany({
      where: { id: { in: careerIds } },
      select: { id: true, titleRu: true },
    });

    const careerMap = new Map(careers.map((c) => [c.id, c.titleRu]));
    const careerList = topCareers
      .slice(0, 3)
      .map((c, i) => {
        const name = careerMap.get(c.careerId) || "Профессия";
        return `${i + 1}. ${name} (${c.matchPercentage}%)`;
      })
      .join("\n");

    // Build share link if available
    const shareLink = shareToken
      ? `\n\n🔗 Подробнее: skilltree.ru/r/${shareToken}`
      : "";

    // Send formatted message that can be forwarded
    await ctx.reply(
      `🌳 *Результаты теста SkillTree*\n\n` +
        `📊 *Код Голланда:* ${hollandCode}\n` +
        `✨ *Тип личности:* ${personalityType}\n\n` +
        `🎯 *Топ-3 профессии:*\n${careerList}` +
        shareLink +
        `\n\n💡 _Пройди тест и узнай свои сильные стороны:_\n@SkillTreeBot`,
      { parse_mode: "Markdown" },
    );

    log.info({ sessionId: session.id, shareToken }, "Forward message sent");
  } catch (error) {
    log.error({ error }, "Error in share forward handler");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
});

// ============================================================================
// /share Command and "Поделиться" Button
// ============================================================================

async function handleShare(ctx: MyContext) {
  if (!ctx.from) return;

  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся как ученик. Отправь /start");
    return;
  }

  const log = logger.child({ command: "/share", telegramId: ctx.from.id });

  try {
    // Get the latest completed session
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!session) {
      await ctx.reply(
        "У тебя пока нет результатов. Пройди тест командой /test",
      );
      return;
    }

    // Generate referral link
    const referralLink = `t.me/skilltreebot?start=ref_${ctx.user.userId}`;

    // Try to fetch share card from API
    let shareCardSent = false;

    try {
      const response = await fetchWithTimeout(
        `${API_URL}/results/${session.id}/share-card`,
      );

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());

        await ctx.replyWithPhoto(new InputFile(buffer, "share-card.png"), {
          caption:
            `Мой RIASEC-профиль!\n\n` +
            `Пройди тест и узнай свои сильные стороны:\n${referralLink}`,
        });

        shareCardSent = true;
        log.info({ sessionId: session.id }, "Share card sent successfully");
      } else {
        log.warn(
          { sessionId: session.id, status: response.status },
          "Failed to fetch share card from API",
        );
      }
    } catch (fetchError) {
      log.error({ error: fetchError }, "Error fetching share card from API");
    }

    // If share card failed, send text fallback
    if (!shareCardSent) {
      await ctx.reply(
        `**Поделись своими результатами!**\n\n` +
          `Отправь эту ссылку друзьям:\n` +
          `${referralLink}\n\n` +
          `Когда друг пройдёт тест, ты получишь бонусные очки!`,
        { parse_mode: "Markdown" },
      );
    }

    // Check if this is the first share and award points
    const isFirstShare = session.shareCount === 0;

    if (isFirstShare) {
      // Update share count
      await ctx.prisma.testSession.update({
        where: { id: session.id },
        data: { shareCount: { increment: 1 } },
      });

      // Award points for first share (+25)
      const pointsAwarded = 25;

      // Update session points
      await ctx.prisma.testSession.update({
        where: { id: session.id },
        data: { points: { increment: pointsAwarded } },
      });

      // Send notification about earned points
      await ctx.reply(
        `🎉 **+${pointsAwarded} очков за первый шеринг!**\n\n` +
          `Когда друг пройдёт тест по твоей ссылке, ты получишь ещё +50 очков!`,
        { parse_mode: "Markdown" },
      );

      log.info(
        { sessionId: session.id, pointsAwarded },
        "First share points awarded",
      );
    } else {
      // Update share count for subsequent shares
      await ctx.prisma.testSession.update({
        where: { id: session.id },
        data: { shareCount: { increment: 1 } },
      });
    }
  } catch (error) {
    log.error({ error }, "Error in share handler");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
}

resultsHandler.command("share", handleShare);

// "Поделиться" keyboard button -> same as /share
resultsHandler.hears(/^Поделиться$/i, handleShare);

// ============================================================================
// Send to Parent Callback
// ============================================================================

// Additional callback constants for parent email functionality
const PARENT_EMAIL_CALLBACK = {
  SELECT_PARENT_PREFIX: "parent_email_select_",
  BACK: "parent_email_back",
} as const;

resultsHandler.callbackQuery(RESULTS_CALLBACK.SEND_TO_PARENT, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  const log = logger.child({
    callback: "sendToParent",
    telegramId: ctx.from?.id,
  });

  try {
    // Get latest completed session
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!session) {
      await safeEditOrReply(
        ctx,
        "Результаты не найдены. Пройди тест командой /test",
        { reply_markup: buildResultsKeyboard() },
      );
      return;
    }

    // Check if student has linked parents
    const parentLinks = await ctx.prisma.parentStudent.findMany({
      where: { studentId: ctx.user.studentId },
      include: {
        parent: {
          include: { user: true },
        },
      },
    });

    // No linked parents - show registration instructions
    if (parentLinks.length === 0) {
      await safeEditOrReply(
        ctx,
        "Чтобы отправить результаты родителям, попросите их:\n\n" +
          "1. Написать боту /start\n" +
          "2. Зарегистрироваться как родитель\n" +
          "3. Ввести код привязки\n\n" +
          "Для получения кода привязки отправь /linkcode",
        { reply_markup: buildResultsKeyboard() },
      );
      return;
    }

    // Filter parents with verified email
    const parentsWithVerifiedEmail = parentLinks.filter(
      (link) => link.parent.email && link.parent.emailVerified,
    );

    // No parents with verified email
    if (parentsWithVerifiedEmail.length === 0) {
      // Check if there are parents with unverified email
      const parentsWithUnverifiedEmail = parentLinks.filter(
        (link) => link.parent.email && !link.parent.emailVerified,
      );

      if (parentsWithUnverifiedEmail.length > 0) {
        await safeEditOrReply(
          ctx,
          "К сожалению, родитель ещё не подтвердил свой email.\n\n" +
            "Попросите родителя:\n" +
            "1. Написать боту /verifyemail\n" +
            "2. Ввести свой email\n" +
            "3. Подтвердить его кодом из письма\n\n" +
            "После этого вы сможете отправить отчёт.",
          { reply_markup: buildResultsKeyboard() },
        );
      } else {
        await safeEditOrReply(
          ctx,
          "Родитель ещё не указал свой email.\n\n" +
            "Попросите родителя:\n" +
            "1. Написать боту /verifyemail\n" +
            "2. Ввести и подтвердить свой email\n\n" +
            "После этого вы сможете отправить отчёт.",
          { reply_markup: buildResultsKeyboard() },
        );
      }
      return;
    }

    // If multiple parents with verified email, show selection keyboard
    if (parentsWithVerifiedEmail.length > 1) {
      const keyboard = new InlineKeyboard();

      for (const link of parentsWithVerifiedEmail) {
        const parentName = link.parent.user.firstName || "Родитель";
        const maskedEmail = maskEmail(link.parent.email!);
        keyboard.text(
          `${parentName} (${maskedEmail})`,
          `${PARENT_EMAIL_CALLBACK.SELECT_PARENT_PREFIX}${link.parent.id}_${session.id}`,
        );
        keyboard.row();
      }

      keyboard.text("Назад", PARENT_EMAIL_CALLBACK.BACK);

      await safeEditOrReply(ctx, "Выберите, кому отправить отчёт:", {
        reply_markup: keyboard,
      });
      return;
    }

    // Single parent with verified email - send directly
    const parentLink = parentsWithVerifiedEmail[0]!;
    await sendEmailReportToParent(ctx, session.id, parentLink.parent, log);
  } catch (error) {
    log.error({ error }, "Error in send to parent handler");
    await safeEditOrReply(ctx, "Произошла ошибка. Попробуй позже.", {
      reply_markup: buildResultsKeyboard(),
    });
  }
});

// ============================================================================
// Parent Selection Callback (when multiple parents)
// ============================================================================

resultsHandler.callbackQuery(/^parent_email_select_/, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  const log = logger.child({
    callback: "parentEmailSelect",
    telegramId: ctx.from?.id,
  });

  try {
    // Parse callback data: parent_email_select_{parentId}_{sessionId}
    const data = ctx.callbackQuery.data;
    const match = data.match(/^parent_email_select_([^_]+)_(.+)$/);

    if (!match) {
      log.warn({ data }, "Invalid parent selection callback data");
      await safeEditOrReply(ctx, "Произошла ошибка.", {
        reply_markup: buildResultsKeyboard(),
      });
      return;
    }

    const [, parentId, sessionId] = match;

    // Verify this parent is linked to the student
    const parentLink = await ctx.prisma.parentStudent.findFirst({
      where: {
        parentId,
        studentId: ctx.user.studentId,
      },
      include: {
        parent: {
          include: { user: true },
        },
      },
    });

    if (
      !parentLink ||
      !parentLink.parent.email ||
      !parentLink.parent.emailVerified
    ) {
      await safeEditOrReply(
        ctx,
        "Родитель не найден или email не подтверждён.",
        { reply_markup: buildResultsKeyboard() },
      );
      return;
    }

    await sendEmailReportToParent(ctx, sessionId!, parentLink.parent, log);
  } catch (error) {
    log.error({ error }, "Error in parent selection handler");
    await safeEditOrReply(ctx, "Произошла ошибка. Попробуй позже.", {
      reply_markup: buildResultsKeyboard(),
    });
  }
});

// ============================================================================
// Back from Parent Selection Callback
// ============================================================================

resultsHandler.callbackQuery(PARENT_EMAIL_CALLBACK.BACK, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!isStudent(ctx)) return;

  try {
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!session) {
      await safeEditOrReply(ctx, "Результаты не найдены.");
      return;
    }

    const results = await getTestResults(ctx.prisma, session.id);

    if (!results) {
      await safeEditOrReply(ctx, "Результаты не найдены.");
      return;
    }

    const message = formatResultsMessage(results);
    const totalPoints = session.points || 0;

    await safeEditOrReply(ctx, message, {
      reply_markup: buildResultsKeyboard({ pdfUnlocked: totalPoints >= 1000 }),
      parse_mode: "Markdown",
    });
  } catch (error) {
    logger.error({ error }, "Error returning to results from parent selection");
    await safeEditOrReply(ctx, "Произошла ошибка.");
  }
});

// ============================================================================
// Send Email Report Helper
// ============================================================================

interface ParentWithUser {
  id: string;
  email: string | null;
  emailVerified: boolean;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
}

async function sendEmailReportToParent(
  ctx: MyContext,
  sessionId: string,
  parent: ParentWithUser,
  log: { info: typeof logger.info; error: typeof logger.error },
): Promise<void> {
  try {
    log.info(
      { sessionId, parentId: parent.id },
      "Sending email report to parent",
    );

    const parentName = parent.user.firstName
      ? `${parent.user.firstName}${parent.user.lastName ? " " + parent.user.lastName : ""}`
      : "Родитель";

    const response = await fetchWithTimeout(
      `${API_URL}/results/${sessionId}/email-report`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentEmail: parent.email,
          parentName,
        }),
      },
    );

    if (response.ok) {
      const maskedEmail = maskEmail(parent.email!);
      await safeEditOrReply(
        ctx,
        `Отчёт успешно отправлен на email родителя: ${maskedEmail}\n\n` +
          "Родитель получит подробный отчёт о твоих результатах теста.",
        { reply_markup: buildResultsKeyboard() },
      );

      log.info(
        { sessionId, parentEmail: parent.email },
        "Email report sent successfully",
      );
    } else {
      const errorData = await response.json().catch(() => ({}));
      log.error(
        { sessionId, status: response.status, errorData },
        "Failed to send email report",
      );

      await safeEditOrReply(
        ctx,
        "Не удалось отправить отчёт. Попробуй позже.",
        {
          reply_markup: buildResultsKeyboard(),
        },
      );
    }
  } catch (error) {
    log.error({ error, sessionId }, "Error calling email report API");
    await safeEditOrReply(
      ctx,
      "Произошла ошибка при отправке. Попробуй позже.",
      { reply_markup: buildResultsKeyboard() },
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

import type { TestResults } from "../services/results.service";

function formatResultsMessage(results: TestResults): string {
  const { profile } = results;

  let message = `**Твой RIASEC-профиль**\n\n`;
  message += `${profile.archetype.emoji} **${profile.archetype.name}**\n`;
  message += `_${profile.archetype.description}_\n\n`;

  message += `**Код Голланда:** ${results.profile.topDimensions.join("")}\n\n`;

  message += `**Твои показатели:**\n`;
  const dimensions: RIASECType[] = ["R", "I", "A", "S", "E", "C"];
  for (const dim of dimensions) {
    const score = profile.normalizedScores[dim];
    const label = RIASEC_LABELS[dim].ru;
    const bar = getProgressBar(score);
    message += `${dim} ${label}: ${bar} ${score}%\n`;
  }

  if (results.careerMatches.length > 0) {
    message += `\n**Топ профессия:** `;
    const topMatch = results.careerMatches[0];
    if (topMatch) {
      message += `${topMatch.matchPercentage}% совместимость`;
    }
  }

  return message;
}

function getProgressBar(percentage: number): string {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  return "▓".repeat(filled) + "░".repeat(empty);
}

function getMatchEmoji(percentage: number): string {
  if (percentage >= 85) return "🌟";
  if (percentage >= 70) return "✨";
  if (percentage >= 55) return "👍";
  return "👌";
}

/**
 * Mask email for privacy display
 * Example: "john.doe@example.com" -> "jo***@***.com"
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***@***.ru";

  // Show first 2 chars of local part
  const maskedLocal =
    localPart.length > 2
      ? localPart.substring(0, 2) + "***"
      : localPart.substring(0, 1) + "***";

  // Show only domain extension
  const domainParts = domain.split(".");
  const extension = domainParts.pop() || "ru";
  const maskedDomain = "***." + extension;

  return `${maskedLocal}@${maskedDomain}`;
}

function formatSalary(amount: number): string {
  return new Intl.NumberFormat("ru-RU").format(amount);
}

function formatDemandLevel(level: string): string {
  const levels: Record<string, string> = {
    HIGH: "Высокий 📈",
    MEDIUM: "Средний 📊",
    LOW: "Низкий 📉",
  };
  return levels[level] || level;
}

function formatOutlook(outlook: string): string {
  const outlooks: Record<string, string> = {
    GROWING: "Растущая 🚀",
    STABLE: "Стабильная 💼",
    DECLINING: "Сокращающаяся 📉",
  };
  return outlooks[outlook] || outlook;
}

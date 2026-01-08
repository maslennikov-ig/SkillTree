/**
 * Inline Query Handler for SkillTree Bot
 *
 * Handles:
 * - @skilltree_bot results - Share test results in any chat
 */

import { Composer, InlineQueryResultBuilder, InlineKeyboard } from "grammy";
import type { MyContext } from "../types/context";
import { getTestResults } from "../services/results.service";
import { logger } from "../utils/logger";

// Base URL for public results page
const RESULTS_BASE_URL = process.env.RESULTS_URL || "https://skilltree.ru/r";

export const inlineHandler = new Composer<MyContext>();

// ============================================================================
// Inline Query: @skilltree_bot results
// ============================================================================

inlineHandler.inlineQuery(/results?/i, async (ctx) => {
  const log = logger.child({ handler: "inline", telegramId: ctx.from.id });

  try {
    // Find user by telegram ID
    const user = await ctx.prisma.user.findUnique({
      where: { telegramId: BigInt(ctx.from.id) },
      include: {
        student: { select: { id: true } },
      },
    });

    if (!user?.student) {
      // User not registered as student
      log.debug("User not registered as student");

      const noUserResult = InlineQueryResultBuilder.article(
        "no-user",
        "🌳 Пройди тест SkillTree",
        {
          description: "Узнай свои профессии по тесту RIASEC",
          thumbnail_url: "https://skilltree.ru/logo.png",
        },
      ).text(
        "🌳 *SkillTree — тест на профориентацию*\n\n" +
          "Пройди тест и узнай, какие профессии тебе подходят!\n\n" +
          "👉 Начать: @SkillTreeBot",
        { parse_mode: "Markdown" },
      );

      await ctx.answerInlineQuery([noUserResult], { cache_time: 60 });
      return;
    }

    // Get latest completed session
    const session = await ctx.prisma.testSession.findFirst({
      where: {
        studentId: user.student.id,
        status: "COMPLETED",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!session) {
      // No completed tests
      log.debug("No completed tests");

      const noResultsResult = InlineQueryResultBuilder.article(
        "no-results",
        "🌳 Пройди тест SkillTree",
        {
          description: "У тебя пока нет результатов",
          thumbnail_url: "https://skilltree.ru/logo.png",
        },
      ).text(
        "🌳 *SkillTree — тест на профориентацию*\n\n" +
          "Я ещё не прошёл тест. Хочешь узнать свои профессии?\n\n" +
          "👉 Начать: @SkillTreeBot",
        { parse_mode: "Markdown" },
      );

      await ctx.answerInlineQuery([noResultsResult], { cache_time: 60 });
      return;
    }

    // Get test results
    const results = await getTestResults(ctx.prisma, session.id);

    if (!results) {
      log.warn({ sessionId: session.id }, "Results not found for session");
      await ctx.answerInlineQuery([], { cache_time: 10 });
      return;
    }

    // Get careers with details
    const careerIds = results.careerMatches.slice(0, 3).map((m) => m.careerId);
    const careers = await ctx.prisma.career.findMany({
      where: { id: { in: careerIds } },
    });

    // Build career list with match percentages
    const careerLines = results.careerMatches.slice(0, 3).map((match, i) => {
      const career = careers.find((c) => c.id === match.careerId);
      const title = career?.titleRu || career?.title || "Неизвестно";
      return `${i + 1}. ${title} (${match.matchPercentage}%)`;
    });

    // Build message
    const firstName = ctx.from.first_name || "Пользователь";
    const hollandCode = results.profile.topDimensions.join("");
    const archetype = results.profile.archetype;

    const messageText =
      `🌳 *Результаты теста SkillTree*\n\n` +
      `👤 ${firstName}\n` +
      `📊 Код Холланда: *${hollandCode}*\n` +
      `🎭 Тип: ${archetype.emoji} ${archetype.name}\n\n` +
      `🎯 *Топ-3 профессии:*\n` +
      careerLines.join("\n") +
      `\n\n` +
      `_${archetype.description}_\n\n` +
      `👉 Пройти тест: @SkillTreeBot`;

    // Build keyboard with share link if available
    const keyboard = new InlineKeyboard();
    if (results.shareToken) {
      keyboard.url("📊 Подробнее", `${RESULTS_BASE_URL}/${results.shareToken}`);
    }
    keyboard.url("🌳 Пройти тест", "https://t.me/SkillTreeBot");

    // Build inline result
    const resultArticle = InlineQueryResultBuilder.article(
      `results-${session.id}`,
      `🌳 Мои результаты SkillTree`,
      {
        description: `${archetype.emoji} ${archetype.name} | ${careerLines[0]}`,
        reply_markup: keyboard,
        thumbnail_url: "https://skilltree.ru/logo.png",
      },
    ).text(messageText, { parse_mode: "Markdown" });

    await ctx.answerInlineQuery([resultArticle], {
      cache_time: 300, // Cache for 5 minutes
      is_personal: true, // Results are personal to user
    });

    log.info({ sessionId: session.id }, "Inline results sent");
  } catch (error) {
    log.error({ error }, "Error handling inline query");
    await ctx.answerInlineQuery([], { cache_time: 10 });
  }
});

// ============================================================================
// Fallback: Empty query or other queries
// ============================================================================

inlineHandler.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query.trim().toLowerCase();

  // Only handle empty queries or "result" variations
  if (query === "" || query.startsWith("res")) {
    // Show hint to type "results"
    const hintResult = InlineQueryResultBuilder.article(
      "hint",
      '🔍 Введи "results" чтобы поделиться',
      {
        description: "Поделись своими результатами теста",
        thumbnail_url: "https://skilltree.ru/logo.png",
      },
    ).text(
      "🌳 *SkillTree — тест на профориентацию*\n\n" +
        "Узнай, какие профессии тебе подходят!\n\n" +
        "👉 Начать: @SkillTreeBot",
      { parse_mode: "Markdown" },
    );

    await ctx.answerInlineQuery([hintResult], { cache_time: 60 });
  } else {
    // Unknown query - return empty
    await ctx.answerInlineQuery([], { cache_time: 60 });
  }
});

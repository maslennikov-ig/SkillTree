/**
 * Inline Query Handler for SkillTree Bot
 *
 * Handles:
 * - @skilltree_bot results - Share test results in any chat
 */

import { Composer, InlineQueryResultBuilder, InlineKeyboard } from "grammy";
import type { MyContext } from "../types/context";
import { getTestResultsForInline } from "../services/results.service";
import { logger } from "../utils/logger";

// ============================================================================
// Configuration Constants
// ============================================================================

const INLINE_CONFIG = {
  CACHE: {
    ERROR: 10, // 10 seconds for errors
    NO_DATA: 60, // 1 minute for missing user/results
    SUCCESS: 300, // 5 minutes for successful results
  },
  URLS: {
    RESULTS_BASE: process.env.RESULTS_URL || "https://skilltree.ru/r",
    THUMBNAIL: "https://skilltree.ru/logo.png",
    BOT: "https://t.me/SkillTreeBot",
  },
} as const;

export const inlineHandler = new Composer<MyContext>();

// ============================================================================
// Inline Query: @skilltree_bot results
// ============================================================================

// Use strict regex pattern to match only "result" or "results" exactly
inlineHandler.inlineQuery(/^results?$/i, async (ctx) => {
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
          thumbnail_url: INLINE_CONFIG.URLS.THUMBNAIL,
        },
      ).text(
        "🌳 *SkillTree — тест на профориентацию*\n\n" +
          "Пройди тест и узнай, какие профессии тебе подходят!\n\n" +
          "👉 Начать: @SkillTreeBot",
        { parse_mode: "Markdown" },
      );

      await ctx.answerInlineQuery([noUserResult], {
        cache_time: INLINE_CONFIG.CACHE.NO_DATA,
      });
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
          thumbnail_url: INLINE_CONFIG.URLS.THUMBNAIL,
        },
      ).text(
        "🌳 *SkillTree — тест на профориентацию*\n\n" +
          "Я ещё не прошёл тест. Хочешь узнать свои профессии?\n\n" +
          "👉 Начать: @SkillTreeBot",
        { parse_mode: "Markdown" },
      );

      await ctx.answerInlineQuery([noResultsResult], {
        cache_time: INLINE_CONFIG.CACHE.NO_DATA,
      });
      return;
    }

    // Get test results with career details (optimized - single query for careers)
    const results = await getTestResultsForInline(ctx.prisma, session.id);

    // Null safety for race condition handling
    if (
      !results ||
      !results.careerMatches ||
      results.careerMatches.length === 0
    ) {
      log.warn({ sessionId: session.id }, "Results not found or empty");

      const errorResult = InlineQueryResultBuilder.article(
        "results-error",
        "🌳 Результаты недоступны",
        {
          description: "Попробуй позже",
          thumbnail_url: INLINE_CONFIG.URLS.THUMBNAIL,
        },
      ).text(
        "🌳 *SkillTree*\n\n" +
          "Результаты временно недоступны. Попробуй снова через минуту.",
        { parse_mode: "Markdown" },
      );

      await ctx.answerInlineQuery([errorResult], {
        cache_time: INLINE_CONFIG.CACHE.ERROR,
      });
      return;
    }

    // Build career list with match percentages (using pre-fetched career data)
    const careerLines = results.careerMatches.slice(0, 3).map((match, i) => {
      const career = results.careers.find((c) => c.id === match.careerId);

      if (!career) {
        log.warn({ careerId: match.careerId }, "Career not found in database");
        return `${i + 1}. Профессия недоступна (${match.matchPercentage}%)`;
      }

      const title = career.titleRu || career.title || "Неизвестно";
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
      keyboard.url(
        "📊 Подробнее",
        `${INLINE_CONFIG.URLS.RESULTS_BASE}/${results.shareToken}`,
      );
    }
    keyboard.url("🌳 Пройти тест", INLINE_CONFIG.URLS.BOT);

    // Build inline result
    const resultArticle = InlineQueryResultBuilder.article(
      `results-${session.id}`,
      `🌳 Мои результаты SkillTree`,
      {
        description: `${archetype.emoji} ${archetype.name} | ${careerLines[0]}`,
        reply_markup: keyboard,
        thumbnail_url: INLINE_CONFIG.URLS.THUMBNAIL,
      },
    ).text(messageText, { parse_mode: "Markdown" });

    await ctx.answerInlineQuery([resultArticle], {
      cache_time: INLINE_CONFIG.CACHE.SUCCESS,
      is_personal: true, // Results are personal to user
    });

    log.info({ sessionId: session.id }, "Inline results sent");
  } catch (error) {
    log.error({ error }, "Error handling inline query");
    await ctx.answerInlineQuery([], { cache_time: INLINE_CONFIG.CACHE.ERROR });
  }
});

// ============================================================================
// Fallback: Empty query or partial "res..." queries
// ============================================================================

inlineHandler.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query.trim().toLowerCase();

  // Only handle empty queries or "res" prefix (hint for typing "results")
  if (query === "" || query.startsWith("res")) {
    // Show hint to type "results"
    const hintResult = InlineQueryResultBuilder.article(
      "hint",
      '🔍 Введи "results" чтобы поделиться',
      {
        description: "Поделись своими результатами теста",
        thumbnail_url: INLINE_CONFIG.URLS.THUMBNAIL,
      },
    ).text(
      "🌳 *SkillTree — тест на профориентацию*\n\n" +
        "Узнай, какие профессии тебе подходят!\n\n" +
        "👉 Начать: @SkillTreeBot",
      { parse_mode: "Markdown" },
    );

    await ctx.answerInlineQuery([hintResult], {
      cache_time: INLINE_CONFIG.CACHE.NO_DATA,
    });
  } else {
    // Unknown query - return empty
    await ctx.answerInlineQuery([], {
      cache_time: INLINE_CONFIG.CACHE.NO_DATA,
    });
  }
});

/**
 * Referral Handler for SkillTree Bot
 *
 * Handles:
 * - /referral command - shows user's referral link and statistics
 */

import { Composer } from "grammy";
import type { MyContext } from "../types/context";
import { isAuthenticated } from "../types/context";
import {
  getReferralStats,
  getReferralCode,
} from "../services/referral.service";
import { POINTS_CONFIG } from "@skilltree/shared";
import { logger } from "../utils/logger";

// ============================================================================
// Composer
// ============================================================================

export const referralHandler = new Composer<MyContext>();

// ============================================================================
// /referral Command
// ============================================================================

referralHandler.command("referral", async (ctx) => {
  if (!ctx.from) return;

  const log = logger.child({ command: "/referral", telegramId: ctx.from.id });

  // Check if user is authenticated
  if (!isAuthenticated(ctx)) {
    await ctx.reply("Сначала зарегистрируйся. Отправь /start");
    return;
  }

  try {
    // Get user's referral statistics
    const stats = await getReferralStats(ctx.prisma, ctx.user.userId);

    // Generate referral code and link
    const referralCode = getReferralCode(ctx.user.userId);
    const botInfo = await ctx.api.getMe();
    const referralLink = `t.me/${botInfo.username}?start=${referralCode}`;

    // Calculate earned points
    const earnedPoints = stats.rewarded * POINTS_CONFIG.REFERRAL_COMPLETED;

    // Build response message
    const message =
      `🔗 **Твоя реферальная программа**\n\n` +
      `📎 Твоя ссылка:\n\`${referralLink}\`\n\n` +
      `📊 **Статистика:**\n` +
      `👥 Приглашено: ${stats.total} ${getPersonWord(stats.total)}\n` +
      `⏳ На рассмотрении: ${stats.pending}\n` +
      `✅ Прошли тест: ${stats.completed + stats.rewarded}\n` +
      `💰 Очков заработано: ${earnedPoints}\n\n` +
      `💡 **Как это работает:**\n` +
      `1. Поделись ссылкой с другом\n` +
      `2. Друг регистрируется и проходит тест\n` +
      `3. Ты получаешь +${POINTS_CONFIG.REFERRAL_COMPLETED} очков!\n` +
      `4. Друг получает +${POINTS_CONFIG.REFERRAL_BONUS_REFEREE} бонусных очков!\n\n` +
      `🏆 **Бейджи за рефералов:**\n` +
      `🤝 1 друг — Первый друг\n` +
      `👥 5 друзей — Популярный\n` +
      `👑 10 друзей — Лидер`;

    await ctx.reply(message, { parse_mode: "Markdown" });

    log.info({ stats }, "Referral stats shown to user");
  } catch (error) {
    log.error({ error }, "Error showing referral info");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Russian word for "person(s)" with correct declension
 */
function getPersonWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return "человек";
  }

  if (lastDigit === 1) {
    return "человек";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "человека";
  }

  return "человек";
}

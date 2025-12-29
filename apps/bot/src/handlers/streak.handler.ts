/**
 * Streak Handler for SkillTree Bot
 *
 * Handles:
 * - /streak command - shows current streak and total points
 * - /achievements command - shows earned badges
 * - /checkin command - perform daily check-in
 */

import { Composer } from "grammy";
import type { MyContext } from "../types/context";
import { isStudent } from "../types/context";
import {
  checkIn,
  getStreakStatus,
  formatStreakMessage,
  formatCheckInMessage,
} from "../services/streak.service";
import { formatBadgeList } from "../services/gamification.service";
import type { BadgeType } from "@skilltree/database";
import { logger } from "../utils/logger";

// ============================================================================
// Composer
// ============================================================================

export const streakHandler = new Composer<MyContext>();

// ============================================================================
// /streak Command
// ============================================================================

streakHandler.command("streak", async (ctx) => {
  if (!ctx.from) return;

  const log = logger.child({ command: "/streak", telegramId: ctx.from.id });

  // Check if user is a registered student
  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся как студент. Отправь /start");
    return;
  }

  try {
    const status = await getStreakStatus(ctx.prisma, ctx.user.studentId);
    const message = formatStreakMessage(status);

    await ctx.reply(message, { parse_mode: "Markdown" });

    log.debug({ status }, "Streak status displayed");
  } catch (error) {
    log.error({ error }, "Error fetching streak status");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
});

// ============================================================================
// /achievements Command
// ============================================================================

streakHandler.command("achievements", async (ctx) => {
  if (!ctx.from) return;

  const log = logger.child({
    command: "/achievements",
    telegramId: ctx.from.id,
  });

  // Check if user is a registered student
  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся как студент. Отправь /start");
    return;
  }

  try {
    // Get student's user ID
    const student = await ctx.prisma.student.findUnique({
      where: { id: ctx.user.studentId },
      select: { userId: true },
    });

    if (!student) {
      await ctx.reply("Профиль не найден. Отправь /start");
      return;
    }

    // Get all achievements for the user
    const achievements = await ctx.prisma.achievement.findMany({
      where: { userId: student.userId },
      orderBy: { earnedAt: "desc" },
    });

    const badges = achievements.map((a) => a.badgeType as BadgeType);

    // Build message
    let message = "\u{1F3C6} **Твои достижения**\n\n";

    if (badges.length === 0) {
      message += "У тебя пока нет бейджей.\n\n";
      message += "Начни тест командой /test, чтобы получить первый бейдж!";
    } else {
      message += formatBadgeList(badges);
      message += `\n\n_Всего бейджей: ${badges.length}_`;
    }

    await ctx.reply(message, { parse_mode: "Markdown" });

    log.debug({ badgeCount: badges.length }, "Achievements displayed");
  } catch (error) {
    log.error({ error }, "Error fetching achievements");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
});

// ============================================================================
// /checkin Command
// ============================================================================

streakHandler.command("checkin", async (ctx) => {
  if (!ctx.from) return;

  const log = logger.child({ command: "/checkin", telegramId: ctx.from.id });

  // Check if user is a registered student
  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся как студент. Отправь /start");
    return;
  }

  try {
    const info = await checkIn(ctx.prisma, ctx.user.studentId);
    const message = formatCheckInMessage(info);

    await ctx.reply(message, { parse_mode: "Markdown" });

    log.info(
      {
        day: info.currentDay,
        bonus: info.bonusEarned,
        isNew: info.isNewCheckIn,
      },
      "Check-in processed",
    );
  } catch (error) {
    log.error({ error }, "Error processing check-in");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
});

// ============================================================================
// Text Button Handlers (from ReplyKeyboard)
// ============================================================================

// Handle "Мой стрик" button
streakHandler.hears(/^(Мой стрик|мой стрик)$/i, async (ctx) => {
  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся. Отправь /start");
    return;
  }

  try {
    const status = await getStreakStatus(ctx.prisma, ctx.user.studentId);
    const message = formatStreakMessage(status);
    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    logger.error({ error }, "Error in streak button handler");
    await ctx.reply("Произошла ошибка. Попробуй /streak");
  }
});

// Handle "Достижения" button
streakHandler.hears(/^(Достижения|достижения)$/i, async (ctx) => {
  if (!isStudent(ctx)) {
    await ctx.reply("Сначала зарегистрируйся. Отправь /start");
    return;
  }

  try {
    const student = await ctx.prisma.student.findUnique({
      where: { id: ctx.user.studentId },
      select: { userId: true },
    });

    if (!student) {
      await ctx.reply("Профиль не найден. Отправь /start");
      return;
    }

    const achievements = await ctx.prisma.achievement.findMany({
      where: { userId: student.userId },
      orderBy: { earnedAt: "desc" },
    });

    const badges = achievements.map((a) => a.badgeType as BadgeType);

    let message = "\u{1F3C6} **Твои достижения**\n\n";

    if (badges.length === 0) {
      message += "У тебя пока нет бейджей.\n\n";
      message += "Начни тест командой /test, чтобы получить первый бейдж!";
    } else {
      message += formatBadgeList(badges);
      message += `\n\n_Всего бейджей: ${badges.length}_`;
    }

    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    logger.error({ error }, "Error in achievements button handler");
    await ctx.reply("Произошла ошибка. Попробуй /achievements");
  }
});

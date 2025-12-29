/**
 * Notification Service for SkillTree Bot
 *
 * Handles reminder notifications:
 * - 12-hour reminder for inactive test sessions
 * - Scheduled notification checks
 */

import type { PrismaClient, TestSession, BadgeType } from "@skilltree/database";
import type { Bot, Api, RawApi } from "grammy";
import type { MyContext } from "../types/context";
import { getBadgeNotification } from "./gamification.service";
import { logger } from "../utils/logger";

// ============================================================================
// Constants
// ============================================================================

const REMINDER_HOURS = 12; // Send reminder after 12 hours of inactivity
const EXPIRY_HOURS = 24; // Session expires after 24 hours

// ============================================================================
// Types
// ============================================================================

export interface ReminderResult {
  sessionId: string;
  telegramId: bigint;
  sent: boolean;
  error?: string;
}

// ============================================================================
// Reminder Check
// ============================================================================

/**
 * Check for sessions that need reminders and send notifications
 * Should be called periodically (e.g., every hour)
 */
export async function checkAndSendReminders(
  prisma: PrismaClient,
  bot: Bot<MyContext>,
): Promise<ReminderResult[]> {
  const log = logger.child({ fn: "checkAndSendReminders" });

  const results: ReminderResult[] = [];

  try {
    // Find sessions that:
    // 1. Are IN_PROGRESS
    // 2. Were updated 12+ hours ago
    // 3. Were updated less than 24 hours ago (not yet expired)
    // 4. Haven't received a reminder yet (reminderSentAt is null or before current inactive period)

    const reminderThreshold = new Date(
      Date.now() - REMINDER_HOURS * 60 * 60 * 1000,
    );
    const expiryThreshold = new Date(
      Date.now() - EXPIRY_HOURS * 60 * 60 * 1000,
    );

    const sessionsNeedingReminder = await prisma.testSession.findMany({
      where: {
        status: "IN_PROGRESS",
        updatedAt: {
          lte: reminderThreshold,
          gt: expiryThreshold,
        },
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lt: reminderThreshold } },
        ],
      },
      include: {
        student: {
          include: {
            user: {
              select: { telegramId: true, firstName: true },
            },
          },
        },
      },
    });

    log.info(
      { count: sessionsNeedingReminder.length },
      "Found sessions needing reminders",
    );

    for (const session of sessionsNeedingReminder) {
      const result = await sendReminder(prisma, bot, session);
      results.push(result);
    }
  } catch (error) {
    log.error({ error }, "Error checking for reminders");
  }

  return results;
}

/**
 * Send reminder to a specific session's user
 */
async function sendReminder(
  prisma: PrismaClient,
  bot: Bot<MyContext>,
  session: TestSession & {
    student: {
      user: { telegramId: bigint; firstName: string | null };
    };
  },
): Promise<ReminderResult> {
  const log = logger.child({ fn: "sendReminder", sessionId: session.id });
  const telegramId = session.student.user.telegramId;

  try {
    const progress = Math.round((session.currentStep / 55) * 100);
    const name = session.student.user.firstName ?? "друг";

    const hoursRemaining = Math.round(
      EXPIRY_HOURS -
        (Date.now() - session.updatedAt.getTime()) / (1000 * 60 * 60),
    );

    const message =
      `Привет, ${name}! 👋\n\n` +
      `Ты не закончил тест на профориентацию.\n` +
      `📊 Прогресс: ${session.currentStep}/55 вопросов (${progress}%)\n\n` +
      `⏰ Осталось ${hoursRemaining} часов до сброса сессии.\n\n` +
      `Отправь /resume чтобы продолжить!`;

    await bot.api.sendMessage(telegramId.toString(), message);

    // Mark reminder as sent
    await prisma.testSession.update({
      where: { id: session.id },
      data: { reminderSentAt: new Date() },
    });

    log.info(
      { telegramId: telegramId.toString() },
      "Reminder sent successfully",
    );

    return {
      sessionId: session.id,
      telegramId,
      sent: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error(
      { error, telegramId: telegramId.toString() },
      "Failed to send reminder",
    );

    return {
      sessionId: session.id,
      telegramId,
      sent: false,
      error: errorMessage,
    };
  }
}

// ============================================================================
// Manual Reminder Check (for testing/debugging)
// ============================================================================

/**
 * Get count of sessions that would receive reminders
 */
export async function getSessionsNeedingReminderCount(
  prisma: PrismaClient,
): Promise<number> {
  const reminderThreshold = new Date(
    Date.now() - REMINDER_HOURS * 60 * 60 * 1000,
  );
  const expiryThreshold = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);

  return prisma.testSession.count({
    where: {
      status: "IN_PROGRESS",
      updatedAt: {
        lte: reminderThreshold,
        gt: expiryThreshold,
      },
      OR: [
        { reminderSentAt: null },
        { reminderSentAt: { lt: reminderThreshold } },
      ],
    },
  });
}

/**
 * Get count of sessions that will expire soon (within 2 hours)
 */
export async function getSessionsExpiringSoonCount(
  prisma: PrismaClient,
): Promise<number> {
  const expiryThreshold = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);
  const soonThreshold = new Date(
    Date.now() - (EXPIRY_HOURS - 2) * 60 * 60 * 1000,
  );

  return prisma.testSession.count({
    where: {
      status: "IN_PROGRESS",
      updatedAt: {
        lte: soonThreshold,
        gt: expiryThreshold,
      },
    },
  });
}

// ============================================================================
// Referral Notifications
// ============================================================================

/**
 * Send notification to referrer when their referral completes the test
 *
 * @param prisma - Prisma client (unused but kept for consistency)
 * @param api - Bot API for sending messages
 * @param referrerTelegramId - Telegram ID of the referrer
 * @param refereeName - Name of the person who completed the test
 * @param pointsAwarded - Points awarded to the referrer
 * @param newBadge - Badge unlocked (if any)
 */
export async function sendReferralSuccessNotification(
  prisma: PrismaClient,
  api: Api<RawApi>,
  referrerTelegramId: bigint,
  refereeName: string,
  pointsAwarded: number,
  newBadge?: BadgeType,
): Promise<boolean> {
  const log = logger.child({
    fn: "sendReferralSuccessNotification",
    referrerTelegramId: referrerTelegramId.toString(),
    refereeName,
  });

  try {
    // Build notification message
    let message =
      `🎉 ${refereeName} прошёл тест по твоей ссылке!\n\n` +
      `💰 +${pointsAwarded} очков за успешный реферал!`;

    // Add badge notification if new badge was unlocked
    if (newBadge) {
      const badgeMessage = getBadgeNotification(newBadge);
      message += `\n\n${badgeMessage}`;
    }

    message += `\n\n📊 Проверь свою статистику: /referral`;

    await api.sendMessage(referrerTelegramId.toString(), message);

    log.info("Referral success notification sent");
    return true;
  } catch (error) {
    log.error({ error }, "Failed to send referral success notification");
    return false;
  }
}

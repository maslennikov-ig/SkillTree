/**
 * Privacy Handler for SkillTree Bot
 *
 * Handles:
 * - /deletedata command - 2-step user data deletion (FR-040)
 * - 6-digit confirmation code with 5-minute expiry
 * - Cascade deletion of all user data
 * - Audit logging before deletion
 */

import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../types/context";
import { logger } from "../utils/logger";
import * as crypto from "crypto";

// ============================================================================
// Composer
// ============================================================================

export const privacyHandler = new Composer<MyContext>();

// ============================================================================
// In-Memory Deletion Code Storage
// ============================================================================

interface PendingDeletion {
  code: string;
  expiresAt: Date;
  userId: string; // For audit logging
}

// Store pending deletion codes (in-memory, cleared on restart is OK for security)
const pendingDeletions = new Map<bigint, PendingDeletion>();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate cryptographically secure 6-digit confirmation code
 */
function generateDeletionCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Clean up expired deletion codes (runs on each /deletedata command)
 */
function cleanupExpiredCodes(): void {
  const now = new Date();
  for (const [telegramId, pending] of pendingDeletions.entries()) {
    if (now > pending.expiresAt) {
      pendingDeletions.delete(telegramId);
    }
  }
}

// ============================================================================
// /deletedata Command - Step 0: Show Warning
// ============================================================================

privacyHandler.command("deletedata", async (ctx) => {
  if (!ctx.from) {
    return;
  }

  const telegramId = BigInt(ctx.from.id);
  const log = logger.child({ command: "/deletedata", telegramId: ctx.from.id });

  try {
    // Clean up expired codes
    cleanupExpiredCodes();

    // Find user and count related data
    const user = await ctx.prisma.user.findUnique({
      where: { telegramId },
      include: {
        student: {
          include: {
            testSessions: {
              select: {
                id: true,
                testResult: { select: { id: true } },
              },
            },
          },
        },
        achievements: { select: { id: true } },
        referralsSent: { select: { id: true } },
        referralsReceived: { select: { id: true } },
      },
    });

    if (!user) {
      await ctx.reply("❌ Аккаунт не найден. Нечего удалять.");
      return;
    }

    // Count data to be deleted
    const sessionCount = user.student?.testSessions.length || 0;
    const resultCount =
      user.student?.testSessions.filter((s) => s.testResult !== null).length ||
      0;
    const achievementCount = user.achievements.length;
    const referralCount =
      (user.referralsSent?.length || 0) + (user.referralsReceived?.length || 0);

    const keyboard = new InlineKeyboard().text(
      "⚠️ Да, удалить все данные",
      "delete_confirm_step1",
    );

    await ctx.reply(
      `🗑️ *Удаление данных*\n\n` +
        `Вы запросили удаление всех ваших данных согласно праву на забвение (152-ФЗ).\n\n` +
        `*Будут удалены:*\n` +
        `• Профиль пользователя\n` +
        `• ${sessionCount} тестовых сессий\n` +
        `• ${resultCount} результатов тестов\n` +
        `• ${achievementCount} достижений\n` +
        `• ${referralCount} записей о рефералах\n` +
        `• История стриков и баллов\n` +
        `• Все ответы на вопросы\n\n` +
        `⚠️ *Это действие необратимо!*\n\n` +
        `После удаления вы сможете зарегистрироваться заново через /start`,
      { parse_mode: "Markdown", reply_markup: keyboard },
    );

    log.info(
      {
        userId: user.id,
        sessionCount,
        resultCount,
        achievementCount,
        referralCount,
      },
      "Deletion warning shown",
    );
  } catch (error) {
    log.error({ error }, "Error in /deletedata command");
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});

// ============================================================================
// Step 1: Generate and Send Confirmation Code
// ============================================================================

privacyHandler.callbackQuery("delete_confirm_step1", async (ctx) => {
  if (!ctx.from) {
    return;
  }

  await ctx.answerCallbackQuery();

  const telegramId = BigInt(ctx.from.id);
  const log = logger.child({
    action: "delete_confirm_step1",
    telegramId: ctx.from.id,
  });

  try {
    // Verify user still exists
    const user = await ctx.prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (!user) {
      await ctx.editMessageText("❌ Аккаунт не найден. Нечего удалять.");
      return;
    }

    // Generate 6-digit confirmation code
    const code = generateDeletionCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Store pending deletion
    pendingDeletions.set(telegramId, {
      code,
      expiresAt,
      userId: user.id,
    });

    await ctx.editMessageText(
      `🔐 *Код подтверждения*\n\n` +
        `Для подтверждения удаления введите код:\n\n` +
        `\`${code}\`\n\n` +
        `⏱ Код действителен 5 минут.\n` +
        `Отправьте код в чат для подтверждения.\n\n` +
        `Для отмены просто проигнорируйте это сообщение.`,
      { parse_mode: "Markdown" },
    );

    log.info(
      { userId: user.id, expiresAt: expiresAt.toISOString() },
      "Deletion code generated",
    );
  } catch (error) {
    log.error({ error }, "Error generating deletion code");
    await ctx.editMessageText(
      "Произошла ошибка. Попробуйте /deletedata снова.",
    );
  }
});

// ============================================================================
// Step 2: Verify Code and Delete Data
// ============================================================================

privacyHandler.hears(/^\d{6}$/, async (ctx) => {
  if (!ctx.from || !ctx.message?.text) {
    return;
  }

  const telegramId = BigInt(ctx.from.id);
  const enteredCode = ctx.message.text;
  const log = logger.child({
    action: "verify_deletion_code",
    telegramId: ctx.from.id,
  });

  // Check if there's a pending deletion for this user
  const pending = pendingDeletions.get(telegramId);
  if (!pending) {
    // No pending deletion - ignore message (could be other 6-digit input)
    return;
  }

  try {
    // Check if code expired
    if (new Date() > pending.expiresAt) {
      pendingDeletions.delete(telegramId);
      await ctx.reply("❌ Код истёк. Начните заново с /deletedata", {
        reply_to_message_id: ctx.message.message_id,
      });
      log.warn({ userId: pending.userId }, "Deletion code expired");
      return;
    }

    // Verify code
    if (enteredCode !== pending.code) {
      await ctx.reply(
        "❌ Неверный код. Попробуйте ещё раз или используйте /deletedata для нового кода.",
        { reply_to_message_id: ctx.message.message_id },
      );
      log.warn({ userId: pending.userId }, "Incorrect deletion code");
      return;
    }

    // Code verified - proceed with deletion
    pendingDeletions.delete(telegramId);

    // Fetch full user data for audit log
    const user = await ctx.prisma.user.findUnique({
      where: { telegramId },
      include: {
        student: {
          include: {
            testSessions: {
              select: {
                id: true,
                answers: { select: { id: true } },
                testResult: { select: { id: true } },
              },
            },
          },
        },
        parent: { select: { id: true } },
        achievements: { select: { id: true } },
        referralsSent: { select: { id: true } },
        referralsReceived: { select: { id: true } },
        dailyStreak: { select: { id: true } },
      },
    });

    if (!user) {
      await ctx.reply("❌ Пользователь не найден.");
      return;
    }

    // Create audit log BEFORE deletion (structured JSON for easy parsing)
    const auditLog = {
      event: "USER_DATA_DELETION",
      userId: user.id,
      telegramId: String(telegramId),
      telegramUsername: user.telegramUsername || null,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.student ? "student" : user.parent ? "parent" : null,
      dataDeleted: {
        testSessions: user.student?.testSessions.length || 0,
        testResults:
          user.student?.testSessions.filter((s) => s.testResult !== null)
            .length || 0,
        answers:
          user.student?.testSessions.reduce(
            (sum, s) => sum + (s.answers?.length || 0),
            0,
          ) || 0,
        achievements: user.achievements.length,
        referralsSent: user.referralsSent.length,
        referralsReceived: user.referralsReceived.length,
        hasDailyStreak: !!user.dailyStreak,
      },
      userCreatedAt: user.createdAt.toISOString(),
      deletedAt: new Date().toISOString(),
      reason: "USER_REQUEST",
      ip: ctx.from.id, // Telegram user ID as audit trail
    };

    logger.info(auditLog, "USER_DATA_DELETION audit log");

    // Perform cascade deletion (relies on Prisma schema onDelete: Cascade)
    await ctx.prisma.user.delete({
      where: { telegramId },
    });

    log.info({ userId: user.id }, "User data deleted successfully");

    await ctx.reply(
      `✅ *Данные успешно удалены*\n\n` +
        `Все ваши данные были удалены из системы SkillTree.\n` +
        `Дата удаления: ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}\n\n` +
        `Вы можете начать заново с /start`,
      { parse_mode: "Markdown", reply_to_message_id: ctx.message.message_id },
    );
  } catch (error) {
    log.error({ error, userId: pending.userId }, "Error deleting user data");
    await ctx.reply(
      "❌ Произошла ошибка при удалении данных. Попробуйте позже или обратитесь в поддержку @skilltree_support",
      { reply_to_message_id: ctx.message.message_id },
    );
  }
});

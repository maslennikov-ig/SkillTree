/**
 * Parent Handler for SkillTree Bot
 *
 * Handles:
 * - /linkcode - Student generates 6-char code for parent linking
 * - /link <code> - Parent uses code to link to child
 * - /verifyemail - Parent email verification flow
 * - /children - Parent views linked children
 */

import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../types/context";
import { isStudent, isParent } from "../types/context";
import {
  createLinkCode,
  getValidLinkCode,
  linkParentToStudent,
  getLinkedChildren,
  createEmailVerification,
  verifyEmailCode,
  getPendingEmailVerification,
} from "../services/parent.service";
import { logger } from "../utils/logger";

// ============================================================================
// Composer
// ============================================================================

export const parentHandler = new Composer<MyContext>();

// ============================================================================
// Callback Data
// ============================================================================

const CALLBACK = {
  GENERATE_NEW_CODE: "parent_new_code",
  CANCEL_EMAIL: "parent_cancel_email",
  RESEND_EMAIL: "parent_resend_email",
} as const;

// ============================================================================
// /linkcode Command (Student generates code for parent)
// ============================================================================

parentHandler.command("linkcode", async (ctx) => {
  if (!ctx.from) return;

  const log = logger.child({ command: "/linkcode", telegramId: ctx.from.id });

  // Only students can generate link codes
  if (!isStudent(ctx)) {
    await ctx.reply(
      "Эта команда доступна только для учеников.\n\n" +
        "Если ты ученик, сначала зарегистрируйся через /start",
    );
    return;
  }

  try {
    // Check for existing valid code
    const existingCode = await getValidLinkCode(ctx.prisma, ctx.user.studentId);

    if (existingCode) {
      const hoursRemaining = Math.round(
        (existingCode.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60),
      );

      const keyboard = new InlineKeyboard().text(
        "Сгенерировать новый код",
        CALLBACK.GENERATE_NEW_CODE,
      );

      await ctx.reply(
        `У тебя уже есть активный код для родителя:\n\n` +
          `**${existingCode.code}**\n\n` +
          `Код действителен ещё ${hoursRemaining} час(ов).\n\n` +
          `Отправь этот код родителю. Он должен использовать команду:\n` +
          `/link ${existingCode.code}`,
        { reply_markup: keyboard, parse_mode: "Markdown" },
      );
      return;
    }

    // Generate new code
    const { code } = await createLinkCode(ctx.prisma, ctx.user.studentId);

    log.info({ code }, "Link code generated");

    await ctx.reply(
      `Код для привязки родителя:\n\n` +
        `**${code}**\n\n` +
        `Код действителен 24 часа.\n\n` +
        `Отправь этот код родителю. Он должен использовать команду:\n` +
        `/link ${code}`,
      { parse_mode: "Markdown" },
    );
  } catch (error) {
    log.error({ error }, "Error generating link code");
    await ctx.reply("Произошла ошибка. Попробуй позже.");
  }
});

// ============================================================================
// Generate New Code Callback
// ============================================================================

parentHandler.callbackQuery(CALLBACK.GENERATE_NEW_CODE, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!ctx.from) return;

  const log = logger.child({
    callback: "generateNewCode",
    telegramId: ctx.from.id,
  });

  if (!isStudent(ctx)) {
    await ctx.editMessageText(
      "Ты не зарегистрирован как ученик. Отправь /start",
    );
    return;
  }

  try {
    const { code } = await createLinkCode(ctx.prisma, ctx.user.studentId);

    log.info({ code }, "New link code generated");

    await ctx.editMessageText(
      `Новый код для привязки родителя:\n\n` +
        `**${code}**\n\n` +
        `Код действителен 24 часа.\n\n` +
        `Отправь этот код родителю. Он должен использовать команду:\n` +
        `/link ${code}`,
      { parse_mode: "Markdown" },
    );
  } catch (error) {
    log.error({ error }, "Error generating new link code");
    await ctx.editMessageText("Произошла ошибка. Попробуй /linkcode ещё раз.");
  }
});

// ============================================================================
// /link <code> Command (Parent links to child)
// ============================================================================

parentHandler.command("link", async (ctx) => {
  if (!ctx.from) return;

  const log = logger.child({ command: "/link", telegramId: ctx.from.id });

  // Only parents can use link codes
  if (!isParent(ctx)) {
    await ctx.reply(
      "Эта команда доступна только для родителей.\n\n" +
        "Если вы родитель, сначала зарегистрируйтесь через /start",
    );
    return;
  }

  // Get code from command arguments
  const code = ctx.match?.trim();

  if (!code) {
    await ctx.reply(
      "Использование: /link <код>\n\n" +
        "Пример: /link ABC123\n\n" +
        "Попросите ребёнка сгенерировать код через команду /linkcode",
    );
    return;
  }

  try {
    const result = await linkParentToStudent(
      ctx.prisma,
      ctx.user.parentId,
      code,
    );

    if (!result.success) {
      const errorMessages: Record<string, string> = {
        invalid_code:
          "Неверный код.\n\nПроверьте код и попробуйте ещё раз, или попросите ребёнка сгенерировать новый код через /linkcode",
        expired_code:
          "Код истёк.\n\nПопросите ребёнка сгенерировать новый код через /linkcode",
        already_linked: "Этот ребёнок уже привязан к вашему аккаунту.",
        parent_not_found:
          "Ошибка: профиль родителя не найден. Попробуйте /start",
        internal_error: "Произошла ошибка. Попробуйте позже.",
      };

      await ctx.reply(
        errorMessages[result.error ?? "internal_error"] ?? "Неизвестная ошибка",
      );
      return;
    }

    log.info({ studentName: result.studentName }, "Parent linked to student");

    // Notify parent
    await ctx.reply(
      `Готово! Вы успешно привязали ребёнка ${result.studentName ?? ""}.\n\n` +
        `Теперь вы можете:\n` +
        `- Просматривать результаты тестов\n` +
        `- Получать уведомления о достижениях\n\n` +
        `Используйте /children чтобы увидеть список привязанных детей.`,
    );

    // Notify student about successful linking
    if (result.studentTelegramId) {
      try {
        await ctx.api.sendMessage(
          result.studentTelegramId.toString(),
          `Родитель ${result.parentName ?? ""} успешно привязался к твоему аккаунту.\n\n` +
            `Теперь он сможет видеть результаты твоих тестов.`,
        );
      } catch (notifyError) {
        log.warn(
          { error: notifyError },
          "Failed to notify student about linking",
        );
        // Don't fail the operation if notification fails
      }
    }
  } catch (error) {
    log.error({ error }, "Error linking parent to student");
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});

// ============================================================================
// /children Command (Parent views linked children)
// ============================================================================

parentHandler.command("children", async (ctx) => {
  if (!ctx.from) return;

  if (!isParent(ctx)) {
    await ctx.reply(
      "Эта команда доступна только для родителей.\n\n" +
        "Если вы родитель, зарегистрируйтесь через /start",
    );
    return;
  }

  try {
    const children = await getLinkedChildren(ctx.prisma, ctx.user.parentId);

    if (children.length === 0) {
      await ctx.reply(
        "У вас пока нет привязанных детей.\n\n" +
          "Чтобы привязать ребёнка:\n" +
          "1. Попросите его сгенерировать код: /linkcode\n" +
          "2. Используйте полученный код: /link <код>",
      );
      return;
    }

    let message = `Ваши дети (${children.length}):\n\n`;

    for (const child of children) {
      const name = child.firstName ?? "Без имени";
      const testStatus = child.hasCompletedTest
        ? "прошёл тест"
        : "не прошёл тест";

      message += `${name}\n`;
      message += `   ${child.grade} класс, ${child.age} лет\n`;
      message += `   ${testStatus}\n\n`;
    }

    message += `Отправьте /results чтобы увидеть результаты детей.`;

    await ctx.reply(message);
  } catch (error) {
    logger.error({ error }, "Error getting linked children");
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});

// ============================================================================
// /verifyemail Command (Parent email verification flow)
// ============================================================================

parentHandler.command("verifyemail", async (ctx) => {
  if (!ctx.from) return;

  const log = logger.child({
    command: "/verifyemail",
    telegramId: ctx.from.id,
  });

  if (!isParent(ctx)) {
    await ctx.reply(
      "Эта команда доступна только для родителей.\n\n" +
        "Если вы родитель, зарегистрируйтесь через /start",
    );
    return;
  }

  try {
    // Check if already verified
    const parent = await ctx.prisma.parent.findUnique({
      where: { id: ctx.user.parentId },
      select: { email: true, emailVerified: true },
    });

    if (parent?.emailVerified) {
      await ctx.reply(
        `Ваш email уже подтверждён: ${parent.email}\n\n` +
          `Вы будете получать отчёты о прогрессе детей на этот адрес.`,
      );
      return;
    }

    // Check for pending verification
    const pending = await getPendingEmailVerification(
      ctx.prisma,
      ctx.user.userId,
    );

    if (pending) {
      const minutesRemaining = Math.round(
        (pending.expiresAt.getTime() - Date.now()) / (1000 * 60),
      );

      const keyboard = new InlineKeyboard()
        .text("Отменить", CALLBACK.CANCEL_EMAIL)
        .text("Отправить код повторно", CALLBACK.RESEND_EMAIL);

      await ctx.reply(
        `Код подтверждения уже отправлен на ${pending.email}\n\n` +
          `Код действителен ещё ${minutesRemaining} минут.\n\n` +
          `Введите полученный код (4 цифры):`,
        { reply_markup: keyboard },
      );
      return;
    }

    // Start new verification - ask for email
    await ctx.reply(
      `Для получения отчётов о прогрессе детей укажите ваш email.\n\n` +
        `Отправьте email адрес сообщением:`,
    );

    // Set state to wait for email (using session or just handle in message handler)
    // For simplicity, we'll handle email input in a text handler with email pattern
  } catch (error) {
    log.error({ error }, "Error in /verifyemail");
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});

// ============================================================================
// Email Input Handler (catches email addresses from parents)
// ============================================================================

// Simple email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

parentHandler.on("message:text", async (ctx, next) => {
  if (!ctx.from) {
    await next();
    return;
  }

  // Only process for parents
  if (!isParent(ctx)) {
    await next();
    return;
  }

  const text = ctx.message.text.trim();

  // Check if it looks like an email
  if (EMAIL_REGEX.test(text)) {
    const log = logger.child({ fn: "emailInput", telegramId: ctx.from.id });

    try {
      // Check if there's already a pending verification
      const pending = await getPendingEmailVerification(
        ctx.prisma,
        ctx.user.userId,
      );

      if (pending) {
        // Already have pending - ignore email input
        await next();
        return;
      }

      // Create verification
      const { code } = await createEmailVerification(
        ctx.prisma,
        ctx.user.userId,
        text,
      );

      log.info({ email: text }, "Email verification created");

      // In production, the API would send the email
      // For now, we show the code (or message that email will be sent)
      await ctx.reply(
        `Код подтверждения отправлен на ${text}\n\n` +
          `Введите 4-значный код из письма.\n\n` +
          `_Примечание: в тестовом режиме код: ${code}_`,
        { parse_mode: "Markdown" },
      );

      // TODO: Call API to actually send the email
      // await sendVerificationEmail(text, code);

      return;
    } catch (error) {
      log.error({ error }, "Error creating email verification");
      await ctx.reply("Произошла ошибка. Попробуйте /verifyemail ещё раз.");
      return;
    }
  }

  // Check if it looks like a 4-digit code
  if (/^\d{4}$/.test(text)) {
    const log = logger.child({ fn: "codeInput", telegramId: ctx.from.id });

    try {
      // Check if there's a pending verification
      const pending = await getPendingEmailVerification(
        ctx.prisma,
        ctx.user.userId,
      );

      if (!pending) {
        // No pending verification - pass to next handler
        await next();
        return;
      }

      // Verify the code
      const result = await verifyEmailCode(ctx.prisma, ctx.user.userId, text);

      if (!result.success) {
        const errorMessages: Record<string, string> = {
          invalid_code: "Неверный код. Попробуйте ещё раз.",
          expired_code:
            "Код истёк. Отправьте /verifyemail чтобы получить новый код.",
          parent_not_found: "Ошибка: профиль не найден. Попробуйте /start",
          internal_error: "Произошла ошибка. Попробуйте позже.",
        };

        await ctx.reply(
          errorMessages[result.error ?? "internal_error"] ??
            "Неизвестная ошибка",
        );
        return;
      }

      log.info("Email verified successfully");

      await ctx.reply(
        `Email успешно подтверждён!\n\n` +
          `Теперь вы будете получать отчёты о прогрессе детей на этот адрес.`,
      );

      return;
    } catch (error) {
      log.error({ error }, "Error verifying email code");
      await ctx.reply("Произошла ошибка. Попробуйте /verifyemail ещё раз.");
      return;
    }
  }

  // Not an email or code - pass to next handler
  await next();
});

// ============================================================================
// Email Verification Callbacks
// ============================================================================

parentHandler.callbackQuery(CALLBACK.CANCEL_EMAIL, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!ctx.from) return;

  if (!isParent(ctx)) {
    await ctx.editMessageText("Сессия истекла. Отправьте /verifyemail");
    return;
  }

  try {
    // Delete pending verification
    await ctx.prisma.emailVerification.deleteMany({
      where: { userId: ctx.user.userId },
    });

    await ctx.editMessageText(
      "Подтверждение email отменено.\n\n" +
        "Отправьте /verifyemail чтобы начать заново.",
    );
  } catch (error) {
    logger.error({ error }, "Error cancelling email verification");
    await ctx.editMessageText("Произошла ошибка. Попробуйте /verifyemail");
  }
});

parentHandler.callbackQuery(CALLBACK.RESEND_EMAIL, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!ctx.from) return;

  const log = logger.child({
    callback: "resendEmail",
    telegramId: ctx.from.id,
  });

  if (!isParent(ctx)) {
    await ctx.editMessageText("Сессия истекла. Отправьте /verifyemail");
    return;
  }

  try {
    // Get pending verification to get the email
    const pending = await getPendingEmailVerification(
      ctx.prisma,
      ctx.user.userId,
    );

    if (!pending) {
      await ctx.editMessageText(
        "Нет активного запроса на подтверждение.\n\n" +
          "Отправьте /verifyemail чтобы начать заново.",
      );
      return;
    }

    // Create new verification code
    const { code } = await createEmailVerification(
      ctx.prisma,
      ctx.user.userId,
      pending.email,
    );

    log.info({ email: pending.email }, "Email verification code resent");

    // TODO: Call API to actually send the email
    // await sendVerificationEmail(pending.email, code);

    await ctx.editMessageText(
      `Новый код отправлен на ${pending.email}\n\n` +
        `Введите 4-значный код из письма.\n\n` +
        `_Примечание: в тестовом режиме код: ${code}_`,
      { parse_mode: "Markdown" },
    );
  } catch (error) {
    log.error({ error }, "Error resending email verification");
    await ctx.editMessageText("Произошла ошибка. Попробуйте /verifyemail");
  }
});

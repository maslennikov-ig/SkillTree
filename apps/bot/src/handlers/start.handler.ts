/**
 * Start Handler for SkillTree Bot
 *
 * Handles:
 * - /start command with deep link support (referrals)
 * - Role selection (Student/Parent)
 * - Student registration (age/grade)
 * - Parent registration (email)
 * - /help command
 */

import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../types/context";
import {
  upsertUser,
  createStudent,
  createParent,
  findByTelegramId,
} from "../services/user.service";
import {
  createReferralTracking,
  parseReferralCode,
} from "../services/referral.service";
import { getMainMenu } from "../keyboards/main-menu";
import { logger } from "../utils/logger";

// ============================================================================
// Composer
// ============================================================================

export const startHandler = new Composer<MyContext>();

// ============================================================================
// Callback Data
// ============================================================================

const CALLBACK = {
  ROLE_STUDENT: "role_student",
  ROLE_PARENT: "role_parent",
  AGE_PREFIX: "age_",
  GRADE_PREFIX: "grade_",
} as const;

// ============================================================================
// /start Command
// ============================================================================

startHandler.command("start", async (ctx) => {
  if (!ctx.from) {
    return;
  }

  const telegramId = BigInt(ctx.from.id);
  const log = logger.child({ command: "/start", telegramId: ctx.from.id });

  try {
    // Check for referral deep link (t.me/bot?start=ref_userId)
    const startPayload = ctx.match;
    let referrerUserId: string | null = null;
    if (startPayload && typeof startPayload === "string") {
      referrerUserId = parseReferralCode(startPayload);
      if (referrerUserId) {
        log.info({ referrerUserId }, "Referral code detected");
      }
    }

    // Check if user exists
    const existingUser = await findByTelegramId(ctx.prisma, telegramId);

    if (existingUser) {
      // Returning user
      const role = existingUser.student
        ? "student"
        : existingUser.parent
          ? "parent"
          : null;

      if (role) {
        // User is registered - show main menu
        const hasActiveQuiz = ctx.quizSession !== undefined;
        const keyboard = getMainMenu(role, hasActiveQuiz);

        await ctx.reply(
          `С возвращением, ${ctx.from.first_name ?? ""}!\n\nГотов продолжить?`,
          { reply_markup: keyboard },
        );
      } else {
        // User exists but no role selected yet
        await showRoleSelection(ctx);
      }
    } else {
      // New user - create and show role selection
      const newUser = await upsertUser(ctx.prisma, {
        telegramId,
        telegramUsername: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      });

      log.info("New user created");

      // Create referral tracking if user came via referral link
      if (referrerUserId && referrerUserId !== newUser.id) {
        try {
          const referralResult = await createReferralTracking(
            ctx.prisma,
            referrerUserId,
            newUser.id,
            `ref_${referrerUserId}`,
          );

          if (!referralResult.isExisting) {
            log.info(
              { referralId: referralResult.id, referrerId: referrerUserId },
              "Referral tracking created for new user",
            );
          }
        } catch (error) {
          // Don't fail user registration if referral tracking fails
          log.error(
            { error, referrerUserId },
            "Failed to create referral tracking",
          );
        }
      }

      await showWelcomeMessage(ctx);
    }
  } catch (error) {
    log.error({ error }, "Error in /start command");
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});

// ============================================================================
// /help Command
// ============================================================================

startHandler.command("help", async (ctx) => {
  const helpText = `📚 Справка по SkillTree Bot

Я помогу тебе определиться с будущей профессией!

Основные команды:
/test — Начать тест (55 вопросов)
/resume — Продолжить тест
/results — Посмотреть результаты
/streak — Твой стрик и очки
/achievements — Твои бейджи
/share — Поделиться результатами
/referral — Пригласи друзей и получи бонусы

Для родителей:
/link <код> — Привязать ребёнка

💬 Вопросы? Пиши @skilltree_support`;

  await ctx.reply(helpText);
});

// ============================================================================
// /privacy Command - Privacy Policy
// ============================================================================

startHandler.command("privacy", async (ctx) => {
  const privacyText = `🔒 Политика конфиденциальности SkillTree Bot

📋 Какие данные мы собираем:
• Telegram ID и имя пользователя
• Возраст и класс обучения (для учеников)
• Ответы на тесты профориентации
• Результаты тестирования и рекомендации
• Email (если указан, для отправки отчётов)

⏱ Сроки хранения:
• Данные аккаунта: 3 года с последней активности
• Результаты тестов: 3 года
• После этого срока данные автоматически анонимизируются

🛡 Ваши права:
• Получить копию своих данных
• Удалить свой аккаунт и все данные
• Отказаться от рассылок

🗑 Удаление данных:
Чтобы полностью удалить свои данные, используй команду /deletedata

📧 Связь с нами:
По вопросам приватности пиши @skilltree_support

Используя бота, ты соглашаешься с условиями обработки данных.`;

  await ctx.reply(privacyText);
});

// ============================================================================
// Role Selection
// ============================================================================

async function showWelcomeMessage(ctx: MyContext) {
  const keyboard = new InlineKeyboard()
    .text("🎓 Я ученик", CALLBACK.ROLE_STUDENT)
    .text("👨‍👩‍👧 Я родитель", CALLBACK.ROLE_PARENT);

  await ctx.reply(
    `Привет! Я SkillTree Bot 🌳\n\nПомогу тебе определиться с будущей профессией!\n\nКто ты?`,
    { reply_markup: keyboard },
  );
}

async function showRoleSelection(ctx: MyContext) {
  const keyboard = new InlineKeyboard()
    .text("🎓 Я ученик", CALLBACK.ROLE_STUDENT)
    .text("👨‍👩‍👧 Я родитель", CALLBACK.ROLE_PARENT);

  await ctx.reply("Выбери свою роль:", { reply_markup: keyboard });
}

// ============================================================================
// Role Selection Callbacks
// ============================================================================

// Student role selected
startHandler.callbackQuery(CALLBACK.ROLE_STUDENT, async (ctx) => {
  await ctx.answerCallbackQuery();

  // Show age selection
  const keyboard = new InlineKeyboard()
    .text("14 лет", `${CALLBACK.AGE_PREFIX}14`)
    .text("15 лет", `${CALLBACK.AGE_PREFIX}15`)
    .row()
    .text("16 лет", `${CALLBACK.AGE_PREFIX}16`)
    .text("17 лет", `${CALLBACK.AGE_PREFIX}17`)
    .row()
    .text("18+ лет", `${CALLBACK.AGE_PREFIX}18`);

  await ctx.editMessageText("Сколько тебе лет?", { reply_markup: keyboard });
});

// Parent role selected
startHandler.callbackQuery(CALLBACK.ROLE_PARENT, async (ctx) => {
  await ctx.answerCallbackQuery();

  try {
    const telegramId = BigInt(ctx.from.id);
    const user = await findByTelegramId(ctx.prisma, telegramId);

    if (!user) {
      await ctx.editMessageText(
        "Ошибка: пользователь не найден. Отправьте /start",
      );
      return;
    }

    // Create parent profile
    await createParent(ctx.prisma, { userId: user.id });

    logger.info({ userId: user.id }, "Parent profile created");

    const keyboard = getMainMenu("parent", false);

    await ctx.editMessageText(
      `Отлично! Вы зарегистрированы как родитель.\n\nЧтобы привязать ребёнка, попросите его сгенерировать код через команду /linkcode, затем используйте /link <код>`,
      { reply_markup: undefined },
    );

    await ctx.reply("Главное меню:", { reply_markup: keyboard });
  } catch (error) {
    logger.error({ error }, "Error creating parent profile");
    await ctx.editMessageText("Произошла ошибка. Попробуйте /start");
  }
});

// ============================================================================
// Age Selection Callbacks
// ============================================================================

startHandler.callbackQuery(/^age_\d+$/, async (ctx) => {
  await ctx.answerCallbackQuery();

  const ageStr = ctx.callbackQuery.data.substring(CALLBACK.AGE_PREFIX.length);
  const age = parseInt(ageStr, 10);

  // Store age temporarily in callback state
  // Show grade selection
  const keyboard = new InlineKeyboard()
    .text("8 класс", `${CALLBACK.GRADE_PREFIX}8_${age}`)
    .text("9 класс", `${CALLBACK.GRADE_PREFIX}9_${age}`)
    .row()
    .text("10 класс", `${CALLBACK.GRADE_PREFIX}10_${age}`)
    .text("11 класс", `${CALLBACK.GRADE_PREFIX}11_${age}`);

  await ctx.editMessageText("В каком ты классе?", { reply_markup: keyboard });
});

// ============================================================================
// Grade Selection Callbacks
// ============================================================================

startHandler.callbackQuery(/^grade_\d+_\d+$/, async (ctx) => {
  await ctx.answerCallbackQuery();

  if (!ctx.from) {
    return;
  }

  try {
    // Parse grade_X_age format
    const parts = ctx.callbackQuery.data
      .substring(CALLBACK.GRADE_PREFIX.length)
      .split("_");
    const gradeStr = parts[0];
    const ageStr = parts[1];

    if (!gradeStr || !ageStr) {
      await ctx.editMessageText(
        "Ошибка: неверный формат данных. Отправьте /start",
      );
      return;
    }

    const grade = parseInt(gradeStr, 10);
    const age = parseInt(ageStr, 10);

    const telegramId = BigInt(ctx.from.id);
    const user = await findByTelegramId(ctx.prisma, telegramId);

    if (!user) {
      await ctx.editMessageText(
        "Ошибка: пользователь не найден. Отправьте /start",
      );
      return;
    }

    // Create student profile
    await createStudent(ctx.prisma, {
      userId: user.id,
      age,
      grade,
    });

    logger.info({ userId: user.id, age, grade }, "Student profile created");

    const keyboard = getMainMenu("student", false);

    await ctx.editMessageText(
      `Отлично! Ты зарегистрирован как ученик ${grade} класса.\n\nТеперь можешь начать тест на профориентацию!`,
      { reply_markup: undefined },
    );

    await ctx.reply("Главное меню:", { reply_markup: keyboard });
  } catch (error) {
    logger.error({ error }, "Error creating student profile");
    await ctx.editMessageText("Произошла ошибка. Попробуйте /start");
  }
});

// ============================================================================
// Menu Button Handlers (text messages from ReplyKeyboard)
// ============================================================================

// Handle "Помощь" button
startHandler.hears("Помощь", async (ctx) => {
  // Trigger /help command
  await ctx.reply(`📚 Справка по SkillTree Bot

Я помогу тебе определиться с будущей профессией!

Основные команды:
/test — Начать тест (55 вопросов)
/resume — Продолжить тест
/results — Посмотреть результаты
/streak — Твой стрик и очки
/achievements — Твои бейджи
/share — Поделиться результатами
/referral — Пригласи друзей и получи бонусы

Для родителей:
/link <код> — Привязать ребёнка

💬 Вопросы? Пиши @skilltree_support`);
});

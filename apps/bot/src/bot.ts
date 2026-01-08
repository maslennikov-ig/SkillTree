/**
 * SkillTree Telegram Bot Entry Point
 *
 * Features:
 * - grammY bot framework with extended context
 * - Prisma middleware for database access
 * - Quiz session middleware (24h timeout, auto-abandon)
 * - User context middleware (role detection)
 * - Graceful shutdown handling
 */

// Load environment variables first - must be before any other imports
import "dotenv/config";

import { Bot } from "grammy";
import { limit } from "@grammyjs/ratelimiter";
import { PrismaClient } from "@skilltree/database";
import type { PrismaClient as PrismaClientType } from "@skilltree/database";
import { logger } from "./utils/logger";
import type { MyContext } from "./types/context";

// Initialize Prisma client
const prisma: PrismaClientType = new PrismaClient();

// Validate environment
if (!process.env.TELEGRAM_BOT_TOKEN) {
  logger.fatal("TELEGRAM_BOT_TOKEN environment variable is required");
  process.exit(1);
}

if (!process.env.API_URL) {
  logger.fatal("API_URL environment variable is required");
  process.exit(1);
}

// Export for use in handlers
export const API_URL = process.env.API_URL;

// Create bot instance with extended context
const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN);

// ============================================================================
// Middleware: Rate Limiting (MUST be first)
// ============================================================================

bot.use(
  limit({
    timeFrame: 60000, // 1 minute
    limit: 20, // max 20 messages per minute
    onLimitExceeded: async (ctx) => {
      logger.warn({ telegramId: ctx.from?.id }, "Rate limit exceeded");
      await ctx.reply("Слишком много запросов. Подожди минуту.");
    },
  }),
);

// ============================================================================
// Middleware: Attach Prisma Client
// ============================================================================

bot.use(async (ctx, next) => {
  ctx.prisma = prisma;
  await next();
});

// ============================================================================
// Middleware: Load User Context
// ============================================================================

bot.use(async (ctx, next) => {
  if (!ctx.from) {
    await next();
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(ctx.from.id) },
      include: {
        student: { select: { id: true } },
        parent: { select: { id: true } },
      },
    });

    if (user) {
      ctx.user = {
        userId: user.id,
        telegramId: user.telegramId,
        role: user.student ? "student" : user.parent ? "parent" : null,
        studentId: user.student?.id,
        parentId: user.parent?.id,
      };
    }
  } catch (error) {
    logger.error(
      { error, telegramId: ctx.from.id },
      "Failed to load user context",
    );
  }

  await next();
});

// ============================================================================
// Middleware: Load Quiz Session (with 24h timeout check)
// ============================================================================

const SESSION_TIMEOUT_HOURS = 24;

bot.use(async (ctx, next) => {
  if (!ctx.from || !ctx.user?.studentId) {
    await next();
    return;
  }

  try {
    const session = await prisma.testSession.findFirst({
      where: {
        studentId: ctx.user.studentId,
        status: "IN_PROGRESS",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (session) {
      const hoursInactive =
        (Date.now() - session.updatedAt.getTime()) / (1000 * 60 * 60);

      if (hoursInactive > SESSION_TIMEOUT_HOURS) {
        // Auto-abandon expired session
        await prisma.testSession.update({
          where: { id: session.id },
          data: { status: "ABANDONED" },
        });

        logger.info(
          {
            sessionId: session.id,
            studentId: ctx.user.studentId,
            hoursInactive,
          },
          "Quiz session auto-abandoned due to timeout",
        );
      } else {
        // Attach active session to context
        ctx.quizSession = {
          id: session.id,
          currentStep: session.currentStep,
          status: session.status,
          studentId: session.studentId,
        };
      }
    }
  } catch (error) {
    logger.error(
      { error, studentId: ctx.user.studentId },
      "Failed to load quiz session",
    );
  }

  await next();
});

// ============================================================================
// Error Handler
// ============================================================================

bot.catch((err) => {
  const ctx = err.ctx;
  const error = err.error;

  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      updateType: ctx.update.update_id,
      chatId: ctx.chat?.id,
      userId: ctx.from?.id,
    },
    "Bot error occurred",
  );

  // Notify user of error (non-blocking)
  ctx.reply("Произошла ошибка. Попробуйте позже.").catch(() => {
    // Ignore reply errors
  });
});

// ============================================================================
// Register Handlers
// ============================================================================

import { startHandler } from "./handlers/start.handler";
import { quizHandler } from "./handlers/quiz.handler";
import { resultsHandler } from "./handlers/results.handler";
import { streakHandler } from "./handlers/streak.handler";
import { parentHandler } from "./handlers/parent.handler";
import { referralHandler } from "./handlers/referral.handler";
import { privacyHandler } from "./handlers/privacy.handler";
import { inlineHandler } from "./handlers/inline.handler";

bot.use(startHandler);
bot.use(quizHandler);
bot.use(resultsHandler);
bot.use(streakHandler);
bot.use(parentHandler);
bot.use(referralHandler);
bot.use(privacyHandler);
bot.use(inlineHandler);

// ============================================================================
// Graceful Shutdown
// ============================================================================

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down bot...");

  try {
    await bot.stop();
    await prisma.$disconnect();
    logger.info("Bot stopped gracefully");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error during shutdown");
    process.exit(1);
  }
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

// ============================================================================
// Start Bot
// ============================================================================

async function start() {
  logger.info("Starting SkillTree Bot...");

  try {
    // Test database connection
    await prisma.$connect();
    logger.info("Database connection established");

    // Start polling
    await bot.start({
      onStart: (botInfo) => {
        logger.info(
          { username: botInfo.username, id: botInfo.id },
          "Bot started successfully",
        );
      },
    });
  } catch (error) {
    logger.fatal({ error }, "Failed to start bot");
    await prisma.$disconnect();
    process.exit(1);
  }
}

start();

// Export for testing
export { bot, prisma };

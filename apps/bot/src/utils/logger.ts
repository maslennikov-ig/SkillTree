import pino from "pino";
import type { Logger as PinoLogger, LoggerOptions } from "pino";

/**
 * Structured logger for Telegram Bot
 *
 * Features:
 * - JSON format for production (parseable by log aggregation tools)
 * - Pretty-print for development
 * - Configurable log level via LOG_LEVEL env variable
 * - Telegram-specific context (chatId, userId, command)
 * - Event tracking (test_started, test_completed, test_abandoned)
 */

const isProduction = process.env.NODE_ENV === "production";
const logLevel = (
  process.env.LOG_LEVEL || (isProduction ? "info" : "debug")
).toLowerCase();

const validLevels = ["trace", "debug", "info", "warn", "error", "fatal"];
if (!validLevels.includes(logLevel)) {
  console.warn(
    `Invalid LOG_LEVEL="${logLevel}". Using "info" instead. Valid values: ${validLevels.join(", ")}`,
  );
}

const pinoOptions: LoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "skilltree-bot",
  },
  ...(isProduction
    ? {
        formatters: {
          level: (label) => ({
            level: label.toUpperCase(),
          }),
        },
      }
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
            singleLine: false,
          },
        },
      }),
};

export const logger: PinoLogger = pino(pinoOptions);

/**
 * Create a child logger with Telegram context
 */
export function createTelegramLogger(context: {
  chatId?: number | string;
  userId?: number | string;
  username?: string;
  command?: string;
}): PinoLogger {
  return logger.child(context);
}

/**
 * Log structured events for analytics
 */
export const events = {
  testStarted: (userId: string, sessionId: string) => {
    logger.info({ event: "test_started", userId, sessionId }, "Test started");
  },
  testCompleted: (
    userId: string,
    sessionId: string,
    durationMinutes: number,
  ) => {
    logger.info(
      { event: "test_completed", userId, sessionId, durationMinutes },
      "Test completed",
    );
  },
  testAbandoned: (userId: string, sessionId: string, lastQuestion: number) => {
    logger.info(
      { event: "test_abandoned", userId, sessionId, lastQuestion },
      "Test abandoned",
    );
  },
  referralCompleted: (referrerId: string, refereeId: string) => {
    logger.info(
      { event: "referral_completed", referrerId, refereeId },
      "Referral completed",
    );
  },
  errorOccurred: (error: Error, context?: Record<string, unknown>) => {
    logger.error(
      { event: "error", error: error.message, stack: error.stack, ...context },
      "Error occurred",
    );
  },
};

export default logger;

import pino from "pino";
import type { Logger as PinoLogger, LoggerOptions } from "pino";

/**
 * Structured logger using Pino
 *
 * Features:
 * - JSON format for production (parseable by log aggregation tools)
 * - Pretty-print for development
 * - Configurable log level via LOG_LEVEL env variable
 * - Request correlation ID tracking
 * - Stack trace logging for errors
 * - Timestamp and context information
 *
 * Usage:
 *   import { logger } from './common/logger';
 *   logger.info({ correlationId }, 'User logged in');
 *   logger.error({ error, stack: error.stack }, 'Database error');
 */

// Determine environment and log level
const isProduction = process.env.NODE_ENV === "production";
const logLevel = (
  process.env.LOG_LEVEL || (isProduction ? "info" : "debug")
).toLowerCase();

// Validate log level
const validLevels = ["trace", "debug", "info", "warn", "error", "fatal"];
if (!validLevels.includes(logLevel)) {
  console.warn(
    `Invalid LOG_LEVEL="${logLevel}". Using "info" instead. Valid values: ${validLevels.join(", ")}`,
  );
}

// Pino configuration
const pinoOptions: LoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  // Pretty-print in development, JSON in production
  ...(isProduction
    ? {
        // Production: clean JSON output
        formatters: {
          level: (label) => ({
            level: label.toUpperCase(),
          }),
        },
      }
    : {
        // Development: pretty-printed with colors
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
            singleLine: false,
            messageFormat: "{levelLabel} {msg}",
          },
        },
      }),
};

// Create and export logger instance
export const logger: PinoLogger = pino(pinoOptions);

/**
 * Create a child logger with correlation ID
 *
 * Usage:
 *   const reqLogger = createChildLogger({ correlationId: 'abc-123' });
 *   reqLogger.info('Request started');
 */
export function createChildLogger(
  context: Record<string, string | number | undefined>,
): PinoLogger {
  return logger.child(context);
}

/**
 * Log function for NestJS compatibility
 * Allows logger to be used as a NestJS logger service
 */
export const loggerService = {
  log: (message: string, context?: string) => {
    logger.info({ context }, message);
  },
  error: (message: string, trace?: string, context?: string) => {
    logger.error({ context, stack: trace }, message);
  },
  warn: (message: string, context?: string) => {
    logger.warn({ context }, message);
  },
  debug: (message: string, context?: string) => {
    logger.debug({ context }, message);
  },
  verbose: (message: string, context?: string) => {
    logger.trace({ context }, message);
  },
};

export default logger;

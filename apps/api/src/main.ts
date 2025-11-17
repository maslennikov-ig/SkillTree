import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { prisma } from "@skilltree/database";
import { logger, loggerService } from "./common/logger";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: loggerService,
  });

  // Apply global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Database connection with retry logic (exponential backoff)
  const maxRetries = 3;
  const retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await prisma.$connect();
      logger.info("Database connected successfully");
      break;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (isLastAttempt) {
        logger.error(
          {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            attempts: attempt + 1,
          },
          "Database connection failed after 3 attempts",
        );
        process.exit(1);
      }

      logger.warn(
        {
          attempt: attempt + 1,
          nextRetryDelayMs: retryDelays[attempt],
          error: errorMessage,
        },
        "Database connection attempt failed. Retrying...",
      );

      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.info(
    {
      port,
      nodeEnv: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL,
    },
    "API server listening",
  );

  // Send PM2 ready signal
  if (process.send) {
    process.send("ready");
    logger.debug("PM2 ready signal sent");
  }

  // Graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, starting graceful shutdown...");

    try {
      await app.close();
      logger.info("NestJS app closed");
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        "Error closing NestJS app",
      );
    }

    try {
      await prisma.$disconnect();
      logger.info("Database disconnected");
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        "Error disconnecting database",
      );
    }

    logger.info("Graceful shutdown completed");
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    "Fatal error during bootstrap",
  );
  process.exit(1);
});

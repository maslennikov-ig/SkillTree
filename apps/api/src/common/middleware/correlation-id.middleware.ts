import { Injectable, NestMiddleware } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { createChildLogger } from "../logger";

/**
 * Correlation ID Middleware
 *
 * Purpose:
 * - Generate or extract correlation ID from incoming request
 * - Attach correlation ID to request object for use in controllers/services
 * - Create child logger with correlation ID for request-scoped logging
 * - Pass correlation ID to response headers for client-side tracing
 *
 * Features:
 * - Generates UUID v4 if no correlation ID provided
 * - Supports extracting correlation ID from multiple header formats:
 *   - X-Correlation-ID (standard)
 *   - X-Request-ID (AWS)
 *   - Correlation-ID (custom)
 * - Includes correlation ID in response headers
 * - Logger automatically includes correlation ID in all logs for this request
 *
 * Usage:
 *   app.use(CorrelationIdMiddleware)
 *
 *   // In controllers:
 *   @Get('/users')
 *   getUsers(@Req() request: Request) {
 *     const { correlationId } = request;
 *     logger.info({ correlationId }, 'Fetching users');
 *   }
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId: string;
      logger: ReturnType<typeof createChildLogger>;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract correlation ID from request headers (in priority order)
    const correlationIdHeader: string | string[] | undefined =
      req.headers["x-correlation-id"] ||
      req.headers["x-request-id"] ||
      req.headers["correlation-id"];

    // Ensure correlation ID is a string
    const finalCorrelationId: string = Array.isArray(correlationIdHeader)
      ? (correlationIdHeader[0] ?? randomUUID())
      : (correlationIdHeader ?? randomUUID());

    // Attach to request object for use in controllers/services
    req.correlationId = finalCorrelationId;

    // Create child logger with correlation ID
    req.logger = createChildLogger({ correlationId: finalCorrelationId });

    // Add correlation ID to response headers for client-side tracing
    res.setHeader("X-Correlation-ID", finalCorrelationId);

    // Continue to next middleware/route
    next();
  }
}

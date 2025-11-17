import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { logger } from "../logger";

/**
 * Global HTTP Exception Filter
 *
 * Purpose:
 * - Catch and log all HTTP exceptions with structured logging
 * - Include request context (method, path, IP, user agent)
 * - Include stack traces for debugging
 * - Provide consistent error response format
 * - Send Telegram alerts for critical errors (optional future enhancement)
 *
 * Features:
 * - Logs exception type, message, status code, stack trace
 * - Includes request correlation ID from middleware
 * - Includes request metadata (method, path, IP, headers)
 * - Distinguishes between HTTP exceptions and unexpected errors
 * - Formats error response with status code and message
 *
 * Usage:
 *   app.useGlobalFilters(new HttpExceptionFilter());
 *
 *   // In controllers:
 *   @Get('/users')
 *   getUsers() {
 *     throw new BadRequestException('Invalid user ID');
 *     // Automatically logged with full context
 *   }
 */

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
  method: string;
  correlationId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal Server Error";
    let exceptionMessage: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract message from NestJS HttpException
      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const obj = exceptionResponse as Record<string, unknown>;
        message =
          (obj.message as string | string[]) ||
          (obj.error as string) ||
          message;
        exceptionMessage = (obj.message as string) || (obj.error as string);
      } else {
        message = String(exceptionResponse);
        exceptionMessage = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      exceptionMessage = exception.message;
    } else {
      message = String(exception);
      exceptionMessage = String(exception);
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.path,
      method: request.method,
      correlationId: request.correlationId,
    };

    // Log with appropriate level
    const logData = {
      correlationId: request.correlationId,
      statusCode: status,
      message: exceptionMessage,
      method: request.method,
      path: request.path,
      ip: this.getClientIp(request),
      userAgent: request.get("user-agent"),
      stack: exception instanceof Error ? exception.stack : undefined,
      exceptionType: exception?.constructor?.name,
    };

    // Critical errors (5xx) - log as error
    if (status >= 500) {
      logger.error(logData, `[${request.method}] ${request.path} - ${status}`);
    }
    // Client errors (4xx) - log as warn or info
    else if (status >= 400) {
      // Log validation errors as debug, others as info
      if (status === 400 || status === 422) {
        logger.debug(
          logData,
          `[${request.method}] ${request.path} - ${status}`,
        );
      } else {
        logger.info(logData, `[${request.method}] ${request.path} - ${status}`);
      }
    }
    // Success-range errors - log as debug
    else {
      logger.debug(logData, `[${request.method}] ${request.path} - ${status}`);
    }

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Extract client IP from request
   * Handles X-Forwarded-For header (for proxies like Caddy)
   *
   * @private
   */
  private getClientIp(request: Request): string {
    const forwardedFor = request.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0]?.trim() || "unknown";
    }

    const xRealIp = request.get("x-real-ip");
    if (xRealIp) {
      return xRealIp;
    }

    return request.ip ?? "unknown";
  }
}

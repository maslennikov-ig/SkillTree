import {
  Controller,
  Get,
  HttpStatus,
  HttpException,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { prisma } from "@skilltree/database";
import { logger } from "../../common/logger";

interface ServiceStatus {
  status: "connected" | "disconnected" | "degraded";
  responseTime?: number;
  error?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  timestamp: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
  };
}

/**
 * Health check controller for monitoring system status
 * Provides endpoints for health checks, readiness probes, and liveness probes
 *
 * Endpoints:
 * - GET /health - Full health check (returns 200 if healthy, 503 otherwise)
 * - GET /health/ready - Readiness probe (returns 200 only if ALL services ready)
 * - GET /health/live - Liveness probe (returns 200 if app running, even if degraded)
 *
 * All requests are logged with structured logging including correlation ID,
 * response times, and service status details.
 */
@Controller("health")
export class HealthController {
  private startTime = Date.now();

  /**
   * Main health check endpoint
   * Returns 200 if healthy, 503 if degraded/unhealthy
   * Used for deployment verification and monitoring
   */
  @Get()
  async getHealth(@Req() request: Request): Promise<HealthResponse> {
    const startTime = Date.now();
    const healthResponse = await this.checkHealth();
    const responseTime = Date.now() - startTime;

    // Log health check result
    logger.info(
      {
        correlationId: request.correlationId,
        status: healthResponse.status,
        responseTimeMs: responseTime,
        services: healthResponse.services,
      },
      "Health check completed",
    );

    if (healthResponse.status !== "healthy") {
      logger.warn(
        {
          correlationId: request.correlationId,
          status: healthResponse.status,
          services: healthResponse.services,
        },
        "Health check returned non-healthy status",
      );

      throw new HttpException(healthResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return healthResponse;
  }

  /**
   * Readiness probe - returns 200 only if ALL services ready
   * Used by load balancers and orchestrators to determine traffic routing
   */
  @Get("ready")
  async getReadiness(@Req() request: Request): Promise<{ ready: boolean }> {
    const healthResponse = await this.checkHealth();

    const isReady =
      healthResponse.services.database.status === "connected" &&
      healthResponse.services.redis.status === "connected";

    if (!isReady) {
      logger.info(
        {
          correlationId: request.correlationId,
          ready: false,
          database: healthResponse.services.database.status,
          redis: healthResponse.services.redis.status,
        },
        "Readiness probe returned false",
      );

      throw new HttpException({ ready: false }, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return { ready: true };
  }

  /**
   * Liveness probe - returns 200 if application is running
   * Even returns 200 in degraded mode (e.g., Redis down but app still functional)
   * Used to determine if pod should be restarted
   */
  @Get("live")
  async getLiveness(@Req() request: Request): Promise<{ alive: boolean }> {
    logger.debug(
      { correlationId: request.correlationId },
      "Liveness probe check",
    );

    // Application is alive if this endpoint can respond
    return { alive: true };
  }

  /**
   * Check health of all services
   * @private
   */
  private async checkHealth(): Promise<HealthResponse> {
    const databaseStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();

    // Determine overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy";

    if (
      databaseStatus.status === "connected" &&
      redisStatus.status === "connected"
    ) {
      overallStatus = "healthy";
    } else if (
      databaseStatus.status === "connected" &&
      redisStatus.status === "disconnected"
    ) {
      // Redis down but database up = degraded (app can run without caching)
      overallStatus = "degraded";
    } else {
      // Database down = unhealthy (app cannot function)
      overallStatus = "unhealthy";
    }

    return {
      status: overallStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000), // seconds
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        redis: redisStatus,
      },
    };
  }

  /**
   * Check database connectivity and measure response time
   * @private
   */
  private async checkDatabase(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      // Simple query to verify database connection
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: "connected",
        responseTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        },
        "Database health check failed",
      );

      return {
        status: "disconnected",
        error: errorMessage,
      };
    }
  }

  /**
   * Check Redis connectivity and measure response time
   * Optional service - returns disconnected but doesn't crash app
   * @private
   */
  private async checkRedis(): Promise<ServiceStatus> {
    // TODO: Implement Redis health check when Redis client is configured
    // For now, return disconnected (degraded mode)
    // This allows the app to start without Redis

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      return {
        status: "disconnected",
        error: "REDIS_URL not configured (optional service)",
      };
    }

    // Redis health check would go here
    // Example: await redisClient.ping()

    return {
      status: "disconnected",
      error: "Redis client not yet configured (future implementation)",
    };
  }
}

import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { prisma } from '@skilltree/database';

interface ServiceStatus {
  status: 'connected' | 'disconnected' | 'degraded';
  responseTime?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
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
 */
@Controller('health')
export class HealthController {
  private startTime = Date.now();

  /**
   * Main health check endpoint
   * Returns 200 if healthy, 503 if degraded/unhealthy
   */
  @Get()
  async getHealth(): Promise<HealthResponse> {
    const healthResponse = await this.checkHealth();

    if (healthResponse.status !== 'healthy') {
      throw new HttpException(healthResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return healthResponse;
  }

  /**
   * Readiness probe - returns 200 only if ALL services ready
   * Used by load balancers and orchestrators to determine traffic routing
   */
  @Get('ready')
  async getReadiness(): Promise<{ ready: boolean }> {
    const healthResponse = await this.checkHealth();

    const isReady =
      healthResponse.services.database.status === 'connected' &&
      healthResponse.services.redis.status === 'connected';

    if (!isReady) {
      throw new HttpException({ ready: false }, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return { ready: true };
  }

  /**
   * Liveness probe - returns 200 if application is running
   * Even returns 200 in degraded mode (e.g., Redis down but app still functional)
   */
  @Get('live')
  async getLiveness(): Promise<{ alive: boolean }> {
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
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (
      databaseStatus.status === 'connected' &&
      redisStatus.status === 'connected'
    ) {
      overallStatus = 'healthy';
    } else if (
      databaseStatus.status === 'connected' &&
      redisStatus.status === 'disconnected'
    ) {
      // Redis down but database up = degraded (app can run without caching)
      overallStatus = 'degraded';
    } else {
      // Database down = unhealthy (app cannot function)
      overallStatus = 'unhealthy';
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
        status: 'connected',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
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
        status: 'disconnected',
        error: 'REDIS_URL not configured (optional service)',
      };
    }

    // Redis health check would go here
    // Example: await redisClient.ping()

    return {
      status: 'disconnected',
      error: 'Redis client not yet configured (future implementation)',
    };
  }
}

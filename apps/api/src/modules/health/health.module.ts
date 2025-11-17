import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Health module providing system health monitoring endpoints
 * Exports health check, readiness, and liveness probes
 */
@Module({
  controllers: [HealthController],
  providers: [],
})
export class HealthModule {}

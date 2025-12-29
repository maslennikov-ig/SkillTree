/**
 * Metrics Module for SkillTree API
 *
 * Provides product analytics and engagement metrics (FR-036)
 * - Imports PrismaModule for database access
 * - Exports MetricsService for use in other modules
 */

import { Module } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { MetricsController } from "./metrics.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}

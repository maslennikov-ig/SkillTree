/**
 * Metrics Controller for SkillTree API
 *
 * Admin-only endpoints for product analytics (FR-036)
 * Authentication: Requires INTERNAL_ADMIN_TOKEN via x-admin-token header
 *
 * Endpoints:
 * - GET /metrics/daily?days=7 - Daily metrics for last N days
 * - GET /metrics/today - Metrics for today only
 * - GET /metrics/summary - All-time summary metrics
 */

import {
  Controller,
  Get,
  Headers,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Validate admin token from request header
   */
  private validateAdminToken(providedToken: string | undefined): void {
    const expectedToken = process.env.INTERNAL_ADMIN_TOKEN;

    if (!expectedToken) {
      throw new UnauthorizedException("Admin authentication not configured");
    }

    if (!providedToken || providedToken !== expectedToken) {
      throw new UnauthorizedException("Invalid or missing admin token");
    }
  }

  /**
   * GET /metrics/daily?days=7
   * Get daily metrics for the last N days (default: 7)
   * Requires: x-admin-token header
   */
  @Get("daily")
  async getDailyMetrics(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Query("days") days?: string,
  ) {
    this.validateAdminToken(adminToken);

    const numDays = days ? parseInt(days, 10) : 7;

    // Validate days parameter
    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      throw new UnauthorizedException("Invalid days parameter (must be 1-365)");
    }

    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999); // End of today UTC

    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - numDays);
    startDate.setUTCHours(0, 0, 0, 0); // Start of day UTC

    const metrics = await this.metricsService.getDailyMetrics(
      startDate,
      endDate,
    );

    return {
      success: true,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
        days: numDays,
      },
      data: metrics,
    };
  }

  /**
   * GET /metrics/today
   * Get metrics for today only (UTC)
   * Requires: x-admin-token header
   */
  @Get("today")
  async getTodayMetrics(
    @Headers("x-admin-token") adminToken: string | undefined,
  ) {
    this.validateAdminToken(adminToken);

    const metrics = await this.metricsService.getTodayMetrics();

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * GET /metrics/summary
   * Get all-time summary metrics
   * Requires: x-admin-token header
   */
  @Get("summary")
  async getSummaryMetrics(
    @Headers("x-admin-token") adminToken: string | undefined,
  ) {
    this.validateAdminToken(adminToken);

    const summary = await this.metricsService.getSummaryMetrics();

    return {
      success: true,
      data: summary,
    };
  }
}

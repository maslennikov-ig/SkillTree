/**
 * Metrics Service for SkillTree API
 *
 * Implements FR-036: Basic engagement metrics for product analytics
 * - Tracks test_started, test_completed, test_abandoned events
 * - Aggregates daily metrics: completion_rate, avg_duration, DAU
 * - Database-driven (queries TestSession table directly)
 */

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SessionStatus } from "@skilltree/database";

export interface DailyMetrics {
  date: string; // ISO date string (YYYY-MM-DD)
  testsStarted: number;
  testsCompleted: number;
  testsAbandoned: number;
  completionRate: number; // percentage (0-100)
  avgDurationMinutes: number | null;
  dau: number; // daily active users (unique studentIds)
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track event (for logging purposes - actual tracking via TestSession status)
   * Events: test_started, test_completed, test_abandoned
   */
  trackEvent(
    event: "test_started" | "test_completed" | "test_abandoned",
    userId: string,
  ): void {
    this.logger.log(`Event tracked: ${event} for user ${userId}`);
    // No database write needed - events are implicit in TestSession status changes
  }

  /**
   * Get daily metrics for a date range
   * Aggregates data from TestSession table grouped by startedAt date
   */
  async getDailyMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyMetrics[]> {
    this.logger.debug(
      `Fetching metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    // Query all sessions in date range
    const sessions = await this.prisma.testSession.findMany({
      where: {
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        completionTimeMinutes: true,
        studentId: true,
      },
      orderBy: {
        startedAt: "asc",
      },
    });

    // Group sessions by date (UTC)
    const sessionsByDate = new Map<string, typeof sessions>();

    for (const session of sessions) {
      const dateParts = session.startedAt.toISOString().split("T");
      const dateKey = dateParts[0]!; // YYYY-MM-DD (non-null assertion safe for ISO strings)

      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, []);
      }

      sessionsByDate.get(dateKey)!.push(session);
    }

    // Calculate metrics for each date
    const metricsArray: DailyMetrics[] = [];

    for (const [dateKey, dateSessions] of sessionsByDate.entries()) {
      const started = dateSessions.length;
      const completed = dateSessions.filter(
        (s) => s.status === SessionStatus.COMPLETED,
      ).length;
      const abandoned = dateSessions.filter(
        (s) => s.status === SessionStatus.ABANDONED,
      ).length;

      // Completion rate: (completed / started) * 100
      const completionRate =
        started > 0 ? Math.round((completed / started) * 100) : 0;

      // Average duration (only for completed sessions with duration data)
      const completedWithDuration = dateSessions.filter(
        (s) =>
          s.status === SessionStatus.COMPLETED &&
          s.completionTimeMinutes !== null,
      );

      const avgDurationMinutes =
        completedWithDuration.length > 0
          ? Math.round(
              completedWithDuration.reduce(
                (sum, s) => sum + (s.completionTimeMinutes || 0),
                0,
              ) / completedWithDuration.length,
            )
          : null;

      // DAU: unique student IDs
      const uniqueStudents = new Set(dateSessions.map((s) => s.studentId));
      const dau = uniqueStudents.size;

      metricsArray.push({
        date: dateKey,
        testsStarted: started,
        testsCompleted: completed,
        testsAbandoned: abandoned,
        completionRate,
        avgDurationMinutes,
        dau,
      });
    }

    // Fill in missing dates with zero metrics
    const dayInMs = 24 * 60 * 60 * 1000;
    const currentDate = new Date(startDate);
    const allMetrics: DailyMetrics[] = [];

    while (currentDate <= endDate) {
      const dateParts = currentDate.toISOString().split("T");
      const dateKey = dateParts[0]!; // YYYY-MM-DD (non-null assertion safe for ISO strings)
      const existingMetrics = metricsArray.find((m) => m.date === dateKey);

      if (existingMetrics) {
        allMetrics.push(existingMetrics);
      } else {
        // No data for this date - push zero metrics
        allMetrics.push({
          date: dateKey,
          testsStarted: 0,
          testsCompleted: 0,
          testsAbandoned: 0,
          completionRate: 0,
          avgDurationMinutes: null,
          dau: 0,
        });
      }

      currentDate.setTime(currentDate.getTime() + dayInMs);
    }

    return allMetrics.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get metrics for today (UTC)
   */
  async getTodayMetrics(): Promise<DailyMetrics> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [metrics] = await this.getDailyMetrics(today, tomorrow);

    if (metrics) {
      return metrics;
    }

    // Fallback for no data
    const dateParts = today.toISOString().split("T");
    const dateKey = dateParts[0]!; // YYYY-MM-DD (non-null assertion safe for ISO strings)

    return {
      date: dateKey,
      testsStarted: 0,
      testsCompleted: 0,
      testsAbandoned: 0,
      completionRate: 0,
      avgDurationMinutes: null,
      dau: 0,
    };
  }

  /**
   * Get summary metrics across all time
   */
  async getSummaryMetrics(): Promise<{
    totalTests: number;
    totalCompleted: number;
    totalAbandoned: number;
    overallCompletionRate: number;
    totalUsers: number;
  }> {
    const [totalCounts, uniqueUsers] = await Promise.all([
      this.prisma.testSession.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      }),
      this.prisma.testSession.findMany({
        select: { studentId: true },
        distinct: ["studentId"],
      }),
    ]);

    const statusMap = new Map(
      totalCounts.map((item) => [item.status, item._count.id]),
    );

    const totalTests = totalCounts.reduce(
      (sum, item) => sum + item._count.id,
      0,
    );
    const totalCompleted = statusMap.get(SessionStatus.COMPLETED) || 0;
    const totalAbandoned = statusMap.get(SessionStatus.ABANDONED) || 0;
    const overallCompletionRate =
      totalTests > 0 ? Math.round((totalCompleted / totalTests) * 100) : 0;

    return {
      totalTests,
      totalCompleted,
      totalAbandoned,
      overallCompletionRate,
      totalUsers: uniqueUsers.length,
    };
  }
}

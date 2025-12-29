/**
 * Gamification Service for SkillTree API
 *
 * Handles:
 * - Retrieving unlocked features based on points
 * - Getting user achievements and badges
 * - Fetching streak status
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient, BadgeType } from "@skilltree/database";

// Feature thresholds (points required to unlock)
const FEATURE_THRESHOLDS = {
  CAREER_DETAILS: 50, // Unlock detailed career info
  RADAR_CHART: 100, // Unlock radar chart visualization
  SHARE_RESULTS: 150, // Unlock social sharing
  EMAIL_REPORT: 200, // Unlock email report
  PDF_DOWNLOAD: 250, // Unlock PDF download
} as const;

export interface UnlockedFeature {
  id: string;
  name: string;
  nameRu: string;
  pointsRequired: number;
  unlocked: boolean;
  progress: number; // 0-100 percentage
}

export interface UserAchievements {
  userId: string;
  totalPoints: number;
  currentStreak: number;
  badges: Array<{
    type: BadgeType;
    name: string;
    description: string;
    earnedAt: Date;
  }>;
  unlockedFeatures: UnlockedFeature[];
}

// Badge metadata for display
const BADGE_INFO: Record<BadgeType, { name: string; description: string }> = {
  BRONZE_EXPLORER: {
    name: "Первый шаг",
    description: "Ты начал тест на профориентацию!",
  },
  SILVER_SEEKER: {
    name: "Четверть пути",
    description: "25% теста пройдено!",
  },
  GOLD_ACHIEVER: {
    name: "Половина пути",
    description: "50% теста пройдено! Так держать!",
  },
  PLATINUM_MASTER: {
    name: "Почти у цели",
    description: "75% теста пройдено! Финиш близко!",
  },
  SPEED_DEMON: {
    name: "Скоростной",
    description: "Прошёл тест быстрее всех!",
  },
  THOUGHTFUL_ANALYST: {
    name: "Тест завершён",
    description: "Поздравляем! Ты прошёл тест полностью!",
  },
  STREAK_3_DAYS: {
    name: "Стрик 3 дня",
    description: "3 дня подряд в приложении!",
  },
  STREAK_7_DAYS: {
    name: "Недельный стрик",
    description: "Целая неделя активности!",
  },
  REFERRAL_BRONZE: {
    name: "Первый друг",
    description: "Ты пригласил первого друга!",
  },
  REFERRAL_SILVER: {
    name: "Популярный",
    description: "Пригласил 5 друзей!",
  },
  REFERRAL_GOLD: {
    name: "Лидер",
    description: "Пригласил 10 друзей!",
  },
  NIGHT_OWL: {
    name: "Ночная сова",
    description: "Прошёл вопрос между 23:00 и 02:00!",
  },
  EARLY_BIRD: {
    name: "Ранняя пташка",
    description: "Прошёл вопрос между 05:00 и 07:00!",
  },
  DETECTIVE: {
    name: "Детектив",
    description: "Нашёл секретный вопрос #33!",
  },
};

@Injectable()
export class GamificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get unlocked features for a user based on their total points
   */
  async getUnlockedFeatures(studentId: string): Promise<UnlockedFeature[]> {
    // Get total points from all completed sessions
    const sessions = await this.prisma.testSession.findMany({
      where: {
        studentId,
        status: "COMPLETED",
      },
      select: { points: true },
    });

    const totalPoints = sessions.reduce((sum, s) => sum + s.points, 0);

    // Build feature list with unlock status
    const features: UnlockedFeature[] = [
      {
        id: "career_details",
        name: "Career Details",
        nameRu: "Подробности профессий",
        pointsRequired: FEATURE_THRESHOLDS.CAREER_DETAILS,
        unlocked: totalPoints >= FEATURE_THRESHOLDS.CAREER_DETAILS,
        progress: Math.min(
          100,
          Math.round((totalPoints / FEATURE_THRESHOLDS.CAREER_DETAILS) * 100),
        ),
      },
      {
        id: "radar_chart",
        name: "Radar Chart",
        nameRu: "Радар-диаграмма",
        pointsRequired: FEATURE_THRESHOLDS.RADAR_CHART,
        unlocked: totalPoints >= FEATURE_THRESHOLDS.RADAR_CHART,
        progress: Math.min(
          100,
          Math.round((totalPoints / FEATURE_THRESHOLDS.RADAR_CHART) * 100),
        ),
      },
      {
        id: "share_results",
        name: "Share Results",
        nameRu: "Поделиться результатами",
        pointsRequired: FEATURE_THRESHOLDS.SHARE_RESULTS,
        unlocked: totalPoints >= FEATURE_THRESHOLDS.SHARE_RESULTS,
        progress: Math.min(
          100,
          Math.round((totalPoints / FEATURE_THRESHOLDS.SHARE_RESULTS) * 100),
        ),
      },
      {
        id: "email_report",
        name: "Email Report",
        nameRu: "Отчёт на email",
        pointsRequired: FEATURE_THRESHOLDS.EMAIL_REPORT,
        unlocked: totalPoints >= FEATURE_THRESHOLDS.EMAIL_REPORT,
        progress: Math.min(
          100,
          Math.round((totalPoints / FEATURE_THRESHOLDS.EMAIL_REPORT) * 100),
        ),
      },
      {
        id: "pdf_download",
        name: "PDF Download",
        nameRu: "Скачать PDF",
        pointsRequired: FEATURE_THRESHOLDS.PDF_DOWNLOAD,
        unlocked: totalPoints >= FEATURE_THRESHOLDS.PDF_DOWNLOAD,
        progress: Math.min(
          100,
          Math.round((totalPoints / FEATURE_THRESHOLDS.PDF_DOWNLOAD) * 100),
        ),
      },
    ];

    return features;
  }

  /**
   * Get full user achievements including badges, points, and streak
   */
  async getUserAchievements(studentId: string): Promise<UserAchievements> {
    // Get student and user data
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });

    if (!student) {
      throw new NotFoundException(`Student not found: ${studentId}`);
    }

    // Get total points
    const sessions = await this.prisma.testSession.findMany({
      where: {
        studentId,
        status: "COMPLETED",
      },
      select: { points: true },
    });

    const totalPoints = sessions.reduce((sum, s) => sum + s.points, 0);

    // Get current streak
    const streak = await this.prisma.dailyStreak.findUnique({
      where: { userId: student.userId },
    });

    // Get all achievements/badges
    const achievements = await this.prisma.achievement.findMany({
      where: { userId: student.userId },
      orderBy: { earnedAt: "desc" },
    });

    const badges = achievements.map((a) => {
      const badgeType = a.badgeType as BadgeType;
      const info = BADGE_INFO[badgeType] || {
        name: badgeType,
        description: "",
      };
      return {
        type: badgeType,
        name: info.name,
        description: info.description,
        earnedAt: a.earnedAt,
      };
    });

    // Get unlocked features
    const unlockedFeatures = await this.getUnlockedFeatures(studentId);

    return {
      userId: student.userId,
      totalPoints,
      currentStreak: streak?.currentDay ?? 0,
      badges,
      unlockedFeatures,
    };
  }

  /**
   * Check if a specific feature is unlocked for a user
   */
  async isFeatureUnlocked(
    studentId: string,
    featureId: string,
  ): Promise<boolean> {
    const features = await this.getUnlockedFeatures(studentId);
    const feature = features.find((f) => f.id === featureId);
    return feature?.unlocked ?? false;
  }
}

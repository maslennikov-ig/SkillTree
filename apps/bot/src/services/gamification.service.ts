/**
 * Gamification Service for SkillTree Bot
 *
 * Handles:
 * - Points awarding for quiz progress
 * - Badge unlock checks (progress milestones)
 * - Easter egg badge detection (time-based, question-based)
 * - Badge notification messages
 */

import type { PrismaClient, BadgeType } from "@skilltree/database";
import { POINTS_CONFIG } from "@skilltree/shared";
import { logger } from "../utils/logger";

// ============================================================================
// Types
// ============================================================================

export interface PointsResult {
  pointsAwarded: number;
  totalPoints: number;
  reason: string;
}

export interface BadgeCheckResult {
  unlocked: boolean;
  badge?: BadgeType;
  isNew: boolean;
}

export interface EasterEggContext {
  questionNumber?: number;
  answeredAt: Date;
  answerValue?: string; // For checking correct answers on easter egg questions
}

// Progress milestones for badge checks (percentage)
const PROGRESS_MILESTONES: Record<number, BadgeType> = {
  0: "BRONZE_EXPLORER", // FIRST_STEP - test started
  25: "SILVER_SEEKER", // QUARTER_DONE
  50: "GOLD_ACHIEVER", // HALF_DONE
  75: "PLATINUM_MASTER", // THREE_QUARTERS
  100: "THOUGHTFUL_ANALYST", // TEST_COMPLETE (using available badge type)
};

// ============================================================================
// Points Management
// ============================================================================

/**
 * Award points to a student and update their session
 */
export async function awardPoints(
  prisma: PrismaClient,
  studentId: string,
  points: number,
  reason: string,
): Promise<PointsResult> {
  const log = logger.child({ fn: "awardPoints", studentId, points, reason });

  try {
    // Get active session for the student
    const session = await prisma.testSession.findFirst({
      where: {
        studentId,
        status: "IN_PROGRESS",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!session) {
      log.warn("No active session found for student");
      return {
        pointsAwarded: 0,
        totalPoints: 0,
        reason,
      };
    }

    // Update session points
    const updatedSession = await prisma.testSession.update({
      where: { id: session.id },
      data: {
        points: { increment: points },
      },
    });

    log.info(
      { sessionId: session.id, newTotal: updatedSession.points },
      "Points awarded",
    );

    return {
      pointsAwarded: points,
      totalPoints: updatedSession.points,
      reason,
    };
  } catch (error) {
    log.error({ error }, "Error awarding points");
    throw error;
  }
}

/**
 * Award points for answering a question
 */
export async function awardQuestionPoints(
  prisma: PrismaClient,
  studentId: string,
): Promise<PointsResult> {
  return awardPoints(
    prisma,
    studentId,
    POINTS_CONFIG.QUESTION_ANSWERED,
    "question_answered",
  );
}

/**
 * Award points for completing a section
 */
export async function awardSectionPoints(
  prisma: PrismaClient,
  studentId: string,
  sectionNumber: number,
): Promise<PointsResult> {
  return awardPoints(
    prisma,
    studentId,
    POINTS_CONFIG.SECTION_COMPLETED,
    `section_${sectionNumber}_completed`,
  );
}

/**
 * Award points for test completion
 */
export async function awardTestCompletionPoints(
  prisma: PrismaClient,
  studentId: string,
): Promise<PointsResult> {
  return awardPoints(
    prisma,
    studentId,
    POINTS_CONFIG.TEST_COMPLETED,
    "test_completed",
  );
}

/**
 * Award points for first share
 */
export async function awardFirstSharePoints(
  prisma: PrismaClient,
  studentId: string,
): Promise<PointsResult> {
  return awardPoints(
    prisma,
    studentId,
    POINTS_CONFIG.SHARE_RESULTS,
    "first_share",
  );
}

// ============================================================================
// Badge Management
// ============================================================================

/**
 * Check and award progress badges based on quiz completion percentage
 */
export async function checkBadgeUnlock(
  prisma: PrismaClient,
  studentId: string,
  progress: number,
): Promise<BadgeCheckResult> {
  const log = logger.child({ fn: "checkBadgeUnlock", studentId, progress });

  // Get the student's user ID
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });

  if (!student) {
    log.warn("Student not found");
    return { unlocked: false, isNew: false };
  }

  // Determine which milestone badge to check
  let badgeToCheck: BadgeType | undefined;

  if (progress === 0) {
    badgeToCheck = PROGRESS_MILESTONES[0];
  } else if (progress >= 100) {
    badgeToCheck = PROGRESS_MILESTONES[100];
  } else if (progress >= 75) {
    badgeToCheck = PROGRESS_MILESTONES[75];
  } else if (progress >= 50) {
    badgeToCheck = PROGRESS_MILESTONES[50];
  } else if (progress >= 25) {
    badgeToCheck = PROGRESS_MILESTONES[25];
  }

  if (!badgeToCheck) {
    return { unlocked: false, isNew: false };
  }

  // Check if badge already exists
  const existingBadge = await prisma.achievement.findUnique({
    where: {
      userId_badgeType: {
        userId: student.userId,
        badgeType: badgeToCheck,
      },
    },
  });

  if (existingBadge) {
    return { unlocked: true, badge: badgeToCheck, isNew: false };
  }

  // Award new badge
  await prisma.achievement.create({
    data: {
      userId: student.userId,
      badgeType: badgeToCheck,
      metadata: { progress, awardedFor: "quiz_progress" },
    },
  });

  log.info({ badge: badgeToCheck }, "Badge unlocked");

  return { unlocked: true, badge: badgeToCheck, isNew: true };
}

/**
 * Check and award Easter egg badges based on context
 * - NIGHT_OWL: answered between 11pm and 2am (Moscow time)
 * - EARLY_BIRD: answered between 5am and 7am (Moscow time)
 * - DETECTIVE: answered question #33
 */
export async function checkEasterEggBadge(
  prisma: PrismaClient,
  studentId: string,
  context: EasterEggContext,
): Promise<BadgeCheckResult[]> {
  const log = logger.child({ fn: "checkEasterEggBadge", studentId, context });
  const results: BadgeCheckResult[] = [];

  // Get the student's user ID
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });

  if (!student) {
    log.warn("Student not found");
    return results;
  }

  // Convert to Moscow time (UTC+3)
  const moscowTime = new Date(context.answeredAt);
  moscowTime.setHours(moscowTime.getUTCHours() + 3);
  const hour = moscowTime.getHours();

  // Check NIGHT_OWL (23:00 - 02:00 Moscow time)
  if (hour >= 23 || hour < 2) {
    const result = await tryAwardBadge(prisma, student.userId, "NIGHT_OWL", {
      hour,
      timezone: "Moscow",
    });
    if (result.unlocked) {
      log.info("NIGHT_OWL badge check");
      results.push(result);
    }
  }

  // Check EARLY_BIRD (05:00 - 07:00 Moscow time)
  if (hour >= 5 && hour < 7) {
    const result = await tryAwardBadge(prisma, student.userId, "EARLY_BIRD", {
      hour,
      timezone: "Moscow",
    });
    if (result.unlocked) {
      log.info("EARLY_BIRD badge check");
      results.push(result);
    }
  }

  // Check DETECTIVE (answered question #33 CORRECTLY)
  // Only award if answer is "correct" or "also_correct"
  if (
    context.questionNumber === 33 &&
    (context.answerValue === "correct" ||
      context.answerValue === "also_correct")
  ) {
    const result = await tryAwardBadge(prisma, student.userId, "DETECTIVE", {
      questionNumber: 33,
      answerValue: context.answerValue,
    });
    if (result.unlocked) {
      log.info("DETECTIVE badge unlocked for correct answer");
      results.push(result);
    }
  }

  return results;
}

/**
 * Try to award a badge (idempotent - won't duplicate)
 */
async function tryAwardBadge(
  prisma: PrismaClient,
  userId: string,
  badgeType: BadgeType,
  metadata: Record<string, string | number | boolean>,
): Promise<BadgeCheckResult> {
  const log = logger.child({ fn: "tryAwardBadge", userId, badgeType });

  try {
    // Check if badge already exists
    const existing = await prisma.achievement.findUnique({
      where: {
        userId_badgeType: {
          userId,
          badgeType,
        },
      },
    });

    if (existing) {
      return { unlocked: true, badge: badgeType, isNew: false };
    }

    // Create new badge
    await prisma.achievement.create({
      data: {
        userId,
        badgeType,
        metadata,
      },
    });

    log.info("Badge awarded");
    return { unlocked: true, badge: badgeType, isNew: true };
  } catch (error) {
    // Handle race condition (unique constraint violation)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { unlocked: true, badge: badgeType, isNew: false };
    }
    throw error;
  }
}

/**
 * Award streak badges (STREAK_3_DAYS, STREAK_7_DAYS)
 */
export async function checkStreakBadge(
  prisma: PrismaClient,
  userId: string,
  streakDays: number,
): Promise<BadgeCheckResult | null> {
  const log = logger.child({ fn: "checkStreakBadge", userId, streakDays });

  let badgeToCheck: BadgeType | null = null;

  if (streakDays >= 7) {
    badgeToCheck = "STREAK_7_DAYS";
  } else if (streakDays >= 3) {
    badgeToCheck = "STREAK_3_DAYS";
  }

  if (!badgeToCheck) {
    return null;
  }

  const result = await tryAwardBadge(prisma, userId, badgeToCheck, {
    streakDays,
  });

  if (result.isNew) {
    log.info({ badge: badgeToCheck }, "Streak badge unlocked");
  }

  return result;
}

// ============================================================================
// Badge Notifications
// ============================================================================

/**
 * Badge display info with Russian text
 */
const BADGE_INFO: Record<
  BadgeType,
  { emoji: string; name: string; description: string }
> = {
  BRONZE_EXPLORER: {
    emoji: "\u{1F3C5}",
    name: "Первый шаг",
    description: "Ты начал тест на профориентацию!",
  },
  SILVER_SEEKER: {
    emoji: "\u{1F948}",
    name: "Четверть пути",
    description: "25% теста пройдено!",
  },
  GOLD_ACHIEVER: {
    emoji: "\u{1F947}",
    name: "Половина пути",
    description: "50% теста пройдено! Так держать!",
  },
  PLATINUM_MASTER: {
    emoji: "\u{1F48E}",
    name: "Почти у цели",
    description: "75% теста пройдено! Финиш близко!",
  },
  SPEED_DEMON: {
    emoji: "\u{26A1}",
    name: "Скоростной",
    description: "Прошёл тест быстрее всех!",
  },
  THOUGHTFUL_ANALYST: {
    emoji: "\u{1F393}",
    name: "Тест завершён",
    description: "Поздравляем! Ты прошёл тест полностью!",
  },
  STREAK_3_DAYS: {
    emoji: "\u{1F525}",
    name: "Стрик 3 дня",
    description: "3 дня подряд в приложении!",
  },
  STREAK_7_DAYS: {
    emoji: "\u{1F31F}",
    name: "Недельный стрик",
    description: "Целая неделя активности!",
  },
  REFERRAL_BRONZE: {
    emoji: "\u{1F91D}",
    name: "Первый друг",
    description: "Ты пригласил первого друга!",
  },
  REFERRAL_SILVER: {
    emoji: "\u{1F465}",
    name: "Популярный",
    description: "Пригласил 5 друзей!",
  },
  REFERRAL_GOLD: {
    emoji: "\u{1F451}",
    name: "Лидер",
    description: "Пригласил 10 друзей!",
  },
  NIGHT_OWL: {
    emoji: "\u{1F989}",
    name: "Ночная сова",
    description: "Прошёл вопрос между 23:00 и 02:00!",
  },
  EARLY_BIRD: {
    emoji: "\u{1F426}",
    name: "Ранняя пташка",
    description: "Прошёл вопрос между 05:00 и 07:00!",
  },
  DETECTIVE: {
    emoji: "\u{1F50D}",
    name: "Детектив",
    description: "Нашёл секретный вопрос #33!",
  },
};

/**
 * Get celebration message for earned badge
 */
export function getBadgeNotification(badge: BadgeType): string {
  const info = BADGE_INFO[badge];

  if (!info) {
    return `\u{1F3C6} Ты получил новый бейдж!`;
  }

  return (
    `${info.emoji} **Новый бейдж: ${info.name}!**\n\n` +
    `${info.description}\n\n` +
    `Посмотри все свои достижения: /achievements`
  );
}

/**
 * Get badge display info
 */
export function getBadgeInfo(badge: BadgeType): {
  emoji: string;
  name: string;
  description: string;
} {
  return (
    BADGE_INFO[badge] || {
      emoji: "\u{1F3C6}",
      name: badge,
      description: "",
    }
  );
}

/**
 * Format badge list for display
 */
export function formatBadgeList(badges: BadgeType[]): string {
  if (badges.length === 0) {
    return "У тебя пока нет бейджей. Начни тест, чтобы получить первый!";
  }

  return badges
    .map((badge) => {
      const info = getBadgeInfo(badge);
      return `${info.emoji} **${info.name}**\n_${info.description}_`;
    })
    .join("\n\n");
}

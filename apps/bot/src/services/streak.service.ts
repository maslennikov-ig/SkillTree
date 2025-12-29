/**
 * Streak Service for SkillTree Bot
 *
 * Handles:
 * - Daily check-in tracking
 * - Streak calculation and maintenance
 * - Weekly bonus points (Day N = N points)
 * - Streak status retrieval
 */

import type { PrismaClient } from "@skilltree/database";
import { logger } from "../utils/logger";
import { checkStreakBadge } from "./gamification.service";

// ============================================================================
// Types
// ============================================================================

export interface StreakInfo {
  currentDay: number;
  weeklyPoints: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn: Date | null;
  bonusEarned: number;
  isNewCheckIn: boolean;
}

export interface StreakStatus {
  currentDay: number;
  weeklyPoints: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn: Date | null;
  nextBonus: number;
  streakActive: boolean;
}

// ============================================================================
// Constants
// ============================================================================

// Moscow timezone offset (UTC+3)
const MOSCOW_OFFSET_HOURS = 3;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Perform daily check-in for a user
 * Awards bonus points based on streak day (Day N = N points)
 * Resets on Monday 00:00 MSK
 */
export async function checkIn(
  prisma: PrismaClient,
  studentId: string,
): Promise<StreakInfo> {
  const log = logger.child({ fn: "checkIn", studentId });

  // Get student's user ID
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });

  if (!student) {
    log.warn("Student not found");
    throw new Error("Student not found");
  }

  const userId = student.userId;
  const now = getMoscowTime();
  const today = getMoscowDateString(now);
  const currentWeekStart = getWeekStartDate(now);

  // Get or create streak record
  let streak = await prisma.dailyStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    // Create new streak record
    streak = await prisma.dailyStreak.create({
      data: {
        userId,
        currentDay: 1,
        weeklyPoints: 1, // Day 1 = 1 point
        weekStartDate: currentWeekStart,
        lastCheckIn: now,
        longestStreak: 1,
        totalCheckIns: 1,
      },
    });

    log.info("New streak created");

    return {
      currentDay: 1,
      weeklyPoints: 1,
      longestStreak: 1,
      totalCheckIns: 1,
      lastCheckIn: now,
      bonusEarned: 1,
      isNewCheckIn: true,
    };
  }

  // Check if already checked in today
  const lastCheckInDate = streak.lastCheckIn
    ? getMoscowDateString(streak.lastCheckIn)
    : null;

  if (lastCheckInDate === today) {
    // Already checked in today
    log.debug("Already checked in today");

    return {
      currentDay: streak.currentDay,
      weeklyPoints: streak.weeklyPoints,
      longestStreak: streak.longestStreak,
      totalCheckIns: streak.totalCheckIns,
      lastCheckIn: streak.lastCheckIn,
      bonusEarned: 0,
      isNewCheckIn: false,
    };
  }

  // Check if week has reset (Monday 00:00 MSK)
  const streakWeekStart = getMoscowDateString(streak.weekStartDate);
  const currentWeekStartStr = getMoscowDateString(currentWeekStart);
  const isNewWeek = streakWeekStart !== currentWeekStartStr;

  // Calculate new streak day
  let newDay: number;
  let newWeeklyPoints: number;
  let newWeekStart: Date;

  if (isNewWeek) {
    // New week - reset to day 1
    newDay = 1;
    newWeeklyPoints = 1;
    newWeekStart = currentWeekStart;
    log.info("Week reset, starting new streak");
  } else {
    // Same week - increment day (max 7)
    newDay = Math.min(streak.currentDay + 1, 7);
    newWeeklyPoints = streak.weeklyPoints + newDay;
    newWeekStart = streak.weekStartDate;
  }

  // Calculate bonus for this check-in
  const bonusEarned = calculateBonus(newDay);

  // Update longest streak if needed
  const newLongestStreak = Math.max(streak.longestStreak, newDay);

  // Update streak record
  const updatedStreak = await prisma.dailyStreak.update({
    where: { userId },
    data: {
      currentDay: newDay,
      weeklyPoints: newWeeklyPoints,
      weekStartDate: newWeekStart,
      lastCheckIn: now,
      longestStreak: newLongestStreak,
      totalCheckIns: { increment: 1 },
    },
  });

  log.info(
    { newDay, bonusEarned, weeklyPoints: newWeeklyPoints },
    "Check-in completed",
  );

  // Check for streak badges
  await checkStreakBadge(prisma, userId, newDay);

  return {
    currentDay: updatedStreak.currentDay,
    weeklyPoints: updatedStreak.weeklyPoints,
    longestStreak: updatedStreak.longestStreak,
    totalCheckIns: updatedStreak.totalCheckIns,
    lastCheckIn: updatedStreak.lastCheckIn,
    bonusEarned,
    isNewCheckIn: true,
  };
}

/**
 * Get current streak status for a user
 */
export async function getStreakStatus(
  prisma: PrismaClient,
  studentId: string,
): Promise<StreakStatus> {
  const log = logger.child({ fn: "getStreakStatus", studentId });

  // Get student's user ID
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });

  if (!student) {
    log.warn("Student not found");
    return {
      currentDay: 0,
      weeklyPoints: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      lastCheckIn: null,
      nextBonus: 1,
      streakActive: false,
    };
  }

  const streak = await prisma.dailyStreak.findUnique({
    where: { userId: student.userId },
  });

  if (!streak) {
    return {
      currentDay: 0,
      weeklyPoints: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      lastCheckIn: null,
      nextBonus: 1,
      streakActive: false,
    };
  }

  // Check if streak is still active (checked in today or streak continues)
  const now = getMoscowTime();
  const today = getMoscowDateString(now);
  const lastCheckInDate = streak.lastCheckIn
    ? getMoscowDateString(streak.lastCheckIn)
    : null;

  // Check if week has reset
  const currentWeekStart = getWeekStartDate(now);
  const streakWeekStart = getMoscowDateString(streak.weekStartDate);
  const currentWeekStartStr = getMoscowDateString(currentWeekStart);
  const isNewWeek = streakWeekStart !== currentWeekStartStr;

  const streakActive = lastCheckInDate === today;

  // Calculate next bonus
  let nextDay: number;
  if (isNewWeek) {
    nextDay = 1;
  } else if (streakActive) {
    nextDay = Math.min(streak.currentDay + 1, 7);
  } else {
    nextDay = Math.min(streak.currentDay + 1, 7);
  }

  return {
    currentDay: isNewWeek ? 0 : streak.currentDay,
    weeklyPoints: isNewWeek ? 0 : streak.weeklyPoints,
    longestStreak: streak.longestStreak,
    totalCheckIns: streak.totalCheckIns,
    lastCheckIn: streak.lastCheckIn,
    nextBonus: calculateBonus(nextDay),
    streakActive,
  };
}

/**
 * Calculate bonus points for a given day
 * Day 1 = 1 point, Day 2 = 2 points, ..., Day 7 = 7 points
 */
export function calculateBonus(dayNumber: number): number {
  // Clamp between 1 and 7
  return Math.max(1, Math.min(7, dayNumber));
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current time in Moscow timezone
 */
function getMoscowTime(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + MOSCOW_OFFSET_HOURS * 3600000);
}

/**
 * Get date string in YYYY-MM-DD format for Moscow time
 */
function getMoscowDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get the Monday 00:00 MSK of the current week
 */
function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust to Monday (day 0 = Sunday, so we need to go back)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format streak info for display
 */
export function formatStreakMessage(status: StreakStatus): string {
  const streakEmoji = getStreakEmoji(status.currentDay);
  const progressBar = getProgressBar(status.currentDay);

  let message = `${streakEmoji} **Твой стрик**\n\n`;

  if (status.currentDay === 0) {
    message += `Ты ещё не начал стрик на этой неделе.\n`;
    message += `Зайди в приложение, чтобы начать!\n\n`;
  } else {
    message += `${progressBar}\n`;
    message += `День: **${status.currentDay}/7**\n`;
    message += `Очков за неделю: **${status.weeklyPoints}**\n\n`;
  }

  message += `\u{1F3C6} Лучший стрик: **${status.longestStreak}** дней\n`;
  message += `\u{2705} Всего чек-инов: **${status.totalCheckIns}**\n\n`;

  if (!status.streakActive && status.currentDay > 0) {
    message += `\u{1F514} Зайди сегодня, чтобы получить **+${status.nextBonus}** очков!\n`;
  } else if (status.currentDay < 7) {
    message += `\u{1F4AB} Завтра получишь **+${status.nextBonus}** очков за стрик!`;
  } else {
    message += `\u{1F31F} Максимальный стрик достигнут! Так держать!`;
  }

  return message;
}

/**
 * Get emoji for streak level
 */
function getStreakEmoji(day: number): string {
  if (day === 0) return "\u{1F4A4}";
  if (day <= 2) return "\u{1F525}";
  if (day <= 4) return "\u{1F525}\u{1F525}";
  if (day <= 6) return "\u{1F525}\u{1F525}\u{1F525}";
  return "\u{1F31F}\u{1F525}\u{1F31F}";
}

/**
 * Get visual progress bar
 */
function getProgressBar(day: number): string {
  const filled = "\u{2588}";
  const empty = "\u{2591}";
  const bar = Array(7)
    .fill(empty)
    .map((_, i) => (i < day ? filled : empty))
    .join("");
  return `[${bar}]`;
}

/**
 * Format check-in result message
 */
export function formatCheckInMessage(info: StreakInfo): string {
  if (!info.isNewCheckIn) {
    return (
      `\u{2705} Ты уже отметился сегодня!\n\n` +
      `День: **${info.currentDay}/7**\n` +
      `Очков за неделю: **${info.weeklyPoints}**`
    );
  }

  const streakEmoji = getStreakEmoji(info.currentDay);

  return (
    `${streakEmoji} **Чек-ин выполнен!**\n\n` +
    `День: **${info.currentDay}/7**\n` +
    `Бонус: **+${info.bonusEarned}** очков\n` +
    `Очков за неделю: **${info.weeklyPoints}**\n\n` +
    `Продолжай в том же духе!`
  );
}

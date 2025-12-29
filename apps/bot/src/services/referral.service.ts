/**
 * Referral Service for SkillTree Bot
 *
 * Handles:
 * - Referral tracking creation and management
 * - Referral completion and reward claiming
 * - Referral milestone badge awards
 * - Referral statistics
 * - Referral code generation and parsing
 */

import type { PrismaClient, ReferralStatus } from "@skilltree/database";
import { POINTS_CONFIG } from "@skilltree/shared";
import { logger } from "../utils/logger";

// ============================================================================
// Constants
// ============================================================================

const REFERRAL_CODE_PREFIX = "ref_";

// CUID format: 25 chars, starts with 'c', alphanumeric lowercase
const CUID_REGEX = /^c[a-z0-9]{24}$/;

// Referral milestone thresholds for badges
const REFERRAL_MILESTONES = {
  BRONZE: 1,
  SILVER: 5,
  GOLD: 10,
} as const;

// ============================================================================
// Types
// ============================================================================

export interface ReferralTrackingResult {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  status: ReferralStatus;
  isExisting: boolean;
}

export interface ReferralCompletionResult {
  success: boolean;
  referralId?: string;
  referrerId?: string;
  referrerTelegramId?: bigint;
  error?: string;
}

export interface ReferralRewardResult {
  success: boolean;
  referrerPointsAwarded: number;
  refereePointsAwarded: number;
  error?: string;
}

export interface ReferralBadgeResult {
  unlocked: boolean;
  badge?: "REFERRAL_BRONZE" | "REFERRAL_SILVER" | "REFERRAL_GOLD";
  isNew: boolean;
}

export interface ReferralStats {
  total: number;
  pending: number;
  completed: number;
  rewarded: number;
}

// ============================================================================
// Referral Code Generation
// ============================================================================

/**
 * Generate referral code from user ID
 * Format: ref_{userId}
 *
 * @param userId - User ID (cuid)
 * @returns Referral code string
 */
export function getReferralCode(userId: string): string {
  return `${REFERRAL_CODE_PREFIX}${userId}`;
}

/**
 * Parse referral code to extract user ID
 *
 * @param code - Referral code string
 * @returns User ID or null if invalid format
 */
export function parseReferralCode(code: string): string | null {
  if (!code || !code.startsWith(REFERRAL_CODE_PREFIX)) {
    return null;
  }

  const userId = code.slice(REFERRAL_CODE_PREFIX.length);

  // Validate CUID format (25 chars, starts with 'c', alphanumeric lowercase)
  if (!userId || !CUID_REGEX.test(userId)) {
    return null;
  }

  return userId;
}

// ============================================================================
// Referral Tracking Management
// ============================================================================

/**
 * Create referral tracking record
 * Handles duplicate referral (same referee-referrer pair) by returning existing
 *
 * @param prisma - Prisma client
 * @param referrerId - User ID of the referrer
 * @param refereeId - User ID of the referee (new user)
 * @param referralCode - Referral code used
 * @returns Referral tracking result
 */
export async function createReferralTracking(
  prisma: PrismaClient,
  referrerId: string,
  refereeId: string,
  referralCode: string,
): Promise<ReferralTrackingResult> {
  const log = logger.child({
    fn: "createReferralTracking",
    referrerId,
    refereeId,
    referralCode,
  });

  try {
    // Check for existing referral with same referee-referrer pair
    const existing = await prisma.referralTracking.findFirst({
      where: {
        referrerId,
        refereeId,
      },
    });

    if (existing) {
      log.info({ existingId: existing.id }, "Referral tracking already exists");
      return {
        id: existing.id,
        referrerId: existing.referrerId,
        refereeId: existing.refereeId,
        referralCode: existing.referralCode,
        status: existing.status,
        isExisting: true,
      };
    }

    // Create new referral tracking record
    const referral = await prisma.referralTracking.create({
      data: {
        referrerId,
        refereeId,
        referralCode,
        status: "PENDING",
        rewardClaimed: false,
      },
    });

    log.info({ referralId: referral.id }, "Referral tracking created");

    return {
      id: referral.id,
      referrerId: referral.referrerId,
      refereeId: referral.refereeId,
      referralCode: referral.referralCode,
      status: referral.status,
      isExisting: false,
    };
  } catch (error) {
    log.error({ error }, "Failed to create referral tracking");
    throw error;
  }
}

/**
 * Complete a referral when referee completes qualifying action
 * Updates status to COMPLETED and sets convertedAt timestamp
 *
 * @param prisma - Prisma client
 * @param refereeUserId - User ID of the referee
 * @returns Referrer info for notification
 */
export async function completeReferral(
  prisma: PrismaClient,
  refereeUserId: string,
): Promise<ReferralCompletionResult> {
  const log = logger.child({ fn: "completeReferral", refereeUserId });

  try {
    // Find PENDING referral where referee matches
    const referral = await prisma.referralTracking.findFirst({
      where: {
        refereeId: refereeUserId,
        status: "PENDING",
      },
      include: {
        referrer: {
          select: {
            id: true,
            telegramId: true,
          },
        },
      },
    });

    if (!referral) {
      log.debug("No pending referral found for user");
      return {
        success: false,
        error: "no_pending_referral",
      };
    }

    // Update referral status to COMPLETED
    await prisma.referralTracking.update({
      where: { id: referral.id },
      data: {
        status: "COMPLETED",
        convertedAt: new Date(),
      },
    });

    log.info(
      { referralId: referral.id, referrerId: referral.referrerId },
      "Referral completed",
    );

    return {
      success: true,
      referralId: referral.id,
      referrerId: referral.referrer.id,
      referrerTelegramId: referral.referrer.telegramId,
    };
  } catch (error) {
    log.error({ error }, "Failed to complete referral");
    return {
      success: false,
      error: "internal_error",
    };
  }
}

/**
 * Claim referral rewards for both referrer and referee
 * Awards points to both users and marks referral as REWARDED
 *
 * @param prisma - Prisma client
 * @param referralId - Referral tracking ID
 * @returns Reward amounts awarded
 */
export async function claimReferralRewards(
  prisma: PrismaClient,
  referralId: string,
): Promise<ReferralRewardResult> {
  const log = logger.child({ fn: "claimReferralRewards", referralId });

  try {
    // Get referral record
    const referral = await prisma.referralTracking.findUnique({
      where: { id: referralId },
    });

    if (!referral) {
      log.warn("Referral not found");
      return {
        success: false,
        referrerPointsAwarded: 0,
        refereePointsAwarded: 0,
        error: "referral_not_found",
      };
    }

    if (referral.rewardClaimed) {
      log.info("Rewards already claimed");
      return {
        success: false,
        referrerPointsAwarded: 0,
        refereePointsAwarded: 0,
        error: "already_claimed",
      };
    }

    const referrerPoints = POINTS_CONFIG.REFERRAL_COMPLETED;
    const refereePoints = POINTS_CONFIG.REFERRAL_BONUS_REFEREE;

    // Update referral status and award points via DailyStreak weeklyPoints in a transaction
    // Note: Points are stored in DailyStreak.weeklyPoints as User model doesn't have totalPoints
    await prisma.$transaction([
      // Update referral status to REWARDED
      prisma.referralTracking.update({
        where: { id: referralId },
        data: {
          status: "REWARDED",
          rewardClaimed: true,
        },
      }),
      // Award points to referrer via DailyStreak
      prisma.dailyStreak.upsert({
        where: { userId: referral.referrerId },
        update: {
          weeklyPoints: { increment: referrerPoints },
        },
        create: {
          userId: referral.referrerId,
          weeklyPoints: referrerPoints,
          weekStartDate: new Date(),
        },
      }),
      // Award points to referee via DailyStreak
      prisma.dailyStreak.upsert({
        where: { userId: referral.refereeId },
        update: {
          weeklyPoints: { increment: refereePoints },
        },
        create: {
          userId: referral.refereeId,
          weeklyPoints: refereePoints,
          weekStartDate: new Date(),
        },
      }),
    ]);

    log.info(
      { referrerPoints, refereePoints },
      "Referral rewards claimed successfully",
    );

    return {
      success: true,
      referrerPointsAwarded: referrerPoints,
      refereePointsAwarded: refereePoints,
    };
  } catch (error) {
    log.error({ error }, "Failed to claim referral rewards");
    return {
      success: false,
      referrerPointsAwarded: 0,
      refereePointsAwarded: 0,
      error: "internal_error",
    };
  }
}

// ============================================================================
// Badge Management
// ============================================================================

/**
 * Check and award referral milestone badges
 * - REFERRAL_BRONZE: 1 successful referral
 * - REFERRAL_SILVER: 5 successful referrals
 * - REFERRAL_GOLD: 10 successful referrals
 *
 * @param prisma - Prisma client
 * @param referrerId - User ID of the referrer
 * @returns Badge result if milestone reached
 */
export async function checkReferralMilestoneBadge(
  prisma: PrismaClient,
  referrerId: string,
): Promise<ReferralBadgeResult> {
  const log = logger.child({ fn: "checkReferralMilestoneBadge", referrerId });

  try {
    // Count completed referrals for this referrer
    const completedCount = await prisma.referralTracking.count({
      where: {
        referrerId,
        status: { in: ["COMPLETED", "REWARDED"] },
      },
    });

    log.debug({ completedCount }, "Completed referrals count");

    // Determine which badge to check based on count
    let badgeToCheck:
      | "REFERRAL_BRONZE"
      | "REFERRAL_SILVER"
      | "REFERRAL_GOLD"
      | null = null;

    if (completedCount >= REFERRAL_MILESTONES.GOLD) {
      badgeToCheck = "REFERRAL_GOLD";
    } else if (completedCount >= REFERRAL_MILESTONES.SILVER) {
      badgeToCheck = "REFERRAL_SILVER";
    } else if (completedCount >= REFERRAL_MILESTONES.BRONZE) {
      badgeToCheck = "REFERRAL_BRONZE";
    }

    if (!badgeToCheck) {
      return { unlocked: false, isNew: false };
    }

    // Check if badge already exists
    const existingBadge = await prisma.achievement.findUnique({
      where: {
        userId_badgeType: {
          userId: referrerId,
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
        userId: referrerId,
        badgeType: badgeToCheck,
        metadata: {
          referralCount: completedCount,
          awardedFor: "referral_milestone",
        },
      },
    });

    log.info(
      { badge: badgeToCheck, count: completedCount },
      "Referral badge unlocked",
    );

    return { unlocked: true, badge: badgeToCheck, isNew: true };
  } catch (error) {
    // Handle race condition (unique constraint violation)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      log.debug("Badge already exists (race condition)");
      return { unlocked: true, isNew: false };
    }
    log.error({ error }, "Failed to check referral milestone badge");
    throw error;
  }
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get referral statistics for a user
 *
 * @param prisma - Prisma client
 * @param userId - User ID
 * @returns Referral statistics
 */
export async function getReferralStats(
  prisma: PrismaClient,
  userId: string,
): Promise<ReferralStats> {
  const log = logger.child({ fn: "getReferralStats", userId });

  try {
    // Get counts for all referral statuses
    const [total, pending, completed, rewarded] = await Promise.all([
      prisma.referralTracking.count({
        where: { referrerId: userId },
      }),
      prisma.referralTracking.count({
        where: { referrerId: userId, status: "PENDING" },
      }),
      prisma.referralTracking.count({
        where: { referrerId: userId, status: "COMPLETED" },
      }),
      prisma.referralTracking.count({
        where: { referrerId: userId, status: "REWARDED" },
      }),
    ]);

    log.debug(
      { total, pending, completed, rewarded },
      "Referral stats retrieved",
    );

    return {
      total,
      pending,
      completed,
      rewarded,
    };
  } catch (error) {
    log.error({ error }, "Failed to get referral stats");
    return {
      total: 0,
      pending: 0,
      completed: 0,
      rewarded: 0,
    };
  }
}

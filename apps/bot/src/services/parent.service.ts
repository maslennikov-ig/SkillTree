/**
 * Parent Service for SkillTree Bot
 *
 * Handles:
 * - Parent-student link code generation
 * - Link code validation and parent-student linking
 * - Email verification flow
 * - Children management for parents
 */

import type { PrismaClient } from "@skilltree/database";
import { logger } from "../utils/logger";

// ============================================================================
// Constants
// ============================================================================

const LINK_CODE_LENGTH = 6;
const LINK_CODE_EXPIRY_HOURS = 24;
const EMAIL_CODE_LENGTH = 4;
const EMAIL_CODE_EXPIRY_MINUTES = 15;

// Characters that are easy to read and won't be confused with each other
// Excluded: 0, O, 1, I, L (can be confused)
const SAFE_ALPHANUMERIC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// ============================================================================
// Types
// ============================================================================

export interface LinkCodeResult {
  code: string;
  expiresAt: Date;
}

export interface LinkResult {
  success: boolean;
  studentName?: string;
  studentTelegramId?: bigint;
  parentName?: string;
  parentTelegramId?: bigint;
  error?: string;
}

export interface ChildInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  grade: number;
  age: number;
  hasCompletedTest: boolean;
}

export interface EmailVerificationResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Link Code Generation
// ============================================================================

/**
 * Generate a random 6-character alphanumeric code
 * Uses only safe characters that won't be confused (no 0/O, 1/I/L)
 */
export function generateLinkCode(): string {
  let code = "";
  for (let i = 0; i < LINK_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_ALPHANUMERIC.length);
    code += SAFE_ALPHANUMERIC[randomIndex];
  }
  return code;
}

/**
 * Generate a random 4-digit code for email verification
 */
export function generateEmailCode(): string {
  let code = "";
  for (let i = 0; i < EMAIL_CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// ============================================================================
// Link Code Management
// ============================================================================

/**
 * Create or refresh link code for a student
 * If a code already exists, it will be replaced with a new one
 *
 * @param prisma - Prisma client
 * @param studentId - Student ID
 * @returns Link code and expiration date
 */
export async function createLinkCode(
  prisma: PrismaClient,
  studentId: string,
): Promise<LinkCodeResult> {
  const log = logger.child({ fn: "createLinkCode", studentId });

  const code = generateLinkCode();
  const expiresAt = new Date(
    Date.now() + LINK_CODE_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  try {
    // Upsert: create new or replace existing code
    await prisma.parentLinkCode.upsert({
      where: { studentId },
      update: {
        code,
        expiresAt,
      },
      create: {
        studentId,
        code,
        expiresAt,
      },
    });

    log.info({ code, expiresAt }, "Link code created/refreshed");

    return { code, expiresAt };
  } catch (error) {
    log.error({ error }, "Failed to create link code");
    throw error;
  }
}

/**
 * Get existing link code for a student (if valid)
 */
export async function getValidLinkCode(
  prisma: PrismaClient,
  studentId: string,
): Promise<LinkCodeResult | null> {
  const linkCode = await prisma.parentLinkCode.findUnique({
    where: { studentId },
  });

  if (!linkCode) {
    return null;
  }

  // Check if expired
  if (linkCode.expiresAt < new Date()) {
    // Clean up expired code
    await prisma.parentLinkCode.delete({
      where: { studentId },
    });
    return null;
  }

  return {
    code: linkCode.code,
    expiresAt: linkCode.expiresAt,
  };
}

// ============================================================================
// Parent-Student Linking
// ============================================================================

/**
 * Validate code and link parent to student
 *
 * @param prisma - Prisma client
 * @param parentId - Parent ID
 * @param code - 6-character link code
 * @returns Result with success status and student/parent info for notifications
 */
export async function linkParentToStudent(
  prisma: PrismaClient,
  parentId: string,
  code: string,
): Promise<LinkResult> {
  const log = logger.child({ fn: "linkParentToStudent", parentId, code });

  try {
    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    // Find link code
    const linkCode = await prisma.parentLinkCode.findUnique({
      where: { code: normalizedCode },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, telegramId: true },
            },
          },
        },
      },
    });

    // Check if code exists
    if (!linkCode) {
      log.warn("Invalid link code");
      return {
        success: false,
        error: "invalid_code",
      };
    }

    // Check if code is expired
    if (linkCode.expiresAt < new Date()) {
      log.warn("Expired link code");
      // Clean up expired code
      await prisma.parentLinkCode.delete({
        where: { id: linkCode.id },
      });
      return {
        success: false,
        error: "expired_code",
      };
    }

    // Check if already linked
    const existingLink = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId: linkCode.studentId,
        },
      },
    });

    if (existingLink) {
      log.info("Already linked");
      return {
        success: false,
        error: "already_linked",
      };
    }

    // Get parent info for notification
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        user: {
          select: { firstName: true, lastName: true, telegramId: true },
        },
      },
    });

    if (!parent) {
      log.error("Parent not found");
      return {
        success: false,
        error: "parent_not_found",
      };
    }

    // Create parent-student link
    await prisma.parentStudent.create({
      data: {
        parentId,
        studentId: linkCode.studentId,
      },
    });

    // Delete used link code
    await prisma.parentLinkCode.delete({
      where: { id: linkCode.id },
    });

    log.info({ studentId: linkCode.studentId }, "Parent linked to student");

    return {
      success: true,
      studentName: linkCode.student.user.firstName ?? undefined,
      studentTelegramId: linkCode.student.user.telegramId,
      parentName: parent.user.firstName ?? undefined,
      parentTelegramId: parent.user.telegramId,
    };
  } catch (error) {
    log.error({ error }, "Failed to link parent to student");
    return {
      success: false,
      error: "internal_error",
    };
  }
}

// ============================================================================
// Children Management
// ============================================================================

/**
 * Get all children linked to a parent
 */
export async function getLinkedChildren(
  prisma: PrismaClient,
  parentId: string,
): Promise<ChildInfo[]> {
  const log = logger.child({ fn: "getLinkedChildren", parentId });

  try {
    const links = await prisma.parentStudent.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
            testSessions: {
              where: { status: "COMPLETED" },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });

    return links.map((link) => ({
      id: link.student.id,
      firstName: link.student.user.firstName,
      lastName: link.student.user.lastName,
      grade: link.student.grade,
      age: link.student.age,
      hasCompletedTest: link.student.testSessions.length > 0,
    }));
  } catch (error) {
    log.error({ error }, "Failed to get linked children");
    return [];
  }
}

/**
 * Check if a parent is linked to a specific student
 */
export async function isParentLinkedToStudent(
  prisma: PrismaClient,
  parentId: string,
  studentId: string,
): Promise<boolean> {
  const link = await prisma.parentStudent.findUnique({
    where: {
      parentId_studentId: {
        parentId,
        studentId,
      },
    },
  });
  return link !== null;
}

// ============================================================================
// Email Verification
// ============================================================================

/**
 * Create or refresh email verification code
 */
export async function createEmailVerification(
  prisma: PrismaClient,
  userId: string,
  email: string,
): Promise<{ code: string; expiresAt: Date }> {
  const log = logger.child({ fn: "createEmailVerification", userId, email });

  const code = generateEmailCode();
  const expiresAt = new Date(
    Date.now() + EMAIL_CODE_EXPIRY_MINUTES * 60 * 1000,
  );

  try {
    // Clean up old verification codes for this user
    await prisma.emailVerification.deleteMany({
      where: { userId },
    });

    // Create new verification
    await prisma.emailVerification.create({
      data: {
        userId,
        email,
        code,
        expiresAt,
      },
    });

    log.info({ expiresAt }, "Email verification code created");

    return { code, expiresAt };
  } catch (error) {
    log.error({ error }, "Failed to create email verification");
    throw error;
  }
}

/**
 * Verify email code and update parent's email status
 */
export async function verifyEmailCode(
  prisma: PrismaClient,
  userId: string,
  code: string,
): Promise<EmailVerificationResult> {
  const log = logger.child({ fn: "verifyEmailCode", userId });

  try {
    // Find verification record
    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId,
        code,
        verified: false,
      },
    });

    if (!verification) {
      log.warn("Invalid verification code");
      return {
        success: false,
        error: "invalid_code",
      };
    }

    // Check if expired
    if (verification.expiresAt < new Date()) {
      log.warn("Expired verification code");
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      return {
        success: false,
        error: "expired_code",
      };
    }

    // Get parent record
    const parent = await prisma.parent.findFirst({
      where: { userId },
    });

    if (!parent) {
      log.error("Parent not found");
      return {
        success: false,
        error: "parent_not_found",
      };
    }

    // Update verification status and parent email
    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { verified: true },
      }),
      prisma.parent.update({
        where: { id: parent.id },
        data: {
          email: verification.email,
          emailVerified: true,
        },
      }),
    ]);

    log.info({ email: verification.email }, "Email verified successfully");

    return { success: true };
  } catch (error) {
    log.error({ error }, "Failed to verify email code");
    return {
      success: false,
      error: "internal_error",
    };
  }
}

/**
 * Get pending email verification for user
 */
export async function getPendingEmailVerification(
  prisma: PrismaClient,
  userId: string,
): Promise<{ email: string; expiresAt: Date } | null> {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      userId,
      verified: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification) {
    return null;
  }

  return {
    email: verification.email,
    expiresAt: verification.expiresAt,
  };
}

/**
 * Extended grammY Context type for SkillTree Bot
 *
 * Provides:
 * - Prisma client access via ctx.prisma
 * - Current quiz session state via ctx.quizSession
 * - User role information
 */

import type { Context } from "grammy";
import type { PrismaClient, SessionStatus } from "@skilltree/database";

/**
 * Active quiz session attached to context by middleware
 */
export interface QuizSession {
  id: string;
  currentStep: number; // FSM instruction pointer (0-54)
  status: SessionStatus;
  studentId: string;
}

/**
 * User context loaded from database
 */
export interface UserContext {
  userId: string;
  telegramId: bigint;
  role: "student" | "parent" | null;
  studentId?: string;
  parentId?: string;
}

/**
 * Extended grammY Context with SkillTree-specific properties
 */
export interface MyContext extends Context {
  /**
   * Prisma client for database access
   */
  prisma: PrismaClient;

  /**
   * Active quiz session (if any)
   * Loaded by quizSessionMiddleware
   */
  quizSession?: QuizSession;

  /**
   * Current user context
   * Loaded by userContextMiddleware
   */
  user?: UserContext;
}

/**
 * Type guard to check if user has an active quiz session
 */
export function hasActiveQuiz(
  ctx: MyContext,
): ctx is MyContext & { quizSession: QuizSession } {
  return (
    ctx.quizSession !== undefined && ctx.quizSession.status === "IN_PROGRESS"
  );
}

/**
 * Type guard to check if user is authenticated
 */
export function isAuthenticated(
  ctx: MyContext,
): ctx is MyContext & { user: UserContext } {
  return ctx.user !== undefined;
}

/**
 * Type guard to check if user is a student
 */
export function isStudent(
  ctx: MyContext,
): ctx is MyContext & {
  user: UserContext & { role: "student"; studentId: string };
} {
  return ctx.user?.role === "student" && ctx.user.studentId !== undefined;
}

/**
 * Type guard to check if user is a parent
 */
export function isParent(
  ctx: MyContext,
): ctx is MyContext & {
  user: UserContext & { role: "parent"; parentId: string };
} {
  return ctx.user?.role === "parent" && ctx.user.parentId !== undefined;
}

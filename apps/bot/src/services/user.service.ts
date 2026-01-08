/**
 * User Service for SkillTree Bot
 *
 * Handles user creation, lookup, and profile management
 * using Prisma for database operations.
 */

import type {
  PrismaClient,
  User,
  Student,
  Parent,
  Gender,
} from "@skilltree/database";

// ============================================================================
// Types
// ============================================================================

export interface CreateUserData {
  telegramId: bigint;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateStudentData {
  userId: string;
  age: number;
  grade: number;
  gender?: Gender;
}

export interface CreateParentData {
  userId: string;
  email?: string;
}

export interface UserWithRelations extends User {
  student: Student | null;
  parent: Parent | null;
}

// ============================================================================
// User Functions
// ============================================================================

/**
 * Find user by Telegram ID with relations
 */
export async function findByTelegramId(
  prisma: PrismaClient,
  telegramId: bigint,
): Promise<UserWithRelations | null> {
  return prisma.user.findUnique({
    where: { telegramId },
    include: {
      student: true,
      parent: true,
    },
  });
}

/**
 * Create new user from Telegram data
 */
export async function createUser(
  prisma: PrismaClient,
  data: CreateUserData,
): Promise<User> {
  return prisma.user.create({
    data: {
      telegramId: data.telegramId,
      telegramUsername: data.telegramUsername,
      firstName: data.firstName,
      lastName: data.lastName,
    },
  });
}

/**
 * Create or update user (upsert)
 */
export async function upsertUser(
  prisma: PrismaClient,
  data: CreateUserData,
): Promise<User> {
  return prisma.user.upsert({
    where: { telegramId: data.telegramId },
    update: {
      telegramUsername: data.telegramUsername,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    create: {
      telegramId: data.telegramId,
      telegramUsername: data.telegramUsername,
      firstName: data.firstName,
      lastName: data.lastName,
    },
  });
}

// ============================================================================
// Student Functions
// ============================================================================

/**
 * Create student profile for existing user
 */
export async function createStudent(
  prisma: PrismaClient,
  data: CreateStudentData,
): Promise<Student> {
  return prisma.student.create({
    data: {
      userId: data.userId,
      age: data.age,
      grade: data.grade,
      gender: data.gender,
    },
  });
}

/**
 * Get student by user ID
 */
export async function getStudentByUserId(
  prisma: PrismaClient,
  userId: string,
): Promise<Student | null> {
  return prisma.student.findUnique({
    where: { userId },
  });
}

/**
 * Check if user has completed any test
 */
export async function hasCompletedTest(
  prisma: PrismaClient,
  studentId: string,
): Promise<boolean> {
  const completedSession = await prisma.testSession.findFirst({
    where: {
      studentId,
      status: "COMPLETED",
    },
    select: { id: true },
  });
  return completedSession !== null;
}

/**
 * Get completed test count for student
 */
export async function getCompletedTestCount(
  prisma: PrismaClient,
  studentId: string,
): Promise<number> {
  return prisma.testSession.count({
    where: {
      studentId,
      status: "COMPLETED",
    },
  });
}

// ============================================================================
// Parent Functions
// ============================================================================

/**
 * Create parent profile for existing user
 */
export async function createParent(
  prisma: PrismaClient,
  data: CreateParentData,
): Promise<Parent> {
  return prisma.parent.create({
    data: {
      userId: data.userId,
      email: data.email,
    },
  });
}

/**
 * Get parent by user ID
 */
export async function getParentByUserId(
  prisma: PrismaClient,
  userId: string,
): Promise<Parent | null> {
  return prisma.parent.findUnique({
    where: { userId },
  });
}

/**
 * Update parent email
 */
export async function updateParentEmail(
  prisma: PrismaClient,
  parentId: string,
  email: string,
  emailVerified = false,
): Promise<Parent> {
  return prisma.parent.update({
    where: { id: parentId },
    data: { email, emailVerified },
  });
}

// ============================================================================
// Role Functions
// ============================================================================

/**
 * Get user role (student/parent/null)
 */
export async function getUserRole(
  prisma: PrismaClient,
  userId: string,
): Promise<"student" | "parent" | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: { select: { id: true } },
      parent: { select: { id: true } },
    },
  });

  if (!user) return null;
  if (user.student) return "student";
  if (user.parent) return "parent";
  return null;
}

/**
 * Check if user exists
 */
export async function userExists(
  prisma: PrismaClient,
  telegramId: bigint,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    select: { id: true },
  });
  return user !== null;
}

/**
 * Quiz Service for SkillTree Bot
 *
 * Handles quiz session management:
 * - Session creation and retrieval
 * - Answer persistence
 * - Question loading from database
 * - Progress tracking
 */

import type {
  PrismaClient,
  TestSession,
  Question as PrismaQuestion,
} from "@skilltree/database";
import type { Question, RIASECScores } from "@skilltree/shared";
import {
  TOTAL_QUESTIONS,
  getProgressInfo,
  getQuestionIdByStep,
  formatProgressString,
} from "../content/questions";
import { logger } from "../utils/logger";

// ============================================================================
// Types
// ============================================================================

export interface QuizSessionData {
  id: string;
  studentId: string;
  currentStep: number;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  answers: Record<string, string>; // questionId -> answerValue
  startedAt: Date;
  updatedAt: Date;
}

export interface AnswerData {
  questionId: string;
  value: string;
  scores?: RIASECScores;
}

// ============================================================================
// Constants
// ============================================================================

const RETAKE_COOLDOWN_DAYS = 7;
const MAX_COMPLETED_TESTS = 3;

// ============================================================================
// Types for Retake Policy
// ============================================================================

export interface RetakePolicyError {
  type: "COOLDOWN" | "MAX_TESTS_REACHED";
  message: string;
  daysRemaining?: number;
  completedTests?: number;
}

export interface StartSessionResult {
  success: true;
  session: QuizSessionData;
}

export interface StartSessionError {
  success: false;
  error: RetakePolicyError;
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Validate retake policy for student
 * - At least 7 days since last COMPLETED test
 * - Maximum 3 COMPLETED tests total
 */
export async function validateRetakePolicy(
  prisma: PrismaClient,
  studentId: string,
): Promise<RetakePolicyError | null> {
  // Count total completed tests
  const completedTestsCount = await prisma.testSession.count({
    where: {
      studentId,
      status: "COMPLETED",
    },
  });

  if (completedTestsCount >= MAX_COMPLETED_TESTS) {
    return {
      type: "MAX_TESTS_REACHED",
      message: `Ты уже прошёл максимальное количество тестов (${MAX_COMPLETED_TESTS}). Для дополнительных попыток обратись в поддержку @skilltree_support`,
      completedTests: completedTestsCount,
    };
  }

  // Find last completed test
  const lastCompletedSession = await prisma.testSession.findFirst({
    where: {
      studentId,
      status: "COMPLETED",
    },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });

  if (lastCompletedSession?.completedAt) {
    const daysSinceLastTest = Math.floor(
      (Date.now() - lastCompletedSession.completedAt.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysSinceLastTest < RETAKE_COOLDOWN_DAYS) {
      const daysRemaining = RETAKE_COOLDOWN_DAYS - daysSinceLastTest;
      return {
        type: "COOLDOWN",
        message: `Ты можешь пройти тест повторно через ${daysRemaining} ${getDaysWord(daysRemaining)}. Отдохни и вернись позже!`,
        daysRemaining,
      };
    }
  }

  return null;
}

/**
 * Start a new quiz session for a student
 * Validates retake policy before creating session
 */
export async function startSession(
  prisma: PrismaClient,
  studentId: string,
): Promise<StartSessionResult | StartSessionError> {
  // Validate retake policy
  const policyError = await validateRetakePolicy(prisma, studentId);
  if (policyError) {
    logger.info(
      { studentId, errorType: policyError.type },
      "Retake policy validation failed",
    );
    return { success: false, error: policyError };
  }

  const session = await prisma.testSession.create({
    data: {
      studentId,
      status: "IN_PROGRESS",
      currentStep: 0,
      answeredJSON: {},
    },
  });

  logger.info({ sessionId: session.id, studentId }, "Quiz session started");

  return { success: true, session: mapSessionToData(session) };
}

/**
 * Get Russian word for "day(s)" with correct declension
 */
function getDaysWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return "дней";
  }
  if (lastDigit === 1) {
    return "день";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "дня";
  }
  return "дней";
}

/**
 * Get active session for a student
 */
export async function getActiveSession(
  prisma: PrismaClient,
  studentId: string,
): Promise<QuizSessionData | null> {
  const session = await prisma.testSession.findFirst({
    where: {
      studentId,
      status: "IN_PROGRESS",
    },
    orderBy: { updatedAt: "desc" },
  });

  return session ? mapSessionToData(session) : null;
}

/**
 * Get session by ID
 */
export async function getSessionById(
  prisma: PrismaClient,
  sessionId: string,
): Promise<QuizSessionData | null> {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
  });

  return session ? mapSessionToData(session) : null;
}

/**
 * Update session step
 */
export async function updateSessionStep(
  prisma: PrismaClient,
  sessionId: string,
  step: number,
): Promise<void> {
  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      currentStep: step,
      updatedAt: new Date(),
    },
  });
}

/**
 * Mark session as completed
 */
export async function completeSession(
  prisma: PrismaClient,
  sessionId: string,
): Promise<TestSession> {
  const session = await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  logger.info({ sessionId }, "Quiz session completed");
  return session;
}

/**
 * Mark session as abandoned
 */
export async function abandonSession(
  prisma: PrismaClient,
  sessionId: string,
): Promise<void> {
  await prisma.testSession.update({
    where: { id: sessionId },
    data: { status: "ABANDONED" },
  });

  logger.info({ sessionId }, "Quiz session abandoned");
}

// ============================================================================
// Answer Management
// ============================================================================

/**
 * Save answer for current question
 * Returns the next step number
 */
export async function saveAnswer(
  prisma: PrismaClient,
  sessionId: string,
  answer: AnswerData,
): Promise<number> {
  // Get current session
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Update answers JSON
  const currentAnswers = (session.answeredJSON as Record<string, string>) || {};
  const updatedAnswers = {
    ...currentAnswers,
    [answer.questionId]: answer.value,
  };

  // Calculate next step
  const nextStep = session.currentStep + 1;
  const isComplete = nextStep >= TOTAL_QUESTIONS;

  // Update session
  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      answeredJSON: updatedAnswers,
      currentStep: nextStep,
      updatedAt: new Date(),
      ...(isComplete ? { status: "COMPLETED", completedAt: new Date() } : {}),
    },
  });

  // Create Answer record for detailed tracking
  await prisma.answer.upsert({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId: answer.questionId,
      },
    },
    update: {
      answerText: answer.value,
      answeredAt: new Date(),
    },
    create: {
      sessionId,
      questionId: answer.questionId,
      answerText: answer.value,
    },
  });

  logger.debug(
    { sessionId, questionId: answer.questionId, nextStep },
    "Answer saved",
  );

  return nextStep;
}

/**
 * Get all answers for a session
 */
export async function getSessionAnswers(
  prisma: PrismaClient,
  sessionId: string,
): Promise<Record<string, string>> {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    select: { answeredJSON: true },
  });

  return (session?.answeredJSON as Record<string, string>) || {};
}

// ============================================================================
// Question Loading
// ============================================================================

/**
 * Get question by ID from database
 */
export async function getQuestionById(
  prisma: PrismaClient,
  questionId: string,
): Promise<Question | null> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: { orderBy: { order: "asc" } } },
  });

  if (!question) return null;

  return mapPrismaQuestionToQuestion(question);
}

/**
 * Get question for current step
 */
export async function getQuestionForStep(
  prisma: PrismaClient,
  step: number,
): Promise<Question | null> {
  const questionId = getQuestionIdByStep(step);
  if (!questionId) return null;

  return getQuestionById(prisma, questionId);
}

/**
 * Get all questions for a section
 */
export async function getQuestionsForSection(
  prisma: PrismaClient,
  section: number,
): Promise<Question[]> {
  const questions = await prisma.question.findMany({
    where: { sectionNumber: section },
    include: { options: { orderBy: { order: "asc" } } },
    orderBy: { orderIndex: "asc" },
  });

  return questions.map(mapPrismaQuestionToQuestion);
}

// ============================================================================
// Progress Tracking
// ============================================================================

/**
 * Get formatted progress for display
 */
export function getProgress(step: number): {
  text: string;
  info: ReturnType<typeof getProgressInfo>;
} {
  return {
    text: formatProgressString(step),
    info: getProgressInfo(step),
  };
}

/**
 * Check if current step completes a section
 */
export function isEndOfSection(step: number): boolean {
  return getProgressInfo(step).isLastInSection;
}

/**
 * Check if quiz is complete
 */
export function isQuizComplete(step: number): boolean {
  return step >= TOTAL_QUESTIONS;
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapSessionToData(session: TestSession): QuizSessionData {
  return {
    id: session.id,
    studentId: session.studentId,
    currentStep: session.currentStep,
    status: session.status as QuizSessionData["status"],
    answers: (session.answeredJSON as Record<string, string>) || {},
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
  };
}

function mapPrismaQuestionToQuestion(
  q: PrismaQuestion & {
    options: Array<{
      text: string;
      value: string;
      scores: unknown;
      order: number;
    }>;
  },
): Question {
  // Parse ratingRange from JSON if present
  const ratingRange = q.ratingRange as {
    min: number;
    max: number;
    labels: { min: string; max: string };
  } | null;

  return {
    id: q.id,
    text: q.text,
    type: mapQuestionType(q.questionType),
    section: q.sectionNumber,
    orderIndex: q.orderIndex,
    difficulty: q.difficulty,
    primaryDimension: q.primaryDimension as Question["primaryDimension"],
    options: q.options.map((opt) => ({
      text: opt.text,
      value: opt.value,
      scores: opt.scores as RIASECScores,
    })),
    isEasterEgg: q.isEasterEgg,
    hint: q.hint ?? undefined,
    ratingRange: ratingRange ?? undefined,
  };
}

function mapQuestionType(prismaType: string): Question["type"] {
  switch (prismaType) {
    case "MULTIPLE_CHOICE":
      return "MULTIPLE_CHOICE";
    case "RATING_SCALE":
      return "RATING";
    case "BINARY_CHOICE":
      return "BINARY";
    case "OPEN_ENDED":
      return "OPEN_TEXT";
    default:
      return "MULTIPLE_CHOICE";
  }
}

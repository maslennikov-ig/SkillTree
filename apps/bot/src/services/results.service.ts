/**
 * Results Service for SkillTree Bot
 *
 * Handles RIASEC profile calculation and career matching:
 * - calculateRIASECProfile: Aggregate scores from quiz answers
 * - matchCareers: Pearson correlation matching per O*NET standard
 * - getArchetype: Map top-2 dimensions to personality type
 * - normalizeScores: Z-score normalization against teen norms
 */

import crypto from "crypto";
import type { PrismaClient } from "@skilltree/database";
import type { RIASECScores, RIASECType, CareerMatch } from "@skilltree/shared";
import { RIASEC_NORMS, ARCHETYPES } from "@skilltree/shared";
import { logger } from "../utils/logger";

// ============================================================================
// Types
// ============================================================================

export interface RIASECProfile {
  rawScores: RIASECScores;
  normalizedScores: RIASECScores;
  topDimensions: [RIASECType, RIASECType, RIASECType];
  archetype: {
    code: string;
    name: string;
    emoji: string;
    description: string;
  };
}

export interface TestResults {
  sessionId: string;
  studentId: string;
  profile: RIASECProfile;
  careerMatches: CareerMatch[];
  completedAt: Date;
  shareToken?: string | null;
}

/**
 * Generate a URL-safe share token (12 chars)
 */
function generateShareToken(): string {
  return crypto.randomBytes(9).toString("base64url");
}

// ============================================================================
// RIASEC Score Calculation
// ============================================================================

/**
 * Calculate RIASEC profile from quiz session answers
 * Aggregates scores from all answered questions
 */
export async function calculateRIASECProfile(
  prisma: PrismaClient,
  sessionId: string,
): Promise<RIASECProfile> {
  const log = logger.child({ fn: "calculateRIASECProfile", sessionId });

  // Get session with all answers
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        include: {
          question: {
            include: {
              options: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Initialize raw scores
  const rawScores: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  // Aggregate scores from answers
  for (const answer of session.answers) {
    const question = answer.question;

    // Find the selected option to get its scores
    const selectedOption = question.options.find(
      (opt) => opt.value === answer.answerText,
    );

    if (selectedOption?.scores) {
      const optionScores = selectedOption.scores as unknown as RIASECScores;
      rawScores.R += optionScores.R || 0;
      rawScores.I += optionScores.I || 0;
      rawScores.A += optionScores.A || 0;
      rawScores.S += optionScores.S || 0;
      rawScores.E += optionScores.E || 0;
      rawScores.C += optionScores.C || 0;
    } else if (question.questionType === "RATING_SCALE") {
      // For rating questions, add score to primary dimension
      const rating = parseInt(answer.answerText, 10) || 0;
      const dimension = question.primaryDimension as RIASECType;
      rawScores[dimension] += rating;
    }
  }

  log.debug({ rawScores }, "Raw scores calculated");

  // Normalize scores against teen population norms
  const normalizedScores = normalizeScores(rawScores);

  // Get top 3 dimensions
  const topDimensions = getTopDimensions(normalizedScores);

  // Get archetype based on top 2 dimensions
  const archetype = getArchetype(topDimensions[0], topDimensions[1]);

  log.info(
    { topDimensions, archetype: archetype.code },
    "RIASEC profile calculated",
  );

  return {
    rawScores,
    normalizedScores,
    topDimensions,
    archetype,
  };
}

/**
 * Normalize raw scores using Z-score normalization
 * Converts to percentile-like scale (0-100)
 */
export function normalizeScores(rawScores: RIASECScores): RIASECScores {
  const normalized: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  const dimensions: RIASECType[] = ["R", "I", "A", "S", "E", "C"];

  for (const dim of dimensions) {
    const norms = RIASEC_NORMS[dim];
    // Z-score calculation
    const zScore = (rawScores[dim] - norms.mean) / norms.sd;
    // Convert to 0-100 scale (assuming normal distribution)
    // Z-score of -3 to +3 maps to ~0 to ~100
    const percentile = Math.round(50 + zScore * 16.67);
    normalized[dim] = Math.max(0, Math.min(100, percentile));
  }

  return normalized;
}

/**
 * Get top 3 dimensions sorted by score
 */
export function getTopDimensions(
  scores: RIASECScores,
): [RIASECType, RIASECType, RIASECType] {
  const dimensions: RIASECType[] = ["R", "I", "A", "S", "E", "C"];
  const sorted = [...dimensions].sort((a, b) => scores[b] - scores[a]);
  // sorted always has 6 elements, first 3 are guaranteed
  return [
    sorted[0] as RIASECType,
    sorted[1] as RIASECType,
    sorted[2] as RIASECType,
  ];
}

// ============================================================================
// Archetype Detection
// ============================================================================

/**
 * Get personality archetype based on top 2 dimensions
 * Uses alphabetical ordering for consistent lookup
 */
export function getArchetype(
  first: RIASECType,
  second: RIASECType,
): {
  code: string;
  name: string;
  emoji: string;
  description: string;
} {
  // Sort alphabetically for consistent lookup (e.g., IR -> IR, not RI)
  const code = [first, second].sort().join("");

  // Try direct lookup
  if (ARCHETYPES[code]) {
    return { code, ...ARCHETYPES[code] };
  }

  // Try reverse order
  const reverseCode = [second, first].sort().join("");
  if (ARCHETYPES[reverseCode]) {
    return { code: reverseCode, ...ARCHETYPES[reverseCode] };
  }

  // Fallback to first dimension only
  return {
    code: first,
    name: getDefaultArchetypeName(first),
    emoji: getDefaultArchetypeEmoji(first),
    description: getDefaultArchetypeDescription(first),
  };
}

function getDefaultArchetypeName(dim: RIASECType): string {
  const names: Record<RIASECType, string> = {
    R: "Практик",
    I: "Исследователь",
    A: "Творец",
    S: "Социальный помощник",
    E: "Предприниматель",
    C: "Организатор",
  };
  return names[dim] ?? "Неизвестный тип";
}

function getDefaultArchetypeEmoji(dim: RIASECType): string {
  const emojis: Record<RIASECType, string> = {
    R: "🔧",
    I: "🔬",
    A: "🎨",
    S: "🤝",
    E: "💼",
    C: "📊",
  };
  return emojis[dim] ?? "❓";
}

function getDefaultArchetypeDescription(dim: RIASECType): string {
  const descriptions: Record<RIASECType, string> = {
    R: "Любит работать руками и создавать вещи",
    I: "Любит разбираться в сложных задачах",
    A: "Выражает себя через творчество",
    S: "Любит помогать и общаться с людьми",
    E: "Любит убеждать и управлять",
    C: "Любит порядок и организованность",
  };
  return descriptions[dim] ?? "Уникальная личность";
}

// ============================================================================
// Career Matching (Pearson Correlation)
// ============================================================================

/**
 * Match student profile to careers using Pearson correlation
 * Returns sorted list of career matches
 */
export async function matchCareers(
  prisma: PrismaClient,
  profile: RIASECProfile,
  limit = 10,
): Promise<CareerMatch[]> {
  const log = logger.child({ fn: "matchCareers" });

  // Get all careers
  const careers = await prisma.career.findMany();

  if (careers.length === 0) {
    log.warn("No careers found in database");
    return [];
  }

  // Calculate correlation with each career
  const matches: CareerMatch[] = [];

  for (const career of careers) {
    const careerProfile = career.riasecProfile as unknown as RIASECScores;

    // Calculate Pearson correlation
    const correlation = calculatePearsonCorrelation(
      profile.normalizedScores,
      careerProfile,
    );

    // Convert correlation to match percentage (0-100)
    const matchPercentage = Math.round((correlation + 1) * 50);

    matches.push({
      careerId: career.id,
      correlation,
      matchPercentage,
      matchCategory: getMatchCategory(correlation),
    });
  }

  // Sort by correlation (descending) and limit
  matches.sort((a, b) => b.correlation - a.correlation);

  log.debug({ matchCount: matches.length }, "Career matches calculated");

  return matches.slice(0, limit);
}

/**
 * Calculate Pearson correlation coefficient between two RIASEC profiles
 * Returns value between -1 (inverse) and 1 (perfect match)
 */
export function calculatePearsonCorrelation(
  profile1: RIASECScores,
  profile2: RIASECScores,
): number {
  const dimensions: RIASECType[] = ["R", "I", "A", "S", "E", "C"];

  // Extract values
  const x = dimensions.map((d) => profile1[d]);
  const y = dimensions.map((d) => profile2[d]);

  const n = x.length;

  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate Pearson correlation
  let numerator = 0;
  let sumSquaredX = 0;
  let sumSquaredY = 0;

  for (let i = 0; i < n; i++) {
    const xVal = x[i] ?? 0;
    const yVal = y[i] ?? 0;
    const diffX = xVal - meanX;
    const diffY = yVal - meanY;
    numerator += diffX * diffY;
    sumSquaredX += diffX * diffX;
    sumSquaredY += diffY * diffY;
  }

  const denominator = Math.sqrt(sumSquaredX * sumSquaredY);

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Categorize match quality based on correlation
 */
export function getMatchCategory(
  correlation: number,
): CareerMatch["matchCategory"] {
  if (correlation >= 0.7) return "Best Fit";
  if (correlation >= 0.4) return "Great Fit";
  if (correlation >= 0.1) return "Good Fit";
  return "Poor Fit";
}

// ============================================================================
// Results Persistence
// ============================================================================

/**
 * Save test results to database
 * Uses actual TestResult schema: sessionId, riasecProfile, topCareers, personalityType, hollandCode
 * Returns the shareToken for sharing results
 */
export async function saveTestResults(
  prisma: PrismaClient,
  sessionId: string,
  profile: RIASECProfile,
  careerMatches: CareerMatch[],
): Promise<{ shareToken: string }> {
  const log = logger.child({ fn: "saveTestResults", sessionId });

  // Build Holland code from top 3 dimensions (e.g., "RIC")
  const hollandCode = profile.topDimensions.join("");

  // Generate unique share token for public results page
  const shareToken = generateShareToken();

  // Create TestResult record matching actual schema
  await prisma.testResult.create({
    data: {
      sessionId,
      riasecProfile: profile.normalizedScores as unknown as Record<
        string,
        number
      >,
      topCareers: careerMatches.slice(0, 5).map((m) => ({
        careerId: m.careerId,
        correlation: m.correlation,
        matchPercentage: m.matchPercentage,
        matchCategory: m.matchCategory,
      })),
      personalityType: profile.archetype.name,
      hollandCode,
      shareToken,
    },
  });

  log.info(
    {
      hollandCode,
      personalityType: profile.archetype.name,
      topCareer: careerMatches[0]?.careerId,
      shareToken,
    },
    "Test results saved",
  );

  return { shareToken };
}

/**
 * Get stored results for a session
 */
export async function getTestResults(
  prisma: PrismaClient,
  sessionId: string,
): Promise<TestResults | null> {
  const result = await prisma.testResult.findUnique({
    where: { sessionId },
    include: {
      session: true,
    },
  });

  if (!result) {
    return null;
  }

  const riasecProfile = result.riasecProfile as unknown as RIASECScores;

  // Parse Holland code to get dimensions
  const hollandCode = result.hollandCode;
  const dim1 = (hollandCode[0] || "R") as RIASECType;
  const dim2 = (hollandCode[1] || "I") as RIASECType;
  const dim3 = (hollandCode[2] || "A") as RIASECType;

  return {
    sessionId: result.sessionId,
    studentId: result.session.studentId,
    profile: {
      rawScores: riasecProfile, // We only store normalized
      normalizedScores: riasecProfile,
      topDimensions: [dim1, dim2, dim3],
      archetype: getArchetype(dim1, dim2),
    },
    careerMatches: (result.topCareers as unknown as CareerMatch[]) || [],
    completedAt: result.session.completedAt || result.createdAt,
    shareToken: result.shareToken,
  };
}

/**
 * Extended results interface with career details for inline queries
 */
export interface TestResultsWithCareers extends TestResults {
  careers: Array<{
    id: string;
    title: string;
    titleRu: string | null;
  }>;
}

/**
 * Get results optimized for inline queries (includes top 3 career details)
 * Reduces N+1 queries by including career data in single response
 */
export async function getTestResultsForInline(
  prisma: PrismaClient,
  sessionId: string,
): Promise<TestResultsWithCareers | null> {
  const result = await prisma.testResult.findUnique({
    where: { sessionId },
    include: {
      session: true,
    },
  });

  if (!result) {
    return null;
  }

  const riasecProfile = result.riasecProfile as unknown as RIASECScores;
  const careerMatches = (result.topCareers as unknown as CareerMatch[]) || [];

  // Fetch top 3 careers in single query (optimization)
  const careerIds = careerMatches.slice(0, 3).map((m) => m.careerId);
  const careers = await prisma.career.findMany({
    where: { id: { in: careerIds } },
    select: { id: true, title: true, titleRu: true },
  });

  // Parse Holland code to get dimensions
  const hollandCode = result.hollandCode;
  const dim1 = (hollandCode[0] || "R") as RIASECType;
  const dim2 = (hollandCode[1] || "I") as RIASECType;
  const dim3 = (hollandCode[2] || "A") as RIASECType;

  return {
    sessionId: result.sessionId,
    studentId: result.session.studentId,
    profile: {
      rawScores: riasecProfile,
      normalizedScores: riasecProfile,
      topDimensions: [dim1, dim2, dim3],
      archetype: getArchetype(dim1, dim2),
    },
    careerMatches,
    completedAt: result.session.completedAt || result.createdAt,
    shareToken: result.shareToken,
    careers,
  };
}

/**
 * Get results by share token (for public sharing)
 */
export async function getResultsByShareToken(
  prisma: PrismaClient,
  shareToken: string,
): Promise<TestResults | null> {
  const result = await prisma.testResult.findUnique({
    where: { shareToken },
    include: {
      session: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    return null;
  }

  const riasecProfile = result.riasecProfile as unknown as RIASECScores;

  // Parse Holland code to get dimensions
  const hollandCode = result.hollandCode;
  const dim1 = (hollandCode[0] || "R") as RIASECType;
  const dim2 = (hollandCode[1] || "I") as RIASECType;
  const dim3 = (hollandCode[2] || "A") as RIASECType;

  return {
    sessionId: result.sessionId,
    studentId: result.session.studentId,
    profile: {
      rawScores: riasecProfile,
      normalizedScores: riasecProfile,
      topDimensions: [dim1, dim2, dim3],
      archetype: getArchetype(dim1, dim2),
    },
    careerMatches: (result.topCareers as unknown as CareerMatch[]) || [],
    completedAt: result.session.completedAt || result.createdAt,
    shareToken: result.shareToken,
  };
}

/**
 * Mirror Service for SkillTree Bot
 *
 * Handles the dynamic "Mirror" question (Q33) that analyzes
 * the student's previous 32 answers and shows a personalized
 * insight about their RIASEC pattern.
 *
 * Features:
 * - Pattern analysis from Q1-Q32 answers
 * - Dynamic question generation with 5 options
 * - "Detective" badge eligibility for correct guesses
 */

import type { PrismaClient } from "@skilltree/database";
import type { RIASECScores, RIASECType } from "@skilltree/shared";
import { logger } from "../utils/logger";

// ============================================================================
// Types
// ============================================================================

/**
 * Analysis result from the first 32 questions
 */
export interface PatternAnalysis {
  /** Highest scoring RIASEC dimension */
  dominant: RIASECType;
  /** Second highest scoring RIASEC dimension */
  secondary: RIASECType;
  /** Two-letter pattern code (e.g., "IA") */
  patternCode: string;
  /** Raw RIASEC scores from Q1-Q32 */
  scores: RIASECScores;
  /** Number of questions answered (should be 32) */
  answeredCount: number;
}

/**
 * Single option for the mirror question
 */
export interface MirrorOption {
  /** Display text for the option (Russian description) */
  text: string;
  /** Value to store if selected (pattern code) */
  value: string;
  /** Two-letter pattern code */
  patternCode: string;
  /** RIASEC scores associated with this pattern */
  scores: RIASECScores;
}

/**
 * Generated mirror question with options
 */
export interface MirrorQuestion {
  /** Question text in Russian */
  text: string;
  /** Shuffled options (5 total: correct + 4 distractors) */
  options: MirrorOption[];
  /** The correct pattern code for this student */
  correctPattern: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * All 15 unique RIASEC pair combinations with Russian descriptions.
 * Keys are alphabetically sorted (e.g., "AI" not "IA") for consistent lookup.
 */
export const RIASEC_DESCRIPTIONS: Record<string, string> = {
  // RI/IR: Realistic + Investigative
  IR: "Разбираться в сложном и делать руками",
  // IA/AI: Investigative + Artistic
  AI: "Исследовать и создавать новое",
  // AS/SA: Artistic + Social
  AS: "Творить и помогать людям",
  // SE/ES: Social + Enterprising
  ES: "Общаться и вести за собой",
  // EC/CE: Enterprising + Conventional
  CE: "Управлять и организовывать",
  // CR/RC: Conventional + Realistic
  CR: "Структурировать и воплощать",
  // RA/AR: Realistic + Artistic
  AR: "Мастерить и выражать себя",
  // IS/SI: Investigative + Social
  IS: "Анализировать и объяснять",
  // AE/EA: Artistic + Enterprising
  AE: "Придумывать и продвигать",
  // SC/CS: Social + Conventional
  CS: "Помогать и систематизировать",
  // RE/ER: Realistic + Enterprising
  ER: "Действовать и влиять",
  // IC/CI: Investigative + Conventional
  CI: "Исследовать и систематизировать",
  // AC/CA: Artistic + Conventional
  AC: "Творить с порядком",
  // SR/RS: Social + Realistic
  RS: "Помогать практично",
  // IE/EI: Investigative + Enterprising
  EI: "Анализировать и убеждать",
};

/**
 * Human-readable Russian names with emojis for each pattern.
 * Keys are alphabetically sorted for consistent lookup.
 */
export const RIASEC_PATTERN_NAMES: Record<string, string> = {
  IR: "🔬 Разбираться в сложном и делать руками",
  AI: "🧠 Исследовать и создавать новое",
  AS: "🎨 Творить и помогать людям",
  ES: "🤝 Общаться и вести за собой",
  CE: "💼 Управлять и организовывать",
  CR: "📊 Структурировать и воплощать",
  AR: "🛠 Мастерить и выражать себя",
  IS: "🔍 Анализировать и объяснять",
  AE: "✨ Придумывать и продвигать",
  CS: "👥 Помогать и систематизировать",
  ER: "⚡ Действовать и влиять",
  CI: "🔢 Исследовать и систематизировать",
  AC: "🎭 Творить с порядком",
  RS: "🏥 Помогать практично",
  EI: "💡 Анализировать и убеждать",
};

/**
 * RIASEC score profiles for each pattern combination.
 * Used for assigning scores when a pattern option is selected.
 */
const PATTERN_SCORES: Record<string, RIASECScores> = {
  IR: { R: 3, I: 3, A: 0, S: 0, E: 0, C: 0 },
  AI: { R: 0, I: 3, A: 3, S: 0, E: 0, C: 0 },
  AS: { R: 0, I: 0, A: 3, S: 3, E: 0, C: 0 },
  ES: { R: 0, I: 0, A: 0, S: 3, E: 3, C: 0 },
  CE: { R: 0, I: 0, A: 0, S: 0, E: 3, C: 3 },
  CR: { R: 3, I: 0, A: 0, S: 0, E: 0, C: 3 },
  AR: { R: 3, I: 0, A: 3, S: 0, E: 0, C: 0 },
  IS: { R: 0, I: 3, A: 0, S: 3, E: 0, C: 0 },
  AE: { R: 0, I: 0, A: 3, S: 0, E: 3, C: 0 },
  CS: { R: 0, I: 0, A: 0, S: 3, E: 0, C: 3 },
  ER: { R: 3, I: 0, A: 0, S: 0, E: 3, C: 0 },
  CI: { R: 0, I: 3, A: 0, S: 0, E: 0, C: 3 },
  AC: { R: 0, I: 0, A: 3, S: 0, E: 0, C: 3 },
  RS: { R: 3, I: 0, A: 0, S: 3, E: 0, C: 0 },
  EI: { R: 0, I: 3, A: 0, S: 0, E: 3, C: 0 },
};

/**
 * Mirror question text template (Russian)
 */
const MIRROR_QUESTION_TEXT = `🔍 **Секретный вопрос!**

Мы проанализировали твои 32 ответа и заметили интересный профиль.

Попробуй угадать — что тебе ближе всего по твоим же ответам?

_Если угадаешь свой реальный профиль — получишь значок «Детектив» 🕵️_`;

// ============================================================================
// Helper Functions
// ============================================================================

/** Valid RIASEC dimension characters */
const VALID_RIASEC_CHARS = ["R", "I", "A", "S", "E", "C"] as const;

/**
 * Normalize pattern code to alphabetically sorted form.
 * E.g., "IA" -> "AI", "RI" -> "IR"
 *
 * @param code - Two-letter pattern code
 * @returns Alphabetically sorted pattern code
 * @throws Error if code is invalid (not 2 chars or invalid RIASEC characters)
 */
function normalizePatternCode(code: string): string {
  if (!code || code.length !== 2) {
    logger.error({ code }, "Invalid pattern code length");
    throw new Error(`Invalid pattern code: "${code}" (expected 2 characters)`);
  }

  const chars = code.toUpperCase().split("");

  // Validate that both characters are valid RIASEC types
  for (const char of chars) {
    if (!VALID_RIASEC_CHARS.includes(char as RIASECType)) {
      logger.error(
        { code, invalidChar: char },
        "Invalid RIASEC character in pattern",
      );
      throw new Error(
        `Invalid RIASEC character "${char}" in pattern: "${code}"`,
      );
    }
  }

  return chars.sort().join("");
}

/**
 * Check if two pattern codes are equivalent (order-independent).
 * E.g., "IA" === "AI", "RI" === "IR"
 *
 * @param a - First pattern code
 * @param b - Second pattern code
 * @returns True if patterns are equivalent
 */
export function isSamePattern(a: string, b: string): boolean {
  return normalizePatternCode(a) === normalizePatternCode(b);
}

/**
 * Get RIASEC scores for a given pattern code.
 *
 * @param code - Two-letter pattern code (e.g., "IA", "AI")
 * @returns RIASECScores object with appropriate values
 */
export function getScoresForPattern(code: string): RIASECScores {
  const normalized = normalizePatternCode(code);
  return PATTERN_SCORES[normalized] || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
}

/**
 * Get human-readable Russian name for a pattern code.
 *
 * @param code - Two-letter pattern code (e.g., "IA", "AI")
 * @returns Russian description with emoji
 */
export function getPatternName(code: string): string {
  const normalized = normalizePatternCode(code);
  return RIASEC_PATTERN_NAMES[normalized] || `❓ Неизвестный паттерн (${code})`;
}

/**
 * Validate that an object contains valid RIASEC scores (all numeric).
 * Returns validated scores or null if invalid.
 *
 * @param scores - Unknown object to validate
 * @returns Validated RIASECScores or null
 */
function validateRIASECScores(scores: unknown): RIASECScores | null {
  if (!scores || typeof scores !== "object") return null;
  const s = scores as Record<string, unknown>;

  // Check all required dimensions exist and are numbers
  const dimensions: RIASECType[] = ["R", "I", "A", "S", "E", "C"];
  for (const dim of dimensions) {
    if (typeof s[dim] !== "number" && s[dim] !== undefined && s[dim] !== null) {
      return null;
    }
  }

  return {
    R: typeof s.R === "number" ? s.R : 0,
    I: typeof s.I === "number" ? s.I : 0,
    A: typeof s.A === "number" ? s.A : 0,
    S: typeof s.S === "number" ? s.S : 0,
    E: typeof s.E === "number" ? s.E : 0,
    C: typeof s.C === "number" ? s.C : 0,
  };
}

/**
 * Get top 2 RIASEC dimensions from scores.
 *
 * @param scores - RIASECScores object
 * @returns Tuple of [dominant, secondary] dimensions
 */
function getTopTwoDimensions(scores: RIASECScores): [RIASECType, RIASECType] {
  const dimensions: RIASECType[] = ["R", "I", "A", "S", "E", "C"];
  const sorted = [...dimensions].sort((a, b) => scores[b] - scores[a]);
  return [sorted[0] as RIASECType, sorted[1] as RIASECType];
}

/**
 * Fisher-Yates shuffle algorithm for randomizing array.
 *
 * @param array - Array to shuffle (modified in place)
 * @returns Shuffled array
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/**
 * Get 4 distractor patterns that are different from the correct pattern.
 * Tries to select diverse patterns covering different RIASEC combinations.
 *
 * @param correctPattern - The correct pattern to exclude
 * @returns Array of 4 distractor pattern codes
 */
function getDistractorPatterns(correctPattern: string): string[] {
  const normalizedCorrect = normalizePatternCode(correctPattern);
  const allPatterns = Object.keys(PATTERN_SCORES);

  // Remove correct pattern
  const available = allPatterns.filter((p) => p !== normalizedCorrect);

  // Shuffle and take 4
  const shuffled = shuffleArray(available);
  return shuffled.slice(0, 4);
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Analyze the first 32 answers to determine the student's RIASEC pattern.
 *
 * @param prisma - Prisma client instance
 * @param sessionId - Quiz session ID
 * @returns PatternAnalysis with dominant/secondary dimensions and scores
 */
export async function analyzeAnswerPattern(
  prisma: PrismaClient,
  sessionId: string,
): Promise<PatternAnalysis> {
  const log = logger.child({ fn: "analyzeAnswerPattern", sessionId });

  // Get session with answers
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    select: { answeredJSON: true },
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const answeredJSON = (session.answeredJSON as Record<string, string>) || {};

  // Get questions Q1-Q32 with their options
  const questionIds = Array.from({ length: 32 }, (_, i) => `q${i + 1}`);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { options: true },
  });

  // Build question map for efficient lookup
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Initialize scores
  const scores: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  let answeredCount = 0;

  // Aggregate scores from Q1-Q32
  for (const questionId of questionIds) {
    const answerValue = answeredJSON[questionId];
    if (!answerValue) continue;

    const question = questionMap.get(questionId);
    if (!question) continue;

    answeredCount++;

    // Find selected option
    const selectedOption = question.options.find(
      (opt) => opt.value === answerValue,
    );

    if (selectedOption?.scores) {
      // Validate scores at runtime instead of unsafe type assertion
      const validatedScores = validateRIASECScores(selectedOption.scores);
      if (validatedScores) {
        scores.R += validatedScores.R;
        scores.I += validatedScores.I;
        scores.A += validatedScores.A;
        scores.S += validatedScores.S;
        scores.E += validatedScores.E;
        scores.C += validatedScores.C;
      } else {
        log.warn(
          {
            questionId,
            optionValue: selectedOption.value,
            scores: selectedOption.scores,
          },
          "Invalid RIASEC scores format in option, skipping",
        );
      }
    } else if (question.questionType === "RATING_SCALE") {
      // For rating questions, add score to primary dimension
      const rating = parseInt(answerValue, 10) || 0;
      const dimension = question.primaryDimension as RIASECType;
      if (dimension && scores[dimension] !== undefined) {
        scores[dimension] += rating;
      }
    }
  }

  // Validate minimum answered count for reliable analysis
  const MINIMUM_ANSWERS_REQUIRED = 20; // Allow some flexibility, but warn if less than 32
  const EXPECTED_ANSWERS = 32;

  if (answeredCount < MINIMUM_ANSWERS_REQUIRED) {
    log.error(
      {
        answeredCount,
        expected: EXPECTED_ANSWERS,
        minimum: MINIMUM_ANSWERS_REQUIRED,
      },
      "Insufficient answers for pattern analysis",
    );
    throw new Error(
      `Insufficient answers for pattern analysis: ${answeredCount}/${EXPECTED_ANSWERS} (minimum: ${MINIMUM_ANSWERS_REQUIRED})`,
    );
  }

  if (answeredCount < EXPECTED_ANSWERS) {
    log.warn(
      { answeredCount, expected: EXPECTED_ANSWERS },
      "Incomplete answers for mirror question - analysis may be less accurate",
    );
  }

  // Get top 2 dimensions
  const [dominant, secondary] = getTopTwoDimensions(scores);
  const patternCode = `${dominant}${secondary}`;

  log.info(
    { answeredCount, scores, patternCode },
    "Pattern analysis completed",
  );

  return {
    dominant,
    secondary,
    patternCode,
    scores,
    answeredCount,
  };
}

/**
 * Generate the mirror question (Q33) based on student's pattern analysis.
 * Creates 5 options: the correct pattern plus 4 distractors.
 *
 * @param pattern - PatternAnalysis from analyzeAnswerPattern
 * @returns MirrorQuestion with text, shuffled options, and correct pattern
 */
export function generateMirrorQuestion(
  pattern: PatternAnalysis,
): MirrorQuestion {
  const log = logger.child({ fn: "generateMirrorQuestion" });
  const correctPatternNormalized = normalizePatternCode(pattern.patternCode);

  // Get 4 distractor patterns
  const distractors = getDistractorPatterns(pattern.patternCode);

  // Defensive check: ensure all distractors are unique and different from correct
  const uniqueDistractors = [...new Set(distractors)]
    .filter((d) => d !== correctPatternNormalized)
    .slice(0, 4);

  if (uniqueDistractors.length < 4) {
    log.warn(
      { correctPatternNormalized, distractors, uniqueDistractors },
      "Insufficient unique distractors generated - some options may be missing",
    );
  }

  // Create correct option
  const correctOption: MirrorOption = {
    text: getPatternName(correctPatternNormalized),
    value: correctPatternNormalized,
    patternCode: correctPatternNormalized,
    scores: getScoresForPattern(correctPatternNormalized),
  };

  // Create distractor options
  const distractorOptions: MirrorOption[] = uniqueDistractors.map((code) => ({
    text: getPatternName(code),
    value: code,
    patternCode: code,
    scores: getScoresForPattern(code),
  }));

  // Combine and shuffle all options
  const allOptions = [correctOption, ...distractorOptions];
  const shuffledOptions = shuffleArray(allOptions);

  log.debug(
    {
      correctPattern: correctPatternNormalized,
      optionCount: shuffledOptions.length,
    },
    "Mirror question generated",
  );

  return {
    text: MIRROR_QUESTION_TEXT,
    options: shuffledOptions,
    correctPattern: correctPatternNormalized,
  };
}

/**
 * Check if the student's answer to the mirror question matches their actual pattern.
 * Used for awarding the "Detective" badge.
 *
 * @param selectedPattern - Pattern code the student selected
 * @param correctPattern - The actual pattern from their Q1-Q32 answers
 * @returns True if the student correctly identified their pattern
 */
export function checkMirrorAnswer(
  selectedPattern: string,
  correctPattern: string,
): boolean {
  return isSamePattern(selectedPattern, correctPattern);
}

/**
 * Get the mirror question ID constant.
 * Q33 is the mirror question in the quiz flow.
 */
export const MIRROR_QUESTION_ID = "q33";

/**
 * Get the step index for the mirror question (0-indexed).
 * Step 32 corresponds to Q33.
 */
export const MIRROR_QUESTION_STEP = 32;

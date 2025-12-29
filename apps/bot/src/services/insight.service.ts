/**
 * Insight Service for SkillTree Bot
 *
 * Generates personalized "insight teasers" shown after completing sections 2, 3, and 4.
 * These are designed to keep teenagers (14-17 years old) engaged by hinting at
 * their emerging RIASEC profile without revealing final results.
 */

import type { PrismaClient } from "@skilltree/database";
import type { RIASECScores, RIASECType } from "@skilltree/shared";
import { RIASEC_LABELS } from "@skilltree/shared";
import { logger } from "../utils/logger";

// ============================================================================
// Types
// ============================================================================

export interface PartialRIASECScores {
  scores: RIASECScores;
  answeredCount: number;
  topDimensions: RIASECType[];
}

export interface SectionInsight {
  message: string;
  topDimension: RIASECType;
  section: number;
}

// ============================================================================
// Dimension-Specific Insight Templates
// ============================================================================

/**
 * Insight templates organized by section and dimension.
 * Each message is engaging, age-appropriate, and hints at profile without spoilers.
 */
const INSIGHT_TEMPLATES: Record<number, Record<RIASECType, string[]>> = {
  // After Section 2 (questions 12-22): School and learning
  2: {
    R: [
      "Похоже, тебе нравится работать руками! Продолжай — узнаем больше.",
      "Интересно! Ты любишь практические задачи. Впереди ещё много открытий!",
    ],
    I: [
      "Ого, ты явно любишь разбираться в сложных вещах! Продолжай.",
      "Похоже, тебе интересно исследовать и анализировать! Это круто.",
    ],
    A: [
      "Интересно! Ты проявляешь творческие способности. Впереди ещё много открытий!",
      "Кажется, в тебе живёт творческая душа! Продолжай, будет интересно.",
    ],
    S: [
      "Похоже, тебе нравится работать с людьми! Продолжай — узнаем больше.",
      "Ты явно социальный человек! Это здорово, продолжаем.",
    ],
    E: [
      "Чувствуется лидерский потенциал! Продолжай — впереди ещё интереснее.",
      "Ты любишь брать инициативу? Похоже на это! Идём дальше.",
    ],
    C: [
      "Ты ценишь порядок и структуру! Это важное качество. Продолжаем!",
      "Похоже, тебе нравится, когда всё организовано. Интересно!",
    ],
  },
  // After Section 3 (questions 23-33): Work preferences
  3: {
    R: [
      "Твоя любовь к практике всё заметнее! Осталось 2 секции.",
      "Ты точно мастер на все руки! Скоро узнаем, какие профессии тебе подойдут.",
    ],
    I: [
      "Исследовательский дух крепнет! Скоро узнаем, куда он тебя приведёт.",
      "Любопытство — твоя суперсила! Осталось совсем немного.",
    ],
    A: [
      "Творческий потенциал растёт! Интересно, что покажут результаты.",
      "Ты определённо творческая личность! Впереди ещё открытия.",
    ],
    S: [
      "Умение работать с людьми — твоя сильная сторона! Продолжаем.",
      "Ты прирождённый командный игрок! Осталось 2 секции.",
    ],
    E: [
      "Лидерские качества всё ярче! Скоро узнаем, где ты сможешь их применить.",
      "Предпринимательская жилка? Очень похоже! Идём дальше.",
    ],
    C: [
      "Организованность — это про тебя! Осталось немного до результатов.",
      "Ты любишь системный подход! Это ценят во многих профессиях.",
    ],
  },
  // After Section 4 (questions 34-44): Skills and abilities
  4: {
    R: [
      "Уже видно твою склонность к практике! Осталось совсем немного.",
      "Практические навыки — твой конёк! Финишная прямая!",
    ],
    I: [
      "Уже видно твою склонность к исследованиям. Осталось совсем немного!",
      "Аналитический ум — это точно про тебя! Последний рывок!",
    ],
    A: [
      "Творческий потенциал раскрыт! Осталась последняя секция.",
      "Креативность зашкаливает! Скоро узнаешь свои идеальные профессии.",
    ],
    S: [
      "Социальные навыки на высоте! Последний рывок — и результаты!",
      "Ты умеешь работать с людьми! Финишная прямая.",
    ],
    E: [
      "Лидерский потенциал раскрыт! Осталась одна секция.",
      "Ты прирождённый лидер! Скоро узнаешь, где это пригодится.",
    ],
    C: [
      "Системный подход — твоя фишка! Осталась последняя секция.",
      "Организаторские способности на высоте! Финиш близко!",
    ],
  },
};

/**
 * Fallback insights when score differences are minimal (balanced profile)
 */
const BALANCED_INSIGHTS: Record<number, string[]> = {
  2: [
    "Интересный профиль вырисовывается! У тебя разносторонние интересы.",
    "Ты многогранная личность! Продолжай — узнаем больше.",
  ],
  3: [
    "Разносторонние таланты — это круто! Скоро увидим полную картину.",
    "У тебя много сильных сторон! Осталось 2 секции до результатов.",
  ],
  4: [
    "Твой профиль уникален! Осталась последняя секция.",
    "Разноплановые способности — это здорово! Финиш близко!",
  ],
};

// ============================================================================
// Partial RIASEC Calculation
// ============================================================================

/**
 * Calculate partial RIASEC scores from answers collected so far.
 * Used to generate personalized insights between sections.
 */
export async function calculatePartialRIASEC(
  prisma: PrismaClient,
  sessionId: string,
): Promise<PartialRIASECScores> {
  const log = logger.child({ fn: "calculatePartialRIASEC", sessionId });

  // Get session with all answers so far
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

  // Initialize scores
  const scores: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  let answeredCount = 0;

  // Aggregate scores from answers
  for (const answer of session.answers) {
    const question = answer.question;

    // Find the selected option to get its scores
    const selectedOption = question.options.find(
      (opt) => opt.value === answer.answerText,
    );

    if (selectedOption?.scores) {
      const optionScores = selectedOption.scores as unknown as RIASECScores;
      scores.R += optionScores.R || 0;
      scores.I += optionScores.I || 0;
      scores.A += optionScores.A || 0;
      scores.S += optionScores.S || 0;
      scores.E += optionScores.E || 0;
      scores.C += optionScores.C || 0;
      answeredCount++;
    } else if (question.questionType === "RATING_SCALE") {
      // For rating questions, add score to primary dimension
      const rating = parseInt(answer.answerText, 10) || 0;
      const dimension = question.primaryDimension as RIASECType;
      scores[dimension] += rating;
      answeredCount++;
    }
  }

  // Get top dimensions sorted by score
  const dimensions: RIASECType[] = ["R", "I", "A", "S", "E", "C"];
  const topDimensions = [...dimensions].sort(
    (a, b) => scores[b] - scores[a],
  ) as RIASECType[];

  log.debug(
    { scores, answeredCount, topDimensions: topDimensions.slice(0, 2) },
    "Partial RIASEC calculated",
  );

  return {
    scores,
    answeredCount,
    topDimensions,
  };
}

// ============================================================================
// Insight Generation
// ============================================================================

/**
 * Generate a personalized insight teaser for the completed section.
 * Called after sections 2, 3, and 4 to keep engagement high.
 *
 * @param prisma - Prisma client instance
 * @param sessionId - Current quiz session ID
 * @param section - Just completed section number (2, 3, or 4)
 * @returns Personalized insight message
 */
export async function generateSectionInsight(
  prisma: PrismaClient,
  sessionId: string,
  section: number,
): Promise<SectionInsight> {
  const log = logger.child({
    fn: "generateSectionInsight",
    sessionId,
    section,
  });

  // Only sections 2, 3, 4 get insights (1 is too early, 5 shows results)
  if (section < 2 || section > 4) {
    log.warn({ section }, "Section insight requested for invalid section");
    return {
      message: "Отлично! Продолжаем!",
      topDimension: "S",
      section,
    };
  }

  // Calculate partial scores from answers so far
  const partialScores = await calculatePartialRIASEC(prisma, sessionId);

  // Check if profile is balanced (no clear leader)
  // topDimensions always has 6 elements from sorting, so first two are guaranteed
  const topDim: RIASECType = partialScores.topDimensions[0] ?? "S";
  const secondDim: RIASECType = partialScores.topDimensions[1] ?? "E";
  const topScore = partialScores.scores[topDim];
  const secondScore = partialScores.scores[secondDim];

  // If top two dimensions are within 15% of each other, consider it balanced
  const isBalanced = topScore > 0 && (topScore - secondScore) / topScore < 0.15;

  let message: string;

  if (isBalanced) {
    // Use balanced profile insights
    const balancedMessages =
      BALANCED_INSIGHTS[section] ?? BALANCED_INSIGHTS[2] ?? [];
    const randomIndex = Math.floor(Math.random() * balancedMessages.length);
    message =
      balancedMessages[randomIndex] ?? "Интересный профиль! Продолжаем.";
    log.info(
      { section, topDim, secondDim, isBalanced: true },
      "Generated balanced insight",
    );
  } else {
    // Use dimension-specific insights
    const sectionTemplates = INSIGHT_TEMPLATES[section];
    const dimensionMessages = sectionTemplates?.[topDim] ?? [];

    if (dimensionMessages.length > 0) {
      const randomIndex = Math.floor(Math.random() * dimensionMessages.length);
      message =
        dimensionMessages[randomIndex] ??
        dimensionMessages[0] ??
        "Отлично! Продолжаем.";
    } else {
      // Fallback if templates are missing
      const dimLabel = RIASEC_LABELS[topDim].ru;
      message = `${dimLabel} тип всё заметнее! Продолжаем.`;
    }

    log.info(
      { section, topDim, score: topScore, isBalanced: false },
      "Generated dimension-specific insight",
    );
  }

  return {
    message,
    topDimension: topDim,
    section,
  };
}

/**
 * Get dimension label in Russian for display
 */
export function getDimensionLabel(dimension: RIASECType): string {
  return RIASEC_LABELS[dimension]?.ru || dimension;
}

/**
 * Check if insight should be shown for this section
 */
export function shouldShowInsight(section: number): boolean {
  return section >= 2 && section <= 4;
}

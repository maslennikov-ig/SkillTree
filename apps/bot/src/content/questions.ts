/**
 * Quiz Question Content for SkillTree Bot
 *
 * Provides constants and helpers for 55-question RIASEC assessment.
 * Questions are loaded from database at runtime via quiz.service.
 */

import type {
  Question,
  QuestionOption,
  RIASECScores,
  RIASECType,
  QuestionType,
} from "@skilltree/shared";

// ============================================================================
// Constants
// ============================================================================

export const TOTAL_QUESTIONS = 55;
export const QUESTIONS_PER_SECTION = 11;
export const TOTAL_SECTIONS = 5;

// ============================================================================
// Quiz Flow (ordered question IDs for FSM navigation)
// ============================================================================

/**
 * Ordered array of question IDs for FSM instruction pointer.
 * currentStep (0-54) maps directly to QUIZ_FLOW[currentStep]
 */
export const QUIZ_FLOW: string[] = [
  // Section 1 (Q1-11): Warm-up, interests, hobbies
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  // Section 2 (Q12-22): School and learning
  "q12",
  "q13",
  "q14",
  "q15",
  "q16",
  "q17",
  "q18",
  "q19",
  "q20",
  "q21",
  "q22",
  // Section 3 (Q23-33): Work preferences
  "q23",
  "q24",
  "q25",
  "q26",
  "q27",
  "q28",
  "q29",
  "q30",
  "q31",
  "q32",
  "q33",
  // Section 4 (Q34-44): Skills and abilities
  "q34",
  "q35",
  "q36",
  "q37",
  "q38",
  "q39",
  "q40",
  "q41",
  "q42",
  "q43",
  "q44",
  // Section 5 (Q45-55): Future and goals
  "q45",
  "q46",
  "q47",
  "q48",
  "q49",
  "q50",
  "q51",
  "q52",
  "q53",
  "q54",
  "q55",
];

// ============================================================================
// Progress Helper Functions
// ============================================================================

/**
 * Get question ID for a given step (0-54)
 */
export function getQuestionIdByStep(step: number): string | undefined {
  if (step < 0 || step >= TOTAL_QUESTIONS) {
    return undefined;
  }
  return QUIZ_FLOW[step];
}

/**
 * Get section number for a given step (0-54)
 * Returns 1-5
 */
export function getSectionForStep(step: number): number {
  return Math.floor(step / QUESTIONS_PER_SECTION) + 1;
}

/**
 * Get progress info for current step
 */
export function getProgressInfo(step: number): {
  questionNumber: number;
  totalQuestions: number;
  section: number;
  totalSections: number;
  percentComplete: number;
  isLastInSection: boolean;
  isLastQuestion: boolean;
} {
  const questionNumber = step + 1;
  const section = getSectionForStep(step);
  const percentComplete = Math.round((questionNumber / TOTAL_QUESTIONS) * 100);
  const isLastInSection = (step + 1) % QUESTIONS_PER_SECTION === 0;
  const isLastQuestion = step === TOTAL_QUESTIONS - 1;

  return {
    questionNumber,
    totalQuestions: TOTAL_QUESTIONS,
    section,
    totalSections: TOTAL_SECTIONS,
    percentComplete,
    isLastInSection,
    isLastQuestion,
  };
}

/**
 * Format progress string for display
 * Example: "Вопрос 12/55 | Секция 2/5 | 22%"
 */
export function formatProgressString(step: number): string {
  const {
    questionNumber,
    totalQuestions,
    section,
    totalSections,
    percentComplete,
  } = getProgressInfo(step);
  return `Вопрос ${questionNumber}/${totalQuestions} | Секция ${section}/${totalSections} | ${percentComplete}%`;
}

/**
 * Get step index for a question ID
 */
export function getStepForQuestionId(questionId: string): number {
  return QUIZ_FLOW.indexOf(questionId);
}

/**
 * Check if step is valid
 */
export function isValidStep(step: number): boolean {
  return step >= 0 && step < TOTAL_QUESTIONS;
}

// ============================================================================
// Section Celebrations
// ============================================================================

export const SECTION_CELEBRATIONS = [
  "Секция 1 завершена! Отличное начало!",
  "Секция 2 пройдена! Ты на высоте!",
  "Секция 3 позади! Больше половины!",
  "Секция 4 готова! Осталось немного!",
  "Поздравляем! Тест завершён!",
] as const;

/**
 * Get celebration message for completed section
 */
export function getSectionCelebration(section: number): string {
  if (section < 1 || section > TOTAL_SECTIONS) {
    return "";
  }
  return SECTION_CELEBRATIONS[section - 1] ?? "";
}

// ============================================================================
// Re-export Types
// ============================================================================

export type {
  Question,
  QuestionOption,
  RIASECScores,
  RIASECType,
  QuestionType,
};

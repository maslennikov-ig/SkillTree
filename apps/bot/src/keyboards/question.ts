/**
 * Question Keyboards for Quiz Handler
 *
 * Builds dynamic InlineKeyboard for different question types:
 * - Multiple Choice (vertical buttons)
 * - Rating Scale (horizontal 1-5)
 * - Binary (Yes/No)
 */

import { InlineKeyboard } from "grammy";
import type { Question, QuestionOption } from "../content/questions";

// ============================================================================
// Callback Data Prefixes
// ============================================================================

export const CALLBACK_PREFIX = {
  MULTIPLE_CHOICE: "answer_mc_",
  RATING: "answer_rating_",
  BINARY: "answer_binary_",
  HINT: "hint_",
  CONTINUE: "flow_continue",
  RESUME: "flow_resume",
  NEW: "flow_new",
} as const;

// ============================================================================
// Multiple Choice Keyboard
// ============================================================================

/**
 * Build keyboard for MULTIPLE_CHOICE questions
 * Each option gets its own row (vertical layout)
 */
export function buildMultipleChoiceKeyboard(
  options: QuestionOption[],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (const option of options) {
    // Use option text directly (includes emoji)
    keyboard.text(
      option.text,
      `${CALLBACK_PREFIX.MULTIPLE_CHOICE}${option.value}`,
    );
    keyboard.row();
  }

  return keyboard;
}

// ============================================================================
// Rating Keyboard
// ============================================================================

/**
 * Rating scale emojis for 1-5
 */
const RATING_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

/**
 * Build keyboard for RATING questions (1-5 scale)
 * Horizontal row of number buttons
 */
export function buildRatingKeyboard(min = 1, max = 5): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (let i = min; i <= max; i++) {
    const emoji = RATING_EMOJIS[i - 1] || String(i);
    keyboard.text(emoji, `${CALLBACK_PREFIX.RATING}${i}`);
  }

  return keyboard;
}

// ============================================================================
// Binary Keyboard
// ============================================================================

/**
 * Build keyboard for BINARY questions (Yes/No)
 */
export function buildBinaryKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Да", `${CALLBACK_PREFIX.BINARY}yes`)
    .text("Нет", `${CALLBACK_PREFIX.BINARY}no`);
}

// ============================================================================
// Dynamic Keyboard Builder
// ============================================================================

/**
 * Build appropriate keyboard based on question type
 */
export function buildQuestionKeyboard(question: Question): InlineKeyboard {
  switch (question.type) {
    case "MULTIPLE_CHOICE":
      if (!question.options || question.options.length === 0) {
        throw new Error(`Question ${question.id} has no options`);
      }
      return buildMultipleChoiceKeyboard(question.options);

    case "RATING": {
      const min = question.ratingRange?.min ?? 1;
      const max = question.ratingRange?.max ?? 5;
      return buildRatingKeyboard(min, max);
    }

    case "BINARY":
      return buildBinaryKeyboard();

    case "OPEN_TEXT":
      // Open text questions don't need keyboard, user types response
      return new InlineKeyboard();

    default:
      // Fallback to multiple choice if options exist
      if (question.options && question.options.length > 0) {
        return buildMultipleChoiceKeyboard(question.options);
      }
      return new InlineKeyboard();
  }
}

// ============================================================================
// Special Keyboards
// ============================================================================

/**
 * Build keyboard for Easter egg hint button
 */
export function buildHintKeyboard(questionId: string): InlineKeyboard {
  return new InlineKeyboard().text(
    "🔍 Подсказка",
    `${CALLBACK_PREFIX.HINT}${questionId}`,
  );
}

/**
 * Build keyboard for section completion
 */
export function buildSectionCompleteKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("Продолжить ➡️", CALLBACK_PREFIX.CONTINUE);
}

/**
 * Build keyboard for session resume prompt
 */
export function buildResumePromptKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Продолжить", CALLBACK_PREFIX.RESUME)
    .text("Начать заново", CALLBACK_PREFIX.NEW);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse callback data to extract answer value
 */
export function parseAnswerCallback(data: string): {
  type: "mc" | "rating" | "binary";
  value: string;
} | null {
  if (data.startsWith(CALLBACK_PREFIX.MULTIPLE_CHOICE)) {
    return {
      type: "mc",
      value: data.substring(CALLBACK_PREFIX.MULTIPLE_CHOICE.length),
    };
  }
  if (data.startsWith(CALLBACK_PREFIX.RATING)) {
    return {
      type: "rating",
      value: data.substring(CALLBACK_PREFIX.RATING.length),
    };
  }
  if (data.startsWith(CALLBACK_PREFIX.BINARY)) {
    return {
      type: "binary",
      value: data.substring(CALLBACK_PREFIX.BINARY.length),
    };
  }
  return null;
}

/**
 * Check if callback data is an answer
 */
export function isAnswerCallback(data: string): boolean {
  return (
    data.startsWith(CALLBACK_PREFIX.MULTIPLE_CHOICE) ||
    data.startsWith(CALLBACK_PREFIX.RATING) ||
    data.startsWith(CALLBACK_PREFIX.BINARY)
  );
}

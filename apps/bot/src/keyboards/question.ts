/**
 * Question Keyboards for Quiz Handler
 *
 * Builds dynamic InlineKeyboard for different question types:
 * - Multiple Choice (vertical buttons)
 * - Rating Scale (horizontal 1-5)
 * - Binary (Yes/No)
 */

import { InlineKeyboard } from "grammy";
import { OPTION_LETTERS } from "@skilltree/shared";
import type { Question, QuestionOption } from "../content/questions";

// ============================================================================
// Callback Data Prefixes
// ============================================================================

export const CALLBACK_PREFIX = {
  MULTIPLE_CHOICE: "answer_mc_",
  RATING: "answer_rating_",
  BINARY: "answer_binary_",
  MIRROR: "mirror_",
  HINT: "hint_",
  CONTINUE: "flow_continue",
  RESUME: "flow_resume",
  NEW: "flow_new",
  SKIP: "flow_skip",
} as const;

// ============================================================================
// Multiple Choice Keyboard
// ============================================================================

/**
 * Build keyboard for MULTIPLE_CHOICE questions
 * Short letter buttons (А, Б, В, Г) in a horizontal row
 * Full option text is shown in the message body
 */
export function buildMultipleChoiceKeyboard(
  options: QuestionOption[],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (let i = 0; i < options.length; i++) {
    const letter = OPTION_LETTERS[i] || String(i + 1);
    const option = options[i];
    if (option) {
      keyboard.text(
        letter,
        `${CALLBACK_PREFIX.MULTIPLE_CHOICE}${option.value}`,
      );
    }
  }

  return keyboard;
}

/**
 * Format options as text for message body
 * Returns string like:
 * А) 🔧 Option text one
 * Б) 📚 Option text two
 */
export function formatOptionsAsText(options: QuestionOption[]): string {
  return options
    .map((opt, i) => {
      const letter = OPTION_LETTERS[i] || String(i + 1);
      return `${letter}) ${opt.text}`;
    })
    .join("\n");
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
 * Build keyboard for BINARY questions
 * If options are provided, uses their text; otherwise defaults to "Да/Нет"
 */
export function buildBinaryKeyboard(
  options?: QuestionOption[],
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (options && options.length >= 2 && options[0] && options[1]) {
    // Use actual option texts from database
    keyboard
      .text(options[0].text, `${CALLBACK_PREFIX.BINARY}yes`)
      .text(options[1].text, `${CALLBACK_PREFIX.BINARY}no`);
  } else {
    // Fallback to default Да/Нет
    keyboard
      .text("Да", `${CALLBACK_PREFIX.BINARY}yes`)
      .text("Нет", `${CALLBACK_PREFIX.BINARY}no`);
  }

  return keyboard;
}

// ============================================================================
// Open Text Keyboard
// ============================================================================

/**
 * Build keyboard for OPEN_TEXT questions (skip button only)
 * User can type their answer and press skip if they want to skip
 */
export function buildOpenTextKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("Пропустить ⏭️", CALLBACK_PREFIX.SKIP);
}

// ============================================================================
// Mirror Keyboard
// ============================================================================

/**
 * Build inline keyboard for Mirror question (Q33)
 * Shows 5 RIASEC pattern options
 */
export function buildMirrorKeyboard(
  options: Array<{
    text: string;
    value: string;
    patternCode: string;
  }>,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (const option of options) {
    keyboard.text(option.text, `${CALLBACK_PREFIX.MIRROR}${option.value}`);
    keyboard.row();
  }

  return keyboard;
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
      return buildBinaryKeyboard(question.options);

    case "OPEN_TEXT":
      return buildOpenTextKeyboard();

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

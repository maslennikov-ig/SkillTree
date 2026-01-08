/**
 * Gender-based text utilities for Russian language
 *
 * Provides gender-specific word endings and phrases for personalization.
 */

import type { Gender } from "@skilltree/database";

/**
 * Get gender-specific verb ending
 * Examples:
 * - MALE: "готов", "ответил", "прошёл"
 * - FEMALE: "готова", "ответила", "прошла"
 * - NOT_SPECIFIED: "готовы" (formal) or neutral form
 */
export function getVerbEnding(
  gender: Gender | undefined | null,
  masculine: string,
  feminine: string,
  neutral: string = masculine,
): string {
  if (!gender || gender === "NOT_SPECIFIED") {
    return neutral;
  }
  return gender === "MALE" ? masculine : feminine;
}

/**
 * Common gender-specific phrases for quiz
 */
export const genderPhrases = {
  ready: (gender: Gender | undefined | null): string =>
    getVerbEnding(gender, "Готов", "Готова", "Готовы"),

  answered: (gender: Gender | undefined | null): string =>
    getVerbEnding(gender, "Ответил", "Ответила", "Ответили"),

  completed: (gender: Gender | undefined | null): string =>
    getVerbEnding(gender, "Прошёл", "Прошла", "Прошли"),

  registered: (gender: Gender | undefined | null): string =>
    getVerbEnding(
      gender,
      "Зарегистрирован",
      "Зарегистрирована",
      "Зарегистрированы",
    ),

  // For "ты молодец" type phrases
  goodJob: (gender: Gender | undefined | null): string =>
    getVerbEnding(gender, "Молодец", "Молодец", "Молодец"), // Same in Russian

  // For "сам/сама" type phrases
  self: (gender: Gender | undefined | null): string =>
    getVerbEnding(gender, "сам", "сама", "сам"),
};

/**
 * Format a message with gender-specific ending
 * Example: formatGenderMessage("Готов|Готова|Готовы", "FEMALE") => "Готова"
 */
export function formatGenderMessage(
  template: string, // Format: "masculine|feminine|neutral"
  gender: Gender | undefined | null,
): string {
  const parts = template.split("|");
  if (parts.length < 2) return template;

  const [masculine, feminine, neutral = masculine] = parts;
  return getVerbEnding(gender, masculine!, feminine!, neutral);
}

/**
 * Get quiz continuation prompt based on gender
 */
export function getReadyPrompt(gender: Gender | undefined | null): string {
  return `${genderPhrases.ready(gender)} продолжить?`;
}

/**
 * Get section completion message based on gender
 */
export function getSectionCompleteMessage(
  gender: Gender | undefined | null,
  sectionNumber: number,
): string {
  const completedVerb = genderPhrases.completed(gender);
  return `🎉 ${completedVerb} секцию ${sectionNumber}!`;
}

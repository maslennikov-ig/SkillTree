/**
 * Results Keyboards for SkillTree Bot
 *
 * Action buttons for results display:
 * - Full Report
 * - View All Careers
 * - Share Results
 * - Send to Parent
 */

import { InlineKeyboard } from "grammy";

// ============================================================================
// Callback Data
// ============================================================================

export const RESULTS_CALLBACK = {
  FULL_REPORT: "results_full",
  VIEW_CAREERS: "results_careers",
  SHARE: "results_share",
  SHARE_FORWARD: "results_share_forward",
  SEND_TO_PARENT: "results_parent",
  PDF_ROADMAP: "results_pdf",
  CAREER_DETAIL: "career_detail_",
  BACK_TO_RESULTS: "results_back",
} as const;

// Base URL for public results page (configurable via env)
const RESULTS_BASE_URL = process.env.RESULTS_URL || "https://skilltree.ru/r";

// ============================================================================
// Main Results Keyboard
// ============================================================================

/**
 * Options for building the results keyboard
 */
export interface ResultsKeyboardOptions {
  /** Whether PDF roadmap feature is unlocked (requires 1000+ points) */
  pdfUnlocked?: boolean;
  /** Share token for public results link */
  shareToken?: string;
}

/**
 * Build main results action keyboard
 */
export function buildResultsKeyboard(
  options?: ResultsKeyboardOptions,
): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text("📊 Все профессии", RESULTS_CALLBACK.VIEW_CAREERS)
    .row();

  // Add share buttons with link if shareToken is available
  if (options?.shareToken) {
    const shareUrl = `${RESULTS_BASE_URL}/${options.shareToken}`;
    const shareText = encodeURIComponent(
      "Мои результаты теста на профориентацию SkillTree:",
    );
    keyboard
      .url(
        "📤 Поделиться ссылкой",
        `tg://msg_url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`,
      )
      .row()
      .text("📨 Переслать результат", RESULTS_CALLBACK.SHARE_FORWARD);
  } else {
    keyboard.text("📤 Поделиться", RESULTS_CALLBACK.SHARE);
  }

  keyboard
    .row()
    .text("👨‍👩‍👧 Отправить родителям", RESULTS_CALLBACK.SEND_TO_PARENT);

  // Add PDF button if unlocked or with lock emoji
  if (options?.pdfUnlocked) {
    keyboard.row().text("📄 PDF Roadmap", RESULTS_CALLBACK.PDF_ROADMAP);
  } else {
    keyboard
      .row()
      .text("🔒 PDF Roadmap (1000 очков)", RESULTS_CALLBACK.PDF_ROADMAP);
  }

  return keyboard;
}

/**
 * Build careers list navigation keyboard
 */
export function buildCareersListKeyboard(
  careers: Array<{ id: string; titleRu: string }>,
  showBackButton = true,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Add career buttons (max 5)
  for (const career of careers.slice(0, 5)) {
    keyboard.text(
      career.titleRu,
      `${RESULTS_CALLBACK.CAREER_DETAIL}${career.id}`,
    );
    keyboard.row();
  }

  if (showBackButton) {
    keyboard.text("Назад к результатам", RESULTS_CALLBACK.BACK_TO_RESULTS);
  }

  return keyboard;
}

/**
 * Build single career detail keyboard with back button
 */
export function buildCareerDetailKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Другие профессии", RESULTS_CALLBACK.VIEW_CAREERS)
    .row()
    .text("Назад к результатам", RESULTS_CALLBACK.BACK_TO_RESULTS);
}

/**
 * Build share keyboard with options
 */
export function buildShareKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text(
    "Назад к результатам",
    RESULTS_CALLBACK.BACK_TO_RESULTS,
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse career ID from callback data
 */
export function parseCareerDetailCallback(data: string): string | null {
  if (data.startsWith(RESULTS_CALLBACK.CAREER_DETAIL)) {
    return data.substring(RESULTS_CALLBACK.CAREER_DETAIL.length);
  }
  return null;
}

/**
 * Check if callback is a career detail callback
 */
export function isCareerDetailCallback(data: string): boolean {
  return data.startsWith(RESULTS_CALLBACK.CAREER_DETAIL);
}

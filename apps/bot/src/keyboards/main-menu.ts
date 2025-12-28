/**
 * Persistent Reply Keyboards for Main Menu
 *
 * Student Menu:
 * - Start Test / Results
 * - My Streak / Achievements
 * - Share / Help
 *
 * Parent Menu:
 * - My Children / Reports
 * - Link Child / Help
 */

import { Keyboard } from "grammy";

// ============================================================================
// Student Menu
// ============================================================================

/**
 * Student main menu keyboard (6 buttons, 3 rows)
 *
 * Layout:
 * [ Начать тест  |  Результаты ]
 * [ Мой стрик    |  Достижения ]
 * [ Поделиться   |  Помощь     ]
 */
export const studentMainMenu = new Keyboard()
  .text("Начать тест")
  .text("Результаты")
  .row()
  .text("Мой стрик")
  .text("Достижения")
  .row()
  .text("Поделиться")
  .text("Помощь")
  .resized()
  .persistent();

/**
 * Student main menu with active quiz (shows Resume option)
 *
 * Layout:
 * [ Продолжить тест |  Результаты ]
 * [ Мой стрик       |  Достижения ]
 * [ Поделиться      |  Помощь     ]
 */
export const studentActiveQuizMenu = new Keyboard()
  .text("Продолжить тест")
  .text("Результаты")
  .row()
  .text("Мой стрик")
  .text("Достижения")
  .row()
  .text("Поделиться")
  .text("Помощь")
  .resized()
  .persistent();

// ============================================================================
// Parent Menu
// ============================================================================

/**
 * Parent main menu keyboard (4 buttons, 2 rows)
 *
 * Layout:
 * [ Мои дети   |  Отчёты   ]
 * [ Привязать  |  Помощь   ]
 */
export const parentMainMenu = new Keyboard()
  .text("Мои дети")
  .text("Отчёты")
  .row()
  .text("Привязать")
  .text("Помощь")
  .resized()
  .persistent();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the appropriate main menu based on user role and quiz state
 */
export function getMainMenu(
  role: "student" | "parent" | null,
  hasActiveQuiz = false,
): Keyboard {
  if (role === "parent") {
    return parentMainMenu;
  }

  if (role === "student") {
    return hasActiveQuiz ? studentActiveQuizMenu : studentMainMenu;
  }

  // Default to student menu for unregistered users
  return studentMainMenu;
}

/**
 * Button text mappings to commands (for handler routing)
 */
export const BUTTON_TO_COMMAND: Record<string, string> = {
  // Student buttons
  "Начать тест": "/test",
  "Продолжить тест": "/resume",
  Результаты: "/results",
  "Мой стрик": "/streak",
  Достижения: "/achievements",
  Поделиться: "/share",
  Помощь: "/help",

  // Parent buttons
  "Мои дети": "/children",
  Отчёты: "/reports",
  Привязать: "/link",
};

/**
 * Remove keyboard entirely
 */
export const removeKeyboard = { remove_keyboard: true as const };

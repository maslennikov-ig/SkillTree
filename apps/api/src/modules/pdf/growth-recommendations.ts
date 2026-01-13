/**
 * Growth Recommendations for PDF Report
 * Russian text templates for developing lower RIASEC dimensions
 * Uses positive framing: "Growth Areas" not "Weaknesses"
 */

import type { RIASECType } from "@skilltree/shared";

/**
 * Growth recommendation data structure
 */
export interface GrowthRecommendation {
  type: RIASECType;
  titleRu: string;
  energyDescription: string;
  positiveFraming: string;
  activities: string[];
  challenge: {
    title: string;
    description: string;
    duration: string;
  };
}

/**
 * Growth recommendations for each RIASEC dimension
 * Used when a dimension score is below the 30th percentile
 */
export const GROWTH_RECOMMENDATIONS: Record<RIASECType, GrowthRecommendation> =
  {
    R: {
      type: "R",
      titleRu: "Развитие практических навыков",
      energyDescription:
        "Вы больше увлечены идеями и общением, чем работой руками. Это нормально!",
      positiveFraming:
        "Развивая практические навыки, вы сможете воплощать свои идеи в реальность. " +
        "Даже небольшой опыт создания чего-то своими руками приносит огромное удовлетворение.",
      activities: [
        "Попробуйте 3D-моделирование или конструктор Arduino",
        "Присоединитесь к робототехническому кружку в школе",
        "Создайте что-то своими руками: скворечник, украшение, блюдо",
        "Поучаствуйте в волонтёрском проекте на свежем воздухе",
      ],
      challenge: {
        title: "Практический челлендж",
        description:
          "Каждую неделю создавайте что-то новое: рисунок, поделку, блюдо по рецепту",
        duration: "30 дней",
      },
    },

    I: {
      type: "I",
      titleRu: "Развитие аналитических навыков",
      energyDescription:
        "Вы предпочитаете действовать, а не долго анализировать. Это даёт вам скорость!",
      positiveFraming:
        "Аналитические навыки помогут вам принимать более взвешенные решения. " +
        "Любопытство — это суперсила, и его можно тренировать!",
      activities: [
        "Разберитесь в статистике любимой игры или спорта",
        "Пройдите курс на Khan Academy по интересной теме",
        "Вступите в дискуссионный клуб или команду по дебатам",
        "Проведите собственное исследование на любую тему",
      ],
      challenge: {
        title: "Исследовательский челлендж",
        description:
          "Каждый день задавайте себе один вопрос 'Почему?' и находите ответ",
        duration: "14 дней",
      },
    },

    A: {
      type: "A",
      titleRu: "Развитие творческого потенциала",
      energyDescription:
        "Вы предпочитаете чёткие правила и структуру. Это надёжный фундамент!",
      positiveFraming:
        "Творческое мышление помогает находить нестандартные решения в любой профессии. " +
        "Не бойтесь экспериментировать — творчество не про 'правильно', а про 'интересно'.",
      activities: [
        "Ведите творческий дневник: рисуйте, пишите, фотографируйте",
        "Создайте плейлист, отражающий ваше настроение",
        "Попробуйте графический дизайн в Canva или Figma",
        "Запишитесь на мастер-класс по искусству или музыке",
      ],
      challenge: {
        title: "Креативный челлендж",
        description:
          "Каждый день делайте что-то творческое, не оценивая результат",
        duration: "21 день",
      },
    },

    S: {
      type: "S",
      titleRu: "Развитие социальных навыков",
      energyDescription:
        "Вы комфортнее работаете в одиночку, чем в команде. Это даёт вам сосредоточенность!",
      positiveFraming:
        "Навыки общения помогут вам эффективнее доносить свои идеи и находить единомышленников. " +
        "Начните с малого — даже маленькие шаги приводят к большим переменам.",
      activities: [
        "Помогите однокласснику с домашним заданием",
        "Присоединитесь к волонтёрскому проекту",
        "Попробуйте наставничество для младших школьников",
        "Участвуйте в групповом проекте, слушая других",
      ],
      challenge: {
        title: "Социальный челлендж",
        description:
          "Каждый день делайте одну вещь для другого человека (комплимент, помощь, совет)",
        duration: "14 дней",
      },
    },

    E: {
      type: "E",
      titleRu: "Развитие лидерских навыков",
      energyDescription:
        "Вы предпочитаете поддерживать, а не вести за собой. Это делает вас надёжным партнёром!",
      positiveFraming:
        "Лидерство — это не про 'быть самым громким'. Это про умение отстаивать свои идеи " +
        "и брать инициативу. Эти навыки помогут вам в любой карьере.",
      activities: [
        "Организуйте мероприятие с друзьями (поход, игровой вечер)",
        "Выступите с идеей на уроке или в кружке",
        "Попробуйте себя в роли капитана команды",
        "Запустите маленький проект (блог, канал, продажа поделок)",
      ],
      challenge: {
        title: "Лидерский челлендж",
        description: "Каждую неделю берите инициативу хотя бы в одном деле",
        duration: "30 дней",
      },
    },

    C: {
      type: "C",
      titleRu: "Развитие организационных навыков",
      energyDescription:
        "Вы любите гибкость и свободу, а не строгие правила. Это питает вашу креативность!",
      positiveFraming:
        "Базовые навыки организации помогут вашим идеям не теряться, а реализовываться. " +
        "Система не должна быть сложной — простые привычки работают лучше всего.",
      activities: [
        "Начните вести планировщик (бумажный или цифровой)",
        "Освойте основы работы с таблицами (Google Sheets / Excel)",
        "Попробуйте роль казначея или секретаря в кружке",
        "Отслеживайте одну личную цель в течение месяца",
      ],
      challenge: {
        title: "Организационный челлендж",
        description: "Ведите Google-календарь или ежедневник без пропусков",
        duration: "7 дней",
      },
    },
  };

/**
 * Get growth recommendations for lowest dimensions
 * @param lowestTypes Array of lowest RIASEC types (2-3 items)
 * @returns Array of growth recommendations
 */
export function getGrowthRecommendations(
  lowestTypes: RIASECType[],
): GrowthRecommendation[] {
  return lowestTypes.map((type) => GROWTH_RECOMMENDATIONS[type]);
}

/**
 * Badge metadata for PDF display
 * Maps BadgeType enum to display info
 */
export const BADGE_DISPLAY_INFO: Record<
  string,
  {
    nameRu: string;
    descriptionRu: string;
    tier: "bronze" | "silver" | "gold" | "platinum";
  }
> = {
  BRONZE_EXPLORER: {
    nameRu: "Бронзовый исследователь",
    descriptionRu: "Начало пути к самопознанию",
    tier: "bronze",
  },
  SILVER_SEEKER: {
    nameRu: "Серебряный искатель",
    descriptionRu: "Уверенный шаг к пониманию себя",
    tier: "silver",
  },
  GOLD_ACHIEVER: {
    nameRu: "Золотой достигатор",
    descriptionRu: "Высокий уровень самопознания",
    tier: "gold",
  },
  PLATINUM_MASTER: {
    nameRu: "Платиновый мастер",
    descriptionRu: "Мастерство в понимании своих интересов",
    tier: "platinum",
  },
  SPEED_DEMON: {
    nameRu: "Молниеносный ум",
    descriptionRu: "Быстрое прохождение теста",
    tier: "silver",
  },
  THOUGHTFUL_ANALYST: {
    nameRu: "Вдумчивый аналитик",
    descriptionRu: "Тщательное обдумывание каждого вопроса",
    tier: "gold",
  },
  STREAK_3_DAYS: {
    nameRu: "Трёхдневный марафон",
    descriptionRu: "Активность 3 дня подряд",
    tier: "bronze",
  },
  STREAK_7_DAYS: {
    nameRu: "Недельный чемпион",
    descriptionRu: "Активность 7 дней подряд",
    tier: "silver",
  },
  REFERRAL_BRONZE: {
    nameRu: "Бронзовый амбассадор",
    descriptionRu: "Пригласил первых друзей",
    tier: "bronze",
  },
  REFERRAL_SILVER: {
    nameRu: "Серебряный амбассадор",
    descriptionRu: "Активно приглашает друзей",
    tier: "silver",
  },
  REFERRAL_GOLD: {
    nameRu: "Золотой амбассадор",
    descriptionRu: "Лидер по приглашениям",
    tier: "gold",
  },
  NIGHT_OWL: {
    nameRu: "Ночная сова",
    descriptionRu: "Прохождение теста ночью",
    tier: "bronze",
  },
  EARLY_BIRD: {
    nameRu: "Ранняя пташка",
    descriptionRu: "Прохождение теста рано утром",
    tier: "bronze",
  },
  DETECTIVE: {
    nameRu: "Детектив",
    descriptionRu: "Внимательное изучение всех деталей",
    tier: "gold",
  },
};

/**
 * Get badge display info by type
 */
export function getBadgeDisplayInfo(badgeType: string): {
  nameRu: string;
  descriptionRu: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
} {
  return (
    BADGE_DISPLAY_INFO[badgeType] || {
      nameRu: badgeType,
      descriptionRu: "Достижение",
      tier: "bronze" as const,
    }
  );
}

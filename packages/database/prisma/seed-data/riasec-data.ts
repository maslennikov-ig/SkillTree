/**
 * RIASEC Career Assessment Seed Data for Russian Teenagers (14-17)
 *
 * Based on O*NET Interest Profiler (Public Domain, U.S. Department of Labor)
 * Adapted for Russian teen scenarios with culturally relevant content
 *
 * Sources:
 * - O*NET Interest Profiler 60-item Short Form
 * - Salary data: hh.ru, Habr Career, SuperJob (2024-2025)
 * - University rankings: RAEX, Forbes Education
 *
 * @license CC-BY-4.0 (O*NET content is public domain)
 */

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type RIASECType = "R" | "I" | "A" | "S" | "E" | "C";

export interface RIASECScores {
  R: number; // Realistic - практический
  I: number; // Investigative - исследовательский
  A: number; // Artistic - артистический
  S: number; // Social - социальный
  E: number; // Enterprising - предприимчивый
  C: number; // Conventional - конвенциональный
}

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "RATING"
  | "BINARY"
  | "OPEN_TEXT";

export interface QuestionOption {
  text: string;
  value: string;
  scores: RIASECScores;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  section: number; // 1-5
  orderIndex: number; // 1-55
  difficulty: number; // 1-3
  primaryDimension: RIASECType;
  options?: QuestionOption[];
  ratingRange?: {
    min: number;
    max: number;
    labels: { min: string; max: string };
  };
  isEasterEgg?: boolean;
  hint?: string;
}

export type CareerCategory =
  | "technology"
  | "creative"
  | "business"
  | "medicine"
  | "science"
  | "engineering"
  | "social";

export type CareerOutlook = "growing" | "stable" | "declining";

export interface Career {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  riasecProfile: RIASECScores;
  salaryMin: number; // RUB/month
  salaryMax: number; // RUB/month
  salarySource: string;
  category: CareerCategory;
  requiredSkills: string[];
  educationPath: string[];
  universities: string[];
  outlook: CareerOutlook;
  demandLevel: "high" | "medium" | "low";
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const createScores = (
  primary: RIASECType,
  secondary?: RIASECType,
): RIASECScores => {
  const scores: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  scores[primary] = 1.0;
  if (secondary) scores[secondary] = 0.3;
  return scores;
};

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 1: 55-QUESTION BANK (RUSSIAN)
// ═══════════════════════════════════════════════════════════════
/**
 * Question Design Principles:
 * - 9 questions per RIASEC dimension (54 total) + 1 engagement buffer
 * - Interleaved dimensions (never same dimension consecutively)
 * - Strategic pacing: easy→medium→hard→medium→easy
 * - Format mix: 70% multiple choice, 20% rating, 10% binary
 * - Language: informal "ты", age-appropriate for 14-17
 * - Scenarios: school, hobbies, future dreams (not workplace)
 *
 * Dimension Mapping:
 * R (Realistic) = Работа руками, техника, природа
 * I (Investigative) = Наука, анализ, исследования
 * A (Artistic) = Творчество, искусство, самовыражение
 * S (Social) = Помощь людям, общение, обучение
 * E (Enterprising) = Лидерство, бизнес, влияние
 * C (Conventional) = Порядок, данные, организация
 */

export const questions: Question[] = [
  // ═══════════════════════════════════════════════════════════════
  // SECTION 1 (Q1-11): Warm-up, interests, hobbies — EASY
  // ═══════════════════════════════════════════════════════════════

  {
    id: "q1",
    text: "🎮 Выходной! Какое занятие тебе по душе?",
    type: "MULTIPLE_CHOICE",
    section: 1,
    orderIndex: 1,
    difficulty: 1,
    primaryDimension: "R",
    // Measures: R (hands-on activities) vs other leisure preferences
    options: [
      {
        text: "🔧 Соберу или починю что-нибудь руками",
        value: "r1",
        scores: { R: 1.0, I: 0.2, A: 0, S: 0, E: 0, C: 0 },
      },
      {
        text: "📚 Посмотрю научпоп или почитаю статью",
        value: "i1",
        scores: { R: 0, I: 1.0, A: 0.1, S: 0, E: 0, C: 0 },
      },
      {
        text: "🎨 Порисую или займусь творчеством",
        value: "a1",
        scores: { R: 0, I: 0, A: 1.0, S: 0.1, E: 0, C: 0 },
      },
      {
        text: "👥 Встречусь с друзьями или помогу кому-то",
        value: "s1",
        scores: { R: 0, I: 0, A: 0, S: 1.0, E: 0.2, C: 0 },
      },
    ],
  },

  {
    id: "q2",
    text: "💡 Какой школьный проект тебя бы зацепил больше всего?",
    type: "MULTIPLE_CHOICE",
    section: 1,
    orderIndex: 2,
    difficulty: 1,
    primaryDimension: "I",
    // Measures: I (research/investigation) preferences
    options: [
      {
        text: "🔬 Провести эксперимент и доказать гипотезу",
        value: "i2",
        scores: { R: 0.2, I: 1.0, A: 0, S: 0, E: 0, C: 0.1 },
      },
      {
        text: "🎭 Снять короткометражку или поставить сценку",
        value: "a2",
        scores: { R: 0, I: 0, A: 1.0, S: 0.3, E: 0.2, C: 0 },
      },
      {
        text: "📊 Организовать опрос и проанализировать данные",
        value: "c2",
        scores: { R: 0, I: 0.3, A: 0, S: 0.2, E: 0.2, C: 1.0 },
      },
      {
        text: "🤝 Создать волонтёрский проект для помощи людям",
        value: "s2",
        scores: { R: 0, I: 0, A: 0, S: 1.0, E: 0.3, C: 0 },
      },
    ],
  },

  {
    id: "q3",
    text: "🎨 Насколько тебе нравятся творческие занятия?",
    type: "RATING",
    section: 1,
    orderIndex: 3,
    difficulty: 1,
    primaryDimension: "A",
    // Measures: A (artistic expression) interest level
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Не моё вообще 😅",
        max: "5 = Обожаю! Это мой вайб 🔥",
      },
    },
  },

  {
    id: "q4",
    text: "👫 Когда друзья приходят с проблемой, ты обычно...",
    type: "MULTIPLE_CHOICE",
    section: 1,
    orderIndex: 4,
    difficulty: 1,
    primaryDimension: "S",
    // Measures: S (helping/social) vs E (leading) vs I (analyzing)
    options: [
      {
        text: "💬 Выслушаешь и поддержишь эмоционально",
        value: "s3",
        scores: { R: 0, I: 0, A: 0.1, S: 1.0, E: 0, C: 0 },
      },
      {
        text: "🧠 Проанализируешь ситуацию и дашь совет",
        value: "i3",
        scores: { R: 0, I: 1.0, A: 0, S: 0.1, E: 0, C: 0 },
      },
      {
        text: "🚀 Предложишь конкретный план действий",
        value: "e3",
        scores: { R: 0, I: 0, A: 0, S: 0.2, E: 1.0, C: 0.1 },
      },
      {
        text: "📝 Поможешь разложить всё по полочкам",
        value: "c3",
        scores: { R: 0, I: 0.1, A: 0, S: 0.1, E: 0, C: 1.0 },
      },
    ],
  },

  {
    id: "q5",
    text: "💰 Представь: тебе дали 100К на стартап в школе. Что делаешь?",
    type: "MULTIPLE_CHOICE",
    section: 1,
    orderIndex: 5,
    difficulty: 1,
    primaryDimension: "E",
    // Measures: E (entrepreneurship/leadership) preferences
    options: [
      {
        text: "🏆 Создам бизнес и буду им управлять",
        value: "e4",
        scores: { R: 0, I: 0, A: 0, S: 0, E: 1.0, C: 0.2 },
      },
      {
        text: "🎨 Открою творческую студию или мастерскую",
        value: "a4",
        scores: { R: 0.2, I: 0, A: 1.0, S: 0, E: 0.3, C: 0 },
      },
      {
        text: "🔬 Создам лабораторию или исследовательский проект",
        value: "i4",
        scores: { R: 0.2, I: 1.0, A: 0, S: 0, E: 0, C: 0 },
      },
      {
        text: "💚 Запущу благотворительный проект",
        value: "s4",
        scores: { R: 0, I: 0, A: 0, S: 1.0, E: 0.3, C: 0 },
      },
    ],
  },

  {
    id: "q6",
    text: "📋 Оцени себя: насколько ты организованный человек?",
    type: "RATING",
    section: 1,
    orderIndex: 6,
    difficulty: 1,
    primaryDimension: "C",
    // Measures: C (conventional/organized) preferences
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Живу хаосом 🌪️",
        max: "5 = У меня всё по полочкам 📁",
      },
    },
  },

  {
    id: "q7",
    text: "🔧 Если что-то сломалось дома, ты...",
    type: "BINARY",
    section: 1,
    orderIndex: 7,
    difficulty: 1,
    primaryDimension: "R",
    // Measures: R (hands-on problem solving)
    options: [
      {
        text: "🛠️ Попробую починить сам/сама",
        value: "yes",
        scores: { R: 1.0, I: 0.2, A: 0, S: 0, E: 0, C: 0 },
      },
      {
        text: "📞 Лучше вызову мастера",
        value: "no",
        scores: { R: 0, I: 0, A: 0, S: 0.2, E: 0, C: 0.3 },
      },
    ],
  },

  {
    id: "q8",
    text: "🌿 Насколько тебе близка работа на природе или с животными?",
    type: "RATING",
    section: 1,
    orderIndex: 8,
    difficulty: 1,
    primaryDimension: "R",
    // Measures: R (realistic/outdoor) interests
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Я городской житель 🏙️",
        max: "5 = Природа — моя стихия 🌲",
      },
    },
  },

  {
    id: "q9",
    text: "🎤 На школьном мероприятии тебе предлагают роль. Выбираешь...",
    type: "MULTIPLE_CHOICE",
    section: 1,
    orderIndex: 9,
    difficulty: 1,
    primaryDimension: "A",
    // Measures: A vs E vs S vs C in public settings
    options: [
      {
        text: "🎭 Выступить на сцене — спеть, сыграть, станцевать",
        value: "a5",
        scores: { R: 0, I: 0, A: 1.0, S: 0.2, E: 0.3, C: 0 },
      },
      {
        text: "📢 Быть ведущим и управлять ходом события",
        value: "e5",
        scores: { R: 0, I: 0, A: 0.2, S: 0.3, E: 1.0, C: 0 },
      },
      {
        text: "🎬 Организовать всё за кулисами",
        value: "c4",
        scores: { R: 0.2, I: 0, A: 0.2, S: 0, E: 0.2, C: 1.0 },
      },
      {
        text: "🤗 Помогать и создавать комфорт для всех",
        value: "s5",
        scores: { R: 0, I: 0, A: 0, S: 1.0, E: 0, C: 0.2 },
      },
    ],
  },

  {
    id: "q10",
    text: "📖 Какой контент тебя больше всего затягивает?",
    type: "MULTIPLE_CHOICE",
    section: 1,
    orderIndex: 10,
    difficulty: 1,
    primaryDimension: "I",
    // Measures: content preferences reflecting RIASEC types
    options: [
      {
        text: "🔬 Научпоп, документалки про космос/технологии",
        value: "i5",
        scores: { R: 0.1, I: 1.0, A: 0.1, S: 0, E: 0, C: 0 },
      },
      {
        text: "💼 Истории успеха, бизнес-контент",
        value: "e6",
        scores: { R: 0, I: 0.2, A: 0, S: 0, E: 1.0, C: 0.2 },
      },
      {
        text: "🎨 Арт, музыка, фильмы, творческие блоги",
        value: "a6",
        scores: { R: 0, I: 0, A: 1.0, S: 0.1, E: 0, C: 0 },
      },
      {
        text: "👥 Психология, отношения, лайфстайл",
        value: "s6",
        scores: { R: 0, I: 0.2, A: 0.1, S: 1.0, E: 0, C: 0 },
      },
    ],
  },

  {
    id: "q11",
    text: "⚡ Engagement check: Ты ещё с нами?",
    type: "MULTIPLE_CHOICE",
    section: 1,
    orderIndex: 11,
    difficulty: 1,
    primaryDimension: "S", // Buffer question
    // Engagement buffer - ensures attention, slight social lean
    options: [
      {
        text: "🔥 Да, погнали дальше!",
        value: "engaged",
        scores: { R: 0, I: 0, A: 0, S: 0.2, E: 0.3, C: 0 },
      },
      {
        text: "😴 Немного устал/а, но продолжаю",
        value: "tired",
        scores: { R: 0, I: 0, A: 0, S: 0.1, E: 0, C: 0.1 },
      },
      {
        text: "🤔 Интересно, хочу узнать результат",
        value: "curious",
        scores: { R: 0, I: 0.3, A: 0, S: 0, E: 0, C: 0.1 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2 (Q12-22): School subjects, activities — MEDIUM
  // ═══════════════════════════════════════════════════════════════

  {
    id: "q12",
    text: "📐 Насколько тебе нравятся геометрия и черчение?",
    type: "RATING",
    section: 2,
    orderIndex: 12,
    difficulty: 2,
    primaryDimension: "R",
    // Measures: R/C (technical drawing, spatial reasoning)
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Мука 😩",
        max: "5 = Кайф, люблю чертить ✏️",
      },
    },
  },

  {
    id: "q13",
    text: "🧪 Лабораторные работы по физике/химии/биологии...",
    type: "MULTIPLE_CHOICE",
    section: 2,
    orderIndex: 13,
    difficulty: 2,
    primaryDimension: "I",
    // Measures: I (experimental science) interest
    options: [
      {
        text: "🔬 Моё любимое — эксперименты это круто!",
        value: "i6",
        scores: { R: 0.3, I: 1.0, A: 0, S: 0, E: 0, C: 0.1 },
      },
      {
        text: "😐 Норм, если понимаю зачем это нужно",
        value: "neutral",
        scores: { R: 0.1, I: 0.3, A: 0, S: 0, E: 0, C: 0.1 },
      },
      {
        text: "📝 Предпочитаю теорию, а не практику",
        value: "theory",
        scores: { R: 0, I: 0.5, A: 0, S: 0, E: 0, C: 0.3 },
      },
      {
        text: "😅 Стараюсь избегать, не моё",
        value: "avoid",
        scores: { R: 0, I: 0, A: 0.2, S: 0.2, E: 0.1, C: 0 },
      },
    ],
  },

  {
    id: "q14",
    text: "📊 Насколько тебе нравится работать с данными, таблицами, цифрами?",
    type: "RATING",
    section: 2,
    orderIndex: 14,
    difficulty: 2,
    primaryDimension: "C",
    // Measures: C (conventional/data) interest
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Скучно, не моё 💤",
        max: "5 = Обожаю! Порядок в данных — это красиво 📈",
      },
    },
  },

  {
    id: "q15",
    text: "👨‍👩‍👧‍👦 Групповые проекты в школе — какая роль тебе ближе?",
    type: "MULTIPLE_CHOICE",
    section: 2,
    orderIndex: 15,
    difficulty: 2,
    primaryDimension: "E",
    // Measures: E (leadership) vs S (collaboration) vs C (organization)
    options: [
      {
        text: "👑 Лидер — распределяю задачи",
        value: "e7",
        scores: { R: 0, I: 0, A: 0, S: 0.2, E: 1.0, C: 0.3 },
      },
      {
        text: "🎨 Креативщик — придумываю идеи и оформление",
        value: "a7",
        scores: { R: 0, I: 0.1, A: 1.0, S: 0.1, E: 0.1, C: 0 },
      },
      {
        text: "🔍 Исследователь — собираю и анализирую",
        value: "i7",
        scores: { R: 0, I: 1.0, A: 0, S: 0, E: 0, C: 0.3 },
      },
      {
        text: "🤝 Модератор — слежу, чтобы все были на одной волне",
        value: "s7",
        scores: { R: 0, I: 0, A: 0, S: 1.0, E: 0.2, C: 0.1 },
      },
    ],
  },

  {
    id: "q16",
    text: "💻 Информатика и программирование...",
    type: "MULTIPLE_CHOICE",
    section: 2,
    orderIndex: 16,
    difficulty: 2,
    primaryDimension: "I",
    // Measures: I/R (technical/analytical) vs A (creative coding)
    options: [
      {
        text: "🖥️ Кайф! Люблю писать код и решать задачи",
        value: "i8",
        scores: { R: 0.2, I: 1.0, A: 0, S: 0, E: 0, C: 0.2 },
      },
      {
        text: "🎮 Интересно для создания игр/сайтов",
        value: "ia",
        scores: { R: 0.1, I: 0.5, A: 0.5, S: 0, E: 0, C: 0 },
      },
      {
        text: "📊 Норм для работы с данными и таблицами",
        value: "c5",
        scores: { R: 0, I: 0.3, A: 0, S: 0, E: 0.1, C: 1.0 },
      },
      {
        text: "😬 Не моё, слишком сложно/скучно",
        value: "avoid",
        scores: { R: 0, I: 0, A: 0.2, S: 0.3, E: 0.2, C: 0 },
      },
    ],
  },

  {
    id: "q17",
    text: "🏃 Физкультура и спорт для тебя — это...",
    type: "MULTIPLE_CHOICE",
    section: 2,
    orderIndex: 17,
    difficulty: 2,
    primaryDimension: "R",
    // Measures: R (physical activity) in different contexts
    options: [
      {
        text: "💪 Важная часть жизни, занимаюсь регулярно",
        value: "r2",
        scores: { R: 1.0, I: 0, A: 0, S: 0, E: 0.2, C: 0 },
      },
      {
        text: "⚽ Люблю командные виды спорта",
        value: "rs",
        scores: { R: 1.0, I: 0, A: 0, S: 0.2, E: 0.1, C: 0 },
      },
      {
        text: "🧘 Предпочитаю индивидуальные занятия",
        value: "r3",
        scores: { R: 0.8, I: 0.1, A: 0.1, S: 0, E: 0, C: 0 },
      },
      {
        text: "📱 Честно? Не особо увлекаюсь",
        value: "low_r",
        scores: { R: 0, I: 0.1, A: 0.1, S: 0.1, E: 0.1, C: 0.1 },
      },
    ],
  },

  {
    id: "q18",
    text: "📊 Насколько тебе интересны экономика и обществознание?",
    type: "RATING",
    section: 2,
    orderIndex: 18,
    difficulty: 2,
    primaryDimension: "E",
    // Measures: E/C (business/social systems) interest
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Зачем это нужно? 🤷",
        max: "5 = Очень интересно! 🌍",
      },
    },
  },

  {
    id: "q19",
    text: "🌍 Иностранные языки для тебя...",
    type: "MULTIPLE_CHOICE",
    section: 2,
    orderIndex: 19,
    difficulty: 2,
    primaryDimension: "S",
    // Measures: S (communication) vs I (learning systems)
    options: [
      {
        text: "🗣️ Возможность общаться с людьми по всему миру",
        value: "s8",
        scores: { R: 0, I: 0.1, A: 0.2, S: 1.0, E: 0.2, C: 0 },
      },
      {
        text: "📚 Интересная система правил и структур",
        value: "i9",
        scores: { R: 0, I: 1.0, A: 0, S: 0.1, E: 0, C: 0.3 },
      },
      {
        text: "🎬 Способ смотреть контент в оригинале",
        value: "a8",
        scores: { R: 0, I: 0.2, A: 1.0, S: 0.1, E: 0, C: 0 },
      },
      {
        text: "💼 Полезный навык для карьеры",
        value: "e8",
        scores: { R: 0, I: 0.1, A: 0, S: 0.1, E: 1.0, C: 0.2 },
      },
    ],
  },

  {
    id: "q20",
    text: "🎓 Какой формат обучения тебе ближе?",
    type: "MULTIPLE_CHOICE",
    section: 2,
    orderIndex: 20,
    difficulty: 2,
    primaryDimension: "C",
    // Measures: learning style preferences across RIASEC
    options: [
      {
        text: "📝 Структурированные уроки с чётким планом",
        value: "c6",
        scores: { R: 0, I: 0.1, A: 0, S: 0, E: 0, C: 1.0 },
      },
      {
        text: "🔬 Практические занятия и эксперименты",
        value: "ri",
        scores: { R: 0.7, I: 0.3, A: 0, S: 0, E: 0, C: 0 },
      },
      {
        text: "💭 Дискуссии и обмен мнениями",
        value: "se",
        scores: { R: 0, I: 0.1, A: 0.1, S: 1.0, E: 0.2, C: 0 },
      },
      {
        text: "🎨 Творческие проекты без жёстких рамок",
        value: "a9",
        scores: { R: 0, I: 0.1, A: 1.0, S: 0, E: 0.1, C: 0 },
      },
    ],
  },

  {
    id: "q21",
    text: "📱 Если бы ты создавал/а приложение, это было бы...",
    type: "MULTIPLE_CHOICE",
    section: 2,
    orderIndex: 21,
    difficulty: 2,
    primaryDimension: "A",
    // Measures: application of interests in tech context
    options: [
      {
        text: "🎨 Креативный редактор или музыкальное приложение",
        value: "a10",
        scores: { R: 0.1, I: 0.2, A: 1.0, S: 0, E: 0, C: 0 },
      },
      {
        text: "🧠 Образовательная платформа или игра-головоломка",
        value: "i10",
        scores: { R: 0, I: 1.0, A: 0.1, S: 0.2, E: 0, C: 0 },
      },
      {
        text: "💬 Социальная сеть для общения и помощи",
        value: "s9",
        scores: { R: 0, I: 0, A: 0.1, S: 1.0, E: 0.2, C: 0 },
      },
      {
        text: "📈 Трекер привычек или финансовое приложение",
        value: "ce",
        scores: { R: 0, I: 0.2, A: 0, S: 0, E: 0.4, C: 1.0 },
      },
    ],
  },

  {
    id: "q22",
    text: "🏫 Самое крутое внеклассное занятие для тебя?",
    type: "MULTIPLE_CHOICE",
    section: 2,
    orderIndex: 22,
    difficulty: 2,
    primaryDimension: "S",
    // Measures: extracurricular preferences
    options: [
      {
        text: "🤝 Волонтёрство или совет старшеклассников",
        value: "s10",
        scores: { R: 0, I: 0, A: 0, S: 1.0, E: 0.3, C: 0 },
      },
      {
        text: "🎭 Театральный кружок или музыкальная группа",
        value: "a11",
        scores: { R: 0, I: 0, A: 1.0, S: 0.3, E: 0.2, C: 0 },
      },
      {
        text: "🔬 Научный кружок или олимпиады",
        value: "i11",
        scores: { R: 0.1, I: 1.0, A: 0, S: 0, E: 0.1, C: 0.1 },
      },
      {
        text: "💼 Бизнес-клуб или дебаты",
        value: "e9",
        scores: { R: 0, I: 0.2, A: 0, S: 0.2, E: 1.0, C: 0 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3 (Q23-33): Work preferences, values — MEDIUM-HARD
  // ═══════════════════════════════════════════════════════════════

  {
    id: "q23",
    text: "💭 Что для тебя важнее в будущей работе?",
    type: "MULTIPLE_CHOICE",
    section: 3,
    orderIndex: 23,
    difficulty: 3,
    primaryDimension: "E",
    // Measures: core work values
    options: [
      {
        text: "💰 Высокий доход и карьерный рост",
        value: "e10",
        scores: { R: 0, I: 0, A: 0, S: 0, E: 1.0, C: 0.2 },
      },
      {
        text: "❤️ Помощь людям и социальная значимость",
        value: "s11",
        scores: { R: 0, I: 0, A: 0, S: 1.0, E: 0, C: 0 },
      },
      {
        text: "🎨 Творческая свобода и самовыражение",
        value: "a12",
        scores: { R: 0, I: 0.1, A: 1.0, S: 0, E: 0, C: 0 },
      },
      {
        text: "🔬 Интересные задачи и интеллектуальный вызов",
        value: "i12",
        scores: { R: 0.1, I: 1.0, A: 0.1, S: 0, E: 0, C: 0 },
      },
    ],
  },

  {
    id: "q24",
    text: "🏢 Где бы ты хотел/а работать?",
    type: "MULTIPLE_CHOICE",
    section: 3,
    orderIndex: 24,
    difficulty: 3,
    primaryDimension: "R",
    // Measures: work environment preferences
    options: [
      {
        text: "🏗️ На производстве, стройке, в мастерской",
        value: "r4",
        scores: { R: 1.0, I: 0.1, A: 0, S: 0, E: 0, C: 0 },
      },
      {
        text: "🏥 В больнице, школе, социальном центре",
        value: "s12",
        scores: { R: 0, I: 0.2, A: 0, S: 1.0, E: 0, C: 0.1 },
      },
      {
        text: "🏙️ В офисе крупной компании",
        value: "ce2",
        scores: { R: 0, I: 0.1, A: 0, S: 0.1, E: 0.5, C: 0.5 },
      },
      {
        text: "🏠 Удалённо или в своей студии",
        value: "ai",
        scores: { R: 0, I: 0.4, A: 0.5, S: 0, E: 0.1, C: 0 },
      },
    ],
  },

  {
    id: "q25",
    text: "💼 Какая сфера деятельности тебя привлекает больше всего?",
    type: "MULTIPLE_CHOICE",
    section: 3,
    orderIndex: 25,
    difficulty: 2,
    primaryDimension: "E", // Career ambitions
    options: [
      {
        text: "💻 IT, технологии, инженерия",
        value: "tech",
        scores: { R: 0.3, I: 0.8, A: 0, S: 0, E: 0.2, C: 0.1 },
      },
      {
        text: "🎨 Творчество, дизайн, медиа",
        value: "creative",
        scores: { R: 0, I: 0.1, A: 1.0, S: 0.1, E: 0.2, C: 0 },
      },
      {
        text: "💰 Бизнес, менеджмент, финансы",
        value: "business",
        scores: { R: 0, I: 0.1, A: 0, S: 0.1, E: 1.0, C: 0.3 },
      },
      {
        text: "🏥 Медицина, помощь людям, образование",
        value: "social",
        scores: { R: 0, I: 0.3, A: 0, S: 1.0, E: 0.1, C: 0.1 },
      },
    ],
  },

  {
    id: "q26",
    text: "👥 Оцени: как тебе комфортнее работать — одному или в команде?",
    type: "RATING",
    section: 3,
    orderIndex: 26,
    difficulty: 2,
    primaryDimension: "S",
    // Measures: social vs independent work preference
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Один/одна — так эффективнее 🧍",
        max: "5 = В команде — вместе круче 👥",
      },
    },
  },

  {
    id: "q27",
    text: "⏰ Какой график работы тебе ближе?",
    type: "MULTIPLE_CHOICE",
    section: 3,
    orderIndex: 27,
    difficulty: 2,
    primaryDimension: "C",
    // Measures: structure vs flexibility preference
    options: [
      {
        text: "📅 Чёткий график 9-18, стабильность",
        value: "c7",
        scores: { R: 0.2, I: 0, A: 0, S: 0.1, E: 0, C: 1.0 },
      },
      {
        text: "🌊 Гибкий график, главное — результат",
        value: "ae",
        scores: { R: 0, I: 0.3, A: 0.4, S: 0, E: 0.3, C: 0 },
      },
      {
        text: "🔥 Проектная работа с дедлайнами",
        value: "ei",
        scores: { R: 0, I: 0.3, A: 0.2, S: 0, E: 0.5, C: 0.2 },
      },
      {
        text: "🌙 Не важно, лишь бы нравилось",
        value: "as",
        scores: { R: 0, I: 0.1, A: 0.4, S: 0.4, E: 0.1, C: 0 },
      },
    ],
  },

  {
    id: "q28",
    text: "📈 Насколько тебя мотивирует конкуренция?",
    type: "RATING",
    section: 3,
    orderIndex: 28,
    difficulty: 2,
    primaryDimension: "E",
    // Measures: E (competitive) drive
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Не мотивирует, лучше сотрудничать 🤝",
        max: "5 = Очень! Люблю побеждать 🏆",
      },
    },
  },

  {
    id: "q29",
    text: "🎯 Оцени по шкале: деньги vs любимое дело — что важнее?",
    type: "RATING",
    section: 3,
    orderIndex: 29,
    difficulty: 3,
    primaryDimension: "A",
    // Measures: intrinsic (A/S) vs extrinsic (E/C) motivation
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Деньги важнее 💰",
        max: "5 = Любимое дело важнее ❤️",
      },
    },
  },

  {
    id: "q30",
    text: "🔄 Рутина или разнообразие?",
    type: "MULTIPLE_CHOICE",
    section: 3,
    orderIndex: 30,
    difficulty: 2,
    primaryDimension: "C",
    // Measures: preference for stability vs novelty
    options: [
      {
        text: "📋 Предсказуемые задачи — знаю, что делать",
        value: "c8",
        scores: { R: 0.2, I: 0, A: 0, S: 0, E: 0, C: 1.0 },
      },
      {
        text: "🎢 Каждый день новое — не скучно!",
        value: "ae2",
        scores: { R: 0.1, I: 0.2, A: 0.4, S: 0.1, E: 0.3, C: 0 },
      },
      {
        text: "⚖️ Баланс: база + новые вызовы",
        value: "balanced",
        scores: { R: 0.1, I: 0.2, A: 0.1, S: 0.1, E: 0.2, C: 0.3 },
      },
    ],
  },

  {
    id: "q31",
    text: "🎓 Готов/а учиться много лет ради профессии мечты?",
    type: "BINARY",
    section: 3,
    orderIndex: 31,
    difficulty: 2,
    primaryDimension: "I",
    // Measures: commitment to long-term education
    options: [
      {
        text: "📚 Да, образование того стоит",
        value: "yes",
        scores: { R: 0, I: 1.0, A: 0.1, S: 0.2, E: 0.1, C: 0.1 },
      },
      {
        text: "🚀 Лучше быстрее начать работать",
        value: "no",
        scores: { R: 0.3, I: 0, A: 0.2, S: 0, E: 0.4, C: 0.2 },
      },
    ],
  },

  {
    id: "q32",
    text: "💡 Оцени себя: ты больше исполнитель или генератор идей?",
    type: "RATING",
    section: 3,
    orderIndex: 32,
    difficulty: 2,
    primaryDimension: "A",
    // Measures: creative/generative vs implementation preference
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Исполнитель 🛠️",
        max: "5 = Генератор идей 💡",
      },
    },
  },

  {
    id: "q33",
    // DYNAMIC QUESTION - Content generated at runtime by mirror.service.ts
    // This is a placeholder for the database; actual question is personalized
    // based on student's Q1-Q32 answers
    text: "[DYNAMIC] Секретный вопрос — угадай свой RIASEC паттерн",
    type: "MULTIPLE_CHOICE",
    section: 3,
    orderIndex: 33,
    difficulty: 2,
    primaryDimension: "I", // Fallback if dynamic generation fails
    isEasterEgg: true,
    hint: "Этот вопрос анализирует твои предыдущие ответы и предлагает угадать свой паттерн",
    // Empty options - generated dynamically based on student's pattern
    // Fallback options in case dynamic generation fails
    options: [
      {
        text: "🧠 Исследовать и создавать новое",
        value: "AI",
        scores: { R: 0, I: 0.7, A: 0.3, S: 0, E: 0, C: 0 },
      },
      {
        text: "🤝 Общаться и вести за собой",
        value: "ES",
        scores: { R: 0, I: 0, A: 0, S: 0.7, E: 0.3, C: 0 },
      },
      {
        text: "🔬 Разбираться в сложном и делать руками",
        value: "IR",
        scores: { R: 0.3, I: 0.7, A: 0, S: 0, E: 0, C: 0 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4 (Q34-44): Social vs solo, structure vs freedom — MEDIUM
  // ═══════════════════════════════════════════════════════════════

  {
    id: "q34",
    text: "🗣️ Оцени: насколько тебе комфортно выступать перед аудиторией?",
    type: "RATING",
    section: 4,
    orderIndex: 34,
    difficulty: 2,
    primaryDimension: "E",
    // Measures: E/S (public speaking, influence)
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Ужас, избегаю 😰",
        max: "5 = Кайф, люблю! 🎤",
      },
    },
  },

  {
    id: "q35",
    text: "📊 Насколько тебе нравится работать с цифрами и таблицами?",
    type: "RATING",
    section: 4,
    orderIndex: 35,
    difficulty: 2,
    primaryDimension: "C",
    // Measures: C (data, organization)
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Не моё 🤯",
        max: "5 = Люблю! 📈",
      },
    },
  },

  {
    id: "q36",
    text: "🧩 Как ты решаешь сложные проблемы?",
    type: "MULTIPLE_CHOICE",
    section: 4,
    orderIndex: 36,
    difficulty: 2,
    primaryDimension: "I",
    // Measures: problem-solving style
    options: [
      {
        text: "🔬 Анализирую данные, ищу закономерности",
        value: "i13",
        scores: { R: 0.1, I: 1.0, A: 0, S: 0, E: 0, C: 0.3 },
      },
      {
        text: "💡 Ищу нестандартные, креативные решения",
        value: "a13",
        scores: { R: 0, I: 0.3, A: 1.0, S: 0, E: 0.1, C: 0 },
      },
      {
        text: "👥 Обсуждаю с другими, ищу разные точки зрения",
        value: "s13",
        scores: { R: 0, I: 0.1, A: 0.1, S: 1.0, E: 0.2, C: 0 },
      },
      {
        text: "📝 Разбиваю на шаги и методично решаю",
        value: "c9",
        scores: { R: 0.2, I: 0.2, A: 0, S: 0, E: 0.1, C: 1.0 },
      },
    ],
  },

  {
    id: "q37",
    text: "🎭 Оцени: насколько легко тебе понимать чувства других людей?",
    type: "RATING",
    section: 4,
    orderIndex: 37,
    difficulty: 2,
    primaryDimension: "S",
    // Measures: S (empathy, social awareness)
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Сложно 🤔",
        max: "5 = Легко, сразу чувствую 💫",
      },
    },
  },

  {
    id: "q38",
    text: "📱 Насколько тебе нравится разбираться в технике — смартфонах, компьютерах, гаджетах?",
    type: "RATING",
    section: 4,
    orderIndex: 38,
    difficulty: 2,
    primaryDimension: "R",
    // Measures: R (technical/gadgets) - differentiated from Q7 (general hands-on)
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Пользуюсь, но не вникаю 🤷",
        max: "5 = Люблю копаться в настройках! 🔧",
      },
    },
  },

  {
    id: "q39",
    text: "📜 Как ты относишься к правилам и инструкциям?",
    type: "MULTIPLE_CHOICE",
    section: 4,
    orderIndex: 39,
    difficulty: 2,
    primaryDimension: "C",
    // Measures: C (rule-following) vs A/E (autonomy)
    options: [
      {
        text: "✅ Чётко следую — так надёжнее",
        value: "c10",
        scores: { R: 0.1, I: 0, A: 0, S: 0, E: 0, C: 1.0 },
      },
      {
        text: "🔄 Адаптирую под ситуацию",
        value: "balanced2",
        scores: { R: 0, I: 0.2, A: 0, S: 0, E: 0.8, C: 0.2 },
      },
      {
        text: "🚀 Часто ищу свой путь",
        value: "ae3",
        scores: { R: 0, I: 0.1, A: 0.8, S: 0, E: 0.3, C: 0 },
      },
      {
        text: "❓ Зависит от того, имеют ли они смысл",
        value: "i14",
        scores: { R: 0, I: 1.0, A: 0, S: 0, E: 0.1, C: 0 },
      },
    ],
  },

  {
    id: "q40",
    text: "💭 Какое качество тебя описывает лучше всего?",
    type: "MULTIPLE_CHOICE",
    section: 4,
    orderIndex: 40,
    difficulty: 2,
    primaryDimension: "S",
    options: [
      {
        text: "🤝 Общительный/ая, люблю работать с людьми",
        value: "social",
        scores: { R: 0, I: 0, A: 0.1, S: 1.0, E: 0.2, C: 0 },
      },
      {
        text: "🧠 Аналитичный/ая, люблю разбираться в деталях",
        value: "analytical",
        scores: { R: 0.1, I: 1.0, A: 0, S: 0, E: 0, C: 0.2 },
      },
      {
        text: "🎨 Творческий/ая, ищу нестандартные решения",
        value: "creative",
        scores: { R: 0, I: 0.1, A: 1.0, S: 0, E: 0.1, C: 0 },
      },
      {
        text: "📋 Организованный/ая, люблю порядок",
        value: "organized",
        scores: { R: 0.1, I: 0, A: 0, S: 0, E: 0.1, C: 1.0 },
      },
    ],
  },

  {
    id: "q41",
    text: "🎯 Ты лучше справляешься с задачами, когда...",
    type: "MULTIPLE_CHOICE",
    section: 4,
    orderIndex: 41,
    difficulty: 2,
    primaryDimension: "E",
    // Measures: task context preferences
    options: [
      {
        text: "🎯 Есть чёткая цель и понятный результат",
        value: "c11",
        scores: { R: 0.2, I: 0.1, A: 0, S: 0, E: 0.2, C: 1.0 },
      },
      {
        text: "🌟 Есть свобода для экспериментов",
        value: "a14",
        scores: { R: 0, I: 0.3, A: 1.0, S: 0, E: 0.1, C: 0 },
      },
      {
        text: "👥 Есть поддержка команды",
        value: "s14",
        scores: { R: 0, I: 0, A: 0, S: 1.0, E: 0.2, C: 0 },
      },
      {
        text: "🏆 Есть вызов и возможность проявить себя",
        value: "e11",
        scores: { R: 0.1, I: 0.2, A: 0.1, S: 0, E: 1.0, C: 0 },
      },
    ],
  },

  {
    id: "q42",
    text: "📱 Если бы ты вёл/а блог, о чём бы он был?",
    type: "MULTIPLE_CHOICE",
    section: 4,
    orderIndex: 42,
    difficulty: 2,
    primaryDimension: "A",
    // Measures: content creation interests
    options: [
      {
        text: "🔧 DIY, лайфхаки, обзоры техники",
        value: "r5",
        scores: { R: 1.0, I: 0.2, A: 0.2, S: 0, E: 0.1, C: 0 },
      },
      {
        text: "🎨 Творчество, арт, музыка, мода",
        value: "a15",
        scores: { R: 0, I: 0, A: 1.0, S: 0.1, E: 0.2, C: 0 },
      },
      {
        text: "📚 Образование, наука, книги",
        value: "i15",
        scores: { R: 0, I: 1.0, A: 0.1, S: 0.2, E: 0, C: 0 },
      },
      {
        text: "💼 Бизнес, финансы, саморазвитие",
        value: "e12",
        scores: { R: 0, I: 0.1, A: 0, S: 0, E: 1.0, C: 0.3 },
      },
    ],
  },

  {
    id: "q43",
    text: "⚡ Оцени себя: ты за быстрые решения или тщательный анализ?",
    type: "RATING",
    section: 4,
    orderIndex: 43,
    difficulty: 2,
    primaryDimension: "I",
    // Measures: I/C (analytical) vs E (action-oriented)
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Быстро решаю ⚡",
        max: "5 = Тщательно анализирую 🔍",
      },
    },
  },

  {
    id: "q44",
    text: "✨ Насколько тебе важно выражать свою индивидуальность?",
    type: "RATING",
    section: 4,
    orderIndex: 44,
    difficulty: 2,
    primaryDimension: "A",
    // Measures: A (self-expression, individuality)
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Не особо 📋",
        max: "5 = Очень! Я уникален/а 🦋",
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5 (Q45-55): Quick confirmations, closure — EASY
  // ═══════════════════════════════════════════════════════════════

  {
    id: "q45",
    text: "📋 Тебе нравится чётко следовать инструкциям и планам?",
    type: "BINARY",
    section: 5,
    orderIndex: 45,
    difficulty: 1,
    primaryDimension: "C",
    options: [
      {
        text: "✅ Да, так проще и надёжнее",
        value: "yes",
        scores: { R: 0.1, I: 0, A: 0, S: 0, E: 0, C: 1.0 },
      },
      {
        text: "🔄 Нет, предпочитаю импровизировать",
        value: "no",
        scores: { R: 0, I: 0.1, A: 0.5, S: 0, E: 0.3, C: 0 },
      },
    ],
  },

  {
    id: "q46",
    text: "🔬 Тебе интересно читать научные статьи в свободное время?",
    type: "BINARY",
    section: 5,
    orderIndex: 46,
    difficulty: 1,
    primaryDimension: "I",
    options: [
      {
        text: "📚 Да, это интересно!",
        value: "yes",
        scores: { R: 0, I: 1.0, A: 0.1, S: 0, E: 0, C: 0.1 },
      },
      {
        text: "🎬 Нет, предпочитаю другой контент",
        value: "no",
        scores: { R: 0.1, I: 0, A: 0.3, S: 0.2, E: 0.2, C: 0 },
      },
    ],
  },

  {
    id: "q47",
    text: "🎨 Тебе нравится рисовать, лепить или создавать что-то руками?",
    type: "BINARY",
    section: 5,
    orderIndex: 47,
    difficulty: 1,
    primaryDimension: "A",
    options: [
      {
        text: "✨ Да, люблю!",
        value: "yes",
        scores: { R: 0.3, I: 0, A: 1.0, S: 0, E: 0, C: 0 },
      },
      {
        text: "🤷 Нет, не моё",
        value: "no",
        scores: { R: 0.1, I: 0.2, A: 0, S: 0.1, E: 0.2, C: 0.2 },
      },
    ],
  },

  {
    id: "q48",
    text: "🤝 Тебе нравится работать с детьми или подростками?",
    type: "BINARY",
    section: 5,
    orderIndex: 48,
    difficulty: 1,
    primaryDimension: "S",
    options: [
      {
        text: "👶 Да, нравится!",
        value: "yes",
        scores: { R: 0, I: 0, A: 0.1, S: 1.0, E: 0.2, C: 0 },
      },
      {
        text: "😅 Нет, не уверен/а",
        value: "no",
        scores: { R: 0.2, I: 0.2, A: 0.1, S: 0, E: 0.1, C: 0.2 },
      },
    ],
  },

  {
    id: "q49",
    text: "💼 Тебе нравится вести переговоры и убеждать людей?",
    type: "BINARY",
    section: 5,
    orderIndex: 49,
    difficulty: 1,
    primaryDimension: "E",
    options: [
      {
        text: "🎯 Да, это моё!",
        value: "yes",
        scores: { R: 0, I: 0, A: 0, S: 0.2, E: 1.0, C: 0 },
      },
      {
        text: "😶 Не очень комфортно",
        value: "no",
        scores: { R: 0.2, I: 0.2, A: 0.2, S: 0.2, E: 0, C: 0.2 },
      },
    ],
  },

  {
    id: "q50",
    text: "📁 Тебе нравится сортировать файлы и наводить порядок в документах?",
    type: "BINARY",
    section: 5,
    orderIndex: 50,
    difficulty: 1,
    primaryDimension: "C",
    options: [
      {
        text: "✅ Да, люблю порядок!",
        value: "yes",
        scores: { R: 0, I: 0.1, A: 0, S: 0, E: 0, C: 1.0 },
      },
      {
        text: "🗑️ Нет, это скучно",
        value: "no",
        scores: { R: 0.1, I: 0.1, A: 0.3, S: 0.1, E: 0.2, C: 0 },
      },
    ],
  },

  {
    id: "q51",
    text: "🌿 Тебе нравится ухаживать за растениями или животными?",
    type: "BINARY",
    section: 5,
    orderIndex: 51,
    difficulty: 1,
    primaryDimension: "R",
    options: [
      {
        text: "🐾 Да, с удовольствием!",
        value: "yes",
        scores: { R: 1.0, I: 0.1, A: 0, S: 0.3, E: 0, C: 0.1 },
      },
      {
        text: "🏙️ Нет, не особо",
        value: "no",
        scores: { R: 0, I: 0.2, A: 0.2, S: 0, E: 0.2, C: 0.1 },
      },
    ],
  },

  {
    id: "q52",
    text: "🎯 Что для тебя важнее в будущей работе?",
    type: "MULTIPLE_CHOICE",
    section: 5,
    orderIndex: 52,
    difficulty: 1,
    primaryDimension: "E",
    options: [
      {
        text: "💰 Высокая зарплата и карьерный рост",
        value: "money",
        scores: { R: 0, I: 0, A: 0, S: 0, E: 1.0, C: 0.2 },
      },
      {
        text: "❤️ Чтобы работа нравилась и была интересной",
        value: "passion",
        scores: { R: 0.1, I: 0.2, A: 0.8, S: 0.1, E: 0, C: 0 },
      },
      {
        text: "🤝 Помогать людям и приносить пользу",
        value: "helping",
        scores: { R: 0, I: 0.1, A: 0, S: 1.0, E: 0.1, C: 0 },
      },
      {
        text: "⚖️ Стабильность и баланс работы и жизни",
        value: "balance",
        scores: { R: 0.1, I: 0.1, A: 0, S: 0.1, E: 0.1, C: 0.8 },
      },
    ],
  },

  {
    id: "q53",
    text: "⚡ Быстро: тебе ближе создавать новое или улучшать существующее?",
    type: "BINARY",
    section: 5,
    orderIndex: 53,
    difficulty: 1,
    primaryDimension: "A",
    options: [
      {
        text: "🆕 Создавать новое",
        value: "create",
        scores: { R: 0.1, I: 0.2, A: 1.0, S: 0, E: 0.3, C: 0 },
      },
      {
        text: "🔧 Улучшать существующее",
        value: "improve",
        scores: { R: 0.3, I: 0.3, A: 0, S: 0.1, E: 0.1, C: 0.4 },
      },
    ],
  },

  {
    id: "q54",
    text: "🎯 Быстрый выбор: ты скорее реалист или мечтатель?",
    type: "BINARY",
    section: 5,
    orderIndex: 54,
    difficulty: 1,
    primaryDimension: "I",
    options: [
      {
        text: "🦅 Мечтатель — вижу возможности",
        value: "dreamer",
        scores: { R: 0, I: 0.2, A: 0.5, S: 0.1, E: 0.3, C: 0 },
      },
      {
        text: "🦊 Реалист — вижу факты",
        value: "realist",
        scores: { R: 0.3, I: 0.4, A: 0, S: 0, E: 0.1, C: 0.4 },
      },
    ],
  },

  {
    id: "q55",
    text: "🎉 Финальный вопрос! Как тебе этот тест?",
    type: "MULTIPLE_CHOICE",
    section: 5,
    orderIndex: 55,
    difficulty: 1,
    primaryDimension: "S", // Engagement/feedback question
    options: [
      {
        text: "🔥 Было интересно, жду результаты!",
        value: "great",
        scores: { R: 0, I: 0.1, A: 0.1, S: 0.2, E: 0.2, C: 0 },
      },
      {
        text: "👍 Норм, посмотрим что выйдет",
        value: "ok",
        scores: { R: 0.1, I: 0.1, A: 0.1, S: 0.1, E: 0.1, C: 0.1 },
      },
      {
        text: "😴 Длинновато, но дошёл/дошла до конца",
        value: "long",
        scores: { R: 0.1, I: 0.1, A: 0, S: 0.1, E: 0, C: 0.2 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // NEW QUESTIONS Q56-Q60 (for 60-question O*NET standard)
  // ═══════════════════════════════════════════════════════════════

  {
    id: "q56",
    text: "🌲 Тебе нравится проводить время на природе — походы, рыбалка, работа в саду?",
    type: "RATING",
    section: 5,
    orderIndex: 56,
    difficulty: 1,
    primaryDimension: "R",
    // Measures: R (outdoor/nature) - distinct from tech-focused R questions
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Предпочитаю город и помещения 🏢",
        max: "5 = Обожаю! Природа — моя стихия 🏕️",
      },
    },
  },

  {
    id: "q57",
    text: "🔩 Интересно ли тебе конструировать, собирать модели, 3D-моделировать?",
    type: "BINARY",
    section: 5,
    orderIndex: 57,
    difficulty: 1,
    primaryDimension: "R",
    options: [
      {
        text: "✅ Да, люблю создавать что-то своими руками",
        value: "yes",
        scores: { R: 1.0, I: 0.2, A: 0.2, S: 0, E: 0, C: 0.1 },
      },
      {
        text: "❌ Нет, это не моё",
        value: "no",
        scores: { R: 0, I: 0.1, A: 0.2, S: 0.1, E: 0.1, C: 0 },
      },
    ],
  },

  {
    id: "q58",
    text: "📅 Насколько тебе важно планировать свой день и следовать расписанию?",
    type: "RATING",
    section: 5,
    orderIndex: 58,
    difficulty: 1,
    primaryDimension: "C",
    // Measures: C (organization/planning)
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Живу спонтанно, без плана 🎲",
        max: "5 = Всё по расписанию! 📋",
      },
    },
  },

  {
    id: "q59",
    text: "🗣️ Тебе нравится убеждать других в своей точке зрения?",
    type: "RATING",
    section: 5,
    orderIndex: 59,
    difficulty: 1,
    primaryDimension: "E",
    // Measures: E (persuasion/influence)
    ratingRange: {
      min: 1,
      max: 5,
      labels: {
        min: "1 = Не люблю спорить и убеждать 🤐",
        max: "5 = Люблю дебаты и переговоры! 🎤",
      },
    },
  },

  {
    id: "q60",
    text: "🎉 Последний вопрос! Готов ли ты узнать свои результаты?",
    type: "MULTIPLE_CHOICE",
    section: 5,
    orderIndex: 60,
    difficulty: 1,
    primaryDimension: "E", // Engagement question with E-bias
    options: [
      {
        text: "🚀 Да, покажите мне всё!",
        value: "excited",
        scores: { R: 0, I: 0.1, A: 0.1, S: 0.1, E: 0.3, C: 0 },
      },
      {
        text: "🤔 Интересно, что там вышло",
        value: "curious",
        scores: { R: 0, I: 0.3, A: 0.1, S: 0.1, E: 0.1, C: 0.1 },
      },
      {
        text: "😌 Посмотрю, но без особых ожиданий",
        value: "calm",
        scores: { R: 0.1, I: 0.1, A: 0, S: 0.2, E: 0, C: 0.2 },
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// DELIVERABLE 2: 40+ CAREER DATABASE (RUSSIAN MARKET)
// ═══════════════════════════════════════════════════════════════
/**
 * Career Database Design:
 * - Mix: 30% tech, 20% creative, 20% business, 15% medicine/science, 15% other
 * - Salaries based on hh.ru, Habr Career, SuperJob 2024-2025 data
 * - RIASEC profiles (0-100 scale)
 * - Both traditional and modern professions
 *
 * Salary Sources (accessed December 2024-2025):
 * - Habr Career: career.habr.com/salaries
 * - hh.ru: hh.ru/salary
 * - SuperJob: superjob.ru/pro
 * - ГородРабот: gorodrabot.ru/salary
 */

export const careers: Career[] = [
  // ═══════════════════════════════════════════════════════════════
  // TECHNOLOGY (12 careers) - 30%
  // ═══════════════════════════════════════════════════════════════

  {
    id: "backend-developer",
    title: "Backend Developer",
    titleRu: "Backend-разработчик",
    description: "Разработка серверной части приложений, API, баз данных",
    // I (problem-solving, logic) + R (technical implementation) + C (structured code)
    riasecProfile: { R: 45, I: 85, A: 25, S: 15, E: 20, C: 70 },
    salaryMin: 120000,
    salaryMax: 350000,
    salarySource: "Habr Career 2024: медиана 202K ₽",
    category: "technology",
    requiredSkills: ["Python/Java/Go", "SQL", "REST API", "Git", "Docker"],
    educationPath: ["Информатика ЕГЭ", "Профильная математика", "Курсы/Вуз IT"],
    universities: ["МФТИ", "ВШЭ ФКН", "МГУ ВМК", "ИТМО", "СПбГУ"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "frontend-developer",
    title: "Frontend Developer",
    titleRu: "Frontend-разработчик",
    description: "Создание пользовательских интерфейсов, веб-приложений",
    // A (visual design) + I (logic) + R (technical)
    riasecProfile: { R: 40, I: 70, A: 55, S: 20, E: 15, C: 50 },
    salaryMin: 100000,
    salaryMax: 300000,
    salarySource: "Habr Career 2024: медиана 166K ₽",
    category: "technology",
    requiredSkills: ["JavaScript/TypeScript", "React/Vue", "HTML/CSS", "Git"],
    educationPath: ["Информатика ЕГЭ", "Курсы frontend", "Портфолио"],
    universities: ["Самообучение", "ВШЭ", "Нетология", "Яндекс.Практикум"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "data-scientist",
    title: "Data Scientist",
    titleRu: "Дата-сайентист",
    description: "Анализ данных, машинное обучение, построение ML-моделей",
    // I (research, analysis) + C (data organization) + R (technical tools)
    riasecProfile: { R: 35, I: 95, A: 30, S: 20, E: 25, C: 75 },
    salaryMin: 150000,
    salaryMax: 450000,
    salarySource: "hh.ru 2024: медиана 242.8K ₽",
    category: "technology",
    requiredSkills: [
      "Python",
      "SQL",
      "Статистика",
      "ML/DL",
      "Pandas",
      "Sklearn",
    ],
    educationPath: [
      "Математика ЕГЭ 90+",
      "Программирование",
      "Магистратура ML",
    ],
    universities: ["МФТИ", "ВШЭ", "МГУ ВМК", "Сколтех", "ИТМО"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    titleRu: "DevOps-инженер",
    description: "Автоматизация развёртывания, CI/CD, инфраструктура",
    // R (systems) + I (problem-solving) + C (processes)
    riasecProfile: { R: 65, I: 80, A: 15, S: 20, E: 25, C: 75 },
    salaryMin: 180000,
    salaryMax: 450000,
    salarySource: "hh.ru 2024: медиана 245.7K ₽",
    category: "technology",
    requiredSkills: [
      "Linux",
      "Docker/K8s",
      "CI/CD",
      "Terraform",
      "Python/Bash",
    ],
    educationPath: ["Системное администрирование", "Облачные технологии"],
    universities: ["МФТИ", "ВШЭ", "Курсы DevOps", "Практический опыт"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "qa-engineer",
    title: "QA Engineer",
    titleRu: "QA-инженер / Тестировщик",
    description: "Тестирование ПО, автоматизация тестов, контроль качества",
    // C (systematic testing) + I (analytical) + R (technical)
    riasecProfile: { R: 40, I: 70, A: 15, S: 25, E: 15, C: 85 },
    salaryMin: 80000,
    salaryMax: 250000,
    salarySource: "Habr Career 2024: медиана 127K ₽",
    category: "technology",
    requiredSkills: ["SQL", "Тест-дизайн", "Автотесты", "API тестирование"],
    educationPath: ["Курсы тестирования", "Практика", "ISTQB сертификация"],
    universities: ["Курсы QA", "Яндекс.Практикум", "GeekBrains"],
    outlook: "stable",
    demandLevel: "high",
  },

  {
    id: "product-manager",
    title: "Product Manager",
    titleRu: "Продакт-менеджер",
    description:
      "Управление продуктом, стратегия, работа с командой и метриками",
    // E (leadership) + S (team work) + I (analytics)
    riasecProfile: { R: 15, I: 65, A: 35, S: 55, E: 85, C: 50 },
    salaryMin: 150000,
    salaryMax: 400000,
    salarySource: "Habr Career 2024: медиана 200K+ ₽",
    category: "technology",
    requiredSkills: [
      "Product metrics",
      "Agile/Scrum",
      "UX",
      "Аналитика",
      "Коммуникация",
    ],
    educationPath: ["Курсы Product Management", "Опыт в IT", "MBA опционально"],
    universities: ["ВШЭ", "Skolkovo", "Product Star", "GoPractice"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "mobile-developer",
    title: "Mobile Developer",
    titleRu: "Мобильный разработчик",
    description: "Разработка приложений для iOS и Android",
    // R (technical) + I (problem-solving) + A (UX/interface)
    riasecProfile: { R: 50, I: 75, A: 45, S: 15, E: 20, C: 55 },
    salaryMin: 130000,
    salaryMax: 380000,
    salarySource: "Habr Career 2024: Kotlin 296K ₽, Swift 295K ₽",
    category: "technology",
    requiredSkills: ["Swift/Kotlin", "Flutter/React Native", "UI/UX", "Git"],
    educationPath: ["Курсы мобильной разработки", "Портфолио приложений"],
    universities: ["МФТИ", "ВШЭ", "Онлайн-курсы", "Самообучение"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "system-analyst",
    title: "System Analyst",
    titleRu: "Системный аналитик",
    description: "Анализ требований, проектирование систем, документация",
    // I (analysis) + C (documentation) + S (stakeholder work)
    riasecProfile: { R: 25, I: 85, A: 20, S: 50, E: 40, C: 80 },
    salaryMin: 120000,
    salaryMax: 300000,
    salarySource: "Habr Career 2024: медиана ~200K ₽",
    category: "technology",
    requiredSkills: [
      "UML",
      "SQL",
      "BPMN",
      "Техническое письмо",
      "Коммуникация",
    ],
    educationPath: ["IT-образование", "Курсы бизнес-анализа"],
    universities: ["ВШЭ", "РАНХиГС", "МФТИ", "Курсы Analyst"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "1c-developer",
    title: "1C Developer",
    titleRu: "Программист 1С",
    description: "Разработка и доработка решений на платформе 1С",
    // C (business processes) + I (programming) + R (technical)
    riasecProfile: { R: 35, I: 65, A: 15, S: 30, E: 30, C: 90 },
    salaryMin: 100000,
    salaryMax: 280000,
    salarySource: "Habr Career 2024: медиана 180K ₽ (+18%)",
    category: "technology",
    requiredSkills: ["1С", "SQL", "Бухучёт", "Налоги", "Бизнес-процессы"],
    educationPath: ["Курсы 1С", "Сертификация 1С:Специалист"],
    universities: ["1С:Учебный центр", "Специализированные курсы"],
    outlook: "stable",
    demandLevel: "high",
  },

  {
    id: "cybersecurity-specialist",
    title: "Cybersecurity Specialist",
    titleRu: "Специалист по кибербезопасности",
    description: "Защита информационных систем, анализ угроз",
    // I (analytical) + R (technical) + C (compliance)
    riasecProfile: { R: 55, I: 90, A: 15, S: 20, E: 30, C: 70 },
    salaryMin: 150000,
    salaryMax: 400000,
    salarySource: "hh.ru 2024: растущий спрос",
    category: "technology",
    requiredSkills: ["Сети", "Linux", "Криптография", "SIEM", "Pentest"],
    educationPath: ["ИБ образование", "Сертификации CISSP/CEH"],
    universities: [
      "МФТИ",
      "МГТУ им. Баумана",
      "МИРЭА",
      "Positive Technologies",
    ],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "game-developer",
    title: "Game Developer",
    titleRu: "Разработчик игр",
    description: "Создание компьютерных и мобильных игр",
    // A (creative) + R (technical) + I (problem-solving)
    riasecProfile: { R: 55, I: 70, A: 75, S: 20, E: 20, C: 40 },
    salaryMin: 100000,
    salaryMax: 350000,
    salarySource: "Habr Career 2024: геймдев ~150-300K ₽",
    category: "technology",
    requiredSkills: ["Unity/Unreal", "C++/C#", "3D/2D графика", "Геймдизайн"],
    educationPath: ["Курсы геймдева", "Портфолио игр", "Game Jams"],
    universities: ["ВШЭ Game Design", "Scream School", "Курсы Unity/Unreal"],
    outlook: "growing",
    demandLevel: "medium",
  },

  {
    id: "ai-ml-engineer",
    title: "AI/ML Engineer",
    titleRu: "AI/ML-инженер",
    description: "Разработка и внедрение моделей искусственного интеллекта",
    // I (research) + R (implementation) + C (data pipelines)
    riasecProfile: { R: 45, I: 95, A: 25, S: 15, E: 25, C: 65 },
    salaryMin: 200000,
    salaryMax: 600000,
    salarySource: "Habr Career 2024: топ по зарплатам в IT",
    category: "technology",
    requiredSkills: [
      "Python",
      "PyTorch/TensorFlow",
      "MLOps",
      "Математика",
      "NLP/CV",
    ],
    educationPath: ["Магистратура ML/AI", "Научные публикации", "Kaggle"],
    universities: ["МФТИ", "Сколтех", "ВШЭ", "MIT/Stanford онлайн"],
    outlook: "growing",
    demandLevel: "high",
  },

  // ═══════════════════════════════════════════════════════════════
  // CREATIVE (8 careers) - 20%
  // ═══════════════════════════════════════════════════════════════

  {
    id: "ux-ui-designer",
    title: "UX/UI Designer",
    titleRu: "UX/UI-дизайнер",
    description: "Проектирование пользовательских интерфейсов и опыта",
    // A (visual design) + I (user research) + S (empathy)
    riasecProfile: { R: 25, I: 60, A: 90, S: 55, E: 25, C: 45 },
    salaryMin: 100000,
    salaryMax: 300000,
    salarySource: "Habr Career 2024: медиана 115K ₽ (+13%)",
    category: "creative",
    requiredSkills: ["Figma", "Прототипирование", "UX Research", "UI Kit"],
    educationPath: ["Курсы UX/UI", "Портфолио", "Дизайн-мышление"],
    universities: ["Британка", "ВШЭ Дизайн", "Skillbox", "Яндекс.Практикум"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "graphic-designer",
    title: "Graphic Designer",
    titleRu: "Графический дизайнер",
    description: "Создание визуального контента, брендинг, полиграфия",
    // A (artistic) + C (layout rules) + R (tools)
    riasecProfile: { R: 30, I: 35, A: 95, S: 30, E: 25, C: 50 },
    salaryMin: 60000,
    salaryMax: 200000,
    salarySource: "Habr Career 2024: дизайнеры 95-150K ₽",
    category: "creative",
    requiredSkills: [
      "Adobe CC",
      "Figma",
      "Типографика",
      "Композиция",
      "Брендинг",
    ],
    educationPath: ["Художественное образование", "Курсы дизайна", "Портфолио"],
    universities: ["Британка", "Строгановка", "ВШЭ Дизайн", "Skillbox"],
    outlook: "stable",
    demandLevel: "medium",
  },

  {
    id: "motion-designer",
    title: "Motion Designer",
    titleRu: "Моушн-дизайнер",
    description: "Создание анимации, видеографики, спецэффектов",
    // A (creative animation) + R (technical tools) + I (problem-solving)
    riasecProfile: { R: 40, I: 50, A: 90, S: 20, E: 25, C: 45 },
    salaryMin: 80000,
    salaryMax: 250000,
    salarySource: "hh.ru 2024: медиана ~120-180K ₽",
    category: "creative",
    requiredSkills: ["After Effects", "Cinema 4D", "Blender", "Premiere Pro"],
    educationPath: ["Курсы моушн-дизайна", "Анимация", "3D графика"],
    universities: ["Scream School", "Skillbox", "VideoSmile", "CGTarian"],
    outlook: "growing",
    demandLevel: "medium",
  },

  {
    id: "architect",
    title: "Architect",
    titleRu: "Архитектор",
    description: "Проектирование зданий и сооружений",
    // A (creative vision) + R (technical drawing) + I (engineering)
    riasecProfile: { R: 60, I: 65, A: 85, S: 30, E: 35, C: 55 },
    salaryMin: 80000,
    salaryMax: 250000,
    salarySource: "hh.ru 2024: архитектор 100-200K ₽",
    category: "creative",
    requiredSkills: [
      "AutoCAD",
      "Revit",
      "3ds Max",
      "Архитектурное проектирование",
    ],
    educationPath: ["Архитектурный вуз 5-6 лет", "Портфолио проектов"],
    universities: ["МАрхИ", "МГСУ", "СПбГАСУ", "КГАСУ"],
    outlook: "stable",
    demandLevel: "medium",
  },

  {
    id: "video-producer",
    title: "Video Producer",
    titleRu: "Видеопродюсер / Режиссёр",
    description: "Создание видеоконтента, режиссура, продакшн",
    // A (creative vision) + E (leadership) + R (technical equipment)
    riasecProfile: { R: 45, I: 40, A: 90, S: 45, E: 60, C: 35 },
    salaryMin: 80000,
    salaryMax: 300000,
    salarySource: "hh.ru 2024: видеопродакшн 100-250K ₽",
    category: "creative",
    requiredSkills: ["Режиссура", "Монтаж", "Сценарий", "Работа с командой"],
    educationPath: ["ВГИК", "Курсы режиссуры", "Практический опыт"],
    universities: ["ВГИК", "ГИТР", "Московская школа кино", "Индустрия"],
    outlook: "growing",
    demandLevel: "medium",
  },

  {
    id: "musician-composer",
    title: "Musician / Composer",
    titleRu: "Музыкант / Композитор",
    description: "Создание музыки, саунд-дизайн, аранжировка",
    // A (artistic expression) + R (instrumental skills) + I (music theory)
    riasecProfile: { R: 50, I: 45, A: 95, S: 35, E: 35, C: 30 },
    salaryMin: 40000,
    salaryMax: 300000,
    salarySource: "Сильно варьируется: от 40K до 300K+ ₽",
    category: "creative",
    requiredSkills: [
      "Музыкальный инструмент",
      "DAW",
      "Теория музыки",
      "Саунд-дизайн",
    ],
    educationPath: ["Музыкальное образование", "Консерватория", "Практика"],
    universities: ["Московская консерватория", "Гнесинка", "Berklee Online"],
    outlook: "stable",
    demandLevel: "low",
  },

  {
    id: "content-creator",
    title: "Content Creator",
    titleRu: "Контент-криейтор / Блогер",
    description: "Создание контента для социальных сетей и платформ",
    // A (creative content) + E (influence) + S (audience engagement)
    riasecProfile: { R: 25, I: 35, A: 85, S: 60, E: 70, C: 30 },
    salaryMin: 30000,
    salaryMax: 500000,
    salarySource: "Habr Career 2024: контент 105K ₽ (+12%)",
    category: "creative",
    requiredSkills: ["Копирайтинг", "Видео/Фото", "SMM", "Личный бренд"],
    educationPath: ["Самообучение", "Курсы SMM", "Практика"],
    universities: ["Нетология", "Skillbox", "Практика в социальных сетях"],
    outlook: "growing",
    demandLevel: "medium",
  },

  {
    id: "interior-designer",
    title: "Interior Designer",
    titleRu: "Дизайнер интерьера",
    description: "Проектирование внутренних пространств, подбор материалов",
    // A (aesthetics) + R (spatial planning) + S (client work)
    riasecProfile: { R: 45, I: 40, A: 90, S: 50, E: 40, C: 45 },
    salaryMin: 70000,
    salaryMax: 200000,
    salarySource: "hh.ru 2024: дизайнер интерьера 80-180K ₽",
    category: "creative",
    requiredSkills: ["3ds Max", "AutoCAD", "Материаловедение", "Эргономика"],
    educationPath: ["Дизайн интерьера", "Архитектурное образование"],
    universities: ["Британка", "ВШЭ", "Строгановка", "IDS"],
    outlook: "stable",
    demandLevel: "medium",
  },

  // ═══════════════════════════════════════════════════════════════
  // BUSINESS (8 careers) - 20%
  // ═══════════════════════════════════════════════════════════════

  {
    id: "marketing-manager",
    title: "Marketing Manager",
    titleRu: "Маркетолог",
    description: "Продвижение продуктов, маркетинговые стратегии",
    // E (influence, strategy) + S (audience understanding) + A (creative campaigns)
    riasecProfile: { R: 15, I: 55, A: 55, S: 55, E: 85, C: 50 },
    salaryMin: 80000,
    salaryMax: 250000,
    salarySource: "hh.ru 2024: маркетолог 100-200K ₽",
    category: "business",
    requiredSkills: ["Digital маркетинг", "Аналитика", "Контент", "Стратегия"],
    educationPath: ["Маркетинг/Экономика", "Курсы digital", "Практика"],
    universities: ["ВШЭ", "РЭУ", "МГУ экономика", "Нетология"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "hr-manager",
    title: "HR Manager",
    titleRu: "HR-менеджер",
    description: "Управление персоналом, подбор, развитие сотрудников",
    // S (people skills) + E (organizational leadership) + C (processes)
    riasecProfile: { R: 10, I: 40, A: 25, S: 90, E: 65, C: 60 },
    salaryMin: 70000,
    salaryMax: 200000,
    salarySource: "hh.ru 2024: HR 80-180K ₽",
    category: "business",
    requiredSkills: [
      "Рекрутинг",
      "HR-аналитика",
      "Трудовое право",
      "Коммуникация",
    ],
    educationPath: ["Управление персоналом", "Психология", "HR-курсы"],
    universities: ["ВШЭ", "РАНХиГС", "МГУ психология", "Нетология HR"],
    outlook: "stable",
    demandLevel: "high",
  },

  {
    id: "financial-analyst",
    title: "Financial Analyst",
    titleRu: "Финансовый аналитик",
    description: "Анализ финансовых данных, прогнозирование, отчётность",
    // I (analytical) + C (data, accuracy) + E (business decisions)
    riasecProfile: { R: 15, I: 80, A: 15, S: 25, E: 55, C: 90 },
    salaryMin: 100000,
    salaryMax: 300000,
    salarySource: "hh.ru 2024: финаналитик 120-280K ₽",
    category: "business",
    requiredSkills: [
      "Excel",
      "SQL",
      "Финмоделирование",
      "Power BI",
      "Accounting",
    ],
    educationPath: ["Финансы/Экономика", "CFA опционально", "Практика"],
    universities: ["ВШЭ", "Финуниверситет", "РЭУ", "МГУ экономика"],
    outlook: "stable",
    demandLevel: "high",
  },

  {
    id: "entrepreneur",
    title: "Entrepreneur",
    titleRu: "Предприниматель",
    description: "Создание и развитие собственного бизнеса",
    // E (leadership, risk-taking) + I (problem-solving) + S (networking)
    riasecProfile: { R: 30, I: 60, A: 45, S: 55, E: 95, C: 45 },
    salaryMin: 0, // Высокая вариативность
    salaryMax: 1000000,
    salarySource: "Сильно варьируется: от убытков до млн+ ₽",
    category: "business",
    requiredSkills: ["Бизнес-планирование", "Продажи", "Финансы", "Лидерство"],
    educationPath: ["MBA опционально", "Практический опыт", "Менторство"],
    universities: [
      "Skolkovo",
      "ВШЭ",
      "МФТИ стартапы",
      "Y Combinator Startup School",
    ],
    outlook: "growing",
    demandLevel: "medium",
  },

  {
    id: "sales-manager",
    title: "Sales Manager",
    titleRu: "Менеджер по продажам",
    description: "Продажи, работа с клиентами, выполнение планов",
    // E (persuasion) + S (relationship building) + C (targets)
    riasecProfile: { R: 15, I: 35, A: 20, S: 70, E: 90, C: 50 },
    salaryMin: 60000,
    salaryMax: 300000,
    salarySource: "Habr Career 2024: продажи 120K ₽ (+33%)",
    category: "business",
    requiredSkills: ["Переговоры", "CRM", "Презентации", "Нетворкинг"],
    educationPath: ["Любое высшее", "Курсы продаж", "Практика"],
    universities: ["Любой вуз", "Skillbox продажи", "Практический опыт"],
    outlook: "stable",
    demandLevel: "high",
  },

  {
    id: "project-manager",
    title: "Project Manager",
    titleRu: "Проектный менеджер",
    description: "Управление проектами, координация команд, дедлайны",
    // E (leadership) + C (planning) + S (team coordination)
    riasecProfile: { R: 20, I: 50, A: 25, S: 60, E: 80, C: 75 },
    salaryMin: 100000,
    salaryMax: 300000,
    salarySource: "hh.ru 2024: PM 120-280K ₽",
    category: "business",
    requiredSkills: ["Agile/Scrum", "Jira", "Риск-менеджмент", "Коммуникация"],
    educationPath: ["PM курсы", "PMP/Agile сертификации", "Опыт в проектах"],
    universities: ["ВШЭ", "РАНХиГС", "Skillbox PM", "Scrumtrek"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "lawyer",
    title: "Lawyer",
    titleRu: "Юрист",
    description: "Правовое консультирование, защита интересов",
    // I (analytical, research) + C (documentation) + E (argumentation)
    riasecProfile: { R: 10, I: 75, A: 30, S: 55, E: 70, C: 85 },
    salaryMin: 60000,
    salaryMax: 300000,
    salarySource: "hh.ru 2024: юрист 80-250K ₽",
    category: "business",
    requiredSkills: ["Право", "Документооборот", "Переговоры", "Аналитика"],
    educationPath: ["Юридический вуз 5 лет", "Специализация"],
    universities: ["МГУ юрфак", "МГЮА", "ВШЭ право", "СПбГУ"],
    outlook: "stable",
    demandLevel: "medium",
  },

  {
    id: "accountant",
    title: "Accountant",
    titleRu: "Бухгалтер",
    description: "Ведение бухгалтерского учёта, отчётность, налоги",
    // C (accuracy, documentation) + I (calculations) + R (systematic)
    riasecProfile: { R: 20, I: 55, A: 10, S: 30, E: 25, C: 95 },
    salaryMin: 50000,
    salaryMax: 150000,
    salarySource: "hh.ru 2024: бухгалтер 60-140K ₽",
    category: "business",
    requiredSkills: ["1С", "Налоговый учёт", "МСФО", "Excel"],
    educationPath: ["Экономическое образование", "Курсы бухучёта"],
    universities: ["Финуниверситет", "РЭУ", "1С:Учебный центр"],
    outlook: "stable",
    demandLevel: "high",
  },

  // ═══════════════════════════════════════════════════════════════
  // MEDICINE & SCIENCE (6 careers) - 15%
  // ═══════════════════════════════════════════════════════════════

  {
    id: "doctor-therapist",
    title: "Doctor (Therapist)",
    titleRu: "Врач-терапевт",
    description: "Первичная медицинская помощь, диагностика, лечение",
    // I (diagnosis) + S (patient care) + C (medical protocols)
    riasecProfile: { R: 35, I: 80, A: 15, S: 85, E: 30, C: 60 },
    salaryMin: 60000,
    salaryMax: 150000,
    salarySource: "hh.ru 2024: терапевт 87K ₽ средняя",
    category: "medicine",
    requiredSkills: ["Диагностика", "Терапия", "Коммуникация с пациентами"],
    educationPath: ["Мединститут 6 лет", "Ординатура 2 года"],
    universities: ["МГМУ им. Сеченова", "РНИМУ им. Пирогова", "СПбГМУ"],
    outlook: "stable",
    demandLevel: "high",
  },

  {
    id: "surgeon",
    title: "Surgeon",
    titleRu: "Хирург",
    description: "Проведение операций, хирургическое лечение",
    // R (manual skills) + I (medical knowledge) + S (patient care)
    riasecProfile: { R: 75, I: 85, A: 20, S: 60, E: 40, C: 55 },
    salaryMin: 80000,
    salaryMax: 300000,
    salarySource: "hh.ru 2024: хирург 82-125K ₽, частные до 500K ₽",
    category: "medicine",
    requiredSkills: ["Хирургические навыки", "Анатомия", "Стрессоустойчивость"],
    educationPath: ["Мединститут 6 лет", "Ординатура хирургия 5 лет"],
    universities: ["МГМУ им. Сеченова", "РНИМУ им. Пирогова", "ВМА"],
    outlook: "stable",
    demandLevel: "high",
  },

  {
    id: "psychologist",
    title: "Psychologist",
    titleRu: "Психолог",
    description: "Психологическая помощь, консультирование, терапия",
    // S (empathy, helping) + I (understanding) + A (creative approaches)
    riasecProfile: { R: 10, I: 75, A: 45, S: 95, E: 35, C: 40 },
    salaryMin: 40000,
    salaryMax: 200000,
    salarySource: "hh.ru 2024: психолог 50-150K ₽, частная практика выше",
    category: "medicine",
    requiredSkills: ["Психотерапия", "Диагностика", "Эмпатия", "Коммуникация"],
    educationPath: ["Психфак 4-5 лет", "Дополнительное образование"],
    universities: ["МГУ психфак", "ВШЭ психология", "СПбГУ", "РГГУ"],
    outlook: "growing",
    demandLevel: "high",
  },

  {
    id: "scientist-researcher",
    title: "Scientist / Researcher",
    titleRu: "Учёный / Исследователь",
    description: "Научные исследования, эксперименты, публикации",
    // I (research, analysis) + R (lab work) + C (methodology)
    riasecProfile: { R: 50, I: 95, A: 35, S: 30, E: 25, C: 65 },
    salaryMin: 50000,
    salaryMax: 200000,
    salarySource: "hh.ru 2024: научный сотрудник 60-150K ₽",
    category: "science",
    requiredSkills: [
      "Методология",
      "Статистика",
      "Научное письмо",
      "Эксперименты",
    ],
    educationPath: ["Магистратура + Аспирантура", "Научные публикации"],
    universities: ["МГУ", "МФТИ", "Сколтех", "РАН институты"],
    outlook: "stable",
    demandLevel: "medium",
  },

  {
    id: "pharmacist",
    title: "Pharmacist",
    titleRu: "Фармацевт / Провизор",
    description: "Работа с лекарствами, консультирование, аптечное дело",
    // I (pharmacology) + S (customer service) + C (accuracy)
    riasecProfile: { R: 35, I: 70, A: 10, S: 60, E: 30, C: 80 },
    salaryMin: 50000,
    salaryMax: 120000,
    salarySource: "SuperJob 2024: фармацевт 55-110K ₽",
    category: "medicine",
    requiredSkills: ["Фармакология", "Консультирование", "Документация"],
    educationPath: ["Фармацевтический вуз 5 лет"],
    universities: ["МГМУ им. Сеченова", "СПХФУ", "Пермская фармакадемия"],
    outlook: "stable",
    demandLevel: "medium",
  },

  {
    id: "biologist",
    title: "Biologist",
    titleRu: "Биолог",
    description: "Исследование живых организмов, биотехнологии",
    // I (research) + R (lab/field work) + C (data analysis)
    riasecProfile: { R: 55, I: 90, A: 25, S: 25, E: 20, C: 60 },
    salaryMin: 45000,
    salaryMax: 150000,
    salarySource: "hh.ru 2024: биолог 50-130K ₽",
    category: "science",
    requiredSkills: [
      "Биология",
      "Лабораторные методы",
      "Статистика",
      "Биоинформатика",
    ],
    educationPath: ["Биофак", "Магистратура", "Специализация"],
    universities: ["МГУ биофак", "СПбГУ", "НГУ", "Сколтех"],
    outlook: "growing",
    demandLevel: "medium",
  },

  // ═══════════════════════════════════════════════════════════════
  // ENGINEERING (4 careers) - 10%
  // ═══════════════════════════════════════════════════════════════

  {
    id: "mechanical-engineer",
    title: "Mechanical Engineer",
    titleRu: "Инженер-механик",
    description: "Проектирование и обслуживание механических систем",
    // R (hands-on, technical) + I (problem-solving) + C (specifications)
    riasecProfile: { R: 85, I: 75, A: 25, S: 20, E: 25, C: 65 },
    salaryMin: 60000,
    salaryMax: 180000,
    salarySource: "hh.ru 2024: инженер-механик 70-160K ₽",
    category: "engineering",
    requiredSkills: ["САПР", "Материаловедение", "Механика", "Чертежи"],
    educationPath: ["Инженерный вуз", "Практика на производстве"],
    universities: ["МГТУ им. Баумана", "МАИ", "МФТИ", "СПбПУ"],
    outlook: "stable",
    demandLevel: "medium",
  },

  {
    id: "civil-engineer",
    title: "Civil Engineer",
    titleRu: "Инженер-строитель",
    description: "Проектирование и строительство зданий, инфраструктуры",
    // R (construction) + I (calculations) + C (codes, specs)
    riasecProfile: { R: 80, I: 70, A: 30, S: 25, E: 35, C: 70 },
    salaryMin: 70000,
    salaryMax: 200000,
    salarySource: "hh.ru 2024: инженер-строитель 80-180K ₽",
    category: "engineering",
    requiredSkills: ["AutoCAD", "Revit", "Строительные нормы", "Сметы"],
    educationPath: ["Строительный вуз", "Допуск СРО"],
    universities: ["МГСУ", "СПбГАСУ", "НГАСУ", "КГАСУ"],
    outlook: "stable",
    demandLevel: "medium",
  },

  {
    id: "electrical-engineer",
    title: "Electrical Engineer",
    titleRu: "Инженер-электрик",
    description: "Проектирование электрических систем и оборудования",
    // R (technical, hands-on) + I (circuits, physics) + C (standards)
    riasecProfile: { R: 80, I: 80, A: 15, S: 15, E: 25, C: 70 },
    salaryMin: 70000,
    salaryMax: 200000,
    salarySource: "hh.ru 2024: инженер-электрик 75-180K ₽",
    category: "engineering",
    requiredSkills: ["Электротехника", "САПР", "ПЛК", "Автоматизация"],
    educationPath: ["Электротехнический вуз", "Допуски"],
    universities: ["МЭИ", "СПбПУ", "МГТУ", "ЮУрГУ"],
    outlook: "stable",
    demandLevel: "medium",
  },

  {
    id: "robotics-engineer",
    title: "Robotics Engineer",
    titleRu: "Инженер-робототехник",
    description: "Разработка и программирование роботов, автоматизация",
    // R (mechanical) + I (programming, AI) + A (design)
    riasecProfile: { R: 75, I: 90, A: 40, S: 15, E: 30, C: 55 },
    salaryMin: 100000,
    salaryMax: 300000,
    salarySource: "hh.ru 2024: робототехника 120-280K ₽",
    category: "engineering",
    requiredSkills: ["ROS", "Python/C++", "Электроника", "Механика", "ML"],
    educationPath: ["Мехатроника/Робототехника", "Соревнования"],
    universities: ["МФТИ", "МГТУ им. Баумана", "ИТМО", "Иннополис"],
    outlook: "growing",
    demandLevel: "high",
  },

  // ═══════════════════════════════════════════════════════════════
  // SOCIAL (4 careers) - 10%
  // ═══════════════════════════════════════════════════════════════

  {
    id: "teacher",
    title: "Teacher",
    titleRu: "Учитель",
    description: "Обучение и воспитание школьников",
    // S (helping, nurturing) + I (subject expertise) + A (creative teaching)
    riasecProfile: { R: 20, I: 60, A: 45, S: 95, E: 45, C: 50 },
    salaryMin: 40000,
    salaryMax: 100000,
    salarySource: "hh.ru 2024: учитель 45-90K ₽",
    category: "social",
    requiredSkills: [
      "Педагогика",
      "Предметные знания",
      "Коммуникация",
      "Терпение",
    ],
    educationPath: ["Педагогический вуз", "Предметная специализация"],
    universities: ["МПГУ", "РГПУ им. Герцена", "НИУ ВШЭ педагогика"],
    outlook: "stable",
    demandLevel: "high",
  },

  {
    id: "social-worker",
    title: "Social Worker",
    titleRu: "Социальный работник",
    description: "Помощь людям в сложных жизненных ситуациях",
    // S (empathy, helping) + C (documentation) + E (advocacy)
    riasecProfile: { R: 15, I: 45, A: 25, S: 95, E: 45, C: 55 },
    salaryMin: 35000,
    salaryMax: 80000,
    salarySource: "hh.ru 2024: соцработник 40-75K ₽",
    category: "social",
    requiredSkills: ["Социальная работа", "Психология", "Законодательство"],
    educationPath: ["Социальная работа/Психология"],
    universities: ["РГСУ", "МГУ соцфак", "ВШЭ"],
    outlook: "stable",
    demandLevel: "medium",
  },

  {
    id: "journalist",
    title: "Journalist",
    titleRu: "Журналист",
    description: "Сбор и подготовка информации, создание материалов",
    // A (writing, creativity) + I (research) + S (interviewing)
    riasecProfile: { R: 15, I: 65, A: 80, S: 60, E: 55, C: 40 },
    salaryMin: 50000,
    salaryMax: 200000,
    salarySource: "hh.ru 2024: журналист 60-180K ₽",
    category: "social",
    requiredSkills: ["Написание текстов", "Интервью", "Исследование", "Медиа"],
    educationPath: ["Журфак", "Практика в СМИ"],
    universities: ["МГУ журфак", "ВШЭ медиа", "МГИМО", "СПбГУ"],
    outlook: "declining",
    demandLevel: "medium",
  },

  {
    id: "translator",
    title: "Translator / Interpreter",
    titleRu: "Переводчик",
    description: "Письменный и устный перевод, локализация",
    // I (language analysis) + A (creative translation) + C (accuracy)
    riasecProfile: { R: 15, I: 70, A: 55, S: 50, E: 30, C: 75 },
    salaryMin: 50000,
    salaryMax: 180000,
    salarySource: "hh.ru 2024: переводчик 55-160K ₽",
    category: "social",
    requiredSkills: [
      "Иностранные языки",
      "Специализированная лексика",
      "Точность",
    ],
    educationPath: ["Лингвистический вуз", "Практика переводов"],
    universities: ["МГЛУ", "МГУ филфак", "МГИМО", "ВШЭ"],
    outlook: "declining",
    demandLevel: "medium",
  },
];

// ═══════════════════════════════════════════════════════════════
// VALIDATION & STATISTICS
// ═══════════════════════════════════════════════════════════════

/**
 * Validation statistics for the question bank
 */
export const questionStats = {
  totalQuestions: questions.length,
  bySection: {
    section1: questions.filter((q) => q.section === 1).length,
    section2: questions.filter((q) => q.section === 2).length,
    section3: questions.filter((q) => q.section === 3).length,
    section4: questions.filter((q) => q.section === 4).length,
    section5: questions.filter((q) => q.section === 5).length,
  },
  byType: {
    MULTIPLE_CHOICE: questions.filter((q) => q.type === "MULTIPLE_CHOICE")
      .length,
    RATING: questions.filter((q) => q.type === "RATING").length,
    BINARY: questions.filter((q) => q.type === "BINARY").length,
    OPEN_TEXT: questions.filter((q) => q.type === "OPEN_TEXT").length,
  },
  byDimension: {
    R: questions.filter((q) => q.primaryDimension === "R").length,
    I: questions.filter((q) => q.primaryDimension === "I").length,
    A: questions.filter((q) => q.primaryDimension === "A").length,
    S: questions.filter((q) => q.primaryDimension === "S").length,
    E: questions.filter((q) => q.primaryDimension === "E").length,
    C: questions.filter((q) => q.primaryDimension === "C").length,
  },
};

/**
 * Validation statistics for the career database
 */
export const careerStats = {
  totalCareers: careers.length,
  byCategory: {
    technology: careers.filter((c) => c.category === "technology").length,
    creative: careers.filter((c) => c.category === "creative").length,
    business: careers.filter((c) => c.category === "business").length,
    medicine: careers.filter((c) => c.category === "medicine").length,
    science: careers.filter((c) => c.category === "science").length,
    engineering: careers.filter((c) => c.category === "engineering").length,
    social: careers.filter((c) => c.category === "social").length,
  },
  byOutlook: {
    growing: careers.filter((c) => c.outlook === "growing").length,
    stable: careers.filter((c) => c.outlook === "stable").length,
    declining: careers.filter((c) => c.outlook === "declining").length,
  },
  salaryRange: {
    min: Math.min(...careers.map((c) => c.salaryMin)),
    max: Math.max(...careers.map((c) => c.salaryMax)),
    avgMin: Math.round(
      careers.reduce((sum, c) => sum + c.salaryMin, 0) / careers.length,
    ),
    avgMax: Math.round(
      careers.reduce((sum, c) => sum + c.salaryMax, 0) / careers.length,
    ),
  },
};

// Log validation on import
console.log("=== RIASEC Seed Data Loaded ===");
console.log("Questions:", questionStats);
console.log("Careers:", careerStats);

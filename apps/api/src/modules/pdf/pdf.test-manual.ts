/**
 * Manual PDF Generation Test Script
 * Run with: npx ts-node --project tsconfig.json src/modules/pdf/pdf.test-manual.ts
 */

import * as fs from "fs";
import * as path from "path";
import { PdfService, RoadmapData } from "./pdf.service";
import { ChartService } from "../results/chart.service";

// Mock ChartService for testing without full NestJS bootstrap
class MockChartService extends ChartService {
  async generateRadarChart(): Promise<Buffer> {
    // Return a simple PNG placeholder (1x1 pixel transparent PNG)
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
    return png;
  }
}

// Test data sets
const testCases: { name: string; data: RoadmapData }[] = [
  {
    name: "balanced",
    data: {
      studentName: "Александр Сидоров",
      testDate: new Date(),
      riasecScores: { R: 20, I: 22, A: 18, S: 25, E: 21, C: 19 },
      hollandCode: "SIE",
      archetype: {
        name: "Научный консультант",
        emoji: "📊",
        description: "Объясняет сложное простым языком",
      },
      topCareers: [
        {
          title: "Data Scientist",
          titleRu: "Аналитик данных",
          matchPercentage: 85,
          description:
            "Анализирует большие объёмы данных для принятия бизнес-решений. Работает с машинным обучением и статистикой.",
          requiredSkills: [
            "Python",
            "SQL",
            "Машинное обучение",
            "Статистика",
            "Визуализация данных",
          ],
          educationPath: [
            "Бакалавриат по математике/ИТ",
            "Магистратура по Data Science",
            "Онлайн-курсы ML",
          ],
          universities: ["МГУ", "ВШЭ", "МФТИ", "СПбГУ", "ИТМО"],
          salaryMin: 120000,
          salaryMax: 350000,
          demandLevel: "HIGH",
        },
        {
          title: "Product Manager",
          titleRu: "Продакт-менеджер",
          matchPercentage: 78,
          description:
            "Управляет развитием продукта от идеи до запуска. Координирует работу команд разработки, дизайна и маркетинга.",
          requiredSkills: [
            "Аналитика",
            "UX",
            "Agile",
            "Коммуникации",
            "Стратегия",
          ],
          educationPath: [
            "Любой бакалавриат",
            "MBA или курсы продакт-менеджмента",
          ],
          universities: ["ВШЭ", "Сколково", "РЭШ"],
          salaryMin: 150000,
          salaryMax: 400000,
          demandLevel: "HIGH",
        },
        {
          title: "UX Researcher",
          titleRu: "UX-исследователь",
          matchPercentage: 72,
          description:
            "Изучает поведение пользователей для улучшения продуктов. Проводит интервью, тесты и анализирует данные.",
          requiredSkills: [
            "User Research",
            "Интервьюирование",
            "Анализ данных",
            "Figma",
            "Презентации",
          ],
          educationPath: ["Психология/Социология", "Курсы UX Research"],
          universities: ["МГУ (психфак)", "ВШЭ", "СПбГУ"],
          salaryMin: 100000,
          salaryMax: 280000,
          demandLevel: "MEDIUM",
        },
        {
          title: "Business Analyst",
          titleRu: "Бизнес-аналитик",
          matchPercentage: 68,
          description:
            "Анализирует бизнес-процессы и помогает компаниям оптимизировать работу. Работает на стыке IT и бизнеса.",
          requiredSkills: [
            "SQL",
            "Excel",
            "BPMN",
            "Системный анализ",
            "Документирование",
          ],
          educationPath: ["Экономика/ИТ", "Курсы бизнес-анализа"],
          universities: ["ВШЭ", "Финансовый университет", "РАНХиГС"],
          salaryMin: 90000,
          salaryMax: 250000,
          demandLevel: "HIGH",
        },
        {
          title: "Teacher",
          titleRu: "Преподаватель",
          matchPercentage: 65,
          description:
            "Обучает студентов и школьников. Разрабатывает учебные программы и методики обучения.",
          requiredSkills: [
            "Педагогика",
            "Коммуникации",
            "Методика",
            "Терпение",
            "Организация",
          ],
          educationPath: [
            "Педагогическое образование",
            "Магистратура по специальности",
          ],
          universities: ["МПГУ", "РГПУ им. Герцена", "Педвузы регионов"],
          salaryMin: 50000,
          salaryMax: 150000,
          demandLevel: "MEDIUM",
        },
      ],
      achievements: [
        { badgeType: "THOUGHTFUL_ANALYST", earnedAt: new Date() },
        { badgeType: "GOLD_ACHIEVER", earnedAt: new Date() },
        { badgeType: "STREAK_7_DAYS", earnedAt: new Date() },
      ],
    },
  },
  {
    name: "extreme",
    data: {
      studentName: "Мария Иванова",
      testDate: new Date(),
      riasecScores: { R: 5, I: 40, A: 8, S: 35, E: 10, C: 30 },
      hollandCode: "ISC",
      archetype: {
        name: "Научный консультант",
        emoji: "📊",
        description: "Объясняет сложное простым языком",
      },
      topCareers: [
        {
          title: "Research Scientist",
          titleRu: "Научный исследователь",
          matchPercentage: 92,
          description:
            "Проводит научные исследования в области биологии, химии или физики. Публикует статьи и участвует в конференциях.",
          requiredSkills: [
            "Научный метод",
            "Статистика",
            "Английский язык",
            "Презентации",
            "Критическое мышление",
          ],
          educationPath: [
            "Профильный бакалавриат",
            "Магистратура",
            "Аспирантура/PhD",
          ],
          universities: ["МГУ", "МФТИ", "НГУ", "СПбГУ"],
          salaryMin: 80000,
          salaryMax: 200000,
          demandLevel: "MEDIUM",
        },
        {
          title: "Psychologist",
          titleRu: "Психолог",
          matchPercentage: 88,
          description:
            "Помогает людям справляться с психологическими проблемами. Проводит консультации и терапию.",
          requiredSkills: [
            "Психология",
            "Эмпатия",
            "Активное слушание",
            "Конфиденциальность",
          ],
          educationPath: [
            "Психология (специалитет)",
            "Переподготовка в психотерапии",
          ],
          universities: ["МГУ (психфак)", "РГГУ", "СПбГУ"],
          salaryMin: 60000,
          salaryMax: 200000,
          demandLevel: "HIGH",
        },
        {
          title: "Doctor",
          titleRu: "Врач",
          matchPercentage: 75,
          description:
            "Диагностирует и лечит заболевания. Требует многолетнего обучения и практики.",
          requiredSkills: [
            "Медицина",
            "Анатомия",
            "Диагностика",
            "Коммуникации с пациентами",
          ],
          educationPath: ["Медицинский вуз (6 лет)", "Ординатура (2-5 лет)"],
          universities: ["Сеченовский", "РНИМУ", "СПбГМУ", "Казанский ГМУ"],
          salaryMin: 70000,
          salaryMax: 300000,
          demandLevel: "HIGH",
        },
        {
          title: "Statistician",
          titleRu: "Статистик",
          matchPercentage: 70,
          description:
            "Анализирует данные и строит статистические модели для принятия решений.",
          requiredSkills: ["Статистика", "R/Python", "SQL", "Математика"],
          educationPath: [
            "Математика/Статистика",
            "Магистратура по прикладной статистике",
          ],
          universities: ["МГУ (мехмат)", "ВШЭ", "НИУ ВШЭ"],
          salaryMin: 100000,
          salaryMax: 280000,
          demandLevel: "MEDIUM",
        },
        {
          title: "Social Worker",
          titleRu: "Социальный работник",
          matchPercentage: 62,
          description:
            "Помогает людям в сложных жизненных ситуациях. Работает с семьями, детьми, пожилыми.",
          requiredSkills: [
            "Эмпатия",
            "Документооборот",
            "Законодательство",
            "Кризисная помощь",
          ],
          educationPath: ["Социальная работа", "Психология"],
          universities: ["РГСУ", "МГУ", "Региональные вузы"],
          salaryMin: 40000,
          salaryMax: 80000,
          demandLevel: "MEDIUM",
        },
      ],
      achievements: [
        { badgeType: "PLATINUM_MASTER", earnedAt: new Date() },
        { badgeType: "DETECTIVE", earnedAt: new Date() },
      ],
    },
  },
  {
    name: "low-scores",
    data: {
      studentName: "Дмитрий Козлов",
      testDate: new Date(),
      riasecScores: { R: 5, I: 8, A: 6, S: 10, E: 7, C: 9 },
      hollandCode: "SCI",
      archetype: {
        name: "Социальный координатор",
        emoji: "📝",
        description: "Организует помощь системно",
      },
      topCareers: [
        {
          title: "Administrative Assistant",
          titleRu: "Офис-менеджер",
          matchPercentage: 55,
          description:
            "Обеспечивает работу офиса. Координирует встречи, документооборот и коммуникации.",
          requiredSkills: [
            "Организация",
            "MS Office",
            "Коммуникации",
            "Многозадачность",
          ],
          educationPath: ["Любое высшее образование"],
          universities: [],
          salaryMin: 45000,
          salaryMax: 90000,
          demandLevel: "LOW",
        },
        {
          title: "Customer Support",
          titleRu: "Специалист поддержки",
          matchPercentage: 52,
          description:
            "Помогает клиентам решать проблемы с продуктами или услугами компании.",
          requiredSkills: [
            "Коммуникации",
            "Терпение",
            "CRM-системы",
            "Решение проблем",
          ],
          educationPath: ["Среднее специальное или высшее"],
          universities: [],
          salaryMin: 40000,
          salaryMax: 80000,
          demandLevel: "MEDIUM",
        },
        {
          title: "Librarian",
          titleRu: "Библиотекарь",
          matchPercentage: 48,
          description:
            "Организует работу библиотеки. Помогает читателям найти нужную информацию.",
          requiredSkills: [
            "Каталогизация",
            "Работа с базами данных",
            "Коммуникации",
          ],
          educationPath: ["Библиотечное дело"],
          universities: ["МГИК", "СПбГИК"],
          salaryMin: 35000,
          salaryMax: 60000,
          demandLevel: "LOW",
        },
        {
          title: "Data Entry Clerk",
          titleRu: "Оператор ввода данных",
          matchPercentage: 45,
          description: "Вводит и обрабатывает данные в компьютерных системах.",
          requiredSkills: ["Внимательность", "Скорость печати", "Excel"],
          educationPath: ["Среднее образование"],
          universities: [],
          salaryMin: 30000,
          salaryMax: 50000,
          demandLevel: "LOW",
        },
        {
          title: "Receptionist",
          titleRu: "Администратор рецепции",
          matchPercentage: 42,
          description:
            "Встречает посетителей и отвечает на звонки. Обеспечивает первый контакт с компанией.",
          requiredSkills: [
            "Коммуникации",
            "Презентабельность",
            "Многозадачность",
          ],
          educationPath: ["Среднее образование, курсы"],
          universities: [],
          salaryMin: 35000,
          salaryMax: 55000,
          demandLevel: "MEDIUM",
        },
      ],
      achievements: [],
    },
  },
  {
    name: "high-scores",
    data: {
      studentName: "Елена Петрова-Смирнова",
      testDate: new Date(),
      riasecScores: { R: 35, I: 38, A: 40, S: 42, E: 37, C: 36 },
      hollandCode: "SAI",
      archetype: {
        name: "Арт-терапевт",
        emoji: "🎭",
        description: "Помогает людям через творчество",
      },
      topCareers: [
        {
          title: "Art Therapist",
          titleRu: "Арт-терапевт",
          matchPercentage: 95,
          description:
            "Использует искусство для помощи людям в преодолении психологических проблем. Сочетает творчество и терапию.",
          requiredSkills: [
            "Психология",
            "Искусство",
            "Эмпатия",
            "Креативность",
            "Коммуникации",
          ],
          educationPath: [
            "Психология + Искусство",
            "Специализация в арт-терапии",
          ],
          universities: ["МГУ", "РГСУ", "Институты арт-терапии"],
          salaryMin: 70000,
          salaryMax: 180000,
          demandLevel: "MEDIUM",
        },
        {
          title: "Creative Director",
          titleRu: "Креативный директор",
          matchPercentage: 91,
          description:
            "Руководит творческой командой. Определяет визуальную стратегию и креативную концепцию проектов.",
          requiredSkills: [
            "Лидерство",
            "Дизайн",
            "Стратегия",
            "Презентации",
            "Управление командой",
          ],
          educationPath: ["Дизайн/Маркетинг", "Опыт в креативных агентствах"],
          universities: ["ВШЭ", "Британка", "Школы дизайна"],
          salaryMin: 200000,
          salaryMax: 500000,
          demandLevel: "MEDIUM",
        },
        {
          title: "UX Designer",
          titleRu: "UX-дизайнер",
          matchPercentage: 88,
          description:
            "Создаёт удобные и красивые интерфейсы. Исследует потребности пользователей и проектирует решения.",
          requiredSkills: [
            "Figma",
            "User Research",
            "Прототипирование",
            "UI дизайн",
            "Аналитика",
          ],
          educationPath: ["Дизайн/HCI", "Курсы UX-дизайна"],
          universities: ["ВШЭ", "Британка", "Skillbox/Нетология"],
          salaryMin: 100000,
          salaryMax: 300000,
          demandLevel: "HIGH",
        },
        {
          title: "Museum Curator",
          titleRu: "Куратор музея",
          matchPercentage: 82,
          description:
            "Организует выставки и управляет коллекциями музея. Исследует и интерпретирует произведения искусства.",
          requiredSkills: [
            "Искусствоведение",
            "Организация выставок",
            "Исследования",
            "Коммуникации",
          ],
          educationPath: ["Искусствоведение", "Музеология"],
          universities: ["МГУ", "РГГУ", "СПбГУ"],
          salaryMin: 60000,
          salaryMax: 150000,
          demandLevel: "LOW",
        },
        {
          title: "Teacher-Counselor",
          titleRu: "Педагог-консультант",
          matchPercentage: 78,
          description:
            "Помогает ученикам с выбором профессии и решением личных проблем в школе.",
          requiredSkills: [
            "Психология",
            "Педагогика",
            "Профориентация",
            "Эмпатия",
          ],
          educationPath: ["Педагогика + Психология"],
          universities: ["МПГУ", "РГПУ", "Педвузы"],
          salaryMin: 50000,
          salaryMax: 120000,
          demandLevel: "MEDIUM",
        },
      ],
      achievements: [
        { badgeType: "GOLD_ACHIEVER", earnedAt: new Date() },
        { badgeType: "THOUGHTFUL_ANALYST", earnedAt: new Date() },
        { badgeType: "STREAK_7_DAYS", earnedAt: new Date() },
        { badgeType: "EARLY_BIRD", earnedAt: new Date() },
        { badgeType: "REFERRAL_BRONZE", earnedAt: new Date() },
      ],
    },
  },
  // Test case 5: Many achievements (Issue #1 edge case)
  {
    name: "many-achievements",
    data: {
      studentName: "Тест Множества Достижений",
      testDate: new Date(),
      riasecScores: { R: 25, I: 28, A: 22, S: 30, E: 26, C: 24 },
      hollandCode: "SIE",
      archetype: {
        name: "Социальный лидер",
        emoji: "👥",
        description: "Объединяет людей для общей цели",
      },
      topCareers: [
        {
          title: "Team Lead",
          titleRu: "Тимлид",
          matchPercentage: 88,
          description: "Руководит командой разработчиков.",
          requiredSkills: ["Лидерство", "Agile", "Коммуникации"],
          educationPath: ["Техническое образование"],
          universities: ["МФТИ", "МГУ"],
          salaryMin: 200000,
          salaryMax: 450000,
          demandLevel: "HIGH",
        },
      ],
      // 12 achievements to test grid overflow (4 rows × 3 columns)
      achievements: [
        { badgeType: "BRONZE_EXPLORER", earnedAt: new Date() },
        { badgeType: "SILVER_SEEKER", earnedAt: new Date() },
        { badgeType: "GOLD_ACHIEVER", earnedAt: new Date() },
        { badgeType: "PLATINUM_MASTER", earnedAt: new Date() },
        { badgeType: "SPEED_DEMON", earnedAt: new Date() },
        { badgeType: "THOUGHTFUL_ANALYST", earnedAt: new Date() },
        { badgeType: "STREAK_3_DAYS", earnedAt: new Date() },
        { badgeType: "STREAK_7_DAYS", earnedAt: new Date() },
        { badgeType: "REFERRAL_BRONZE", earnedAt: new Date() },
        { badgeType: "REFERRAL_SILVER", earnedAt: new Date() },
        { badgeType: "REFERRAL_GOLD", earnedAt: new Date() },
        { badgeType: "NIGHT_OWL", earnedAt: new Date() },
      ],
    },
  },
];

async function runTests() {
  console.log("=== PDF Generation Test Suite ===\n");

  const chartService = new MockChartService();
  const pdfService = new PdfService(chartService);

  const outputDir = path.join(__dirname, "../../../../../.tmp/current");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results: {
    name: string;
    success: boolean;
    error?: string;
    path?: string;
    pages?: number;
  }[] = [];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}...`);

    try {
      const pdfBuffer = await pdfService.generateCareerRoadmap(testCase.data);
      const outputPath = path.join(outputDir, `test-pdf-${testCase.name}.pdf`);

      fs.writeFileSync(outputPath, pdfBuffer);

      // Basic validation
      const fileSize = pdfBuffer.length;
      const isValidPdf = pdfBuffer.slice(0, 5).toString() === "%PDF-";

      if (!isValidPdf) {
        throw new Error("Generated file is not a valid PDF");
      }

      console.log(
        `  ✓ Generated: ${outputPath} (${(fileSize / 1024).toFixed(1)} KB)`,
      );

      results.push({
        name: testCase.name,
        success: true,
        path: outputPath,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`  ✗ Failed: ${errorMessage}`);

      results.push({
        name: testCase.name,
        success: false,
        error: errorMessage,
      });
    }
  }

  // Summary
  console.log("\n=== Summary ===");
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log("\nGenerated PDFs:");
  results
    .filter((r) => r.success)
    .forEach((r) => {
      console.log(`  - ${r.path}`);
    });

  return results;
}

// Run tests
runTests()
  .then(() => {
    console.log("\nTest suite completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test suite failed:", error);
    process.exit(1);
  });

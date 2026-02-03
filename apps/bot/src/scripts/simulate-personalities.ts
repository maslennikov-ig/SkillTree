/**
 * Personality Simulation Test with Detailed Reports
 *
 * Simulates 5 different personality types answering the RIASEC quiz
 * and generates detailed MD reports for each.
 *
 * Types tested:
 * 1. Творец (AI) - Artistic + Investigative
 * 2. Инженер (RC) - Realistic + Conventional
 * 3. Учёный (IR) - Investigative + Realistic
 * 4. Помощник (SA) - Social + Artistic
 * 5. Лидер (EC) - Enterprising + Conventional
 *
 * Run: cd apps/bot && npx ts-node --transpile-only src/scripts/simulate-personalities.ts
 */

import * as fs from "fs";
import * as path from "path";
import {
  questions,
  type Question,
  type RIASECScores,
  type RIASECType,
} from "../../../../packages/database/prisma/seed-data/riasec-data";
import { calculateAllPercentiles, ARCHETYPES } from "@skilltree/shared";

// ============================================================================
// Personality Profiles - All 5 Types
// ============================================================================

interface PersonalityProfile {
  name: string;
  shortName: string;
  description: string;
  backstory: string; // История персонажа для понимания
  expectedCode: string;
  expectedProfessions: string[];
  preferences: Record<RIASECType, number>;
}

const personalities: PersonalityProfile[] = [
  {
    name: "Творец",
    shortName: "AI",
    description: "Художник, любит рисовать, творить, самовыражаться",
    backstory:
      "Маша, 16 лет. Рисует с детства, ведёт арт-блог, интересуется историей искусства. " +
      "Любит придумывать новые идеи, исследовать разные стили. Мечтает стать дизайнером или режиссёром.",
    expectedCode: "AI",
    expectedProfessions: ["Дизайнер", "Режиссёр", "Художник", "Архитектор"],
    preferences: {
      R: 2,
      I: 4, // Интерес к идеям
      A: 5, // Обожает творчество!
      S: 3,
      E: 2,
      C: 2,
    },
  },
  {
    name: "Инженер",
    shortName: "RC",
    description: "Любит чинить технику, собирать, строить, ценит порядок",
    backstory:
      "Дима, 15 лет. Разбирает технику с детства, собирает компьютеры, помогает папе в гараже. " +
      "Любит когда всё работает и на своих местах. Мечтает стать инженером или программистом.",
    expectedCode: "RC",
    expectedProfessions: ["Инженер", "Механик", "Технолог", "IT-специалист"],
    preferences: {
      R: 5, // Обожает работать руками!
      I: 3,
      A: 1, // Не интересуется творчеством
      S: 2,
      E: 2,
      C: 5, // Любит порядок!
    },
  },
  {
    name: "Учёный",
    shortName: "IR",
    description: "Любит эксперименты, анализировать данные, исследовать",
    backstory:
      "Артём, 17 лет. Участвует в олимпиадах по физике, делает проекты на Arduino. " +
      "Любит разбираться как что работает, проводит эксперименты дома. Мечтает стать учёным или data scientist.",
    expectedCode: "IR",
    expectedProfessions: [
      "Data Scientist",
      "Учёный",
      "Аналитик",
      "Инженер-исследователь",
    ],
    preferences: {
      R: 4, // Любит практику
      I: 5, // Обожает исследования!
      A: 2,
      S: 2,
      E: 2,
      C: 3,
    },
  },
  {
    name: "Помощник",
    shortName: "SA",
    description: "Любит людей, помогать, творческий подход к общению",
    backstory:
      "Аня, 16 лет. Волонтёр в приюте для животных, помогает младшим с уроками. " +
      "Любит рисовать открытки для друзей, организует праздники. Мечтает стать психологом или учителем.",
    expectedCode: "SA",
    expectedProfessions: ["Психолог", "Учитель", "Социальный работник", "HR"],
    preferences: {
      R: 2,
      I: 2,
      A: 4, // Творческий подход
      S: 5, // Обожает помогать людям!
      E: 3,
      C: 2,
    },
  },
  {
    name: "Лидер",
    shortName: "EC",
    description: "Хочет руководить, создавать бизнес, организован",
    backstory:
      "Макс, 17 лет. Староста класса, организует школьные мероприятия, ведёт канал о бизнесе. " +
      "Любит управлять проектами, всё планирует. Мечтает открыть свой стартап.",
    expectedCode: "EC",
    expectedProfessions: [
      "Менеджер",
      "Предприниматель",
      "Директор",
      "Продюсер",
    ],
    preferences: {
      R: 2,
      I: 3,
      A: 2,
      S: 3,
      E: 5, // Обожает руководить!
      C: 5, // Любит порядок и планирование!
    },
  },
];

// ============================================================================
// Answer Simulation Logic
// ============================================================================

interface AnswerRecord {
  questionId: string;
  questionText: string;
  questionType: string;
  primaryDimension: string;
  chosenAnswer: string;
  chosenValue: string;
  scores: RIASECScores;
}

function simulateMultipleChoice(
  question: Question,
  prefs: Record<RIASECType, number>,
): { value: string; text: string; scores: RIASECScores } {
  if (!question.options || question.options.length === 0) {
    return {
      value: "unknown",
      text: "N/A",
      scores: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
    };
  }

  // We already checked options exists and has length > 0 above
  const options = question.options;
  let bestOption = options[0]!;
  let bestScore = -Infinity;

  for (const option of options) {
    let optionScore = 0;
    for (const dim of ["R", "I", "A", "S", "E", "C"] as RIASECType[]) {
      optionScore += option.scores[dim] * prefs[dim];
    }
    if (optionScore > bestScore) {
      bestScore = optionScore;
      bestOption = option;
    }
  }

  return {
    value: bestOption.value,
    text: bestOption.text,
    scores: bestOption.scores,
  };
}

function simulateRating(
  question: Question,
  prefs: Record<RIASECType, number>,
): number {
  const primaryDim = question.primaryDimension as RIASECType;
  return prefs[primaryDim];
}

// ============================================================================
// Report Generator
// ============================================================================

function generateReport(
  profile: PersonalityProfile,
  answers: AnswerRecord[],
  rawScores: RIASECScores,
  normalizedScores: RIASECScores,
  topDimensions: RIASECType[],
  archetype: string,
  passed: boolean,
): string {
  const actualCode = topDimensions.slice(0, 2).join("");

  let report = `# Тест профиля: ${profile.name} (${profile.shortName})

## Описание персонажа

**${profile.backstory}**

| Параметр | Значение |
|----------|----------|
| Ожидаемый код | ${profile.expectedCode} |
| Полученный код | ${actualCode} |
| Архетип | ${archetype} |
| Статус | ${passed ? "✅ СОВПАДАЕТ" : "❌ НЕ СОВПАДАЕТ"} |

## Предпочтения персонажа (1-5)

| Измерение | Название | Уровень |
|-----------|----------|---------|
| R | Практический | ${"⭐".repeat(profile.preferences.R)} |
| I | Исследовательский | ${"⭐".repeat(profile.preferences.I)} |
| A | Артистический | ${"⭐".repeat(profile.preferences.A)} |
| S | Социальный | ${"⭐".repeat(profile.preferences.S)} |
| E | Предприимчивый | ${"⭐".repeat(profile.preferences.E)} |
| C | Конвенциональный | ${"⭐".repeat(profile.preferences.C)} |

## Результаты

### Raw Scores (сырые баллы)

| Измерение | Баллы | Визуализация |
|-----------|-------|--------------|
`;

  for (const dim of ["R", "I", "A", "S", "E", "C"] as RIASECType[]) {
    const bar = "█".repeat(Math.round(rawScores[dim] / 2));
    report += `| ${dim} | ${rawScores[dim].toFixed(1)} | ${bar} |\n`;
  }

  report += `
### Normalized Scores (percentiles)

| Измерение | Percentile | Визуализация |
|-----------|------------|--------------|
`;

  for (const dim of ["R", "I", "A", "S", "E", "C"] as RIASECType[]) {
    const bar = "█".repeat(Math.round(normalizedScores[dim] / 5));
    report += `| ${dim} | ${normalizedScores[dim]}% | ${bar} |\n`;
  }

  report += `
### Топ-3 измерения

1. **${topDimensions[0]}** - ${normalizedScores[topDimensions[0]!]}%
2. **${topDimensions[1]}** - ${normalizedScores[topDimensions[1]!]}%
3. **${topDimensions[2]}** - ${normalizedScores[topDimensions[2]!]}%

## Ответы на вопросы

`;

  // Group by section
  const sections: Record<number, AnswerRecord[]> = {};
  for (const a of answers) {
    const q = questions.find((q) => q.id === a.questionId);
    const section = q?.section || 1;
    if (!sections[section]) sections[section] = [];
    sections[section].push(a);
  }

  for (const [sectionNum, sectionAnswers] of Object.entries(sections)) {
    report += `### Секция ${sectionNum}\n\n`;
    report += `| # | Вопрос | Тип | Ответ |\n`;
    report += `|---|--------|-----|-------|\n`;

    for (const a of sectionAnswers) {
      const shortText =
        a.questionText.length > 40
          ? a.questionText.slice(0, 40) + "..."
          : a.questionText;
      const shortAnswer =
        a.chosenAnswer.length > 30
          ? a.chosenAnswer.slice(0, 30) + "..."
          : a.chosenAnswer;
      report += `| ${a.questionId} | ${shortText} | ${a.questionType} | ${shortAnswer} |\n`;
    }

    report += "\n";
  }

  report += `## Вывод

${
  passed
    ? `✅ **Алгоритм правильно определил тип личности "${profile.name}".**\n\nПолученный код ${actualCode} соответствует ожидаемому ${profile.expectedCode}. Архетип "${archetype}" подходит для профессий: ${profile.expectedProfessions.join(", ")}.`
    : `❌ **Алгоритм НЕ определил тип личности "${profile.name}" правильно.**\n\nОжидался код ${profile.expectedCode}, но получен ${actualCode}. Требуется анализ причин расхождения.`
}

---
*Сгенерировано автоматически: ${new Date().toISOString()}*
`;

  return report;
}

// ============================================================================
// Main Simulation
// ============================================================================

function simulatePersonality(profile: PersonalityProfile): {
  answers: AnswerRecord[];
  rawScores: RIASECScores;
  normalizedScores: RIASECScores;
  topDimensions: RIASECType[];
  archetype: string;
  passed: boolean;
} {
  const rawScores: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const answers: AnswerRecord[] = [];

  for (const q of questions) {
    let answer: AnswerRecord;

    if (q.type === "MULTIPLE_CHOICE" || q.type === "BINARY") {
      const result = simulateMultipleChoice(q, profile.preferences);
      rawScores.R += result.scores.R;
      rawScores.I += result.scores.I;
      rawScores.A += result.scores.A;
      rawScores.S += result.scores.S;
      rawScores.E += result.scores.E;
      rawScores.C += result.scores.C;

      answer = {
        questionId: q.id,
        questionText: q.text,
        questionType: q.type,
        primaryDimension: q.primaryDimension,
        chosenAnswer: result.text,
        chosenValue: result.value,
        scores: result.scores,
      };
    } else if (q.type === "RATING") {
      const rating = simulateRating(q, profile.preferences);
      const dim = q.primaryDimension as RIASECType;
      rawScores[dim] += rating;

      answer = {
        questionId: q.id,
        questionText: q.text,
        questionType: q.type,
        primaryDimension: q.primaryDimension,
        chosenAnswer: `${rating}/5`,
        chosenValue: String(rating),
        scores: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, [dim]: rating },
      };
    } else {
      // OPEN_TEXT - skip
      continue;
    }

    answers.push(answer);
  }

  const normalizedScores = calculateAllPercentiles(rawScores);

  const dims: RIASECType[] = ["R", "I", "A", "S", "E", "C"];
  const sorted = [...dims].sort(
    (a, b) => normalizedScores[b] - normalizedScores[a],
  );
  const topDimensions = sorted.slice(0, 3) as RIASECType[];

  const code1 = [topDimensions[0], topDimensions[1]].sort().join("");
  const archetype = ARCHETYPES[code1]?.name || "Неизвестный";

  const actualNormalized = [topDimensions[0], topDimensions[1]].sort().join("");
  const expectedNormalized = profile.expectedCode.split("").sort().join("");
  const passed = actualNormalized === expectedNormalized;

  return {
    answers,
    rawScores,
    normalizedScores,
    topDimensions,
    archetype,
    passed,
  };
}

function main(): void {
  console.log("═".repeat(60));
  console.log("СИМУЛЯЦИЯ 5 ТИПОВ ЛИЧНОСТИ - ТЕСТ АЛГОРИТМА RIASEC");
  console.log("═".repeat(60));
  console.log(`Всего вопросов: ${questions.length}`);
  console.log(`Типов личности: ${personalities.length}`);
  console.log();

  const outputDir = path.join(__dirname, "../../../../.tmp/personality-tests");
  fs.mkdirSync(outputDir, { recursive: true });

  const results: Array<{
    profile: PersonalityProfile;
    passed: boolean;
    actualCode: string;
  }> = [];

  for (const profile of personalities) {
    console.log(`Симулирую: ${profile.name} (${profile.shortName})...`);

    const sim = simulatePersonality(profile);
    const actualCode = sim.topDimensions.slice(0, 2).join("");

    // Generate report
    const report = generateReport(
      profile,
      sim.answers,
      sim.rawScores,
      sim.normalizedScores,
      sim.topDimensions,
      sim.archetype,
      sim.passed,
    );

    // Save to file
    const filename = `test-${profile.shortName.toLowerCase()}-${profile.name.toLowerCase()}.md`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, report, "utf-8");
    console.log(`  → Отчёт сохранён: ${filepath}`);

    results.push({ profile, passed: sim.passed, actualCode });
  }

  // Summary
  console.log();
  console.log("═".repeat(60));
  console.log("ИТОГИ");
  console.log("═".repeat(60));

  const passedCount = results.filter((r) => r.passed).length;

  for (const r of results) {
    const status = r.passed ? "✅" : "❌";
    console.log(
      `  ${status} ${r.profile.name} (${r.profile.shortName}): получено ${r.actualCode}`,
    );
  }

  console.log();
  console.log(`Пройдено: ${passedCount}/${results.length}`);
  console.log(`Отчёты сохранены в: ${outputDir}`);

  if (passedCount === results.length) {
    console.log(`\n🎉 Все типы личности определены правильно!`);
  } else {
    console.log(`\n⚠️ Некоторые типы не совпали`);
    process.exit(1);
  }
}

main();

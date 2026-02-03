/**
 * Analyze Real Test Results from Production Database
 *
 * Fetches completed tests and generates detailed analysis reports
 * comparing answers with expected outcomes.
 *
 * Run: cd apps/bot && npx ts-node --transpile-only src/scripts/analyze-real-tests.ts
 */

import * as fs from "fs";
import * as path from "path";
import {
  questions,
  type Question,
  type RIASECScores,
  type RIASECType,
} from "../../../../packages/database/prisma/seed-data/riasec-data";
import { calculateAllPercentiles, RIASEC_LABELS } from "@skilltree/shared";

// ============================================================================
// Real Test Data (from production database)
// ============================================================================

interface RealTestData {
  sessionId: string;
  telegramId: number;
  completedAt: string;
  hollandCode: string;
  personalityType: string;
  riasecProfile: RIASECScores;
  answers: Record<string, string>;
}

// Data extracted from production database
const realTests: RealTestData[] = [
  {
    sessionId: "cml0ju0wf0001h1koiqed7kdo",
    telegramId: 656461523,
    completedAt: "2026-01-30",
    hollandCode: "ERA",
    personalityType: "Предприниматель-производитель",
    riasecProfile: { A: 46, C: 42, E: 56, I: 29, R: 55, S: 33 },
    answers: {
      q1: "i1",
      q2: "i2",
      q3: "3",
      q4: "e3",
      q5: "e4",
      q6: "4",
      q7: "yes",
      q8: "5",
      q9: "a5",
      q10: "e6",
      q11: "engaged",
      q12: "5",
      q13: "i6",
      q14: "2",
      q15: "e7",
      q16: "avoid",
      q17: "r2",
      q18: "5",
      q19: "s8",
      q20: "c6",
      q21: "i10",
      q22: "e9",
      q23: "e10",
      q24: "ce2",
      q26: "4",
      q27: "as",
      q28: "5",
      q29: "3",
      q30: "balanced",
      q31: "no",
      q32: "4",
      q33: "ES",
      q34: "3",
      q35: "4",
      q36: "s13",
      q37: "4",
      q38: "4",
      q39: "balanced2",
      q41: "s14",
      q42: "e12",
      q43: "3",
      q44: "3",
      q45: "yes",
      q46: "no",
      q47: "yes",
      q48: "yes",
      q49: "yes",
      q50: "yes",
      q51: "yes",
      q53: "no",
      q54: "no",
      q55: "ok",
    },
  },
  {
    sessionId: "cmkbhro0d003e13day8uy4jd6",
    telegramId: 870747019,
    completedAt: "2026-01-12",
    hollandCode: "ARE",
    personalityType: "Творец",
    riasecProfile: { A: 53, C: 35, E: 42, I: 37, R: 44, S: 26 },
    answers: {
      q1: "i1",
      q2: "i2",
      q3: "4",
      q4: "c3",
      q5: "e4",
      q6: "4",
      q7: "yes",
      q8: "3",
      q9: "a5",
      q10: "a6",
      q11: "engaged",
      q12: "1",
      q13: "i6",
      q14: "4",
      q15: "e7",
      q16: "avoid",
      q17: "r2",
      q18: "1",
      q19: "s8",
      q20: "ri",
      q21: "i10",
      q22: "e9",
      q23: "e10",
      q24: "ai",
      q26: "3",
      q27: "as",
      q28: "3",
      q29: "1",
      q30: "balanced",
      q31: "yes",
      q32: "3",
      q33: "also_correct",
      q34: "4",
      q35: "1",
      q36: "i13",
      q37: "5",
      q38: "5",
      q39: "i14",
      q41: "c11",
      q42: "e12",
      q43: "3",
      q44: "5",
      q45: "no",
      q46: "no",
      q47: "yes",
      q48: "no",
      q49: "yes",
      q50: "no",
      q51: "no",
      q53: "no",
      q54: "yes",
      q55: "great",
    },
  },
  {
    sessionId: "cmkb65xb2000313da4fbpqd8s",
    telegramId: 656461523,
    completedAt: "2026-01-12",
    hollandCode: "ARE",
    personalityType: "Творец",
    riasecProfile: { A: 52, C: 37, E: 39, I: 35, R: 45, S: 25 },
    answers: {
      q1: "r1",
      q2: "i2",
      q3: "5",
      q4: "i3",
      q5: "a4",
      q6: "3",
      q7: "yes",
      q8: "1",
      q9: "a5",
      q10: "i5",
      q11: "engaged",
      q12: "1",
      q13: "i6",
      q14: "1",
      q15: "e7",
      q16: "i8",
      q17: "r2",
      q18: "1",
      q19: "s8",
      q20: "c6",
      q21: "a10",
      q22: "s10",
      q23: "e10",
      q24: "r4",
      q26: "1",
      q27: "ae",
      q28: "3",
      q29: "3",
      q30: "ae2",
      q31: "no",
      q32: "3",
      q33: "guess",
      q34: "4",
      q35: "4",
      q36: "s13",
      q37: "4",
      q38: "4",
      q39: "ae3",
      q41: "s14",
      q42: "i15",
      q43: "3",
      q44: "4",
      q45: "yes",
      q46: "yes",
      q47: "yes",
      q48: "yes",
      q49: "yes",
      q50: "yes",
      q51: "yes",
      q53: "no",
      q54: "no",
      q55: "great",
    },
  },
  {
    sessionId: "cmk5eru6100031lxqy3l9vnti",
    telegramId: 656461523,
    completedAt: "2026-01-08",
    hollandCode: "RAE",
    personalityType: "Практик",
    riasecProfile: { A: 49, C: 46, E: 49, I: 41, R: 54, S: 28 },
    answers: {
      q1: "i1",
      q2: "i2",
      q3: "3",
      q4: "e3",
      q5: "e4",
      q6: "4",
      q7: "yes",
      q8: "3",
      q9: "a5",
      q10: "i5",
      q11: "tired",
      q12: "5",
      q13: "i6",
      q14: "4",
      q15: "e7",
      q16: "i8",
      q17: "r2",
      q18: "4",
      q19: "s8",
      q20: "c6",
      q21: "i10",
      q22: "e9",
      q23: "e10",
      q24: "ce2",
      q26: "3",
      q27: "ae",
      q28: "3",
      q29: "4",
      q30: "balanced",
      q31: "yes",
      q32: "4",
      q33: "guess",
      q34: "4",
      q35: "5",
      q36: "s13",
      q37: "5",
      q38: "5",
      q39: "balanced2",
      q41: "c11",
      q42: "e12",
      q43: "5",
      q44: "2",
      q45: "yes",
      q46: "yes",
      q47: "yes",
      q48: "yes",
      q49: "yes",
      q50: "yes",
      q51: "yes",
      q53: "yes",
      q54: "yes",
      q55: "ok",
    },
  },
];

// ============================================================================
// Analysis Functions
// ============================================================================

interface AnswerAnalysis {
  questionId: string;
  questionText: string;
  questionType: string;
  primaryDimension: string;
  answer: string;
  answerText: string;
  scores: RIASECScores;
}

function findAnswerText(question: Question, answerValue: string): string {
  if (question.type === "RATING") {
    return `${answerValue}/5`;
  }
  if (question.options) {
    const option = question.options.find((o) => o.value === answerValue);
    if (option) return option.text;
  }
  return answerValue;
}

function getAnswerScores(
  question: Question,
  answerValue: string,
): RIASECScores {
  const zero: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  if (question.type === "RATING") {
    const rating = parseInt(answerValue, 10) || 0;
    const dim = question.primaryDimension as RIASECType;
    return { ...zero, [dim]: rating };
  }

  if (question.options) {
    const option = question.options.find((o) => o.value === answerValue);
    if (option) return option.scores;
  }

  return zero;
}

function analyzeTest(test: RealTestData): {
  answers: AnswerAnalysis[];
  calculatedRaw: RIASECScores;
  calculatedNormalized: RIASECScores;
  topDimensions: RIASECType[];
  calculatedCode: string;
  matchesStored: boolean;
} {
  const answers: AnswerAnalysis[] = [];
  const calculatedRaw: RIASECScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const q of questions) {
    const answerValue = test.answers[q.id];
    if (!answerValue || answerValue === "[ПРОПУЩЕНО]") continue;

    const scores = getAnswerScores(q, answerValue);

    calculatedRaw.R += scores.R;
    calculatedRaw.I += scores.I;
    calculatedRaw.A += scores.A;
    calculatedRaw.S += scores.S;
    calculatedRaw.E += scores.E;
    calculatedRaw.C += scores.C;

    answers.push({
      questionId: q.id,
      questionText: q.text,
      questionType: q.type,
      primaryDimension: q.primaryDimension,
      answer: answerValue,
      answerText: findAnswerText(q, answerValue),
      scores,
    });
  }

  const calculatedNormalized = calculateAllPercentiles(calculatedRaw);

  const dims: RIASECType[] = ["R", "I", "A", "S", "E", "C"];
  const sorted = [...dims].sort(
    (a, b) => calculatedNormalized[b] - calculatedNormalized[a],
  );
  const topDimensions = sorted.slice(0, 3) as RIASECType[];
  const calculatedCode = topDimensions.join("");

  const matchesStored = calculatedCode === test.hollandCode;

  return {
    answers,
    calculatedRaw,
    calculatedNormalized,
    topDimensions,
    calculatedCode,
    matchesStored,
  };
}

// ============================================================================
// Report Generator
// ============================================================================

function generateReport(test: RealTestData): string {
  const analysis = analyzeTest(test);

  let report = `# Анализ реального теста

## Информация о тесте

| Параметр | Значение |
|----------|----------|
| Session ID | \`${test.sessionId}\` |
| Telegram ID | ${test.telegramId} |
| Дата прохождения | ${test.completedAt} |
| Сохранённый код | **${test.hollandCode}** |
| Сохранённый архетип | ${test.personalityType} |

## Сохранённый профиль RIASEC (percentiles)

| Измерение | Значение | Название |
|-----------|----------|----------|
`;

  for (const dim of ["R", "I", "A", "S", "E", "C"] as RIASECType[]) {
    const bar = "█".repeat(Math.round(test.riasecProfile[dim] / 5));
    const label = RIASEC_LABELS[dim].ru;
    report += `| ${dim} | ${test.riasecProfile[dim]}% ${bar} | ${label} |\n`;
  }

  report += `
## Пересчитанный профиль (на основе ответов)

### Raw Scores

| Измерение | Баллы |
|-----------|-------|
`;

  for (const dim of ["R", "I", "A", "S", "E", "C"] as RIASECType[]) {
    const bar = "█".repeat(Math.round(analysis.calculatedRaw[dim] / 2));
    report += `| ${dim} | ${analysis.calculatedRaw[dim].toFixed(1)} ${bar} |\n`;
  }

  report += `
### Normalized (Percentiles)

| Измерение | Percentile |
|-----------|------------|
`;

  for (const dim of ["R", "I", "A", "S", "E", "C"] as RIASECType[]) {
    const bar = "█".repeat(Math.round(analysis.calculatedNormalized[dim] / 5));
    report += `| ${dim} | ${analysis.calculatedNormalized[dim]}% ${bar} |\n`;
  }

  report += `
## Сравнение результатов

| Параметр | Сохранённый | Пересчитанный | Совпадение |
|----------|-------------|---------------|------------|
| Holland Code | ${test.hollandCode} | ${analysis.calculatedCode} | ${analysis.matchesStored ? "✅" : "❌"} |
| Топ-1 | ${test.hollandCode[0]} | ${analysis.topDimensions[0]} | ${test.hollandCode[0] === analysis.topDimensions[0] ? "✅" : "❌"} |
| Топ-2 | ${test.hollandCode[1]} | ${analysis.topDimensions[1]} | ${test.hollandCode[1] === analysis.topDimensions[1] ? "✅" : "❌"} |
| Топ-3 | ${test.hollandCode[2]} | ${analysis.topDimensions[2]} | ${test.hollandCode[2] === analysis.topDimensions[2] ? "✅" : "❌"} |

`;

  // Check profile differences
  report += `### Разница в percentiles (сохранённый vs пересчитанный)\n\n`;
  report += `| Измерение | Сохранённый | Пересчитанный | Разница |\n`;
  report += `|-----------|-------------|---------------|--------|\n`;

  for (const dim of ["R", "I", "A", "S", "E", "C"] as RIASECType[]) {
    const stored = test.riasecProfile[dim];
    const calculated = analysis.calculatedNormalized[dim];
    const diff = calculated - stored;
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
    report += `| ${dim} | ${stored}% | ${calculated}% | ${diffStr} |\n`;
  }

  report += `
## Детальные ответы (${analysis.answers.length} вопросов)

`;

  // Group by section
  const sections: Record<number, AnswerAnalysis[]> = {};
  for (const a of analysis.answers) {
    const q = questions.find((q) => q.id === a.questionId);
    const section = q?.section || 1;
    if (!sections[section]) sections[section] = [];
    sections[section].push(a);
  }

  for (const [sectionNum, sectionAnswers] of Object.entries(sections)) {
    report += `### Секция ${sectionNum}\n\n`;
    report += `| # | Вопрос | Тип | Ответ | Dim |\n`;
    report += `|---|--------|-----|-------|-----|\n`;

    for (const a of sectionAnswers) {
      const shortQ =
        a.questionText.length > 35
          ? a.questionText.slice(0, 35) + "..."
          : a.questionText;
      const shortA =
        a.answerText.length > 25
          ? a.answerText.slice(0, 25) + "..."
          : a.answerText;
      report += `| ${a.questionId} | ${shortQ} | ${a.questionType} | ${shortA} | ${a.primaryDimension} |\n`;
    }

    report += "\n";
  }

  // Analysis conclusion
  report += `## Заключение

`;

  if (analysis.matchesStored) {
    report += `✅ **Результаты совпадают.** Сохранённый код ${test.hollandCode} соответствует пересчитанному ${analysis.calculatedCode}.\n\n`;
  } else {
    report += `⚠️ **Результаты отличаются.** Сохранённый код ${test.hollandCode}, пересчитанный ${analysis.calculatedCode}.\n\n`;
    report += `Возможные причины:\n`;
    report += `- Исправление формулы нормализации (использование erf() вместо линейной аппроксимации)\n`;
    report += `- Изменение в подсчёте scores для некоторых типов вопросов\n`;
  }

  // Personality assessment
  const topDim = analysis.topDimensions[0]!;
  const topLabel = RIASEC_LABELS[topDim].ru;
  report += `### Оценка личности\n\n`;
  report += `Доминирующее измерение: **${topDim} (${topLabel})** — ${analysis.calculatedNormalized[topDim]}%\n\n`;

  // Check if result makes sense based on answers
  const dims: RIASECType[] = ["R", "I", "A", "S", "E", "C"];
  const sortedByRaw = [...dims].sort(
    (a, b) => analysis.calculatedRaw[b] - analysis.calculatedRaw[a],
  );
  report += `По сырым баллам топ-3: ${sortedByRaw.slice(0, 3).join("")}\n`;
  report += `После нормализации топ-3: ${analysis.topDimensions.join("")}\n\n`;

  if (sortedByRaw.slice(0, 3).join("") !== analysis.topDimensions.join("")) {
    report += `*Примечание: порядок изменился после нормализации из-за разных норм для каждого измерения.*\n`;
  }

  report += `
---
*Анализ сгенерирован: ${new Date().toISOString()}*
`;

  return report;
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  console.log("═".repeat(60));
  console.log("АНАЛИЗ РЕАЛЬНЫХ ТЕСТОВ ИЗ PRODUCTION БД");
  console.log("═".repeat(60));
  console.log(`Тестов для анализа: ${realTests.length}`);
  console.log();

  const outputDir = path.join(
    __dirname,
    "../../../../docs/tests/real-tests-analysis",
  );
  fs.mkdirSync(outputDir, { recursive: true });

  const results: Array<{
    test: RealTestData;
    matchesStored: boolean;
    calculatedCode: string;
  }> = [];

  for (const test of realTests) {
    console.log(
      `Анализирую: ${test.sessionId.slice(0, 12)}... (${test.completedAt})`,
    );

    const analysis = analyzeTest(test);
    const report = generateReport(test);

    const filename = `test-${test.completedAt}-${test.telegramId}.md`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, report, "utf-8");
    console.log(`  → Сохранено: ${filename}`);
    console.log(
      `     Сохранённый: ${test.hollandCode}, Пересчитанный: ${analysis.calculatedCode} ${analysis.matchesStored ? "✅" : "⚠️"}`,
    );

    results.push({
      test,
      matchesStored: analysis.matchesStored,
      calculatedCode: analysis.calculatedCode,
    });
  }

  // Summary report
  let summary = `# Сводка анализа реальных тестов

## Обзор

| Дата | Telegram ID | Сохранённый | Пересчитанный | Статус |
|------|-------------|-------------|---------------|--------|
`;

  for (const r of results) {
    const status = r.matchesStored ? "✅" : "⚠️";
    summary += `| ${r.test.completedAt} | ${r.test.telegramId} | ${r.test.hollandCode} | ${r.calculatedCode} | ${status} |\n`;
  }

  const matchCount = results.filter((r) => r.matchesStored).length;
  summary += `
## Итого

- Совпадений: ${matchCount}/${results.length}
- Расхождений: ${results.length - matchCount}/${results.length}

## Файлы отчётов

`;

  for (const r of results) {
    summary += `- [test-${r.test.completedAt}-${r.test.telegramId}.md](./test-${r.test.completedAt}-${r.test.telegramId}.md)\n`;
  }

  summary += `
## Выводы

${
  matchCount === results.length
    ? "✅ Все результаты совпадают — алгоритм работает корректно."
    : `⚠️ Есть расхождения (${results.length - matchCount}). Это ожидаемо после исправления формулы нормализации.\n\nСохранённые результаты были рассчитаны со старой формулой (линейная аппроксимация), а пересчитанные — с новой (правильная CDF с erf()).`
}

---
*Сгенерировано: ${new Date().toISOString()}*
`;

  fs.writeFileSync(path.join(outputDir, "README.md"), summary, "utf-8");
  console.log();
  console.log(`Сводка сохранена в: ${outputDir}/README.md`);

  console.log();
  console.log("═".repeat(60));
  console.log(`ИТОГО: ${matchCount}/${results.length} совпадений`);
  console.log("═".repeat(60));
}

main();

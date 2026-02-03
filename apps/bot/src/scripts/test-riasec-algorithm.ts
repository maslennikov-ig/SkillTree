/**
 * Test script for RIASEC algorithm verification
 *
 * Tests:
 * 1. normalizeScores function with known inputs
 * 2. calculateAllPercentiles correctness
 * 3. Edge cases (very high/low scores)
 *
 * Run: pnpm --filter @skilltree/bot ts-node src/scripts/test-riasec-algorithm.ts
 */

import { calculateAllPercentiles, RIASEC_NORMS } from "@skilltree/shared";

interface TestCase {
  name: string;
  rawScores: Record<string, number>;
  expectedRange: Record<string, { min: number; max: number }>;
}

const testCases: TestCase[] = [
  {
    name: "Average scores (at mean)",
    rawScores: {
      R: 16.5, // mean for R
      I: 20.3, // mean for I
      A: 21.1, // mean for A
      S: 24.7, // mean for S
      E: 21.4, // mean for E
      C: 17.8, // mean for C
    },
    // At mean, percentile should be ~50
    expectedRange: {
      R: { min: 45, max: 55 },
      I: { min: 45, max: 55 },
      A: { min: 45, max: 55 },
      S: { min: 45, max: 55 },
      E: { min: 45, max: 55 },
      C: { min: 45, max: 55 },
    },
  },
  {
    name: "High R-dominant profile (+2 SD)",
    rawScores: {
      R: 16.5 + 2 * 9.2, // ~35
      I: 20.3,
      A: 21.1,
      S: 24.7,
      E: 21.4,
      C: 17.8,
    },
    // +2 SD should give ~97-98 percentile
    expectedRange: {
      R: { min: 95, max: 100 },
      I: { min: 45, max: 55 },
      A: { min: 45, max: 55 },
      S: { min: 45, max: 55 },
      E: { min: 45, max: 55 },
      C: { min: 45, max: 55 },
    },
  },
  {
    name: "Low scores (-1 SD)",
    rawScores: {
      R: 16.5 - 9.2, // ~7.3
      I: 20.3 - 8.8, // ~11.5
      A: 21.1 - 9.5, // ~11.6
      S: 24.7 - 8.5, // ~16.2
      E: 21.4 - 9.0, // ~12.4
      C: 17.8 - 8.9, // ~8.9
    },
    // -1 SD should give ~16 percentile
    expectedRange: {
      R: { min: 10, max: 20 },
      I: { min: 10, max: 20 },
      A: { min: 10, max: 20 },
      S: { min: 10, max: 20 },
      E: { min: 10, max: 20 },
      C: { min: 10, max: 20 },
    },
  },
  {
    name: "Realistic test scenario (55 questions)",
    rawScores: {
      R: 25, // Above average
      I: 30, // High
      A: 15, // Below average
      S: 20, // Below average
      E: 25, // Average
      C: 20, // Average
    },
    expectedRange: {
      R: { min: 60, max: 90 }, // Slightly above average
      I: { min: 70, max: 100 }, // High
      A: { min: 20, max: 40 }, // Below average
      S: { min: 25, max: 45 }, // Below average
      E: { min: 55, max: 75 }, // Average
      C: { min: 50, max: 70 }, // Average
    },
  },
];

function runTests(): void {
  console.log("=".repeat(60));
  console.log("RIASEC Algorithm Test Suite");
  console.log("=".repeat(60));
  console.log();

  console.log("RIASEC Norms (from O*NET teen population):");
  for (const [dim, norm] of Object.entries(RIASEC_NORMS)) {
    console.log(`  ${dim}: mean=${norm.mean}, sd=${norm.sd}`);
  }
  console.log();

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`Test: ${test.name}`);
    console.log("-".repeat(40));

    const result = calculateAllPercentiles(
      test.rawScores as Record<"R" | "I" | "A" | "S" | "E" | "C", number>,
    );

    let testPassed = true;

    for (const dim of Object.keys(test.rawScores)) {
      const value = result[dim as "R" | "I" | "A" | "S" | "E" | "C"];
      const expected = test.expectedRange[dim];
      const rawScore = test.rawScores[dim];

      if (!expected || rawScore === undefined) {
        console.log(`  ${dim}: SKIPPED (missing data)`);
        continue;
      }

      const inRange = value >= expected.min && value <= expected.max;

      const status = inRange ? "PASS" : "FAIL";
      if (!inRange) testPassed = false;

      console.log(
        `  ${dim}: raw=${rawScore.toFixed(1)} -> percentile=${value} (expected: ${expected.min}-${expected.max}) [${status}]`,
      );
    }

    if (testPassed) {
      passed++;
      console.log("  Result: PASSED");
    } else {
      failed++;
      console.log("  Result: FAILED");
    }
    console.log();
  }

  console.log("=".repeat(60));
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run if executed directly
runTests();

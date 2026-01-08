/**
 * Prisma Seed Script for SkillTree Database
 *
 * Seeds:
 * - 55 RIASEC questions with options
 * - 43 careers with RIASEC profiles
 *
 * Run with: pnpm db:seed
 */

import {
  PrismaClient,
  Prisma,
  QuestionType,
  CareerOutlook,
  DemandLevel,
} from "@prisma/client";
import { questions, careers } from "./seed-data/riasec-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed Questions
  console.log("📝 Seeding questions...");
  let questionCount = 0;
  let optionCount = 0;

  for (const q of questions) {
    // Map question type
    const questionType = mapQuestionType(q.type);

    // Create question
    const question = await prisma.question.upsert({
      where: { id: q.id },
      update: {
        text: q.text,
        category: q.primaryDimension,
        questionType,
        difficulty: q.difficulty,
        sectionNumber: q.section,
        orderIndex: q.orderIndex,
        primaryDimension: q.primaryDimension,
        riasecWeights: Prisma.JsonNull, // Will be calculated from options
        isEasterEgg: q.isEasterEgg ?? false,
        hint: q.hint ?? null,
        ratingRange: q.ratingRange
          ? (q.ratingRange as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      create: {
        id: q.id,
        text: q.text,
        category: q.primaryDimension,
        questionType,
        difficulty: q.difficulty,
        sectionNumber: q.section,
        orderIndex: q.orderIndex,
        primaryDimension: q.primaryDimension,
        riasecWeights: Prisma.JsonNull,
        isEasterEgg: q.isEasterEgg ?? false,
        hint: q.hint ?? null,
        ratingRange: q.ratingRange
          ? (q.ratingRange as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
    questionCount++;

    // Seed options for multiple choice, binary choice questions
    if (q.options && q.options.length > 0) {
      // Delete existing options first
      await prisma.questionOption.deleteMany({
        where: { questionId: question.id },
      });

      // Create new options
      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];
        if (!opt) continue;
        await prisma.questionOption.create({
          data: {
            questionId: question.id,
            text: opt.text,
            emoji: extractEmoji(opt.text),
            value: opt.value,
            scores: opt.scores as unknown as Prisma.InputJsonValue,
            order: i,
          },
        });
        optionCount++;
      }
    }
  }

  console.log(
    `   ✅ Created ${questionCount} questions with ${optionCount} options`,
  );

  // Seed Careers
  console.log("💼 Seeding careers...");
  let careerCount = 0;

  for (const c of careers) {
    await prisma.career.upsert({
      where: { id: c.id },
      update: {
        title: c.title,
        titleRu: c.titleRu,
        description: c.description,
        riasecProfile: c.riasecProfile as unknown as Prisma.InputJsonValue,
        salaryMin: c.salaryMin,
        salaryMax: c.salaryMax,
        salarySource: c.salarySource,
        category: c.category,
        requiredSkills: c.requiredSkills,
        educationPath: c.educationPath,
        universities: c.universities,
        outlook: mapOutlook(c.outlook),
        demandLevel: mapDemandLevel(c.demandLevel),
      },
      create: {
        id: c.id,
        title: c.title,
        titleRu: c.titleRu,
        description: c.description,
        riasecProfile: c.riasecProfile as unknown as Prisma.InputJsonValue,
        salaryMin: c.salaryMin,
        salaryMax: c.salaryMax,
        salarySource: c.salarySource,
        category: c.category,
        requiredSkills: c.requiredSkills,
        educationPath: c.educationPath,
        universities: c.universities,
        outlook: mapOutlook(c.outlook),
        demandLevel: mapDemandLevel(c.demandLevel),
      },
    });
    careerCount++;
  }

  console.log(`   ✅ Created ${careerCount} careers`);

  console.log("🎉 Database seeded successfully!");
}

// Helper functions
function mapQuestionType(type: string): QuestionType {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return QuestionType.MULTIPLE_CHOICE;
    case "RATING":
      return QuestionType.RATING_SCALE;
    case "BINARY":
      return QuestionType.BINARY_CHOICE;
    case "OPEN_TEXT":
      return QuestionType.OPEN_ENDED;
    default:
      return QuestionType.MULTIPLE_CHOICE;
  }
}

function mapOutlook(outlook: string): CareerOutlook {
  switch (outlook) {
    case "growing":
      return CareerOutlook.GROWING;
    case "declining":
      return CareerOutlook.DECLINING;
    default:
      return CareerOutlook.STABLE;
  }
}

function mapDemandLevel(level: string): DemandLevel {
  switch (level) {
    case "high":
      return DemandLevel.HIGH;
    case "low":
      return DemandLevel.LOW;
    default:
      return DemandLevel.MEDIUM;
  }
}

function extractEmoji(text: string): string | null {
  const emojiMatch = text.match(/^(\p{Emoji})/u);
  return emojiMatch?.[1] ?? null;
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

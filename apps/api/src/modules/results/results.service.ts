import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "@skilltree/database";
import type { RIASECScores, CareerMatch } from "@skilltree/shared";

export interface TestResultData {
  sessionId: string;
  studentId: string;
  riasecProfile: RIASECScores;
  hollandCode: string;
  personalityType: string;
  topCareers: CareerMatch[];
  radarChartUrl: string | null;
  shareCardUrl: string | null;
  completedAt: Date;
}

@Injectable()
export class ResultsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get test results for a session
   */
  async getResults(sessionId: string): Promise<TestResultData> {
    const result = await this.prisma.testResult.findUnique({
      where: { sessionId },
      include: {
        session: {
          select: {
            studentId: true,
            completedAt: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException(
        `Results not found for session: ${sessionId}`,
      );
    }

    return {
      sessionId: result.sessionId,
      studentId: result.session.studentId,
      riasecProfile: result.riasecProfile as unknown as RIASECScores,
      hollandCode: result.hollandCode,
      personalityType: result.personalityType,
      topCareers: (result.topCareers as unknown as CareerMatch[]) || [],
      radarChartUrl: result.radarChartUrl,
      shareCardUrl: result.shareCardUrl,
      completedAt: result.session.completedAt || result.createdAt,
    };
  }

  /**
   * Get career matches for a session result
   */
  async getCareers(sessionId: string): Promise<{
    careers: Array<{
      id: string;
      title: string;
      titleRu: string;
      description: string;
      correlation: number;
      matchPercentage: number;
      matchCategory: string;
      category: string;
      salaryMin: number;
      salaryMax: number;
      demandLevel: string;
    }>;
  }> {
    const result = await this.prisma.testResult.findUnique({
      where: { sessionId },
    });

    if (!result) {
      throw new NotFoundException(
        `Results not found for session: ${sessionId}`,
      );
    }

    const topCareers = (result.topCareers as unknown as CareerMatch[]) || [];
    const careerIds = topCareers.map((c) => c.careerId);

    const careers = await this.prisma.career.findMany({
      where: { id: { in: careerIds } },
    });

    // Combine career data with match data
    const enrichedCareers = topCareers
      .map((match) => {
        const career = careers.find((c) => c.id === match.careerId);
        if (!career) return null;

        return {
          id: career.id,
          title: career.title,
          titleRu: career.titleRu,
          description: career.description,
          correlation: match.correlation,
          matchPercentage: match.matchPercentage,
          matchCategory: match.matchCategory,
          category: career.category,
          salaryMin: career.salaryMin,
          salaryMax: career.salaryMax,
          demandLevel: career.demandLevel,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    return { careers: enrichedCareers };
  }

  /**
   * Update radar chart URL for a session result
   */
  async updateRadarChartUrl(sessionId: string, url: string): Promise<void> {
    await this.prisma.testResult.update({
      where: { sessionId },
      data: { radarChartUrl: url },
    });
  }

  /**
   * Update share card URL for a session result
   */
  async updateShareCardUrl(sessionId: string, url: string): Promise<void> {
    await this.prisma.testResult.update({
      where: { sessionId },
      data: { shareCardUrl: url },
    });
  }

  /**
   * Get test results by public share token
   * Used for public sharing links
   */
  async getResultsByShareToken(shareToken: string): Promise<TestResultData> {
    const result = await this.prisma.testResult.findUnique({
      where: { shareToken },
      include: {
        session: {
          select: {
            studentId: true,
            completedAt: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException(
        `Results not found for share token: ${shareToken}`,
      );
    }

    return {
      sessionId: result.sessionId,
      studentId: result.session.studentId,
      riasecProfile: result.riasecProfile as unknown as RIASECScores,
      hollandCode: result.hollandCode,
      personalityType: result.personalityType,
      topCareers: (result.topCareers as unknown as CareerMatch[]) || [],
      radarChartUrl: result.radarChartUrl,
      shareCardUrl: result.shareCardUrl,
      completedAt: result.session.completedAt || result.createdAt,
    };
  }

  /**
   * Get career matches by share token
   */
  async getCareersByShareToken(shareToken: string): Promise<{
    careers: Array<{
      id: string;
      title: string;
      titleRu: string;
      description: string;
      correlation: number;
      matchPercentage: number;
      matchCategory: string;
      category: string;
      salaryMin: number;
      salaryMax: number;
      demandLevel: string;
    }>;
  }> {
    const result = await this.prisma.testResult.findUnique({
      where: { shareToken },
    });

    if (!result) {
      throw new NotFoundException(
        `Results not found for share token: ${shareToken}`,
      );
    }

    const topCareers = (result.topCareers as unknown as CareerMatch[]) || [];
    const careerIds = topCareers.map((c) => c.careerId);

    const careers = await this.prisma.career.findMany({
      where: { id: { in: careerIds } },
    });

    // Combine career data with match data
    const enrichedCareers = topCareers
      .map((match) => {
        const career = careers.find((c) => c.id === match.careerId);
        if (!career) return null;

        return {
          id: career.id,
          title: career.title,
          titleRu: career.titleRu,
          description: career.description,
          correlation: match.correlation,
          matchPercentage: match.matchPercentage,
          matchCategory: match.matchCategory,
          category: career.category,
          salaryMin: career.salaryMin,
          salaryMax: career.salaryMax,
          demandLevel: career.demandLevel,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    return { careers: enrichedCareers };
  }

  /**
   * Get all data needed for PDF roadmap generation in optimized queries
   * Fetches test results, careers, and achievements in parallel
   */
  async getFullRoadmapData(sessionId: string): Promise<{
    result: TestResultData;
    studentName: string;
    careers: Array<{
      id: string;
      title: string;
      titleRu: string;
      description: string;
      correlation: number;
      matchPercentage: number;
      matchCategory: string;
      category: string;
      salaryMin: number;
      salaryMax: number;
      demandLevel: string;
      requiredSkills: string[];
      educationPath: string[];
      universities: string[];
    }>;
    achievements: Array<{
      badgeType: string;
      earnedAt: Date;
      metadata: unknown;
    }>;
  }> {
    // Query 1: Get TestResult with full Session -> Student -> User data
    const result = await this.prisma.testResult.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException(
        `Results not found for session: ${sessionId}`,
      );
    }

    // Format student name
    const user = result.session.student.user;
    const studentName = user.firstName
      ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
      : user.telegramUsername || "Учащийся";

    // Get career IDs from results
    const topCareers = (result.topCareers as unknown as CareerMatch[]) || [];
    const careerIds = topCareers.map((c) => c.careerId);

    // Query 2 & 3: Get Career data and Achievements in parallel
    const [careersData, achievementsData] = await Promise.all([
      this.prisma.career.findMany({
        where: { id: { in: careerIds } },
      }),
      this.prisma.achievement.findMany({
        where: { userId: result.session.student.userId },
        orderBy: { earnedAt: "desc" },
      }),
    ]);

    // Helper to safely convert Prisma JSON to string array
    const ensureStringArray = (value: unknown): string[] => {
      if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
        return value;
      }
      return [];
    };

    // Combine career data with match data, preserving order from topCareers
    const enrichedCareers = topCareers
      .map((match) => {
        const career = careersData.find((c) => c.id === match.careerId);
        if (!career) return null;

        return {
          id: career.id,
          title: career.title,
          titleRu: career.titleRu,
          description: career.description,
          correlation: match.correlation,
          matchPercentage: match.matchPercentage,
          matchCategory: match.matchCategory,
          category: career.category,
          salaryMin: career.salaryMin,
          salaryMax: career.salaryMax,
          demandLevel: career.demandLevel,
          requiredSkills: ensureStringArray(career.requiredSkills),
          educationPath: ensureStringArray(career.educationPath),
          universities: ensureStringArray(career.universities),
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Format achievements for PDF
    const achievements = achievementsData.map((a) => ({
      badgeType: a.badgeType,
      earnedAt: a.earnedAt,
      metadata: a.metadata,
    }));

    return {
      result: {
        sessionId: result.sessionId,
        studentId: result.session.studentId,
        riasecProfile: result.riasecProfile as unknown as RIASECScores,
        hollandCode: result.hollandCode,
        personalityType: result.personalityType,
        topCareers: topCareers,
        radarChartUrl: result.radarChartUrl,
        shareCardUrl: result.shareCardUrl,
        completedAt: result.session.completedAt || result.createdAt,
      },
      studentName,
      careers: enrichedCareers,
      achievements,
    };
  }
}

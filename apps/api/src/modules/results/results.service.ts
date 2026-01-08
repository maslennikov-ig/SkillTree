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
}

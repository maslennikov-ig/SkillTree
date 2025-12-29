import { Controller, Get, Param, Res, NotFoundException } from "@nestjs/common";
import { Response } from "express";
import { PdfService, RoadmapData } from "./pdf.service";
import { ResultsService } from "../results/results.service";
import { PrismaService } from "../prisma/prisma.service";
import { ARCHETYPES } from "@skilltree/shared";

/**
 * PDF Controller for generating and serving career roadmap PDFs
 * Endpoint: GET /results/:sessionId/pdf-roadmap
 */
@Controller("results")
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly resultsService: ResultsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /results/:sessionId/pdf-roadmap
   * Generate and download career roadmap PDF
   */
  @Get(":sessionId/pdf-roadmap")
  async getPdfRoadmap(
    @Param("sessionId") sessionId: string,
    @Res() res: Response,
  ) {
    // Get test results
    const results = await this.resultsService.getResults(sessionId);

    // Get career details with full information
    const careersData = await this.resultsService.getCareers(sessionId);

    if (careersData.careers.length === 0) {
      throw new NotFoundException(
        `No career matches found for session: ${sessionId}`,
      );
    }

    // Get student information
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    // Get full career data from database for additional fields
    const careerIds = careersData.careers.map((c) => c.id);
    const fullCareers = await this.prisma.career.findMany({
      where: { id: { in: careerIds } },
    });

    // Build career map for quick lookup
    const careerMap = new Map(fullCareers.map((c) => [c.id, c]));

    // Construct student name
    const studentName = session.student.user.firstName
      ? `${session.student.user.firstName}${session.student.user.lastName ? " " + session.student.user.lastName : ""}`
      : session.student.user.telegramUsername || "Учащийся";

    // Get archetype from Holland code
    const hollandCode2Char = results.hollandCode.substring(0, 2);
    const archetype = ARCHETYPES[hollandCode2Char] || {
      name: "Неопределённый",
      emoji: "?",
      description: "Профиль интересов не определён",
    };

    // Prepare roadmap data
    const roadmapData: RoadmapData = {
      studentName,
      testDate: results.completedAt,
      riasecScores: results.riasecProfile,
      hollandCode: results.hollandCode,
      archetype,
      topCareers: careersData.careers.slice(0, 5).map((career) => {
        const fullCareer = careerMap.get(career.id);
        return {
          title: career.titleRu || career.title,
          matchPercentage: career.matchPercentage,
          description: career.description,
          requiredSkills: (fullCareer?.requiredSkills as string[]) || [],
          educationPath: (fullCareer?.educationPath as string[]) || [],
          universities: (fullCareer?.universities as string[]) || [],
        };
      }),
    };

    // Generate PDF
    const pdfBuffer = await this.pdfService.generateCareerRoadmap(roadmapData);

    // Set response headers for PDF download
    const filename = `skilltree-roadmap-${sessionId}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
      "Cache-Control": "private, max-age=3600", // Cache for 1 hour
    });

    res.send(pdfBuffer);
  }
}

import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { Response } from "express";
import { PdfService, RoadmapData } from "./pdf.service";
import { ResultsService } from "../results/results.service";
import { ARCHETYPES } from "@skilltree/shared";

/**
 * PDF Controller for generating and serving career roadmap PDFs
 * Endpoint: GET /results/:sessionId/pdf-roadmap
 *
 * Uses optimized database queries via ResultsService.getFullRoadmapData()
 * which reduces 4 round-trips to 2.
 */
@Controller("results")
export class PdfController {
  private readonly logger = new Logger(PdfController.name);

  constructor(
    private readonly pdfService: PdfService,
    private readonly resultsService: ResultsService,
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
    // Validate UUID format to prevent injection attempts
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      throw new BadRequestException("Invalid session ID format");
    }

    try {
      // Get all roadmap data in optimized queries (2 instead of 4)
      const { result, studentName, careers } =
        await this.resultsService.getFullRoadmapData(sessionId);

      if (careers.length === 0) {
        throw new NotFoundException(
          `No career matches found for session: ${sessionId}`,
        );
      }

      // Get archetype from Holland code
      const hollandCode2Char = result.hollandCode.substring(0, 2);
      const archetype = ARCHETYPES[hollandCode2Char] || {
        name: "Неопределённый",
        emoji: "?",
        description: "Профиль интересов не определён",
      };

      // Prepare roadmap data (type-safe from service)
      const roadmapData: RoadmapData = {
        studentName,
        testDate: result.completedAt,
        riasecScores: result.riasecProfile,
        hollandCode: result.hollandCode,
        archetype,
        topCareers: careers.slice(0, 5).map((career) => ({
          title: career.titleRu || career.title,
          matchPercentage: career.matchPercentage,
          description: career.description,
          requiredSkills: career.requiredSkills,
          educationPath: career.educationPath,
          universities: career.universities,
        })),
      };

      // Generate PDF
      const pdfBuffer =
        await this.pdfService.generateCareerRoadmap(roadmapData);

      // Sanitize sessionId for filename
      const safeSessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, "");
      const filename = `skilltree-roadmap-${safeSessionId}.pdf`;

      // Set response headers for PDF download with security headers
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": pdfBuffer.length,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      });

      res.send(pdfBuffer);
    } catch (error) {
      // Log structured error for debugging
      this.logger.error(
        `Failed to generate PDF for session ${sessionId}:`,
        error instanceof Error ? error.stack : error,
      );

      // Re-throw to let NestJS exception filter handle the response
      throw error;
    }
  }
}

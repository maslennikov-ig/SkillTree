import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { ResultsService } from "./results.service";
import { ChartService } from "./chart.service";
import { CardService } from "./card.service";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { ARCHETYPES } from "@skilltree/shared";

@Controller("results")
export class ResultsController {
  private readonly logger = new Logger(ResultsController.name);

  constructor(
    private readonly resultsService: ResultsService,
    private readonly chartService: ChartService,
    private readonly cardService: CardService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /results/:sessionId
   * Get test results for a session
   */
  @Get(":sessionId")
  async getResults(@Param("sessionId") sessionId: string) {
    return this.resultsService.getResults(sessionId);
  }

  /**
   * GET /results/:sessionId/careers
   * Get matched careers for a session
   */
  @Get(":sessionId/careers")
  async getCareers(@Param("sessionId") sessionId: string) {
    return this.resultsService.getCareers(sessionId);
  }

  /**
   * GET /results/:sessionId/radar-chart
   * Generate and return radar chart image
   */
  @Get(":sessionId/radar-chart")
  async getRadarChart(
    @Param("sessionId") sessionId: string,
    @Res() res: Response,
  ) {
    const results = await this.resultsService.getResults(sessionId);

    const chartBuffer = await this.chartService.generateRadarChart(
      results.riasecProfile,
    );

    res.set({
      "Content-Type": "image/png",
      "Content-Length": chartBuffer.length,
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    });

    res.send(chartBuffer);
  }

  /**
   * GET /results/:sessionId/summary
   * Get a summary of test results for display
   */
  @Get(":sessionId/summary")
  async getSummary(@Param("sessionId") sessionId: string) {
    const results = await this.resultsService.getResults(sessionId);
    const careersData = await this.resultsService.getCareers(sessionId);

    return {
      hollandCode: results.hollandCode,
      personalityType: results.personalityType,
      profile: results.riasecProfile,
      topCareer: careersData.careers[0] || null,
      completedAt: results.completedAt,
    };
  }

  /**
   * GET /results/:sessionId/share-card
   * Generate and return share card image (1080x1080 PNG)
   */
  @Get(":sessionId/share-card")
  async getShareCard(
    @Param("sessionId") sessionId: string,
    @Res() res: Response,
  ) {
    const results = await this.resultsService.getResults(sessionId);
    const careersData = await this.resultsService.getCareers(sessionId);

    const topCareer = careersData.careers[0];
    if (!topCareer) {
      throw new NotFoundException(
        `No career matches found for session: ${sessionId}`,
      );
    }

    const cardBuffer = await this.cardService.generateShareCard({
      scores: results.riasecProfile,
      hollandCode: results.hollandCode,
      personalityType: results.personalityType,
      topCareerTitle: topCareer.titleRu || topCareer.title,
    });

    res.set({
      "Content-Type": "image/png",
      "Content-Length": cardBuffer.length,
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    });

    res.send(cardBuffer);
  }

  /**
   * POST /results/:sessionId/email-report
   * Send parent report email with test results
   */
  @Post(":sessionId/email-report")
  async sendEmailReport(
    @Param("sessionId") sessionId: string,
    @Body() body: { parentEmail: string; parentName?: string },
  ) {
    this.logger.log(`Email report requested for session ${sessionId}`);

    // Validate email
    if (!body.parentEmail) {
      throw new BadRequestException("Parent email is required");
    }

    // Get test results and careers
    const results = await this.resultsService.getResults(sessionId);
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

    // Construct student name from user data
    const studentName = session.student.user.firstName
      ? `${session.student.user.firstName}${session.student.user.lastName ? " " + session.student.user.lastName : ""}`
      : session.student.user.telegramUsername || "Учащийся";

    // Get archetype from Holland code
    const hollandCode2Char = results.hollandCode.substring(0, 2);
    const archetype = ARCHETYPES[hollandCode2Char] || {
      name: "Неопределённый",
      emoji: "❓",
      description: "Профиль интересов не определён",
    };

    // Prepare top 3 careers
    const topCareers = careersData.careers.slice(0, 3).map((career) => ({
      title: career.titleRu || career.title,
      description: career.description,
      matchPercentage: career.matchPercentage,
    }));

    // Send email
    const success = await this.emailService.sendParentReport(body.parentEmail, {
      parentName: body.parentName || "Родитель",
      studentName,
      testDate: results.completedAt,
      hollandCode: results.hollandCode,
      archetype,
      riasecScores: results.riasecProfile,
      topCareers,
    });

    if (!success) {
      this.logger.error(`Failed to send email report for session ${sessionId}`);
      throw new BadRequestException(
        "Failed to send email. Please try again later.",
      );
    }

    this.logger.log(
      `Email report sent successfully for session ${sessionId} to ${body.parentEmail}`,
    );
    return {
      success: true,
      message: "Report email sent successfully",
      sentTo: body.parentEmail,
    };
  }
}

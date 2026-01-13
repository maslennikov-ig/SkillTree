import { Injectable, Logger } from "@nestjs/common";
import PDFDocument from "pdfkit";
import * as path from "path";
import * as fs from "fs";
import type { RIASECScores, RIASECType } from "@skilltree/shared";
import {
  RIASEC_COLORS,
  RIASEC_LABELS,
  RIASEC_DESCRIPTIONS,
  calculateAllPercentiles,
  getLowestDimensions,
} from "@skilltree/shared";
import { ChartService } from "../results/chart.service";
import {
  GROWTH_RECOMMENDATIONS,
  getBadgeDisplayInfo,
} from "./growth-recommendations";

// Demand level translations
const DEMAND_LEVEL_RU: Record<string, { label: string; color: string }> = {
  HIGH: { label: "Высокий спрос", color: "#27AE60" },
  MEDIUM: { label: "Средний спрос", color: "#F39C12" },
  LOW: { label: "Низкий спрос", color: "#E74C3C" },
};

// Badge tier colors
const BADGE_TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#D4AF37",
  platinum: "#E5E4E2",
};

/**
 * Enhanced career data with market information
 */
export interface EnhancedCareer {
  title: string;
  titleRu?: string;
  matchPercentage: number;
  description: string;
  requiredSkills: string[];
  educationPath: string[];
  universities: string[];
  salaryMin?: number;
  salaryMax?: number;
  demandLevel?: string;
  category?: string;
}

/**
 * Achievement data for PDF display
 */
export interface AchievementData {
  badgeType: string;
  earnedAt: Date;
  metadata?: unknown;
}

/**
 * Roadmap data structure for PDF generation
 */
export interface RoadmapData {
  studentName: string;
  testDate: Date;
  riasecScores: RIASECScores;
  hollandCode: string;
  archetype: { name: string; emoji: string; description: string };
  topCareers: EnhancedCareer[];
  achievements?: AchievementData[];
}

/**
 * PDF generation service for career roadmap documents (10-12 pages)
 * Uses PDFKit with Inter font family for professional Russian-language output
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  // A4 page dimensions in points (72 points per inch)
  private readonly PAGE_WIDTH = 595.28;
  private readonly PAGE_HEIGHT = 841.89;
  private readonly MARGIN = 50;
  private readonly CONTENT_WIDTH = 595.28 - 100;

  // Colors
  private readonly PRIMARY_COLOR = "#2ECC71";
  private readonly SECONDARY_COLOR = "#3498DB";
  private readonly TEXT_COLOR = "#2C3E50";
  private readonly MUTED_COLOR = "#7F8C8D";

  // Badge grid layout constants
  private readonly BADGE_SIZE = 80;
  private readonly BADGES_PER_ROW = 3;
  private readonly BADGE_GAP = 40;
  private readonly BADGE_ROW_HEIGHT = 170; // BADGE_SIZE + space for 2-line name + 2-line description

  constructor(private readonly chartService: ChartService) {}

  /**
   * Validate input data for PDF generation
   */
  private validateRoadmapData(data: RoadmapData): void {
    if (!data.studentName || !data.hollandCode) {
      throw new Error("Invalid roadmap data: missing required fields");
    }
    if (!data.riasecScores) {
      throw new Error("Invalid roadmap data: missing RIASEC scores");
    }
    const requiredKeys: Array<keyof RIASECScores> = [
      "R",
      "I",
      "A",
      "S",
      "E",
      "C",
    ];
    for (const key of requiredKeys) {
      if (typeof data.riasecScores[key] !== "number") {
        throw new Error(`Invalid RIASEC score: ${key} must be a number`);
      }
    }
    if (!Array.isArray(data.topCareers)) {
      throw new Error("Invalid roadmap data: topCareers must be an array");
    }
  }

  /**
   * Generate a career roadmap PDF document (10-12 pages)
   */
  async generateCareerRoadmap(data: RoadmapData): Promise<Buffer> {
    this.validateRoadmapData(data);

    return new Promise((resolve, reject) => {
      const generatePdf = async () => {
        try {
          const doc = new PDFDocument({
            size: "A4",
            margin: this.MARGIN,
            bufferPages: false,
            info: {
              Title: "SkillTree - Стратегия профессионального развития",
              Author: "SkillTree",
              Subject: `Карьерный план для ${data.studentName}`,
              Creator: "SkillTree Career Assessment",
            },
          });

          const chunks: Buffer[] = [];
          doc.on("data", (chunk: Buffer) => chunks.push(chunk));
          doc.on("end", () => resolve(Buffer.concat(chunks)));
          doc.on("error", reject);

          this.registerFonts(doc);

          const percentiles = calculateAllPercentiles(data.riasecScores);

          // Page 1: Cover Page + Executive Summary
          this.renderCoverPage(doc, data);

          // Page 2-3: RIASEC Profile with percentile bars
          doc.addPage();
          await this.renderRiasecProfile(doc, data, percentiles);

          // Page 4-5: Growth Areas
          doc.addPage();
          this.renderGrowthAreas(doc, data, percentiles);

          // Page 6-8: Enhanced Careers with salary data
          doc.addPage();
          this.renderEnhancedCareers(doc, data);

          // Page 9: Achievements (if any)
          if (data.achievements && data.achievements.length > 0) {
            doc.addPage();
            this.renderAchievements(doc, data);
          }

          // Page 10-11: Development Roadmap
          doc.addPage();
          this.renderDevelopmentRoadmap(doc, data);

          doc.end();
        } catch (error) {
          reject(error);
        }
      };

      generatePdf();
    });
  }

  /**
   * Register Inter font family
   */
  private registerFonts(doc: PDFKit.PDFDocument): void {
    const fontsPath = path.join(__dirname, "../../../assets/fonts");
    const fonts = [
      { name: "Inter-Regular", file: "Inter-Regular.ttf" },
      { name: "Inter-Medium", file: "Inter-Medium.ttf" },
      { name: "Inter-Bold", file: "Inter-Bold.ttf" },
    ];

    for (const font of fonts) {
      const fontPath = path.join(fontsPath, font.file);
      if (fs.existsSync(fontPath)) {
        try {
          doc.registerFont(font.name, fontPath);
        } catch (error) {
          this.logger.error(`Failed to register font ${font.name}:`, error);
        }
      } else {
        this.logger.warn(`Font file not found: ${fontPath}`);
      }
    }
  }

  /**
   * Cover Page: Professional title and executive summary
   */
  private renderCoverPage(doc: PDFKit.PDFDocument, data: RoadmapData): void {
    let y = 120;

    // Main title
    doc
      .font("Inter-Bold")
      .fontSize(32)
      .fillColor(this.PRIMARY_COLOR)
      .text("СТРАТЕГИЯ", this.MARGIN, y, {
        width: this.CONTENT_WIDTH,
        align: "center",
      });

    y +=
      doc.heightOfString("СТРАТЕГИЯ", {
        width: this.CONTENT_WIDTH,
      }) + 15;

    const subtitleText = "ПРОФЕССИОНАЛЬНОГО РАЗВИТИЯ";
    doc
      .font("Inter-Bold")
      .fontSize(28)
      .fillColor(this.TEXT_COLOR)
      .text(subtitleText, this.MARGIN, y, {
        width: this.CONTENT_WIDTH,
        align: "center",
      });

    y +=
      doc.heightOfString(subtitleText, {
        width: this.CONTENT_WIDTH,
      }) + 20;

    doc
      .font("Inter-Medium")
      .fontSize(16)
      .fillColor(this.MUTED_COLOR)
      .text("Персональный навигатор карьеры", this.MARGIN, y, {
        width: this.CONTENT_WIDTH,
        align: "center",
      });

    y += 40;

    // Decorative line
    doc
      .strokeColor(this.PRIMARY_COLOR)
      .lineWidth(3)
      .moveTo(this.MARGIN + 100, y)
      .lineTo(this.PAGE_WIDTH - this.MARGIN - 100, y)
      .stroke();

    y += 60;

    // Student info box
    doc
      .roundedRect(this.MARGIN + 50, y, this.CONTENT_WIDTH - 100, 120, 10)
      .fillAndStroke("#F8F9FA", this.PRIMARY_COLOR);

    y += 20;

    doc
      .font("Inter-Medium")
      .fontSize(14)
      .fillColor(this.MUTED_COLOR)
      .text("Подготовлено для:", this.MARGIN + 70, y);

    y += 25;

    doc
      .font("Inter-Bold")
      .fontSize(22)
      .fillColor(this.TEXT_COLOR)
      .text(data.studentName, this.MARGIN + 70, y);

    y += 40;

    doc
      .font("Inter-Regular")
      .fontSize(12)
      .fillColor(this.MUTED_COLOR)
      .text(`Дата: ${this.formatDate(data.testDate)}`, this.MARGIN + 70, y);

    y += 100;

    // Executive Summary
    doc
      .font("Inter-Bold")
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text("Краткое резюме", this.MARGIN, y);

    y += 30;

    const colWidth = (this.CONTENT_WIDTH - 40) / 3;

    this.renderSummaryBox(doc, this.MARGIN, y, colWidth, {
      label: "Код Голланда",
      value: data.hollandCode,
      color: this.PRIMARY_COLOR,
    });

    this.renderSummaryBox(doc, this.MARGIN + colWidth + 20, y, colWidth, {
      label: "Архетип",
      value: data.archetype.name,
      color: this.SECONDARY_COLOR,
    });

    const topCareer = data.topCareers[0];
    this.renderSummaryBox(doc, this.MARGIN + (colWidth + 20) * 2, y, colWidth, {
      label: "Топ профессия",
      value: topCareer?.titleRu || topCareer?.title || "—",
      badge: topCareer
        ? `${Math.round(topCareer.matchPercentage)}%`
        : undefined,
      color: "#27AE60",
    });

    // Footer
    const footerY = this.PAGE_HEIGHT - 50;
    doc
      .font("Inter-Bold")
      .fontSize(14)
      .fillColor(this.PRIMARY_COLOR)
      .text("SkillTree", this.MARGIN, footerY, { continued: true })
      .font("Inter-Regular")
      .fillColor(this.MUTED_COLOR)
      .text(" | Система профориентации");
  }

  /**
   * Render a summary box
   */
  private renderSummaryBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    options: { label: string; value: string; badge?: string; color: string },
  ): void {
    const height = 90;
    doc.roundedRect(x, y, width, height, 8).fillAndStroke("#FFFFFF", "#E0E0E0");

    doc
      .font("Inter-Medium")
      .fontSize(11)
      .fillColor(this.MUTED_COLOR)
      .text(options.label, x + 10, y + 12, { width: width - 20 });

    doc
      .font("Inter-Bold")
      .fontSize(14)
      .fillColor(options.color)
      .text(options.value, x + 10, y + 35, {
        width: width - 20,
        height: 40,
        ellipsis: true,
      });

    if (options.badge) {
      doc.roundedRect(x + width - 50, y + 60, 40, 22, 4).fill("#27AE60");
      doc
        .font("Inter-Bold")
        .fontSize(11)
        .fillColor("#FFFFFF")
        .text(options.badge, x + width - 50, y + 65, {
          width: 40,
          align: "center",
        });
    }
  }

  /**
   * RIASEC Profile with radar chart and percentile bars
   */
  private async renderRiasecProfile(
    doc: PDFKit.PDFDocument,
    data: RoadmapData,
    percentiles: Record<RIASECType, number>,
  ): Promise<void> {
    let y = this.MARGIN;

    doc
      .font("Inter-Bold")
      .fontSize(24)
      .fillColor(this.PRIMARY_COLOR)
      .text("Профиль интересов RIASEC", this.MARGIN, y);

    y += 35; // Proper spacing for 24pt header

    // Radar chart
    const chartBuffer = await this.chartService.generateRadarChart(
      data.riasecScores,
    );
    const chartSize = 220;
    const chartX = (this.PAGE_WIDTH - chartSize) / 2;
    doc.image(chartBuffer, chartX, y, { width: chartSize });

    y += chartSize + 30;

    // Percentile bars
    doc
      .font("Inter-Bold")
      .fontSize(16)
      .fillColor(this.SECONDARY_COLOR)
      .text("Сравнение с другими подростками", this.MARGIN, y);

    y += 25;

    const types: RIASECType[] = ["R", "I", "A", "S", "E", "C"];

    for (const type of types) {
      const percentile = percentiles[type];
      const label = RIASEC_LABELS[type].ru;
      const color = RIASEC_COLORS[type];

      doc
        .font("Inter-Medium")
        .fontSize(12)
        .fillColor(this.TEXT_COLOR)
        .text(`${type} — ${label}`, this.MARGIN, y, { width: 150 });

      const barX = this.MARGIN + 160;
      const barWidth = this.CONTENT_WIDTH - 220;
      const barHeight = 20;

      doc.roundedRect(barX, y, barWidth, barHeight, 4).fill("#E8E8E8");

      const fillWidth = (percentile / 100) * barWidth;
      if (fillWidth > 0) {
        doc.roundedRect(barX, y, fillWidth, barHeight, 4).fill(color);
      }

      doc
        .font("Inter-Bold")
        .fontSize(12)
        .fillColor(this.TEXT_COLOR)
        .text(`${percentile}%`, barX + barWidth + 10, y + 3);

      y += 35;
    }

    // Detailed descriptions
    if (y + 200 > this.PAGE_HEIGHT - this.MARGIN) {
      doc.addPage();
      y = this.MARGIN;
    }

    doc
      .font("Inter-Bold")
      .fontSize(16)
      .fillColor(this.SECONDARY_COLOR)
      .text("Ваши сильные стороны", this.MARGIN, y);

    y += 25;

    const sortedTypes = types
      .map((t) => ({ type: t, score: data.riasecScores[t] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    for (const { type } of sortedTypes) {
      const desc = RIASEC_DESCRIPTIONS[type];
      const color = RIASEC_COLORS[type];

      if (y + 80 > this.PAGE_HEIGHT - this.MARGIN) {
        doc.addPage();
        y = this.MARGIN;
      }

      doc.circle(this.MARGIN + 8, y + 8, 6).fill(color);

      doc
        .font("Inter-Bold")
        .fontSize(14)
        .fillColor(this.TEXT_COLOR)
        .text(desc.fullName, this.MARGIN + 25, y);

      y += 22;

      doc
        .font("Inter-Regular")
        .fontSize(11)
        .fillColor(this.MUTED_COLOR)
        .text(desc.longDescription, this.MARGIN + 25, y, {
          width: this.CONTENT_WIDTH - 35,
        });

      y +=
        doc.heightOfString(desc.longDescription, {
          width: this.CONTENT_WIDTH - 35,
        }) + 15;
    }
  }

  /**
   * Growth Areas section - positive framing for lowest dimensions
   */
  private renderGrowthAreas(
    doc: PDFKit.PDFDocument,
    data: RoadmapData,
    percentiles: Record<RIASECType, number>,
  ): void {
    let y = this.MARGIN;

    doc
      .font("Inter-Bold")
      .fontSize(24)
      .fillColor(this.PRIMARY_COLOR)
      .text("Зоны развития", this.MARGIN, y);

    y += 35; // Proper spacing for 24pt header

    doc
      .font("Inter-Regular")
      .fontSize(12)
      .fillColor(this.MUTED_COLOR)
      .text(
        "Области, в которых вы можете расти и развиваться. Это не слабости — это возможности!",
        this.MARGIN,
        y,
        { width: this.CONTENT_WIDTH },
      );

    y += 30; // Space after subtitle

    // Get lowest 2 dimensions
    const lowestTypes = getLowestDimensions(data.riasecScores, 2);

    for (const type of lowestTypes) {
      const recommendation = GROWTH_RECOMMENDATIONS[type];
      const percentile = percentiles[type];
      const color = RIASEC_COLORS[type];

      // Check page overflow
      if (y + 280 > this.PAGE_HEIGHT - this.MARGIN) {
        doc.addPage();
        y = this.MARGIN;
      }

      // Section header with color indicator
      doc.roundedRect(this.MARGIN, y, this.CONTENT_WIDTH, 50, 8).fill(color);

      doc
        .font("Inter-Bold")
        .fontSize(16)
        .fillColor("#FFFFFF")
        .text(recommendation.titleRu, this.MARGIN + 15, y + 15);

      doc
        .font("Inter-Regular")
        .fontSize(12)
        .fillColor("#FFFFFF")
        .text(`Ваш результат: ${percentile}%`, this.MARGIN + 350, y + 18);

      y += 65;

      // Energy description
      doc
        .font("Inter-Medium")
        .fontSize(12)
        .fillColor(this.TEXT_COLOR)
        .text(recommendation.energyDescription, this.MARGIN, y, {
          width: this.CONTENT_WIDTH,
        });

      y +=
        doc.heightOfString(recommendation.energyDescription, {
          width: this.CONTENT_WIDTH,
        }) + 15;

      // Positive framing
      doc
        .font("Inter-Regular")
        .fontSize(11)
        .fillColor(this.MUTED_COLOR)
        .text(recommendation.positiveFraming, this.MARGIN, y, {
          width: this.CONTENT_WIDTH,
        });

      y +=
        doc.heightOfString(recommendation.positiveFraming, {
          width: this.CONTENT_WIDTH,
        }) + 20;

      // Activities section
      doc
        .font("Inter-Bold")
        .fontSize(13)
        .fillColor(this.SECONDARY_COLOR)
        .text("Попробуйте:", this.MARGIN, y);

      y += 20;

      for (const activity of recommendation.activities) {
        doc
          .rect(this.MARGIN, y + 2, 10, 10)
          .strokeColor(color)
          .lineWidth(1.5)
          .stroke();

        doc
          .font("Inter-Regular")
          .fontSize(11)
          .fillColor(this.TEXT_COLOR)
          .text(activity, this.MARGIN + 20, y, {
            width: this.CONTENT_WIDTH - 30,
          });

        y +=
          doc.heightOfString(activity, { width: this.CONTENT_WIDTH - 30 }) + 8;
      }

      y += 15;

      // Challenge box
      doc
        .roundedRect(this.MARGIN, y, this.CONTENT_WIDTH, 70, 8)
        .fillAndStroke("#FFF9E6", "#F39C12");

      doc
        .font("Inter-Bold")
        .fontSize(12)
        .fillColor("#F39C12")
        .text(
          `${recommendation.challenge.title} (${recommendation.challenge.duration})`,
          this.MARGIN + 15,
          y + 12,
        );

      doc
        .font("Inter-Regular")
        .fontSize(11)
        .fillColor(this.TEXT_COLOR)
        .text(recommendation.challenge.description, this.MARGIN + 15, y + 32, {
          width: this.CONTENT_WIDTH - 30,
        });

      y += 90;
    }
  }

  /**
   * Enhanced Careers section with salary and demand data
   */
  private renderEnhancedCareers(
    doc: PDFKit.PDFDocument,
    data: RoadmapData,
  ): void {
    let y = this.MARGIN;

    doc
      .font("Inter-Bold")
      .fontSize(24)
      .fillColor(this.PRIMARY_COLOR)
      .text("Топ-5 подходящих профессий", this.MARGIN, y);

    y += 50;

    const careersToShow = data.topCareers.slice(0, 5);

    careersToShow.forEach((career, index) => {
      // Calculate required height
      const descHeight = doc.heightOfString(career.description || "", {
        width: this.CONTENT_WIDTH - 100,
        lineGap: 3,
      });

      const hasSalary =
        career.salaryMin !== undefined && career.salaryMax !== undefined;
      const salaryHeight = hasSalary ? 60 : 0;

      const requiredHeight = 100 + descHeight + salaryHeight;

      if (y + requiredHeight > this.PAGE_HEIGHT - this.MARGIN) {
        doc.addPage();
        y = this.MARGIN;
      }

      // Career title and match badge
      doc
        .font("Inter-Bold")
        .fontSize(16)
        .fillColor(this.SECONDARY_COLOR)
        .text(
          `${index + 1}. ${career.titleRu || career.title}`,
          this.MARGIN,
          y,
        );

      this.renderMatchBadge(
        doc,
        career.matchPercentage,
        this.PAGE_WIDTH - this.MARGIN - 80,
        y,
      );

      y += 25;

      // Description
      doc
        .font("Inter-Regular")
        .fontSize(12)
        .fillColor(this.TEXT_COLOR)
        .text(career.description, this.MARGIN, y, {
          width: this.CONTENT_WIDTH - 100,
          lineGap: 3,
        });

      y += descHeight + 15;

      // Salary and demand info
      if (hasSalary) {
        const salaryText = this.formatSalary(
          career.salaryMin!,
          career.salaryMax!,
        );
        const demandInfo = career.demandLevel
          ? DEMAND_LEVEL_RU[career.demandLevel] || {
              label: career.demandLevel,
              color: "#7F8C8D",
            }
          : null;

        doc
          .font("Inter-Medium")
          .fontSize(11)
          .fillColor(this.MUTED_COLOR)
          .text("Зарплата:", this.MARGIN, y);

        doc
          .font("Inter-Bold")
          .fontSize(11)
          .fillColor(this.PRIMARY_COLOR)
          .text(salaryText, this.MARGIN + 70, y);

        if (demandInfo) {
          doc
            .roundedRect(this.MARGIN + 250, y - 3, 120, 20, 4)
            .fill(demandInfo.color);

          doc
            .font("Inter-Bold")
            .fontSize(10)
            .fillColor("#FFFFFF")
            .text(demandInfo.label, this.MARGIN + 255, y, {
              width: 110,
              align: "center",
            });
        }

        y += 30;
      }

      // Skills
      if (career.requiredSkills && career.requiredSkills.length > 0) {
        doc
          .font("Inter-Medium")
          .fontSize(11)
          .fillColor(this.MUTED_COLOR)
          .text("Навыки:", this.MARGIN, y);

        y += 15;

        const skillsText = career.requiredSkills.slice(0, 5).join(" | ");
        doc
          .font("Inter-Regular")
          .fontSize(11)
          .fillColor(this.TEXT_COLOR)
          .text(skillsText, this.MARGIN + 10, y, {
            width: this.CONTENT_WIDTH - 20,
          });

        y +=
          doc.heightOfString(skillsText, { width: this.CONTENT_WIDTH - 20 }) +
          10;
      }

      // Separator
      y += 10;
      doc
        .strokeColor("#E0E0E0")
        .lineWidth(1)
        .moveTo(this.MARGIN, y)
        .lineTo(this.PAGE_WIDTH - this.MARGIN, y)
        .stroke();

      y += 20;
    });
  }

  /**
   * Achievements page
   */
  private renderAchievements(doc: PDFKit.PDFDocument, data: RoadmapData): void {
    let y = this.MARGIN;

    doc
      .font("Inter-Bold")
      .fontSize(24)
      .fillColor(this.PRIMARY_COLOR)
      .text("Ваши достижения", this.MARGIN, y);

    y += 35; // Proper spacing for 24pt header

    doc
      .font("Inter-Regular")
      .fontSize(12)
      .fillColor(this.MUTED_COLOR)
      .text(
        "Награды за прохождение теста и активность на платформе",
        this.MARGIN,
        y,
      );

    y += 30; // Space after subtitle

    const achievements = data.achievements || [];

    achievements.forEach((achievement, index) => {
      const row = Math.floor(index / this.BADGES_PER_ROW);
      const col = index % this.BADGES_PER_ROW;

      // Check overflow BEFORE moving to new row (Issue #1 fix)
      if (col === 0 && row > 0) {
        const nextY = y + this.BADGE_ROW_HEIGHT;
        if (nextY + this.BADGE_ROW_HEIGHT > this.PAGE_HEIGHT - this.MARGIN) {
          doc.addPage();
          y = this.MARGIN;
        } else {
          y = nextY;
        }
      }

      const x = this.MARGIN + col * (this.BADGE_SIZE + this.BADGE_GAP);
      const badgeInfo = getBadgeDisplayInfo(achievement.badgeType);
      const tierColor = BADGE_TIER_COLORS[badgeInfo.tier];

      // Badge circle
      doc
        .circle(
          x + this.BADGE_SIZE / 2,
          y + this.BADGE_SIZE / 2,
          this.BADGE_SIZE / 2,
        )
        .fill(tierColor);

      doc
        .circle(
          x + this.BADGE_SIZE / 2,
          y + this.BADGE_SIZE / 2,
          this.BADGE_SIZE / 2 - 5,
        )
        .strokeColor("#FFFFFF")
        .lineWidth(2)
        .stroke();

      // Badge name
      const nameY = y + this.BADGE_SIZE + 10;
      doc
        .font("Inter-Bold")
        .fontSize(10)
        .fillColor(this.TEXT_COLOR)
        .text(badgeInfo.nameRu, x - 10, nameY, {
          width: this.BADGE_SIZE + 20,
          align: "center",
        });

      // Calculate name height for description positioning
      const nameHeight = doc.heightOfString(badgeInfo.nameRu, {
        width: this.BADGE_SIZE + 20,
      });

      // Badge description - positioned after name
      doc
        .font("Inter-Regular")
        .fontSize(9)
        .fillColor(this.MUTED_COLOR)
        .text(badgeInfo.descriptionRu, x - 10, nameY + nameHeight + 3, {
          width: this.BADGE_SIZE + 20,
          align: "center",
        });
    });
  }

  /**
   * Development Roadmap page
   */
  private renderDevelopmentRoadmap(
    doc: PDFKit.PDFDocument,
    data: RoadmapData,
  ): void {
    let y = this.MARGIN;

    doc
      .font("Inter-Bold")
      .fontSize(24)
      .fillColor(this.PRIMARY_COLOR)
      .text("Карьерная дорожная карта", this.MARGIN, y);

    y += 50;

    const primaryCareer = data.topCareers[0];

    if (primaryCareer) {
      // Education Path
      doc
        .font("Inter-Bold")
        .fontSize(18)
        .fillColor(this.SECONDARY_COLOR)
        .text("Образовательный путь", this.MARGIN, y);

      y += 30;

      if (
        primaryCareer.educationPath &&
        primaryCareer.educationPath.length > 0
      ) {
        primaryCareer.educationPath.forEach((step, index) => {
          doc.circle(this.MARGIN + 15, y + 8, 12).fill(this.PRIMARY_COLOR);

          doc
            .font("Inter-Bold")
            .fontSize(12)
            .fillColor("#FFFFFF")
            .text((index + 1).toString(), this.MARGIN + 10, y + 3, {
              width: 10,
              align: "center",
            });

          doc
            .font("Inter-Regular")
            .fontSize(13)
            .fillColor(this.TEXT_COLOR)
            .text(step, this.MARGIN + 40, y, {
              width: this.CONTENT_WIDTH - 50,
            });

          const stepHeight = Math.max(
            25,
            doc.heightOfString(step, { width: this.CONTENT_WIDTH - 50 }),
          );

          if (index < primaryCareer.educationPath.length - 1) {
            doc
              .strokeColor(this.PRIMARY_COLOR)
              .lineWidth(2)
              .moveTo(this.MARGIN + 15, y + 20)
              .lineTo(this.MARGIN + 15, y + stepHeight + 10)
              .stroke();
          }

          y += stepHeight + 15;
        });
      } else {
        doc
          .font("Inter-Regular")
          .fontSize(12)
          .fillColor(this.MUTED_COLOR)
          .text(
            "Информация об образовательном пути будет добавлена позже.",
            this.MARGIN,
            y,
          );
        y += 30;
      }

      y += 20;

      // Universities
      doc
        .font("Inter-Bold")
        .fontSize(18)
        .fillColor(this.SECONDARY_COLOR)
        .text("Рекомендуемые университеты", this.MARGIN, y);

      y += 25;

      if (primaryCareer.universities && primaryCareer.universities.length > 0) {
        primaryCareer.universities.slice(0, 5).forEach((uni) => {
          doc
            .font("Inter-Regular")
            .fontSize(12)
            .fillColor(this.TEXT_COLOR)
            .text(`  ${uni}`, this.MARGIN, y);
          y += 20;
        });
      } else {
        doc
          .font("Inter-Regular")
          .fontSize(12)
          .fillColor(this.MUTED_COLOR)
          .text(
            "Список рекомендуемых университетов будет добавлен позже.",
            this.MARGIN,
            y,
          );
        y += 30;
      }

      y += 30;
    }

    // Next Steps
    doc
      .font("Inter-Bold")
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text("Следующие шаги", this.MARGIN, y);

    y += 25;

    const nextSteps = [
      "Изучите топ-3 профессии подробнее",
      "Обсудите с родителями карьерные интересы",
      "Найдите специалистов для информационных интервью",
      "Изучите программы обучения в университетах",
    ];

    const FOOTER_RESERVE = 70;

    nextSteps.forEach((step) => {
      const stepHeight = Math.max(
        30,
        doc.heightOfString(step, { width: this.CONTENT_WIDTH - 35 }) + 15,
      );

      if (y + stepHeight > this.PAGE_HEIGHT - this.MARGIN - FOOTER_RESERVE) {
        doc.addPage();
        y = this.MARGIN;
      }

      doc
        .rect(this.MARGIN, y, 14, 14)
        .strokeColor(this.PRIMARY_COLOR)
        .lineWidth(1.5)
        .stroke();

      doc
        .font("Inter-Regular")
        .fontSize(12)
        .fillColor(this.TEXT_COLOR)
        .text(step, this.MARGIN + 25, y, { width: this.CONTENT_WIDTH - 35 });

      y += stepHeight;
    });

    // Footer line
    const footerY = this.PAGE_HEIGHT - 30;
    doc
      .strokeColor("#E0E0E0")
      .lineWidth(1)
      .moveTo(this.MARGIN, footerY)
      .lineTo(this.PAGE_WIDTH - this.MARGIN, footerY)
      .stroke();
  }

  /**
   * Render match percentage badge
   */
  private renderMatchBadge(
    doc: PDFKit.PDFDocument,
    percentage: number,
    x: number,
    y: number,
  ): void {
    const badgeColor =
      percentage >= 80 ? "#27AE60" : percentage >= 60 ? "#F39C12" : "#E74C3C";

    doc.roundedRect(x, y - 5, 70, 25, 5).fill(badgeColor);

    doc
      .font("Inter-Bold")
      .fontSize(12)
      .fillColor("#FFFFFF")
      .text(`${Math.round(percentage)}%`, x, y, { width: 70, align: "center" });
  }

  /**
   * Format salary range in Russian
   */
  private formatSalary(min: number, max: number): string {
    const formatNum = (n: number) => {
      if (n <= 0) return "—"; // Handle zero/negative gracefully (Issue #6 fix)
      if (n >= 1000) {
        return `${Math.round(n / 1000)}K`;
      }
      return n.toString();
    };
    return `${formatNum(min)} — ${formatNum(max)} руб./мес`;
  }

  /**
   * Format date in Russian locale
   */
  private formatDate(date: Date): string {
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];

    const d = new Date(date);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} г.`;
  }
}

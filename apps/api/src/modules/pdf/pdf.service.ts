import { Injectable, Logger } from "@nestjs/common";
import PDFDocument from "pdfkit";
import * as path from "path";
import * as fs from "fs";
import type { RIASECScores } from "@skilltree/shared";
import { ChartService } from "../results/chart.service";

// Short Russian labels for PDF table (fits in narrow columns)
const RIASEC_SHORT_LABELS: Record<string, string> = {
  R: "Практик",
  I: "Исследов.",
  A: "Артистич.",
  S: "Социальн.",
  E: "Предприим.",
  C: "Конвенц.",
};

/**
 * Roadmap data structure for PDF generation
 */
export interface RoadmapData {
  studentName: string;
  testDate: Date;
  riasecScores: RIASECScores;
  hollandCode: string;
  archetype: { name: string; emoji: string; description: string };
  topCareers: Array<{
    title: string;
    matchPercentage: number;
    description: string;
    requiredSkills: string[];
    educationPath: string[];
    universities: string[];
  }>;
}

/**
 * PDF generation service for career roadmap documents
 * Uses PDFKit with Inter font family for professional Russian-language output
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  // A4 page dimensions in points (72 points per inch)
  private readonly PAGE_WIDTH = 595.28;
  private readonly PAGE_HEIGHT = 841.89;
  private readonly MARGIN = 50;
  private readonly CONTENT_WIDTH = 595.28 - 100; // PAGE_WIDTH - 2 * MARGIN

  // Colors
  private readonly PRIMARY_COLOR = "#2ECC71"; // SkillTree green
  private readonly SECONDARY_COLOR = "#3498DB";
  private readonly TEXT_COLOR = "#2C3E50";
  private readonly MUTED_COLOR = "#7F8C8D";

  constructor(private readonly chartService: ChartService) {}

  /**
   * Generate a career roadmap PDF document
   * @param data - Roadmap data including student info, RIASEC scores, and career matches
   * @returns PDF document as Buffer
   */
  async generateCareerRoadmap(data: RoadmapData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const generatePdf = async () => {
        try {
          const doc = new PDFDocument({
            size: "A4",
            margin: this.MARGIN,
            info: {
              Title: "SkillTree - Карьерный план",
              Author: "SkillTree",
              Subject: `Карьерный план для ${data.studentName}`,
              Creator: "SkillTree Career Assessment",
            },
          });

          const chunks: Buffer[] = [];
          doc.on("data", (chunk: Buffer) => chunks.push(chunk));
          doc.on("end", () => resolve(Buffer.concat(chunks)));
          doc.on("error", reject);

          // Register fonts
          this.registerFonts(doc);

          // Page 1: Title + Profile Summary
          await this.renderPage1(doc, data);

          // Page 2: Top 5 Careers
          doc.addPage();
          this.renderPage2(doc, data);

          // Page 3: Development Roadmap
          doc.addPage();
          this.renderPage3(doc, data);

          doc.end();
        } catch (error) {
          reject(error);
        }
      };

      generatePdf();
    });
  }

  /**
   * Register Inter font family with the PDF document
   * Falls back to default fonts if custom fonts are not available
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
          // Log but don't fail - PDF will use default font
          this.logger.error(`Failed to register font ${font.name}:`, error);
        }
      } else {
        this.logger.warn(
          `Font file not found: ${fontPath}. Using default fonts.`,
        );
      }
    }
  }

  /**
   * Page 1: Title, Profile Summary, Radar Chart
   */
  private async renderPage1(
    doc: PDFKit.PDFDocument,
    data: RoadmapData,
  ): Promise<void> {
    let y = this.MARGIN;

    // Header with branding
    doc
      .font("Inter-Bold")
      .fontSize(28)
      .fillColor(this.PRIMARY_COLOR)
      .text("SkillTree", this.MARGIN, y, { continued: true })
      .fillColor(this.TEXT_COLOR)
      .text(" | Карьерный план");

    y += 50;

    // Horizontal line
    doc
      .strokeColor(this.PRIMARY_COLOR)
      .lineWidth(2)
      .moveTo(this.MARGIN, y)
      .lineTo(this.PAGE_WIDTH - this.MARGIN, y)
      .stroke();

    y += 30;

    // Student info section
    doc
      .font("Inter-Medium")
      .fontSize(14)
      .fillColor(this.MUTED_COLOR)
      .text("Имя учащегося:", this.MARGIN, y);

    doc
      .font("Inter-Bold")
      .fontSize(16)
      .fillColor(this.TEXT_COLOR)
      .text(data.studentName, this.MARGIN + 130, y);

    y += 25;

    doc
      .font("Inter-Medium")
      .fontSize(14)
      .fillColor(this.MUTED_COLOR)
      .text("Дата тестирования:", this.MARGIN, y);

    const formattedDate = this.formatDate(data.testDate);
    doc
      .font("Inter-Bold")
      .fontSize(16)
      .fillColor(this.TEXT_COLOR)
      .text(formattedDate, this.MARGIN + 130, y);

    y += 50;

    // Section title: RIASEC Profile
    doc
      .font("Inter-Bold")
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text("Профиль интересов RIASEC", this.MARGIN, y);

    y += 30;

    // Generate and embed radar chart
    const chartBuffer = await this.chartService.generateRadarChart(
      data.riasecScores,
    );
    const chartSize = 250;
    const chartX = (this.PAGE_WIDTH - chartSize) / 2;

    doc.image(chartBuffer, chartX, y, { width: chartSize });

    y += chartSize + 20;

    // RIASEC scores table
    this.renderScoresTable(doc, data.riasecScores, y);

    y += 100;

    // Holland Code and Archetype
    doc
      .font("Inter-Bold")
      .fontSize(16)
      .fillColor(this.TEXT_COLOR)
      .text("Код Голланда:", this.MARGIN, y, { continued: true })
      .font("Inter-Bold")
      .fillColor(this.PRIMARY_COLOR)
      .text(` ${data.hollandCode}`);

    y += 30;

    // Archetype box
    doc
      .roundedRect(this.MARGIN, y, this.CONTENT_WIDTH, 80, 10)
      .fillAndStroke("#F8F9FA", this.PRIMARY_COLOR);

    // Note: Emojis are not supported by Inter font, so we skip them
    doc
      .font("Inter-Bold")
      .fontSize(18)
      .fillColor(this.TEXT_COLOR)
      .text(data.archetype.name, this.MARGIN + 20, y + 20);

    doc
      .font("Inter-Regular")
      .fontSize(14)
      .fillColor(this.MUTED_COLOR)
      .text(data.archetype.description, this.MARGIN + 20, y + 50, {
        width: this.CONTENT_WIDTH - 40,
      });
  }

  /**
   * Render RIASEC scores table
   */
  private renderScoresTable(
    doc: PDFKit.PDFDocument,
    scores: RIASECScores,
    startY: number,
  ): void {
    const types: Array<keyof RIASECScores> = ["R", "I", "A", "S", "E", "C"];
    const cellWidth = this.CONTENT_WIDTH / 6;

    types.forEach((type, index) => {
      const x = this.MARGIN + index * cellWidth;

      // Type label
      doc
        .font("Inter-Bold")
        .fontSize(14)
        .fillColor(this.TEXT_COLOR)
        .text(type, x, startY, { width: cellWidth, align: "center" });

      // Score
      doc
        .font("Inter-Medium")
        .fontSize(20)
        .fillColor(this.PRIMARY_COLOR)
        .text(Math.round(scores[type]).toString(), x, startY + 20, {
          width: cellWidth,
          align: "center",
        });

      // Russian label (short version to fit in column)
      doc
        .font("Inter-Regular")
        .fontSize(10)
        .fillColor(this.MUTED_COLOR)
        .text(RIASEC_SHORT_LABELS[type] || type, x, startY + 45, {
          width: cellWidth,
          align: "center",
        });
    });
  }

  /**
   * Page 2: Top 5 Careers
   */
  private renderPage2(doc: PDFKit.PDFDocument, data: RoadmapData): void {
    let y = this.MARGIN;

    // Page header
    doc
      .font("Inter-Bold")
      .fontSize(24)
      .fillColor(this.PRIMARY_COLOR)
      .text("Топ-5 подходящих профессий", this.MARGIN, y);

    y += 50;

    // Render each career
    const careersToShow = data.topCareers.slice(0, 5);

    careersToShow.forEach((career, index) => {
      // Check if we need a new page
      if (y > this.PAGE_HEIGHT - 200) {
        doc.addPage();
        y = this.MARGIN;
      }

      // Career number and title
      doc
        .font("Inter-Bold")
        .fontSize(16)
        .fillColor(this.SECONDARY_COLOR)
        .text(`${index + 1}. ${career.title}`, this.MARGIN, y);

      // Match percentage badge
      const matchX = this.PAGE_WIDTH - this.MARGIN - 80;
      this.renderMatchBadge(doc, career.matchPercentage, matchX, y);

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

      y +=
        doc.heightOfString(career.description, {
          width: this.CONTENT_WIDTH - 100,
          lineGap: 3,
        }) + 15;

      // Required skills
      if (career.requiredSkills && career.requiredSkills.length > 0) {
        doc
          .font("Inter-Medium")
          .fontSize(11)
          .fillColor(this.MUTED_COLOR)
          .text("Ключевые навыки:", this.MARGIN, y);

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

      // Separator line
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
   * Page 3: Development Roadmap
   */
  private renderPage3(doc: PDFKit.PDFDocument, data: RoadmapData): void {
    let y = this.MARGIN;

    // Page header
    doc
      .font("Inter-Bold")
      .fontSize(24)
      .fillColor(this.PRIMARY_COLOR)
      .text("Карьерная дорожная карта", this.MARGIN, y);

    y += 50;

    // Get first career for detailed roadmap
    const primaryCareer = data.topCareers[0];

    if (primaryCareer) {
      // Education Path section
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
          // Step number circle
          doc.circle(this.MARGIN + 15, y + 8, 12).fill(this.PRIMARY_COLOR);

          doc
            .font("Inter-Bold")
            .fontSize(12)
            .fillColor("#FFFFFF")
            .text((index + 1).toString(), this.MARGIN + 10, y + 3, {
              width: 10,
              align: "center",
            });

          // Step text
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

          // Connecting line (except for last item)
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

      // Universities section
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

    // Next Steps Checklist
    doc
      .font("Inter-Bold")
      .fontSize(18)
      .fillColor(this.SECONDARY_COLOR)
      .text("Следующие шаги", this.MARGIN, y);

    y += 25;

    const nextSteps = [
      "Изучите подробнее топ-3 подходящих профессии",
      "Поговорите с родителями о ваших карьерных интересах",
      "Найдите специалистов в интересующих областях для информационных интервью",
      "Исследуйте программы обучения в рекомендованных университетах",
      "Составьте план развития навыков на ближайший год",
      "Рассмотрите возможности стажировок и волонтёрства",
    ];

    // Reserve space for footer when checking page overflow
    const FOOTER_RESERVE = 70;

    nextSteps.forEach((step) => {
      const stepHeight = Math.max(
        30,
        doc.heightOfString(step, { width: this.CONTENT_WIDTH - 35 }) + 15,
      );

      // Check if we need a new page (leave room for footer)
      if (y + stepHeight > this.PAGE_HEIGHT - this.MARGIN - FOOTER_RESERVE) {
        doc.addPage();
        y = this.MARGIN;
      }

      // Checkbox
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

    // Footer only on the last page
    this.renderFooter(doc);
  }

  /**
   * Render page footer with branding
   * Uses lineBreak: false to prevent PDFKit from creating a new page
   */
  private renderFooter(doc: PDFKit.PDFDocument): void {
    const footerY = this.PAGE_HEIGHT - 40;

    doc
      .strokeColor("#E0E0E0")
      .lineWidth(1)
      .moveTo(this.MARGIN, footerY - 10)
      .lineTo(this.PAGE_WIDTH - this.MARGIN, footerY - 10)
      .stroke();

    doc
      .font("Inter-Regular")
      .fontSize(10)
      .fillColor(this.MUTED_COLOR)
      .text(
        "SkillTree | Помогаем подросткам найти своё призвание",
        this.MARGIN,
        footerY,
        { width: this.CONTENT_WIDTH, align: "center", lineBreak: false },
      );
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

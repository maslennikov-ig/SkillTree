import { Injectable, OnModuleInit } from "@nestjs/common";
import { createCanvas, GlobalFonts, SKRSContext2D } from "@napi-rs/canvas";
import { join } from "path";
import type { RIASECScores, RIASECType } from "@skilltree/shared";
import { RIASEC_COLORS, ARCHETYPES } from "@skilltree/shared";
import { ChartService } from "./chart.service";

interface GradientColors {
  primary: string;
  gradientStart: string;
  gradientEnd: string;
}

interface ShareCardData {
  scores: RIASECScores;
  hollandCode: string;
  personalityType: string;
  topCareerTitle: string;
}

@Injectable()
export class CardService implements OnModuleInit {
  private readonly CARD_SIZE = 1080;
  private readonly CHART_SIZE = 400;
  private fontsRegistered = false;

  constructor(private readonly chartService: ChartService) {}

  onModuleInit() {
    this.registerFonts();
  }

  /**
   * Register custom fonts for canvas rendering
   */
  private registerFonts(): void {
    if (this.fontsRegistered) return;

    const fontsDir = join(__dirname, "../../../../assets/fonts");

    try {
      GlobalFonts.registerFromPath(
        join(fontsDir, "Inter-Regular.ttf"),
        "Inter",
      );
      GlobalFonts.registerFromPath(
        join(fontsDir, "Inter-Medium.ttf"),
        "Inter Medium",
      );
      GlobalFonts.registerFromPath(
        join(fontsDir, "Inter-Bold.ttf"),
        "Inter Bold",
      );
      GlobalFonts.registerFromPath(
        join(fontsDir, "NotoColorEmoji.ttf"),
        "Noto Color Emoji",
      );
      this.fontsRegistered = true;
    } catch (error) {
      console.error("Failed to register fonts:", error);
    }
  }

  /**
   * Get colors for a RIASEC dimension (primary + gradient colors)
   */
  getColorsForDimension(dimension: RIASECType): GradientColors {
    const primary = RIASEC_COLORS[dimension];

    // Generate gradient colors based on primary
    const gradientColors: Record<RIASECType, GradientColors> = {
      R: { primary, gradientStart: "#E74C3C", gradientEnd: "#C0392B" }, // Red gradient
      I: { primary, gradientStart: "#3498DB", gradientEnd: "#2980B9" }, // Blue gradient
      A: { primary, gradientStart: "#9B59B6", gradientEnd: "#8E44AD" }, // Purple gradient
      S: { primary, gradientStart: "#2ECC71", gradientEnd: "#27AE60" }, // Green gradient
      E: { primary, gradientStart: "#F39C12", gradientEnd: "#E67E22" }, // Orange gradient
      C: { primary, gradientStart: "#1ABC9C", gradientEnd: "#16A085" }, // Teal gradient
    };

    return gradientColors[dimension];
  }

  /**
   * Get top RIASEC dimension from scores
   */
  private getTopDimension(scores: RIASECScores): RIASECType {
    const dimensions: RIASECType[] = ["R", "I", "A", "S", "E", "C"];
    return dimensions.reduce((max, dim) =>
      scores[dim] > scores[max] ? dim : max,
    );
  }

  /**
   * Get archetype info from Holland code
   */
  private getArchetypeInfo(hollandCode: string): {
    name: string;
    emoji: string;
  } {
    // Holland code is like "RIA", we need top 2 letters
    const twoLetterCode = hollandCode.slice(0, 2);

    // Check both orders (RI and IR)
    const archetype =
      ARCHETYPES[twoLetterCode] ||
      ARCHETYPES[twoLetterCode.split("").reverse().join("")];

    if (archetype) {
      return { name: archetype.name, emoji: archetype.emoji };
    }

    // Fallback
    return { name: "Уникальный профиль", emoji: "✨" };
  }

  /**
   * Draw rounded rectangle
   */
  private roundRect(
    ctx: SKRSContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Generate share card as PNG buffer
   */
  async generateShareCard(data: ShareCardData): Promise<Buffer> {
    this.registerFonts(); // Ensure fonts are registered

    const canvas = createCanvas(this.CARD_SIZE, this.CARD_SIZE);
    const ctx = canvas.getContext("2d");

    const topDimension = this.getTopDimension(data.scores);
    const colors = this.getColorsForDimension(topDimension);
    const archetype = this.getArchetypeInfo(data.hollandCode);

    // === BACKGROUND ===
    // Create gradient background
    const gradient = ctx.createLinearGradient(
      0,
      0,
      this.CARD_SIZE,
      this.CARD_SIZE,
    );
    gradient.addColorStop(0, colors.gradientStart);
    gradient.addColorStop(1, colors.gradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.CARD_SIZE, this.CARD_SIZE);

    // Add subtle pattern overlay
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    for (let i = 0; i < this.CARD_SIZE; i += 40) {
      ctx.fillRect(i, 0, 1, this.CARD_SIZE);
      ctx.fillRect(0, i, this.CARD_SIZE, 1);
    }

    // === MAIN CONTENT CARD ===
    const cardMargin = 60;
    const cardWidth = this.CARD_SIZE - cardMargin * 2;
    const cardHeight = this.CARD_SIZE - cardMargin * 2;

    // White card with rounded corners
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    this.roundRect(ctx, cardMargin, cardMargin, cardWidth, cardHeight, 32);
    ctx.fill();

    // Card shadow (subtle)
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    // === HEADER ===
    const headerY = cardMargin + 60;

    // Emoji (using Noto Color Emoji)
    ctx.font = '64px "Noto Color Emoji"';
    ctx.textAlign = "center";
    ctx.fillStyle = "#333";
    ctx.fillText(archetype.emoji, this.CARD_SIZE / 2, headerY);

    // Reset shadow for text
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Archetype name
    ctx.font = 'bold 42px "Inter Bold", Inter, sans-serif';
    ctx.fillStyle = "#1a1a1a";
    ctx.fillText(archetype.name, this.CARD_SIZE / 2, headerY + 70);

    // Holland code badge
    const hollandY = headerY + 110;
    const hollandWidth = 120;
    const hollandHeight = 40;
    const hollandX = (this.CARD_SIZE - hollandWidth) / 2;

    ctx.fillStyle = colors.primary;
    this.roundRect(ctx, hollandX, hollandY, hollandWidth, hollandHeight, 20);
    ctx.fill();

    ctx.font = 'bold 24px "Inter Bold", Inter, sans-serif';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(data.hollandCode, this.CARD_SIZE / 2, hollandY + 28);

    // === RADAR CHART ===
    // Generate mini radar chart
    const chartBuffer = await this.chartService.generateRadarChart(data.scores);
    const { loadImage } = await import("@napi-rs/canvas");

    // Load chart image
    const chartImage = await loadImage(chartBuffer);

    // Position chart in center
    const chartX = (this.CARD_SIZE - this.CHART_SIZE) / 2;
    const chartY = hollandY + 80;

    // Draw chart with white background
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(
      this.CARD_SIZE / 2,
      chartY + this.CHART_SIZE / 2,
      this.CHART_SIZE / 2 + 10,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.drawImage(chartImage, chartX, chartY, this.CHART_SIZE, this.CHART_SIZE);

    // === TOP CAREER ===
    const careerY = chartY + this.CHART_SIZE + 40;

    ctx.font = '18px "Inter Medium", Inter, sans-serif';
    ctx.fillStyle = "#666666";
    ctx.fillText("Топ профессия для тебя:", this.CARD_SIZE / 2, careerY);

    ctx.font = 'bold 28px "Inter Bold", Inter, sans-serif';
    ctx.fillStyle = "#1a1a1a";

    // Truncate career title if too long
    let careerTitle = data.topCareerTitle;
    const maxCareerWidth = cardWidth - 80;
    let metrics = ctx.measureText(careerTitle);
    while (metrics.width > maxCareerWidth && careerTitle.length > 3) {
      careerTitle = careerTitle.slice(0, -4) + "...";
      metrics = ctx.measureText(careerTitle);
    }
    ctx.fillText(careerTitle, this.CARD_SIZE / 2, careerY + 40);

    // === BRANDING ===
    const brandingY = this.CARD_SIZE - cardMargin - 50;

    // SkillTree logo/text
    ctx.font = 'bold 24px "Inter Bold", Inter, sans-serif';
    ctx.fillStyle = colors.primary;
    ctx.fillText("SkillTree", this.CARD_SIZE / 2, brandingY);

    // Tagline
    ctx.font = '16px "Inter", sans-serif';
    ctx.fillStyle = "#999999";
    ctx.fillText(
      "Узнай свой путь к успеху",
      this.CARD_SIZE / 2,
      brandingY + 28,
    );

    return canvas.toBuffer("image/png");
  }
}

import { Injectable, OnModuleInit } from "@nestjs/common";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { join } from "path";
import {
  Chart,
  ChartConfiguration,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip,
} from "chart.js";
import type { RIASECScores } from "@skilltree/shared";

// Register Chart.js components for server-side rendering
Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip,
);

interface ChartRenderOptions {
  compact?: boolean;
}

@Injectable()
export class ChartService implements OnModuleInit {
  private readonly CHART_SIZE = 600; // pixels
  private fontsRegistered = false;

  onModuleInit() {
    this.registerFonts();
  }

  private registerFonts(): void {
    if (this.fontsRegistered) return;
    const fontsDir = join(__dirname, "../../../assets/fonts");
    try {
      GlobalFonts.registerFromPath(
        join(fontsDir, "Inter-Bold.ttf"),
        "Inter Bold",
      );
      this.fontsRegistered = true;
    } catch {
      // Fonts may already be registered by CardService
    }
  }

  /**
   * Generate RIASEC radar chart as PNG buffer
   */
  async generateRadarChart(
    scores: RIASECScores,
    options?: ChartRenderOptions,
  ): Promise<Buffer> {
    this.registerFonts();
    const compact = options?.compact ?? false;
    const chartSize = compact ? 800 : this.CHART_SIZE;
    const canvas = createCanvas(chartSize, chartSize);
    const ctx = canvas.getContext("2d");

    const rawData = [
      scores.R,
      scores.I,
      scores.A,
      scores.S,
      scores.E,
      scores.C,
    ];

    // For compact mode (share card), rescale so the polygon fills the chart
    let chartData: number[];
    let chartMax: number;

    if (compact) {
      const maxVal = Math.max(...rawData);
      const minVal = Math.min(...rawData);
      const range = maxVal - minVal;

      if (range < 5) {
        // Near-equal scores: scale proportionally so max maps to ~85%
        const scale = maxVal > 0 ? 85 / maxVal : 1;
        chartData = rawData.map((v) => Math.max(v * scale, 10));
      } else {
        // Normal case: rescale to [25, 90] range preserving relative differences
        chartData = rawData.map((v) => ((v - minVal) / range) * 65 + 25);
      }
      chartMax = 100;
    } else {
      chartData = rawData;
      chartMax = 100;
    }

    // Chart configuration
    const config: ChartConfiguration<"radar"> = {
      type: "radar",
      data: {
        labels: [
          "Реалист",
          "Учёный",
          "Артист",
          "Социальный",
          "Лидер",
          "Организатор",
        ],
        datasets: [
          {
            label: "RIASEC Profile",
            data: chartData,
            backgroundColor: "rgba(75, 192, 192, 0.45)",
            borderColor: "rgba(52, 152, 219, 1)",
            borderWidth: compact ? 5 : 3,
            pointBackgroundColor: "rgba(52, 152, 219, 1)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: compact ? 3 : 2,
            pointRadius: compact ? 10 : 6,
          },
        ],
      },
      options: {
        responsive: false,
        layout: {
          padding: compact ? 70 : 10,
        },
        scales: {
          r: {
            beginAtZero: true,
            max: chartMax,
            ticks: {
              stepSize: 20,
              font: { size: 14 },
              backdropColor: "rgba(255, 255, 255, 0.8)",
              ...(compact && { display: false }),
            },
            pointLabels: {
              font: {
                size: compact ? 36 : 16,
                weight: "bold",
                family: "Inter Bold, Inter, sans-serif",
              },
              color: compact ? "#1a1a1a" : "#333333",
            },
            grid: {
              color: compact ? "rgba(0, 0, 0, 0.18)" : "rgba(0, 0, 0, 0.1)",
              ...(compact && { lineWidth: 2 }),
            },
            angleLines: {
              color: compact ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.1)",
              ...(compact && { lineWidth: 1.5 }),
            },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chart = new Chart(ctx as any, config);
    const buffer = canvas.toBuffer("image/png");
    chart.destroy();

    return buffer;
  }
}

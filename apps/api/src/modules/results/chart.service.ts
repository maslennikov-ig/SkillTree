import { Injectable } from "@nestjs/common";
import { createCanvas } from "@napi-rs/canvas";
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
export class ChartService {
  private readonly CHART_SIZE = 600; // pixels

  /**
   * Generate RIASEC radar chart as PNG buffer
   */
  async generateRadarChart(
    scores: RIASECScores,
    options?: ChartRenderOptions,
  ): Promise<Buffer> {
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
    // Map scores to [20, 95] range preserving relative differences
    let chartData: number[];
    let chartMax: number;

    if (compact) {
      const maxVal = Math.max(...rawData);
      const minVal = Math.min(...rawData);
      const range = maxVal - minVal || 1;
      chartData = rawData.map((v) => ((v - minVal) / range) * 65 + 25);
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
              font: { size: compact ? 36 : 16, weight: "bold" },
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
    new Chart(ctx as any, config);

    return canvas.toBuffer("image/png");
  }
}

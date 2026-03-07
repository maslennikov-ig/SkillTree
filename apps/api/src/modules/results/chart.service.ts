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

@Injectable()
export class ChartService {
  private readonly CHART_SIZE = 600; // pixels

  /**
   * Generate RIASEC radar chart as PNG buffer
   */
  async generateRadarChart(scores: RIASECScores): Promise<Buffer> {
    const canvas = createCanvas(this.CHART_SIZE, this.CHART_SIZE);
    const ctx = canvas.getContext("2d");

    // Chart configuration
    const config: ChartConfiguration<"radar"> = {
      type: "radar",
      data: {
        labels: [
          "Реалист (R)",
          "Исследователь (I)",
          "Артист (A)",
          "Социальный (S)",
          "Предприниматель (E)",
          "Конвенциональный (C)",
        ],
        datasets: [
          {
            label: "RIASEC Profile",
            data: [scores.R, scores.I, scores.A, scores.S, scores.E, scores.C],
            backgroundColor: "rgba(75, 192, 192, 0.45)",
            borderColor: "rgba(52, 152, 219, 1)",
            borderWidth: 3,
            pointBackgroundColor: "rgba(52, 152, 219, 1)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
          },
        ],
      },
      options: {
        responsive: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              font: { size: 14 },
              backdropColor: "rgba(255, 255, 255, 0.8)",
            },
            pointLabels: {
              font: { size: 16, weight: "bold" },
              color: "#333333",
            },
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            angleLines: {
              color: "rgba(0, 0, 0, 0.1)",
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

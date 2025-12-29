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
  private readonly BACKGROUND_COLOR = "#ffffff";

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
        labels: ["R", "I", "A", "S", "E", "C"],
        datasets: [
          {
            label: "RIASEC Profile",
            data: [scores.R, scores.I, scores.A, scores.S, scores.E, scores.C],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(75, 192, 192, 1)",
          },
        ],
      },
      options: {
        responsive: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 20 },
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

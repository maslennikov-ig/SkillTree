import { Module } from "@nestjs/common";
import { PdfController } from "./pdf.controller";
import { PdfService } from "./pdf.service";
import { ResultsModule } from "../results/results.module";

/**
 * PDF Module for generating career roadmap documents
 *
 * Features:
 * - Career roadmap PDF generation with RIASEC profile
 * - Professional Russian-language layout using Inter fonts
 * - Embedded radar charts from ChartService
 * - Career recommendations with match percentages
 * - Educational path and university recommendations
 *
 * Dependencies:
 * - ResultsModule: For test results and career data
 * - ChartService: For radar chart generation (exported from ResultsModule)
 */
@Module({
  imports: [ResultsModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}

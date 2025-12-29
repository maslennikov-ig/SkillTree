import { Module } from "@nestjs/common";
import { ResultsController } from "./results.controller";
import { ResultsService } from "./results.service";
import { ChartService } from "./chart.service";
import { CardService } from "./card.service";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [EmailModule],
  controllers: [ResultsController],
  providers: [ResultsService, ChartService, CardService],
  exports: [ResultsService, ChartService, CardService],
})
export class ResultsModule {}

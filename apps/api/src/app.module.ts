import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";
import { WebhookModule } from "./modules/webhook/webhook.module";

@Module({
  imports: [HealthModule, WebhookModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

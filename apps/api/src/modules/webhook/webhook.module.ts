import { Module } from "@nestjs/common";
import { WebhookController } from "./webhook.controller";

/**
 * Webhook module for GitHub deployment integration
 * Handles incoming webhooks and triggers deployment pipeline
 */
@Module({
  controllers: [WebhookController],
  providers: [],
})
export class WebhookModule {}

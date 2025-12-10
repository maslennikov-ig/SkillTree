import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { HealthModule } from "./modules/health/health.module";
import { WebhookModule } from "./modules/webhook/webhook.module";

@Module({
  imports: [HealthModule, WebhookModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}

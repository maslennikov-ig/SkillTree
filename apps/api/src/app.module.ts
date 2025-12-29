import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { WebhookModule } from "./modules/webhook/webhook.module";
import { CareersModule } from "./modules/careers/careers.module";
import { ResultsModule } from "./modules/results/results.module";
import { GamificationModule } from "./modules/gamification/gamification.module";
import { EmailModule } from "./modules/email/email.module";
import { PdfModule } from "./modules/pdf/pdf.module";
import { MetricsModule } from "./modules/metrics/metrics.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    WebhookModule,
    CareersModule,
    ResultsModule,
    GamificationModule,
    EmailModule,
    PdfModule,
    MetricsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}

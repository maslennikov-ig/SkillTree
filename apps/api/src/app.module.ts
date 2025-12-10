import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}

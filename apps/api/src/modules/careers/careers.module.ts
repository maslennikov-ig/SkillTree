import { Module } from "@nestjs/common";
import { CareersController } from "./careers.controller";
import { CareersService } from "./careers.service";

/**
 * Careers module providing career data management
 *
 * Exports:
 * - CareersService for use in other modules (e.g., test results matching)
 *
 * Controllers:
 * - CareersController for REST API endpoints
 *
 * Future enhancements:
 * - Integration with PrismaModule for database access
 * - RIASEC profile matching with Pearson correlation
 * - Career recommendations based on test results
 */
@Module({
  controllers: [CareersController],
  providers: [CareersService],
  exports: [CareersService],
})
export class CareersModule {}

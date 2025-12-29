import {
  Controller,
  Get,
  Param,
  NotFoundException,
  HttpStatus,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { CareersService, Career } from "./careers.service";
import { logger } from "../../common/logger";

/**
 * Careers controller providing REST API endpoints for career data
 *
 * Endpoints:
 * - GET /careers - List all careers
 * - GET /careers/:id - Get career by ID
 * - GET /careers/category/:category - Search careers by category
 *
 * All requests are logged with correlation ID for tracing
 */
@Controller("careers")
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  /**
   * List all careers
   * @returns Array of all career records
   */
  @Get()
  async listAll(@Req() request: Request): Promise<Career[]> {
    logger.info(
      {
        correlationId: request.correlationId,
        endpoint: "GET /careers",
      },
      "Listing all careers",
    );

    const careers = await this.careersService.listAll();

    logger.info(
      {
        correlationId: request.correlationId,
        count: careers.length,
      },
      "Careers list retrieved",
    );

    return careers;
  }

  /**
   * Get a single career by ID
   * @param id - Career CUID
   * @returns Career record
   * @throws NotFoundException if career not found
   */
  @Get(":id")
  async getById(
    @Param("id") id: string,
    @Req() request: Request,
  ): Promise<Career> {
    logger.info(
      {
        correlationId: request.correlationId,
        careerId: id,
        endpoint: "GET /careers/:id",
      },
      "Fetching career by ID",
    );

    const career = await this.careersService.getById(id);

    if (!career) {
      logger.warn(
        {
          correlationId: request.correlationId,
          careerId: id,
        },
        "Career not found",
      );

      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Career with ID ${id} not found`,
        error: "Not Found",
      });
    }

    logger.info(
      {
        correlationId: request.correlationId,
        careerId: id,
        title: career.title,
      },
      "Career retrieved",
    );

    return career;
  }

  /**
   * Search careers by category
   * @param category - Career category (e.g., "IT", "Healthcare", "Engineering")
   * @returns Array of careers in the specified category
   */
  @Get("category/:category")
  async getByCategory(
    @Param("category") category: string,
    @Req() request: Request,
  ): Promise<Career[]> {
    logger.info(
      {
        correlationId: request.correlationId,
        category,
        endpoint: "GET /careers/category/:category",
      },
      "Searching careers by category",
    );

    const careers = await this.careersService.searchByCategory(category);

    logger.info(
      {
        correlationId: request.correlationId,
        category,
        count: careers.length,
      },
      "Careers by category retrieved",
    );

    return careers;
  }
}

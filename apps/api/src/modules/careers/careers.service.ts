import { Injectable } from "@nestjs/common";
import type { RIASECScores } from "@skilltree/shared";

/**
 * Career data structure matching Prisma schema
 */
export interface Career {
  id: string;
  title: string;
  titleRu: string;
  description: string;
  riasecProfile: RIASECScores;
  salaryMin: number;
  salaryMax: number;
  salarySource: string;
  category: string;
  requiredSkills: string[];
  educationPath: string[];
  universities: string[];
  outlook: "GROWING" | "STABLE" | "DECLINING";
  demandLevel: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * Careers service providing CRUD operations for career data
 *
 * Currently uses in-memory placeholder data.
 * TODO: Integrate with PrismaService for database operations
 */
@Injectable()
export class CareersService {
  // TODO: Replace with PrismaService
  // constructor(private readonly prisma: PrismaService) {}
  constructor() {}

  /**
   * Placeholder data for initial development
   * TODO: Remove when PrismaService is integrated
   */
  private readonly careers: Career[] = [];

  /**
   * List all careers in the database
   * @returns Array of all career records
   */
  async listAll(): Promise<Career[]> {
    // TODO: Implement with Prisma
    // return this.prisma.career.findMany();
    return this.careers;
  }

  /**
   * Get a single career by ID
   * @param id - Career CUID
   * @returns Career record or null if not found
   */
  async getById(id: string): Promise<Career | null> {
    // TODO: Implement with Prisma
    // return this.prisma.career.findUnique({ where: { id } });
    const career = this.careers.find((c) => c.id === id);
    return career || null;
  }

  /**
   * Get careers matching a RIASEC profile
   * Uses correlation-based matching to find best career fits
   *
   * @param profile - User's RIASEC scores (0-100 for each dimension)
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of matching careers sorted by correlation score
   */
  async getByRiasecProfile(
    profile: RIASECScores,
    _limit: number = 10,
  ): Promise<Career[]> {
    // TODO: Implement Pearson correlation matching with Prisma
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Search careers by category
   * @param category - Career category (e.g., "IT", "Healthcare", "Engineering")
   * @returns Array of careers in the specified category
   */
  async searchByCategory(category: string): Promise<Career[]> {
    // TODO: Implement with Prisma
    // return this.prisma.career.findMany({ where: { category } });
    return this.careers.filter((c) => c.category === category);
  }
}

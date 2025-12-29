/**
 * Gamification Controller for SkillTree API
 *
 * Endpoints:
 * - GET /gamification/:studentId/unlocks - Get unlocked features
 * - GET /gamification/:studentId/achievements - Get all achievements
 * - GET /gamification/:studentId/features/:featureId - Check specific feature
 */

import { Controller, Get, Param } from "@nestjs/common";
import { GamificationService } from "./gamification.service";

@Controller("gamification")
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * GET /gamification/:studentId/unlocks
   * Get all unlocked features for a student
   */
  @Get(":studentId/unlocks")
  async getUnlockedFeatures(@Param("studentId") studentId: string) {
    const features =
      await this.gamificationService.getUnlockedFeatures(studentId);
    return {
      studentId,
      features,
      unlockedCount: features.filter((f) => f.unlocked).length,
      totalFeatures: features.length,
    };
  }

  /**
   * GET /gamification/:studentId/achievements
   * Get all achievements for a student
   */
  @Get(":studentId/achievements")
  async getAchievements(@Param("studentId") studentId: string) {
    return this.gamificationService.getUserAchievements(studentId);
  }

  /**
   * GET /gamification/:studentId/features/:featureId
   * Check if a specific feature is unlocked
   */
  @Get(":studentId/features/:featureId")
  async checkFeature(
    @Param("studentId") studentId: string,
    @Param("featureId") featureId: string,
  ) {
    const unlocked = await this.gamificationService.isFeatureUnlocked(
      studentId,
      featureId,
    );
    return {
      studentId,
      featureId,
      unlocked,
    };
  }
}

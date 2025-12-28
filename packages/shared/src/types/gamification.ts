/**
 * Gamification System Types
 * Points, unlockable features, and rewards configuration
 */

export interface PointsConfig {
  QUESTION_ANSWERED: number; // 10
  SECTION_COMPLETED: number; // 100
  TEST_COMPLETED: number; // 500
  SHARE_RESULTS: number; // 25
  REFERRAL_COMPLETED: number; // 50
  REFERRAL_BONUS_REFEREE: number; // 25
  EASTER_EGG_FOUND: number; // 30
}

export interface UnlockableFeature {
  points: number;
  feature: string;
  description: string;
}

export const POINTS_CONFIG: PointsConfig = {
  QUESTION_ANSWERED: 10,
  SECTION_COMPLETED: 100,
  TEST_COMPLETED: 500,
  SHARE_RESULTS: 25,
  REFERRAL_COMPLETED: 50,
  REFERRAL_BONUS_REFEREE: 25,
  EASTER_EGG_FOUND: 30,
};

export const FEATURE_UNLOCKS: UnlockableFeature[] = [
  {
    points: 500,
    feature: "CAREER_COMPARISON",
    description: "Compare 2 careers side-by-side",
  },
  {
    points: 1000,
    feature: "PDF_ROADMAP",
    description: "Downloadable career development plan",
  },
  {
    points: 2000,
    feature: "FREE_CONSULTATION",
    description: "15-min call with career expert",
  },
  {
    points: 5000,
    feature: "PREMIUM_INSIGHTS",
    description: "Lifetime access to advanced analytics",
  },
  {
    points: 10000,
    feature: "MENTOR_SESSION",
    description: "1-hour personal career mentor call",
  },
];

/**
 * RIASEC Career Assessment Types
 * Based on Holland's RIASEC model for career interest profiling
 */

export type RIASECType = "R" | "I" | "A" | "S" | "E" | "C";

export interface RIASECScores {
  R: number; // Realistic: 0-100
  I: number; // Investigative: 0-100
  A: number; // Artistic: 0-100
  S: number; // Social: 0-100
  E: number; // Enterprising: 0-100
  C: number; // Conventional: 0-100
}

export interface CareerMatch {
  careerId: string;
  correlation: number; // -1 to 1 (Pearson r)
  matchPercentage: number; // 0-100
  matchCategory: "Best Fit" | "Great Fit" | "Good Fit" | "Poor Fit";
}

export interface RIASECNorms {
  mean: number;
  sd: number;
}

// ============================================================================
// Question Types (for Quiz Content)
// ============================================================================

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "RATING"
  | "BINARY"
  | "OPEN_TEXT";

export interface QuestionOption {
  text: string;
  value: string;
  scores: RIASECScores;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  section: number; // 1-5
  orderIndex: number; // 1-55
  difficulty: number; // 1-3
  primaryDimension: RIASECType;
  options?: QuestionOption[];
  ratingRange?: {
    min: number;
    max: number;
    labels: { min: string; max: string };
  };
  isEasterEgg?: boolean;
  hint?: string;
}

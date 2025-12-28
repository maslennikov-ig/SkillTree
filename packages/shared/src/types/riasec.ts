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

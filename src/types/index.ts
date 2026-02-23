import type { BodyRegion, SeverityLevel, AilmentStatus } from "@prisma/client";

export interface BodyMapRegion {
  id: BodyRegion;
  label: string;
  severityLevel: SeverityLevel | null;
  ailmentCount: number;
}

export interface AIReviewResult {
  overallRating: "good" | "fair" | "needs_improvement";
  summary: string;
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  missingElements: string[];
  safetyFlags: string[];
}

export interface DailyPlanExerciseItem {
  exerciseId: string;
  order: number;
  estimatedMinutes: number;
  reason: string;
}

export interface GeneratedDailyPlan {
  exercises: DailyPlanExerciseItem[];
  totalMinutes: number;
  skippedExercises: Array<{
    exerciseId: string;
    reason: string;
  }>;
  notes: string;
}

export interface AilmentSummary {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
}

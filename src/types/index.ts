import type { BodyRegion, ConditionStatus } from "@prisma/client";

export type SeverityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface BodyMapRegion {
  id: BodyRegion;
  label: string;
  severity: SeverityLevel | null;
  conditionCount: number;
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

export interface DailyRoutineExercise {
  exerciseId: string;
  order: number;
  estimatedMinutes: number;
  reason: string;
}

export interface GeneratedRoutine {
  exercises: DailyRoutineExercise[];
  totalMinutes: number;
  skippedExercises: Array<{
    exerciseId: string;
    reason: string;
  }>;
  notes: string;
}

export interface ConditionSummary {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severity: number;
  status: ConditionStatus;
}

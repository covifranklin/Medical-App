import type { BodyRegion, SeverityLevel, AilmentStatus, PriorityLevel, GoalTimeframe } from "@prisma/client";

export interface BodyMapRegion {
  id: BodyRegion;
  label: string;
  severityLevel: SeverityLevel | null;
  ailmentCount: number;
}

/** Legacy review result (kept for backward compatibility) */
export interface AIReviewResult {
  overallRating: "good" | "fair" | "needs_improvement";
  summary: string;
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  missingElements: string[];
  safetyFlags: string[];
}

/** Per-exercise AI review */
export interface ExerciseReview {
  exerciseId: string;
  rating: "good" | "caution" | "concern";
  feedback: string;
  suggestedAlternative: string | null;
}

/** Full structured AI plan review */
export interface PlanReviewResult {
  overallAssessment: string;
  exerciseReviews: ExerciseReview[];
  crossConditionWarnings: string[];
  confidenceLevel: "low" | "medium" | "high";
  overallRating: "good" | "fair" | "needs_improvement";
  strengths: string[];
  concerns: string[];
  suggestions: string[];
}

/** Saved plan review record */
export interface PlanReviewRecord {
  id: string;
  treatmentPlanId: string;
  result: PlanReviewResult;
  modelUsed: string;
  createdAt: string;
}

export interface DailyPlanExerciseItem {
  exerciseId: string;
  order: number;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  estimatedMinutes: number;
  reason: string;
  targetAilment: string;
}

export interface SkippedExercise {
  exerciseId: string;
  exerciseName: string;
  reason: string;
  suggestedReturn: string;
}

export interface GeneratedDailyPlan {
  warmUp: string;
  exercises: DailyPlanExerciseItem[];
  coolDown: string;
  totalMinutes: number;
  skippedExercises: SkippedExercise[];
  notes: string;
}

export interface AilmentSummary {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
}

/** Ailment data enriched with latest pain log, used by the body map */
export interface AilmentWithPain {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
  diagnosis: string | null;
  notes: string | null;
  treatmentPlanCount: number;
  latestPainLog: {
    painLevel: number;
    date: string;
    notes: string | null;
  } | null;
}

/** Data for a single body region on the map */
export interface RegionData {
  bodyRegion: BodyRegion;
  ailments: AilmentWithPain[];
}

/** Full response from the body-map API */
export interface BodyMapData {
  regions: Record<string, RegionData>;
}

/** User preferences for daily plan generation */
export interface UserPreferencesData {
  id: string;
  dailyTimeBudgetMinutes: number;
  weeklyFocusAreas: BodyRegion[];
  createdAt: string;
  updatedAt: string;
}

/** Ailment with priority configuration */
export interface AilmentPriority {
  priorityLevel: PriorityLevel;
  goalTimeframe: GoalTimeframe;
}

// Re-export Prisma enums for convenience
export type { PriorityLevel, GoalTimeframe };

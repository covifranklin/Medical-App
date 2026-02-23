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

/** Ailment data enriched with latest pain log, used by the body map */
export interface AilmentWithPain {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
  diagnosis: string | null;
  notes: string | null;
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

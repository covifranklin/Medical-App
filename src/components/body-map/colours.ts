import type { SeverityLevel, AilmentStatus } from "@prisma/client";

export interface RegionColour {
  fill: string;
  stroke: string;
  label: string;
}

const COLOUR_MAP: Record<string, RegionColour> = {
  none: { fill: "#e5e7eb", stroke: "#d1d5db", label: "No issues" },
  managed: { fill: "#86efac", stroke: "#4ade80", label: "Managed / Mild" },
  moderate: { fill: "#fdba74", stroke: "#fb923c", label: "Niggling / Moderate" },
  severe: { fill: "#fca5a5", stroke: "#f87171", label: "Serious / Acute" },
};

/**
 * Determine the colour for a body region based on the worst active ailment.
 * Priority: CRITICAL/SEVERE > MODERATE > MILD > MANAGED status > no issues
 */
export function getRegionColour(
  ailments: Array<{ severityLevel: SeverityLevel; status: AilmentStatus }>
): RegionColour {
  if (ailments.length === 0) return COLOUR_MAP.none;

  const active = ailments.filter((a) => a.status !== "RESOLVED");
  if (active.length === 0) return COLOUR_MAP.none;

  // Find worst severity among active ailments
  const severityOrder: SeverityLevel[] = ["CRITICAL", "SEVERE", "MODERATE", "MILD"];
  let worstSeverity: SeverityLevel = "MILD";
  for (const level of severityOrder) {
    if (active.some((a) => a.severityLevel === level)) {
      worstSeverity = level;
      break;
    }
  }

  // Also check if all active are MANAGED status
  const allManaged = active.every((a) => a.status === "MANAGED");

  if (worstSeverity === "CRITICAL" || worstSeverity === "SEVERE") {
    return COLOUR_MAP.severe;
  }
  if (worstSeverity === "MODERATE" && !allManaged) {
    return COLOUR_MAP.moderate;
  }
  return COLOUR_MAP.managed;
}

export function getColourForPainLevel(painLevel: number): RegionColour {
  if (painLevel >= 7) return COLOUR_MAP.severe;
  if (painLevel >= 4) return COLOUR_MAP.moderate;
  if (painLevel >= 1) return COLOUR_MAP.managed;
  return COLOUR_MAP.none;
}

export const LEGEND_ITEMS = [
  COLOUR_MAP.none,
  COLOUR_MAP.managed,
  COLOUR_MAP.moderate,
  COLOUR_MAP.severe,
];

import type { SeverityLevel, AilmentStatus } from "@prisma/client";

export interface RegionColour {
  fill: string;
  stroke: string;
  label: string;
}

// Warm, muted tones that feel gentle rather than clinical
const COLOUR_MAP: Record<string, RegionColour> = {
  none: { fill: "#F0EDE8", stroke: "#D4CDC4", label: "No issues" },
  managed: { fill: "#C8D9C8", stroke: "#A3BFA3", label: "Managed / Mild" },
  moderate: { fill: "#F5D5A8", stroke: "#E8B878", label: "Niggling / Moderate" },
  severe: { fill: "#E8AEA8", stroke: "#D48880", label: "Serious / Acute" },
};

/**
 * Determine the colour for a body region based on the worst active ailment.
 */
export function getRegionColour(
  ailments: Array<{ severityLevel: SeverityLevel; status: AilmentStatus }>
): RegionColour {
  if (ailments.length === 0) return COLOUR_MAP.none;

  const active = ailments.filter((a) => a.status !== "RESOLVED");
  if (active.length === 0) return COLOUR_MAP.none;

  const severityOrder: SeverityLevel[] = ["CRITICAL", "SEVERE", "MODERATE", "MILD"];
  let worstSeverity: SeverityLevel = "MILD";
  for (const level of severityOrder) {
    if (active.some((a) => a.severityLevel === level)) {
      worstSeverity = level;
      break;
    }
  }

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

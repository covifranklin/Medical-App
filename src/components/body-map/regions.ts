import type { BodyRegion } from "@prisma/client";

export interface RegionConfig {
  id: BodyRegion;
  label: string;
  view: "front" | "back";
  // SVG path data for the clickable region shape
  path: string;
}

// All regions mapped to SVG paths within a 200x450 viewBox per view.
// Coordinates are designed for a simplified anatomical human figure.
export const BODY_REGIONS: RegionConfig[] = [
  // ── Front View ──────────────────────────────────────
  {
    id: "HEAD",
    label: "Head",
    view: "front",
    path: "M88,8 C88,8 82,2 100,2 C118,2 112,8 112,8 L116,30 C116,42 108,52 100,52 C92,52 84,42 84,30 Z",
  },
  {
    id: "NECK",
    label: "Neck",
    view: "front",
    path: "M92,52 L88,68 L112,68 L108,52 C104,56 96,56 92,52 Z",
  },
  {
    id: "LEFT_SHOULDER",
    label: "Left Shoulder",
    view: "front",
    path: "M88,68 L62,78 L58,92 L72,88 L84,80 L88,72 Z",
  },
  {
    id: "RIGHT_SHOULDER",
    label: "Right Shoulder",
    view: "front",
    path: "M112,68 L138,78 L142,92 L128,88 L116,80 L112,72 Z",
  },
  {
    id: "CHEST",
    label: "Chest",
    view: "front",
    path: "M84,80 L72,88 L70,130 L84,140 L100,145 L116,140 L130,130 L128,88 L116,80 L112,72 L100,68 L88,72 Z",
  },
  {
    id: "LEFT_ARM",
    label: "Left Arm",
    view: "front",
    path: "M62,78 L58,92 L46,140 L40,138 L36,160 L46,162 L56,140 L70,130 L72,88 Z",
  },
  {
    id: "RIGHT_ARM",
    label: "Right Arm",
    view: "front",
    path: "M138,78 L142,92 L154,140 L160,138 L164,160 L154,162 L144,140 L130,130 L128,88 Z",
  },
  {
    id: "LEFT_WRIST",
    label: "Left Wrist",
    view: "front",
    path: "M36,160 L46,162 L44,178 L34,176 Z",
  },
  {
    id: "RIGHT_WRIST",
    label: "Right Wrist",
    view: "front",
    path: "M164,160 L154,162 L156,178 L166,176 Z",
  },
  {
    id: "LEFT_HAND",
    label: "Left Hand",
    view: "front",
    path: "M34,176 L44,178 L42,200 L38,210 L32,208 L28,200 L26,196 L30,192 L32,196 L34,192 Z",
  },
  {
    id: "RIGHT_HAND",
    label: "Right Hand",
    view: "front",
    path: "M166,176 L156,178 L158,200 L162,210 L168,208 L172,200 L174,196 L170,192 L168,196 L166,192 Z",
  },
  {
    id: "LEFT_HIP",
    label: "Left Hip",
    view: "front",
    path: "M70,180 L84,180 L100,185 L100,210 L86,220 L74,216 L68,200 Z",
  },
  {
    id: "RIGHT_HIP",
    label: "Right Hip",
    view: "front",
    path: "M130,180 L116,180 L100,185 L100,210 L114,220 L126,216 L132,200 Z",
  },
  {
    id: "LEFT_KNEE",
    label: "Left Knee",
    view: "front",
    path: "M82,295 L92,290 L96,310 L94,330 L84,330 L80,310 Z",
  },
  {
    id: "RIGHT_KNEE",
    label: "Right Knee",
    view: "front",
    path: "M118,295 L108,290 L104,310 L106,330 L116,330 L120,310 Z",
  },
  {
    id: "LEFT_ANKLE",
    label: "Left Ankle",
    view: "front",
    path: "M84,390 L94,390 L94,410 L84,410 Z",
  },
  {
    id: "RIGHT_ANKLE",
    label: "Right Ankle",
    view: "front",
    path: "M106,390 L116,390 L116,410 L106,410 Z",
  },
  {
    id: "LEFT_FOOT",
    label: "Left Foot",
    view: "front",
    path: "M84,410 L94,410 L96,430 L92,440 L80,438 L78,425 Z",
  },
  {
    id: "RIGHT_FOOT",
    label: "Right Foot",
    view: "front",
    path: "M116,410 L106,410 L104,430 L108,440 L120,438 L122,425 Z",
  },

  // ── Back View ───────────────────────────────────────
  {
    id: "UPPER_BACK",
    label: "Upper Back",
    view: "back",
    path: "M84,80 L72,88 L70,140 L84,140 L100,138 L116,140 L130,140 L128,88 L116,80 L112,72 L100,68 L88,72 Z",
  },
  {
    id: "LOWER_BACK",
    label: "Lower Back",
    view: "back",
    path: "M70,140 L84,140 L100,145 L116,140 L130,140 L130,180 L116,180 L100,185 L84,180 L70,180 Z",
  },
];

// Front view also needs thigh/shin connectors (not clickable, just structural)
// The regions above cover all 21 BodyRegion enum values.

export const FRONT_REGIONS = BODY_REGIONS.filter((r) => r.view === "front");
export const BACK_REGIONS = BODY_REGIONS.filter((r) => r.view === "back");

export function getRegionLabel(region: BodyRegion): string {
  return BODY_REGIONS.find((r) => r.id === region)?.label ?? region;
}

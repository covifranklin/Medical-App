import type { BodyRegion } from "@prisma/client";

export interface RegionConfig {
  id: BodyRegion;
  label: string;
  view: "front" | "back";
  path: string;
}

// All regions mapped to SVG paths within a 200x460 viewBox.
// Anatomically proportioned with organic curves.
export const BODY_REGIONS: RegionConfig[] = [
  // ── Front View ──
  {
    id: "HEAD",
    label: "Head",
    view: "front",
    path: "M100,4 C86,4 77,14 77,28 C77,36 80,44 85,48 C87,50 93,53 100,54 C107,53 113,50 115,48 C120,44 123,36 123,28 C123,14 114,4 100,4 Z",
  },
  {
    id: "NECK",
    label: "Neck",
    view: "front",
    path: "M93,53 C92,56 91,60 90,65 L110,65 C109,60 108,56 107,53 C104,54 96,54 93,53 Z",
  },
  {
    id: "LEFT_SHOULDER",
    label: "Left Shoulder",
    view: "front",
    path: "M90,65 C82,67 72,72 64,80 L68,108 C72,96 78,86 86,76 L88,70 Z",
  },
  {
    id: "RIGHT_SHOULDER",
    label: "Right Shoulder",
    view: "front",
    path: "M110,65 C118,67 128,72 136,80 L132,108 C128,96 122,86 114,76 L112,70 Z",
  },
  {
    id: "CHEST",
    label: "Chest",
    view: "front",
    path: "M88,70 C78,80 72,92 68,108 C69,120 70,132 72,145 L100,150 L128,145 C130,132 131,120 132,108 C128,92 122,80 112,70 L100,66 Z",
  },
  {
    id: "LEFT_ARM",
    label: "Left Arm",
    view: "front",
    path: "M64,80 C58,86 52,100 46,120 C44,128 42,136 41,142 L50,144 C52,136 55,126 58,116 C62,104 66,94 68,88 Z",
  },
  {
    id: "RIGHT_ARM",
    label: "Right Arm",
    view: "front",
    path: "M136,80 C142,86 148,100 154,120 C156,128 158,136 159,142 L150,144 C148,136 145,126 142,116 C138,104 134,94 132,88 Z",
  },
  {
    id: "LEFT_WRIST",
    label: "Left Wrist",
    view: "front",
    path: "M41,142 L50,144 L48,168 L38,166 Z",
  },
  {
    id: "RIGHT_WRIST",
    label: "Right Wrist",
    view: "front",
    path: "M159,142 L150,144 L152,168 L162,166 Z",
  },
  {
    id: "LEFT_HAND",
    label: "Left Hand",
    view: "front",
    path: "M38,166 L48,168 C46,178 43,190 40,200 C38,206 35,210 33,212 C31,214 30,210 30,204 C30,198 32,188 34,178 Z",
  },
  {
    id: "RIGHT_HAND",
    label: "Right Hand",
    view: "front",
    path: "M162,166 L152,168 C154,178 157,190 160,200 C162,206 165,210 167,212 C169,214 170,210 170,204 C170,198 168,188 166,178 Z",
  },
  {
    id: "LEFT_HIP",
    label: "Left Hip",
    view: "front",
    path: "M72,145 L100,150 L100,198 C90,196 84,192 80,186 C75,178 73,168 72,158 Z",
  },
  {
    id: "RIGHT_HIP",
    label: "Right Hip",
    view: "front",
    path: "M128,145 L100,150 L100,198 C110,196 116,192 120,186 C125,178 127,168 128,158 Z",
  },
  {
    id: "LEFT_KNEE",
    label: "Left Knee",
    view: "front",
    path: "M86,284 C85,292 84,300 84,308 C85,316 86,320 86,324 L92,326 C92,320 92,312 92,304 C92,296 92,290 92,284 Z",
  },
  {
    id: "RIGHT_KNEE",
    label: "Right Knee",
    view: "front",
    path: "M114,284 C115,292 116,300 116,308 C115,316 114,320 114,324 L108,326 C108,320 108,312 108,304 C108,296 108,290 108,284 Z",
  },
  {
    id: "LEFT_ANKLE",
    label: "Left Ankle",
    view: "front",
    path: "M84,392 L91,394 L90,414 L84,412 Z",
  },
  {
    id: "RIGHT_ANKLE",
    label: "Right Ankle",
    view: "front",
    path: "M116,392 L109,394 L110,414 L116,412 Z",
  },
  {
    id: "LEFT_FOOT",
    label: "Left Foot",
    view: "front",
    path: "M84,412 L90,414 C90,422 89,430 87,436 C85,440 80,442 77,438 C76,434 78,428 80,422 Z",
  },
  {
    id: "RIGHT_FOOT",
    label: "Right Foot",
    view: "front",
    path: "M116,412 L110,414 C110,422 111,430 113,436 C115,440 120,442 123,438 C124,434 122,428 120,422 Z",
  },

  // ── Back View ──
  {
    id: "UPPER_BACK",
    label: "Upper Back",
    view: "back",
    path: "M88,70 C78,80 72,92 68,108 C69,120 70,130 72,140 L100,142 L128,140 C130,130 131,120 132,108 C128,92 122,80 112,70 L100,66 Z",
  },
  {
    id: "LOWER_BACK",
    label: "Lower Back",
    view: "back",
    path: "M72,140 L100,142 L128,140 C128,152 127,164 125,174 C122,182 118,190 112,196 L100,198 L88,196 C82,190 78,182 75,174 C73,164 72,152 72,140 Z",
  },
];

export const FRONT_REGIONS = BODY_REGIONS.filter((r) => r.view === "front");
export const BACK_REGIONS = BODY_REGIONS.filter((r) => r.view === "back");

export function getRegionLabel(region: BodyRegion): string {
  return BODY_REGIONS.find((r) => r.id === region)?.label ?? region;
}

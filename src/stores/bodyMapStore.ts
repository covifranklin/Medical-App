import { create } from "zustand";
import type { BodyRegion } from "@prisma/client";

interface BodyMapState {
  selectedRegion: BodyRegion | null;
  hoveredRegion: BodyRegion | null;
  setSelectedRegion: (region: BodyRegion | null) => void;
  setHoveredRegion: (region: BodyRegion | null) => void;
}

export const useBodyMapStore = create<BodyMapState>((set) => ({
  selectedRegion: null,
  hoveredRegion: null,
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setHoveredRegion: (region) => set({ hoveredRegion: region }),
}));

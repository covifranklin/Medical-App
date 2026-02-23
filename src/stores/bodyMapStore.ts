import { create } from "zustand";
import type { BodyRegion } from "@prisma/client";
import type { AilmentWithPain, RegionData } from "@/types";

interface BodyMapState {
  selectedRegion: BodyRegion | null;
  hoveredRegion: BodyRegion | null;
  regions: Record<string, RegionData>;
  loading: boolean;
  setSelectedRegion: (region: BodyRegion | null) => void;
  setHoveredRegion: (region: BodyRegion | null) => void;
  setRegions: (regions: Record<string, RegionData>) => void;
  setLoading: (loading: boolean) => void;
  getAilmentsForRegion: (region: BodyRegion) => AilmentWithPain[];
  refreshRegions: () => Promise<void>;
}

export const useBodyMapStore = create<BodyMapState>((set, get) => ({
  selectedRegion: null,
  hoveredRegion: null,
  regions: {},
  loading: true,
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setHoveredRegion: (region) => set({ hoveredRegion: region }),
  setRegions: (regions) => set({ regions }),
  setLoading: (loading) => set({ loading }),
  getAilmentsForRegion: (region) => {
    return get().regions[region]?.ailments ?? [];
  },
  refreshRegions: async () => {
    try {
      const res = await fetch("/api/body-map");
      if (res.ok) {
        const data = await res.json();
        set({ regions: data.regions });
      }
    } catch (err) {
      console.error("Failed to refresh body map data:", err);
    }
  },
}));

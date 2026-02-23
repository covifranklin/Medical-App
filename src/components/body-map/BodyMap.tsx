"use client";

import { useEffect } from "react";
import { useBodyMapStore } from "@/stores/bodyMapStore";
import { FRONT_REGIONS, BACK_REGIONS } from "./regions";
import { getRegionColour } from "./colours";
import { FrontOutline, BackOutline } from "./BodyOutline";
import BodyRegionPath from "./BodyRegionPath";
import RegionDetailPanel from "./RegionDetailPanel";
import SeverityLegend from "./SeverityLegend";
import type { BodyRegion } from "@prisma/client";

export default function BodyMap() {
  const {
    selectedRegion,
    hoveredRegion,
    regions,
    loading,
    setSelectedRegion,
    setHoveredRegion,
    setRegions,
    setLoading,
    getAilmentsForRegion,
  } = useBodyMapStore();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/body-map");
        if (res.ok) {
          const data = await res.json();
          setRegions(data.regions);
        }
      } catch (err) {
        console.error("Failed to load body map data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setRegions, setLoading]);

  function handleRegionClick(regionId: BodyRegion) {
    setSelectedRegion(selectedRegion === regionId ? null : regionId);
  }

  function getColourForRegion(regionId: BodyRegion) {
    const ailments = regions[regionId]?.ailments ?? [];
    return getRegionColour(ailments);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">Loading body map...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SeverityLegend />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Body Maps */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-1">
          {/* Front View */}
          <div className="flex flex-col items-center">
            <span className="mb-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
              Front
            </span>
            <svg
              viewBox="0 0 200 450"
              className="h-[500px] w-auto"
              aria-label="Front body view"
            >
              <FrontOutline />
              {FRONT_REGIONS.map((region) => (
                <BodyRegionPath
                  key={region.id}
                  region={region}
                  colour={getColourForRegion(region.id)}
                  isSelected={selectedRegion === region.id}
                  isHovered={hoveredRegion === region.id}
                  onClick={() => handleRegionClick(region.id)}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              ))}
            </svg>
          </div>

          {/* Back View */}
          <div className="flex flex-col items-center">
            <span className="mb-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
              Back
            </span>
            <svg
              viewBox="0 0 200 450"
              className="h-[500px] w-auto"
              aria-label="Back body view"
            >
              <BackOutline />
              {BACK_REGIONS.map((region) => (
                <BodyRegionPath
                  key={region.id}
                  region={region}
                  colour={getColourForRegion(region.id)}
                  isSelected={selectedRegion === region.id}
                  isHovered={hoveredRegion === region.id}
                  onClick={() => handleRegionClick(region.id)}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:w-80 shrink-0">
          {selectedRegion ? (
            <RegionDetailPanel
              bodyRegion={selectedRegion}
              ailments={getAilmentsForRegion(selectedRegion)}
              onClose={() => setSelectedRegion(null)}
            />
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-400">
                Click a body region to view ailments
              </p>
            </div>
          )}

          {/* Region hover tooltip */}
          {hoveredRegion && hoveredRegion !== selectedRegion && (
            <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-center">
              <p className="text-xs text-gray-500">
                {FRONT_REGIONS.find((r) => r.id === hoveredRegion)?.label ??
                  BACK_REGIONS.find((r) => r.id === hoveredRegion)?.label ??
                  hoveredRegion}
                {regions[hoveredRegion]?.ailments.length
                  ? ` — ${regions[hoveredRegion].ailments.length} ailment${regions[hoveredRegion].ailments.length !== 1 ? "s" : ""}`
                  : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

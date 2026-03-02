"use client";

import { useEffect, useState } from "react";
import { useBodyMapStore } from "@/stores/bodyMapStore";
import { FRONT_REGIONS, BACK_REGIONS, BODY_REGIONS } from "./regions";
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

  const [mobileView, setMobileView] = useState<"svg" | "list">("svg");

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

  // Deduplicate regions for the list view (some appear in both front and back)
  const uniqueRegions = BODY_REGIONS.filter(
    (r, i, arr) => arr.findIndex((x) => x.id === r.id) === i
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <SeverityLegend />

      {/* Mobile view toggle */}
      <div className="flex md:hidden gap-1 justify-center">
        <button
          onClick={() => setMobileView("svg")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            mobileView === "svg"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Body View
        </button>
        <button
          onClick={() => setMobileView("list")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            mobileView === "list"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Region List
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* ── SVG Body Maps ── */}
        {/* Desktop: always show. Mobile: only when mobileView === "svg" */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center flex-1 ${mobileView === "list" ? "hidden md:flex" : ""}`}>
          {/* Front View */}
          <div className="flex flex-col items-center">
            <span className="mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
              Front
            </span>
            <svg
              viewBox="0 0 200 450"
              className="h-[300px] sm:h-[400px] md:h-[500px] w-auto touch-manipulation"
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
            <span className="mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
              Back
            </span>
            <svg
              viewBox="0 0 200 450"
              className="h-[300px] sm:h-[400px] md:h-[500px] w-auto touch-manipulation"
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

        {/* ── Mobile region list (alternative to SVG tapping) ── */}
        <div className={`md:hidden flex-1 ${mobileView === "svg" ? "hidden" : ""}`}>
          <div className="grid grid-cols-2 gap-2">
            {uniqueRegions.map((region) => {
              const colour = getColourForRegion(region.id);
              const ailmentCount =
                regions[region.id]?.ailments.length ?? 0;
              const isSelected = selectedRegion === region.id;
              return (
                <button
                  key={region.id}
                  onClick={() => handleRegionClick(region.id)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full border"
                    style={{
                      backgroundColor: colour.fill,
                      borderColor: colour.stroke,
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {region.label}
                    </p>
                    {ailmentCount > 0 && (
                      <p className="text-[10px] text-gray-500">
                        {ailmentCount} ailment{ailmentCount !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
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
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 md:p-6 text-center">
              <p className="text-sm text-gray-400">
                {mobileView === "list"
                  ? "Tap a region to view ailments"
                  : "Tap a body region to view ailments"}
              </p>
            </div>
          )}

          {/* Region hover tooltip (desktop only) */}
          {hoveredRegion && hoveredRegion !== selectedRegion && (
            <div className="hidden md:block mt-3 rounded-md bg-gray-50 px-3 py-2 text-center">
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

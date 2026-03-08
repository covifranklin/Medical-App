"use client";

import { useEffect, useState } from "react";
import { useBodyMapStore } from "@/stores/bodyMapStore";
import { FRONT_REGIONS, BACK_REGIONS, BODY_REGIONS } from "./regions";
import { getRegionColour } from "./colours";
import { FrontOutline, BackOutline } from "./BodyOutline";
import BodyRegionPath from "./BodyRegionPath";
import RegionDetailPanel from "./RegionDetailPanel";
import SeverityLegend from "./SeverityLegend";
import { SkeletonBodyMap } from "@/components/shared/Skeleton";
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
    return <SkeletonBodyMap />;
  }

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
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            mobileView === "svg"
              ? "bg-sage-600 text-white shadow-soft"
              : "bg-warm-100 text-warm-600"
          }`}
        >
          Body View
        </button>
        <button
          onClick={() => setMobileView("list")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            mobileView === "list"
              ? "bg-sage-600 text-white shadow-soft"
              : "bg-warm-100 text-warm-600"
          }`}
        >
          Region List
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* ── SVG Body Maps ── */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center flex-1 ${mobileView === "list" ? "hidden md:flex" : ""}`}>
          {/* Front View */}
          <div className="flex flex-col items-center">
            <span className="mb-2 text-xs font-semibold text-warm-400 uppercase tracking-widest">
              Front
            </span>
            <svg
              viewBox="0 0 200 460"
              className="h-[320px] sm:h-[420px] md:h-[520px] w-auto touch-manipulation"
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
            <span className="mb-2 text-xs font-semibold text-warm-400 uppercase tracking-widest">
              Back
            </span>
            <svg
              viewBox="0 0 200 460"
              className="h-[320px] sm:h-[420px] md:h-[520px] w-auto touch-manipulation"
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

        {/* ── Mobile region list ── */}
        <div className={`md:hidden flex-1 ${mobileView === "svg" ? "hidden" : ""}`}>
          <div className="grid grid-cols-2 gap-2">
            {uniqueRegions.map((region) => {
              const colour = getColourForRegion(region.id);
              const ailmentCount = regions[region.id]?.ailments.length ?? 0;
              const isSelected = selectedRegion === region.id;
              return (
                <button
                  key={region.id}
                  onClick={() => handleRegionClick(region.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? "border-sage-400 bg-sage-50 ring-1 ring-sage-400"
                      : "border-warm-200 bg-white"
                  }`}
                >
                  <div
                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: colour.fill,
                      border: `1.5px solid ${colour.stroke}`,
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-warm-800 truncate">
                      {region.label}
                    </p>
                    {ailmentCount > 0 && (
                      <p className="text-[10px] text-warm-500">
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
            <div className="rounded-2xl border-2 border-dashed border-warm-200 p-6 text-center">
              <p className="text-sm text-warm-400">
                {mobileView === "list"
                  ? "Tap a region to view ailments"
                  : "Tap a body region to view ailments"}
              </p>
            </div>
          )}

          {/* Region hover tooltip (desktop) */}
          {hoveredRegion && hoveredRegion !== selectedRegion && (
            <div className="hidden md:block mt-3 rounded-xl bg-warm-100 px-4 py-2.5 text-center">
              <p className="text-xs font-medium text-warm-600">
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

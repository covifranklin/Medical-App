"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRegionLabel } from "@/components/body-map/regions";
import { getColourForPainLevel } from "@/components/body-map/colours";
import type { BodyRegion, SeverityLevel, AilmentStatus } from "@prisma/client";

interface AilmentSummaryData {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
  latestPainLevel: number | null;
  todayPainLevel: number | null;
  trend: "up" | "down" | "stable" | null;
  logCount7d: number;
}

interface SummaryResponse {
  loggedToday: boolean;
  ailments: AilmentSummaryData[];
}

const TREND_DISPLAY: Record<string, { icon: string; label: string; colour: string }> = {
  up: { icon: "\u2191", label: "Increasing", colour: "text-red-600" },
  down: { icon: "\u2193", label: "Improving", colour: "text-green-600" },
  stable: { icon: "\u2192", label: "Stable", colour: "text-gray-500" },
};

const SEVERITY_DOT: Record<string, string> = {
  MILD: "bg-green-400",
  MODERATE: "bg-orange-400",
  SEVERE: "bg-red-400",
  CRITICAL: "bg-red-600",
};

export default function DashboardSummary() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/pain-logs/summary");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load summary:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 text-center text-sm text-gray-400">
        Loading summary...
      </div>
    );
  }

  if (!data || data.ailments.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Check-in prompt */}
      {!data.loggedToday && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">
              No pain log for today yet
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Quick check-in keeps your pain history accurate.
            </p>
          </div>
          <Link
            href="/check-in"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Check in now
          </Link>
        </div>
      )}

      {/* Summary cards */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Ailment Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.ailments.map((ailment) => (
            <AilmentCard key={ailment.id} ailment={ailment} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AilmentCard({ ailment }: { ailment: AilmentSummaryData }) {
  const trendInfo = ailment.trend ? TREND_DISPLAY[ailment.trend] : null;
  const painLevel = ailment.todayPainLevel ?? ailment.latestPainLevel;
  const painColour = painLevel ? getColourForPainLevel(painLevel) : null;

  return (
    <Link
      href={`/conditions/${ailment.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow transition-all"
    >
      {/* Header: name + severity dot */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${SEVERITY_DOT[ailment.severityLevel]}`}
          />
          <span className="text-sm font-medium text-gray-900 truncate">
            {ailment.name}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
          {getRegionLabel(ailment.bodyRegion)}
        </span>
      </div>

      {/* Pain level + trend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {painLevel ? (
            <>
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: painColour?.fill ?? "#e5e7eb",
                  color: "#1f2937",
                }}
              >
                {painLevel}
              </span>
              <span className="text-xs text-gray-500">/10</span>
              {ailment.todayPainLevel && (
                <span className="text-[10px] text-green-600 font-medium">
                  today
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400">No logs</span>
          )}
        </div>

        {/* 7-day trend arrow */}
        {trendInfo && (
          <div className={`flex items-center gap-1 ${trendInfo.colour}`}>
            <span className="text-base font-bold">{trendInfo.icon}</span>
            <span className="text-[10px]">{trendInfo.label}</span>
          </div>
        )}
      </div>

      {/* 7-day activity bar */}
      <div className="mt-2 flex items-center gap-1">
        <span className="text-[10px] text-gray-400">7d:</span>
        <span className="text-[10px] text-gray-500">
          {ailment.logCount7d} log{ailment.logCount7d !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}

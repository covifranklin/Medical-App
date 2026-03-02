"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBodyMapStore } from "@/stores/bodyMapStore";
import type { BodyRegion, SeverityLevel, AilmentStatus } from "@prisma/client";

interface AilmentForCheckIn {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
  latestPainLog: { painLevel: number; date: string } | null;
}

interface PainEntry {
  ailmentId: string;
  painLevel: number;
  notes: string;
  expanded: boolean; // whether the notes field is showing
}

const REGION_LABELS: Record<string, string> = {
  HEAD: "Head", NECK: "Neck", LEFT_SHOULDER: "Left Shoulder",
  RIGHT_SHOULDER: "Right Shoulder", UPPER_BACK: "Upper Back",
  LOWER_BACK: "Lower Back", CHEST: "Chest", LEFT_ARM: "Left Arm",
  RIGHT_ARM: "Right Arm", LEFT_HAND: "Left Hand", RIGHT_HAND: "Right Hand",
  LEFT_WRIST: "Left Wrist", RIGHT_WRIST: "Right Wrist",
  LEFT_HIP: "Left Hip", RIGHT_HIP: "Right Hip", LEFT_KNEE: "Left Knee",
  RIGHT_KNEE: "Right Knee", LEFT_ANKLE: "Left Ankle",
  RIGHT_ANKLE: "Right Ankle", LEFT_FOOT: "Left Foot", RIGHT_FOOT: "Right Foot",
};

const SEVERITY_BADGE: Record<string, string> = {
  MILD: "bg-green-100 text-green-800",
  MODERATE: "bg-orange-100 text-orange-800",
  SEVERE: "bg-red-100 text-red-800",
  CRITICAL: "bg-red-200 text-red-900",
};

function painColour(level: number): string {
  if (level >= 7) return "bg-red-500";
  if (level >= 4) return "bg-orange-400";
  return "bg-green-500";
}

function painLabel(level: number): string {
  if (level >= 9) return "Worst";
  if (level >= 7) return "Severe";
  if (level >= 5) return "Moderate";
  if (level >= 3) return "Mild";
  return "Minimal";
}

export default function CheckInPage() {
  const router = useRouter();
  const refreshRegions = useBodyMapStore((s) => s.refreshRegions);

  const [ailments, setAilments] = useState<AilmentForCheckIn[]>([]);
  const [entries, setEntries] = useState<Record<string, PainEntry>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayAlreadyLogged, setTodayAlreadyLogged] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    try {
      // Fetch active ailments and today's existing logs in parallel
      const [ailRes, logRes] = await Promise.all([
        fetch("/api/ailments?status=ACTIVE"),
        fetch(`/api/pain-logs?date=${today}`),
      ]);

      if (!ailRes.ok) throw new Error("Failed to load ailments");

      const ailData: AilmentForCheckIn[] = await ailRes.json();
      setAilments(ailData);

      // Check if today already has logs
      const existingLogs: Array<{
        ailmentId: string;
        painLevel: number;
        notes: string | null;
      }> = logRes.ok ? await logRes.json() : [];

      const existingMap = new Map(
        existingLogs.map((l) => [l.ailmentId, l])
      );

      if (existingLogs.length > 0) {
        setTodayAlreadyLogged(true);
      }

      // Initialize entries — use existing log values or baseline from latest pain log
      const initial: Record<string, PainEntry> = {};
      for (const a of ailData) {
        const existing = existingMap.get(a.id);
        initial[a.id] = {
          ailmentId: a.id,
          painLevel: existing
            ? existing.painLevel
            : a.latestPainLog
              ? a.latestPainLog.painLevel
              : 3,
          notes: existing?.notes ?? "",
          expanded: false,
        };
      }
      setEntries(initial);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updatePainLevel(ailmentId: string, level: number) {
    setEntries((prev) => ({
      ...prev,
      [ailmentId]: { ...prev[ailmentId], painLevel: level },
    }));
  }

  function updateNotes(ailmentId: string, notes: string) {
    setEntries((prev) => ({
      ...prev,
      [ailmentId]: { ...prev[ailmentId], notes },
    }));
  }

  function toggleExpanded(ailmentId: string) {
    setEntries((prev) => ({
      ...prev,
      [ailmentId]: { ...prev[ailmentId], expanded: !prev[ailmentId].expanded },
    }));
  }

  function handleNormalDay() {
    // Set all pain levels to their baseline (last known) or 2 for mild
    setEntries((prev) => {
      const updated = { ...prev };
      for (const a of ailments) {
        const baseline = a.latestPainLog?.painLevel ?? 2;
        updated[a.id] = {
          ...updated[a.id],
          painLevel: baseline,
          notes: "",
          expanded: false,
        };
      }
      return updated;
    });
    // Auto-submit after brief visual feedback
    handleSubmit(true);
  }

  async function handleSubmit(isNormalDay = false) {
    setError(null);
    setSubmitting(true);

    const payload = Object.values(entries).map((e) => ({
      ailmentId: e.ailmentId,
      painLevel: e.painLevel,
      notes: e.notes.trim() || null,
      date: today,
    }));

    if (!isNormalDay) {
      // Validate - for non-normal-day, just check we have entries
      if (payload.length === 0) {
        setError("No ailments to log.");
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/pain-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: payload }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(
          data.errors
            ? data.errors.join(", ")
            : data.error ?? "Failed to save."
        );
        setSubmitting(false);
        return;
      }

      // Refresh body map store so dashboard colours update
      await refreshRegions();
      setSubmitted(true);

      // Redirect to dashboard after a moment
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  // Group ailments by body region
  const grouped = ailments.reduce<Record<string, AilmentForCheckIn[]>>(
    (acc, a) => {
      const key = a.bodyRegion;
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Loading check-in...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="py-20 text-center">
        <div className="text-3xl mb-3">Logged</div>
        <p className="text-sm text-gray-600">
          Pain levels saved for {today}. Redirecting to body map...
        </p>
      </div>
    );
  }

  if (ailments.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Check-in</h1>
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">
            No active ailments to log. Add ailments first from the Body Map or
            Ailments page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Daily Check-in</h1>
          <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-gray-600">
            {today} — {ailments.length} active ailment
            {ailments.length !== 1 ? "s" : ""}
            {todayAlreadyLogged && (
              <span className="ml-2 text-orange-600 font-medium">
                (updating today&apos;s log)
              </span>
            )}
          </p>
        </div>

        {/* Normal Day button */}
        <button
          onClick={handleNormalDay}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 md:py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 w-full sm:w-auto"
        >
          Normal Day
          <span className="text-xs font-normal opacity-80">
            (use baseline)
          </span>
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Ailment entries grouped by region */}
      <div className="mt-6 space-y-6">
        {Object.entries(grouped).map(([region, regionAilments]) => (
          <div key={region}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              {REGION_LABELS[region] ?? region}
            </h2>
            <div className="space-y-3">
              {regionAilments.map((ailment) => {
                const entry = entries[ailment.id];
                if (!entry) return null;
                return (
                  <div
                    key={ailment.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    {/* Ailment name + severity badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {ailment.name}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[ailment.severityLevel]}`}
                        >
                          {ailment.severityLevel.toLowerCase()}
                        </span>
                      </div>
                      {ailment.latestPainLog && (
                        <span className="text-xs text-gray-400">
                          Last: {ailment.latestPainLog.painLevel}/10 ({ailment.latestPainLog.date})
                        </span>
                      )}
                    </div>

                    {/* Pain level slider */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={entry.painLevel}
                        onChange={(e) =>
                          updatePainLevel(ailment.id, Number(e.target.value))
                        }
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-manipulation"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center justify-center w-9 h-9 md:w-8 md:h-8 rounded-full text-sm font-bold text-white ${painColour(entry.painLevel)}`}
                        >
                          {entry.painLevel}
                        </span>
                        <span className="text-xs text-gray-500 w-16">
                          {painLabel(entry.painLevel)}
                        </span>
                      </div>
                    </div>

                    {/* Scale labels */}
                    <div className="flex justify-between mt-1 px-0.5">
                      <span className="text-[10px] text-gray-300">1</span>
                      <span className="text-[10px] text-gray-300">5</span>
                      <span className="text-[10px] text-gray-300">10</span>
                    </div>

                    {/* Notes toggle + field */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(ailment.id)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        {entry.expanded ? "Hide notes" : "+ Add notes"}
                      </button>
                      {entry.expanded && (
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={entry.notes}
                          onChange={(e) =>
                            updateNotes(ailment.id, e.target.value)
                          }
                          placeholder="Anything unusual? Triggers, time of day..."
                          className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-4 md:pb-8">
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 md:py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Check-in"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 md:py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

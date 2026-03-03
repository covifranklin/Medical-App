"use client";

import { useEffect, useState, useCallback } from "react";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { useToast } from "@/components/shared/Toast";
import type { BodyRegion } from "@prisma/client";

const BODY_REGION_OPTIONS: { value: BodyRegion; label: string }[] = [
  { value: "HEAD", label: "Head" },
  { value: "NECK", label: "Neck" },
  { value: "LEFT_SHOULDER", label: "Left Shoulder" },
  { value: "RIGHT_SHOULDER", label: "Right Shoulder" },
  { value: "UPPER_BACK", label: "Upper Back" },
  { value: "LOWER_BACK", label: "Lower Back" },
  { value: "CHEST", label: "Chest" },
  { value: "LEFT_ARM", label: "Left Arm" },
  { value: "RIGHT_ARM", label: "Right Arm" },
  { value: "LEFT_WRIST", label: "Left Wrist" },
  { value: "RIGHT_WRIST", label: "Right Wrist" },
  { value: "LEFT_HAND", label: "Left Hand" },
  { value: "RIGHT_HAND", label: "Right Hand" },
  { value: "LEFT_HIP", label: "Left Hip" },
  { value: "RIGHT_HIP", label: "Right Hip" },
  { value: "LEFT_KNEE", label: "Left Knee" },
  { value: "RIGHT_KNEE", label: "Right Knee" },
  { value: "LEFT_ANKLE", label: "Left Ankle" },
  { value: "RIGHT_ANKLE", label: "Right Ankle" },
  { value: "LEFT_FOOT", label: "Left Foot" },
  { value: "RIGHT_FOOT", label: "Right Foot" },
];

const TIME_PRESETS = [15, 20, 30, 45, 60, 90];

interface Preferences {
  dailyTimeBudgetMinutes: number;
  weeklyFocusAreas: BodyRegion[];
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/preferences");
      if (!res.ok) {
        setError("Failed to load preferences.");
        return;
      }
      const data = await res.json();
      setPrefs({
        dailyTimeBudgetMinutes: data.dailyTimeBudgetMinutes,
        weeklyFocusAreas: data.weeklyFocusAreas ?? [],
      });
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.errors?.[0] ?? data.error ?? "Failed to save.");
        setSaving(false);
        return;
      }

      toast("Preferences saved");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  function toggleFocusArea(region: BodyRegion) {
    if (!prefs) return;
    setPrefs((prev) => {
      if (!prev) return prev;
      const areas = prev.weeklyFocusAreas.includes(region)
        ? prev.weeklyFocusAreas.filter((r) => r !== region)
        : [...prev.weeklyFocusAreas, region];
      return { ...prev, weeklyFocusAreas: areas };
    });
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="mt-6 space-y-6">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {error ?? "Failed to load preferences."}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Configure your daily exercise routine preferences.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Daily Time Budget */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Daily Time Budget
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          How many minutes can you dedicate to exercises each day? The AI will
          prioritise exercises to fit within this budget.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={prefs.dailyTimeBudgetMinutes}
            onChange={(e) =>
              setPrefs((prev) =>
                prev
                  ? { ...prev, dailyTimeBudgetMinutes: Number(e.target.value) }
                  : prev
              )
            }
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-lg font-semibold text-gray-900 w-16 text-right">
            {prefs.dailyTimeBudgetMinutes}m
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {TIME_PRESETS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() =>
                setPrefs((prev) =>
                  prev ? { ...prev, dailyTimeBudgetMinutes: mins } : prev
                )
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                prefs.dailyTimeBudgetMinutes === mins
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Focus Areas */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Weekly Focus Areas
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Select body regions to prioritise this week. Leave empty to let the AI
          decide based on severity and pain levels.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {BODY_REGION_OPTIONS.map((opt) => {
            const isSelected = prefs.weeklyFocusAreas.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleFocusArea(opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                  isSelected
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {prefs.weeklyFocusAreas.length > 0 && (
          <button
            type="button"
            onClick={() =>
              setPrefs((prev) =>
                prev ? { ...prev, weeklyFocusAreas: [] } : prev
              )
            }
            className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all focus areas
          </button>
        )}
      </div>

      {/* Save */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

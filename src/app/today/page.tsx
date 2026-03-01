"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

// ── Types ──

interface ExerciseDetail {
  id: string;
  name: string;
  description: string | null;
  targetBodyRegion: string;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  durationMinutes: number;
  contraindications: string | null;
  ailmentName: string;
}

interface PlanExercise {
  id: string; // DailyPlanExercise id
  exerciseId: string;
  orderIndex: number;
  completed: boolean;
  completedAt: string | null;
  estimatedMinutes: number;
  reason: string | null;
  exercise: ExerciseDetail;
}

interface DailyPlan {
  id: string;
  date: string;
  source: string;
  totalMinutes: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  exercises: PlanExercise[];
}

// ── Constants ──

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

const REGION_COLOURS: Record<string, string> = {
  HEAD: "bg-purple-100 text-purple-800",
  NECK: "bg-purple-100 text-purple-800",
  LEFT_SHOULDER: "bg-blue-100 text-blue-800",
  RIGHT_SHOULDER: "bg-blue-100 text-blue-800",
  UPPER_BACK: "bg-indigo-100 text-indigo-800",
  LOWER_BACK: "bg-indigo-100 text-indigo-800",
  CHEST: "bg-pink-100 text-pink-800",
  LEFT_ARM: "bg-teal-100 text-teal-800",
  RIGHT_ARM: "bg-teal-100 text-teal-800",
  LEFT_HAND: "bg-cyan-100 text-cyan-800",
  RIGHT_HAND: "bg-cyan-100 text-cyan-800",
  LEFT_WRIST: "bg-cyan-100 text-cyan-800",
  RIGHT_WRIST: "bg-cyan-100 text-cyan-800",
  LEFT_HIP: "bg-amber-100 text-amber-800",
  RIGHT_HIP: "bg-amber-100 text-amber-800",
  LEFT_KNEE: "bg-orange-100 text-orange-800",
  RIGHT_KNEE: "bg-orange-100 text-orange-800",
  LEFT_ANKLE: "bg-rose-100 text-rose-800",
  RIGHT_ANKLE: "bg-rose-100 text-rose-800",
  LEFT_FOOT: "bg-rose-100 text-rose-800",
  RIGHT_FOOT: "bg-rose-100 text-rose-800",
};

// ── Timer component ──

function ExerciseTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start() {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pause() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(seconds);
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 0;

  return (
    <div className="mt-2 rounded-md bg-gray-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-mono font-semibold text-gray-900">
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
        <div className="flex gap-1.5">
          {!running ? (
            <button
              onClick={start}
              disabled={remaining === 0}
              className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {remaining === seconds ? "Start" : "Resume"}
            </button>
          ) : (
            <button
              onClick={pause}
              className="rounded bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600"
            >
              Pause
            </button>
          )}
          <button
            onClick={reset}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${remaining === 0 ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Page ──

export default function TodayPage() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [hasPainLog, setHasPainLog] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [regenTimeBudget, setRegenTimeBudget] = useState<number>(30);

  const today = new Date().toISOString().split("T")[0];

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/daily");
      if (!res.ok) throw new Error("Failed to fetch plan");
      const data = await res.json();
      setPlan(data.plan ?? null);
    } catch {
      setError("Failed to load today's plan.");
    }
  }, []);

  const checkPainLog = useCallback(async () => {
    try {
      const res = await fetch(`/api/pain-logs?date=${today}`);
      if (!res.ok) {
        setHasPainLog(false);
        return;
      }
      const logs = await res.json();
      setHasPainLog(Array.isArray(logs) && logs.length > 0);
    } catch {
      setHasPainLog(false);
    }
  }, [today]);

  useEffect(() => {
    Promise.all([fetchPlan(), checkPainLog()]).finally(() =>
      setLoading(false)
    );
  }, [fetchPlan, checkPainLog]);

  // ── Generate plan ──
  async function handleGenerate(force = false, timeBudget?: number) {
    setError(null);
    setGenerating(true);
    try {
      const payload: Record<string, unknown> = {};
      if (force) payload.force = true;
      if (timeBudget) payload.timeBudget = timeBudget;

      const res = await fetch("/api/daily-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to generate plan.");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      setPlan(data.plan);
      setShowRegenerate(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Toggle exercise completion ──
  async function toggleComplete(dpeId: string) {
    try {
      const res = await fetch(`/api/daily-plan/exercises/${dpeId}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((e) =>
            e.id === dpeId
              ? { ...e, completed: data.completed, completedAt: data.completedAt }
              : e
          ),
        };
      });
    } catch {
      setError("Failed to update exercise.");
    }
  }

  // ── Swap exercise ──
  async function handleSwap(dpeId: string, reason: string) {
    setSwappingId(dpeId);
    try {
      const res = await fetch("/api/daily-plan/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyPlanExerciseId: dpeId, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to swap exercise.");
        setSwappingId(null);
        return;
      }

      const data = await res.json();
      if (!data.swapped) {
        setError(data.message ?? "No alternatives available.");
        setSwappingId(null);
        return;
      }

      // Refetch the full plan to get updated data
      await fetchPlan();
    } catch {
      setError("Failed to swap exercise.");
    } finally {
      setSwappingId(null);
    }
  }

  // ── Derived state ──
  const completedCount = plan?.exercises.filter((e) => e.completed).length ?? 0;
  const totalCount = plan?.exercises.length ?? 0;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Parse deprioritised exercises from notes
  const deprioritisedText = plan?.notes
    ?.split("\n\n")
    .find((section) => section.startsWith("**Deprioritised today:**"));

  const warmUpText = plan?.notes
    ?.split("\n\n")
    .find((section) => section.startsWith("**Warm-up"));

  const coolDownText = plan?.notes
    ?.split("\n\n")
    .find((section) => section.startsWith("**Cool-down"));

  const generalNotes = plan?.notes
    ?.split("\n\n")
    .filter(
      (section) =>
        !section.startsWith("**Warm-up") &&
        !section.startsWith("**Cool-down") &&
        !section.startsWith("**Deprioritised today:**")
    )
    .join("\n\n");

  // ── Loading state ──
  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Loading today&apos;s routine...
      </div>
    );
  }

  // ── Check-in prompt (feature 2) ──
  if (hasPainLog === false) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Today&apos;s Routine
        </h1>
        <div className="mt-8 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-blue-900">
            Start with your check-in
          </h2>
          <p className="mt-2 text-sm text-blue-700">
            Log today&apos;s pain levels before generating your exercise plan.
            This helps the AI prioritise exercises for how you&apos;re feeling
            today.
          </p>
          <Link
            href="/check-in"
            className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Do Check-in
          </Link>
          <button
            onClick={() => setHasPainLog(true)}
            className="mt-3 block mx-auto text-xs text-blue-500 hover:text-blue-700"
          >
            Skip check-in and generate plan anyway
          </button>
        </div>
      </div>
    );
  }

  // ── No plan yet (feature 3) ──
  if (!plan) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Today&apos;s Routine
        </h1>
        <p className="mt-1 text-sm text-gray-500">{today}</p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-700">
            No plan for today yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Generate a personalised exercise plan based on your ailments, pain
            levels, and treatment plans.
          </p>
          <button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="mt-5 inline-flex items-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Today's Plan"}
          </button>
        </div>
      </div>
    );
  }

  // ── Plan display (features 4-7) ──
  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Today&apos;s Routine
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {today} — {plan.totalMinutes} min plan —{" "}
            {plan.source === "AI" ? "AI-generated" : "Manual"}
          </p>
        </div>
        <button
          onClick={() => setShowRegenerate(!showRegenerate)}
          className="shrink-0 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Regenerate
        </button>
      </div>

      {/* Regenerate panel (feature 7) */}
      {showRegenerate && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">
            Regenerate Plan
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            This will replace your current plan. Completion progress will be
            lost.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm text-gray-600">Time budget:</label>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={regenTimeBudget}
              onChange={(e) => setRegenTimeBudget(Number(e.target.value))}
              className="w-40 accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-900 w-12">
              {regenTimeBudget}m
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Regenerate"}
            </button>
            <button
              onClick={() => setShowRegenerate(false)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Progress bar (feature 5) */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700">
            Progress: {completedCount}/{totalCount} exercises
          </span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progressPct)}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPct === 100 ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {progressPct === 100 && (
          <p className="mt-2 text-sm font-medium text-green-700">
            All exercises completed! Great work today.
          </p>
        )}
      </div>

      {/* Warm-up note */}
      {warmUpText && (
        <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">{warmUpText.replace(/^\*\*Warm-up \(2-3 min\):\*\*\s*/, "")}</p>
          <span className="mt-1 block text-xs text-green-600">Warm-up (2-3 min)</span>
        </div>
      )}

      {/* General notes */}
      {generalNotes && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">{generalNotes}</p>
        </div>
      )}

      {/* Exercise cards (feature 4) */}
      <div className="mt-5 space-y-3">
        {plan.exercises.map((pe) => (
          <ExerciseCard
            key={pe.id}
            pe={pe}
            onToggle={() => toggleComplete(pe.id)}
            onSwap={(reason) => handleSwap(pe.id, reason)}
            swapping={swappingId === pe.id}
          />
        ))}
      </div>

      {/* Cool-down note */}
      {coolDownText && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">{coolDownText.replace(/^\*\*Cool-down \(2 min\):\*\*\s*/, "")}</p>
          <span className="mt-1 block text-xs text-blue-600">Cool-down (2 min)</span>
        </div>
      )}

      {/* Deprioritised section (feature 6) */}
      {deprioritisedText && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Deprioritised Today
          </h3>
          <div className="space-y-1">
            {deprioritisedText
              .replace(/^\*\*Deprioritised today:\*\*\s*/, "")
              .split("; ")
              .map((item, i) => (
                <p key={i} className="text-sm text-gray-600">
                  &bull; {item}
                </p>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Exercise Card Component ──

function ExerciseCard({
  pe,
  onToggle,
  onSwap,
  swapping,
}: {
  pe: PlanExercise;
  onToggle: () => void;
  onSwap: (reason: string) => void;
  swapping: boolean;
}) {
  const [showSwapMenu, setShowSwapMenu] = useState(false);
  const ex = pe.exercise;
  const regionLabel = REGION_LABELS[ex.targetBodyRegion] ?? ex.targetBodyRegion;
  const regionColour = REGION_COLOURS[ex.targetBodyRegion] ?? "bg-gray-100 text-gray-800";

  // Build detail string
  const details: string[] = [];
  if (ex.sets && ex.reps) details.push(`${ex.sets} x ${ex.reps} reps`);
  else if (ex.sets) details.push(`${ex.sets} sets`);
  else if (ex.reps) details.push(`${ex.reps} reps`);
  if (ex.holdSeconds) details.push(`hold ${ex.holdSeconds}s`);
  details.push(`~${pe.estimatedMinutes} min`);

  const hasTimer = ex.holdSeconds && ex.holdSeconds > 0;
  const timerSeconds = hasTimer
    ? (ex.sets ?? 1) * ex.holdSeconds!
    : null;

  return (
    <div
      className={`rounded-lg border bg-white shadow-sm transition-all ${
        pe.completed
          ? "border-green-200 bg-green-50/50 opacity-80"
          : "border-gray-200"
      }`}
    >
      <div className="p-4">
        {/* Top row: checkbox + name + region */}
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              pe.completed
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            {pe.completed && (
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6L5 9L10 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-semibold ${
                  pe.completed ? "text-gray-500 line-through" : "text-gray-900"
                }`}
              >
                {ex.name}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${regionColour}`}
              >
                {regionLabel}
              </span>
              <span className="text-xs text-gray-400">
                for {ex.ailmentName}
              </span>
            </div>

            {/* Details */}
            <p className="mt-1 text-xs text-gray-500">
              {details.join(" · ")}
            </p>

            {/* Description/instructions */}
            {ex.description && (
              <p className="mt-1.5 text-sm text-gray-600">
                {ex.description}
              </p>
            )}

            {/* Reason for inclusion */}
            {pe.reason && (
              <p className="mt-1 text-xs text-gray-400 italic">
                {pe.reason}
              </p>
            )}
          </div>
        </div>

        {/* Timer for hold-based exercises */}
        {hasTimer && timerSeconds && !pe.completed && (
          <ExerciseTimer seconds={timerSeconds} />
        )}

        {/* Action buttons */}
        {!pe.completed && (
          <div className="mt-3 flex gap-2 pl-8">
            <button
              onClick={() => setShowSwapMenu(!showSwapMenu)}
              disabled={swapping}
              className="inline-flex items-center rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {swapping ? "Swapping..." : "This hurts / Swap"}
            </button>
          </div>
        )}

        {/* Swap reason menu */}
        {showSwapMenu && !pe.completed && (
          <div className="mt-2 ml-8 rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Why do you need to swap?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Causes pain",
                "Too difficult",
                "No equipment",
                "Already fatigued",
                "Doctor advised against it",
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    setShowSwapMenu(false);
                    onSwap(reason);
                  }}
                  disabled={swapping}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

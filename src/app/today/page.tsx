"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";
import { useToast } from "@/components/shared/Toast";

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
  LEFT_SHOULDER: "bg-sage-100 text-sage-700",
  RIGHT_SHOULDER: "bg-sage-100 text-sage-700",
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
    <div className="mt-2 rounded-xl bg-warm-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-mono font-semibold text-warm-900">
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
        <div className="flex gap-1.5">
          {!running ? (
            <button
              onClick={start}
              disabled={remaining === 0}
              className="rounded bg-green-600 px-4 py-2 md:px-3 md:py-1 text-xs font-medium text-white hover:bg-green-700 active:bg-green-800 disabled:opacity-50"
            >
              {remaining === seconds ? "Start" : "Resume"}
            </button>
          ) : (
            <button
              onClick={pause}
              className="rounded bg-yellow-500 px-4 py-2 md:px-3 md:py-1 text-xs font-medium text-white hover:bg-yellow-600 active:bg-yellow-700"
            >
              Pause
            </button>
          )}
          <button
            onClick={reset}
            className="rounded border border-warm-300 bg-white px-4 py-2 md:px-3 md:py-1 text-xs font-medium text-warm-600 hover:bg-warm-50"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-warm-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${remaining === 0 ? "bg-green-500" : "bg-sage-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Post-exercise types ──

interface PainAssessment {
  ailmentId: string;
  ailmentName: string;
  bodyRegion: string;
  painLevel: number;
  notes: string;
}

interface ComparisonResult {
  ailmentId: string;
  ailmentName: string;
  bodyRegion: string | null;
  prePainLevel: number | null;
  postPainLevel: number | null;
  change: number | null;
}

type PageView = "routine" | "summary" | "done";

// ── Main Page ──

export default function TodayPage() {
  const { toast } = useToast();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [hasPainLog, setHasPainLog] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [regenTimeBudget, setRegenTimeBudget] = useState<number>(30);
  const [view, setView] = useState<PageView>("routine");
  const [painAssessments, setPainAssessments] = useState<PainAssessment[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult[]>([]);
  const [savingAssessment, setSavingAssessment] = useState(false);

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
      toast("Plan generated successfully");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Toggle exercise completion (optimistic) ──
  async function toggleComplete(dpeId: string) {
    // Optimistic: toggle immediately in UI
    const prevPlan = plan;
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) =>
          e.id === dpeId
            ? { ...e, completed: !e.completed, completedAt: e.completed ? null : new Date().toISOString() }
            : e
        ),
      };
    });

    try {
      const res = await fetch(`/api/daily-plan/exercises/${dpeId}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Reconcile with server response
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
      // Revert on failure
      setPlan(prevPlan);
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

  // ── Enter summary view ──
  function handleFinishRoutine() {
    if (!plan) return;
    const assessments: PainAssessment[] = [];
    const seen = new Set<string>();
    for (const pe of plan.exercises) {
      const ex = pe.exercise;
      if (!seen.has(ex.ailmentName)) {
        seen.add(ex.ailmentName);
        assessments.push({
          ailmentId: "",
          ailmentName: ex.ailmentName,
          bodyRegion: ex.targetBodyRegion,
          painLevel: 5,
          notes: "",
        });
      }
    }
    setPainAssessments(assessments);
    setView("summary");
  }

  // ── Save post-exercise assessment ──
  async function handleSaveAssessment() {
    if (!plan) return;
    setSavingAssessment(true);
    setError(null);
    try {
      const ailmentsRes = await fetch("/api/ailments?status=ACTIVE");
      if (!ailmentsRes.ok) throw new Error("Failed to fetch ailments");
      const ailments: Array<{ id: string; name: string }> =
        await ailmentsRes.json();
      const ailmentIdMap = new Map<string, string>();
      for (const a of ailments) ailmentIdMap.set(a.name, a.id);

      const entries = painAssessments
        .map((pa) => ({
          ailmentId: ailmentIdMap.get(pa.ailmentName) ?? "",
          painLevel: pa.painLevel,
          notes: pa.notes.trim() || undefined,
        }))
        .filter((e) => e.ailmentId !== "");

      if (entries.length === 0) {
        setError("Could not match ailments. Please try again.");
        setSavingAssessment(false);
        return;
      }

      const res = await fetch("/api/pain-logs/post-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries, dailyPlanId: plan.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save assessment.");
        setSavingAssessment(false);
        return;
      }

      const data = await res.json();
      setComparison(data.comparison ?? []);
      toast("Assessment saved");
      setView("done");
    } catch {
      setError("Network error saving assessment.");
    } finally {
      setSavingAssessment(false);
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
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <SkeletonLine width="w-48" height="h-7" />
            <SkeletonLine width="w-32" height="h-4" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  // ── Check-in prompt (feature 2) ──
  if (hasPainLog === false) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-warm-900">
          Today&apos;s Routine
        </h1>
        <div className="mt-8 rounded-2xl border-2 border-dashed border-sage-200 bg-sage-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-sage-800">
            Start with your check-in
          </h2>
          <p className="mt-2 text-sm text-sage-700">
            Log today&apos;s pain levels before generating your exercise plan.
            This helps the AI prioritise exercises for how you&apos;re feeling
            today.
          </p>
          <Link
            href="/check-in"
            className="mt-4 inline-flex items-center rounded-xl bg-sage-600 px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-sage-700"
          >
            Do Check-in
          </Link>
          <button
            onClick={() => setHasPainLog(true)}
            className="mt-3 block mx-auto text-xs text-sage-500 hover:text-sage-700"
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
        <h1 className="text-2xl font-bold text-warm-900">
          Today&apos;s Routine
        </h1>
        <p className="mt-1 text-sm text-warm-500">{today}</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 rounded-2xl border-2 border-dashed border-warm-300 p-12 text-center">
          <h2 className="text-lg font-semibold text-warm-700">
            No plan for today yet
          </h2>
          <p className="mt-2 text-sm text-warm-500">
            Generate a personalised exercise plan based on your ailments, pain
            levels, and treatment plans.
          </p>
          <button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="mt-5 inline-flex items-center rounded-xl bg-sage-600 px-6 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-sage-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Today's Plan"}
          </button>
        </div>
      </div>
    );
  }

  // ── Summary stats ──
  const completedExercises = plan?.exercises.filter((e) => e.completed) ?? [];
  const totalTimeMin = completedExercises.reduce(
    (sum, e) => sum + e.estimatedMinutes,
    0
  );
  const regionsWorked = Array.from(
    new Set(completedExercises.map((e) => e.exercise.targetBodyRegion))
  );

  // ── Summary view (post-exercise assessment) ──
  if (view === "summary" && plan) {
    return (
      <div className="pb-8">
        <h1 className="text-2xl font-bold text-warm-900">Session Summary</h1>
        <p className="mt-1 text-sm text-warm-500">
          Great work! Rate how each area feels after exercising.
        </p>

        {/* Stats bar */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-warm-200 bg-white p-3 text-center">
            <p className="text-2xl font-bold text-sage-600">
              {completedExercises.length}
              <span className="text-sm font-normal text-warm-400">
                /{plan.exercises.length}
              </span>
            </p>
            <p className="mt-1 text-xs text-warm-500">Exercises</p>
          </div>
          <div className="rounded-2xl border border-warm-200 bg-white p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{totalTimeMin}</p>
            <p className="mt-1 text-xs text-warm-500">Minutes</p>
          </div>
          <div className="rounded-2xl border border-warm-200 bg-white p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {regionsWorked.length}
            </p>
            <p className="mt-1 text-xs text-warm-500">Regions</p>
          </div>
        </div>

        {/* Regions worked chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {regionsWorked.map((r) => (
            <span
              key={r}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REGION_COLOURS[r] ?? "bg-warm-100 text-warm-800"}`}
            >
              {REGION_LABELS[r] ?? r}
            </span>
          ))}
        </div>

        {/* Pain re-assessment */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-warm-900">
            Post-Exercise Pain Check
          </h2>
          <p className="mt-1 text-xs text-warm-500">
            How does each area feel now? This before/after data helps improve
            future plans.
          </p>
          <div className="mt-4 space-y-4">
            {painAssessments.map((pa, idx) => (
              <div
                key={pa.ailmentName}
                className="rounded-2xl border border-warm-200 bg-white p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${REGION_COLOURS[pa.bodyRegion] ?? "bg-warm-100 text-warm-800"}`}
                  >
                    {REGION_LABELS[pa.bodyRegion] ?? pa.bodyRegion}
                  </span>
                  <span className="text-sm font-medium text-warm-900">
                    {pa.ailmentName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-warm-400 w-6">1</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={pa.painLevel}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPainAssessments((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, painLevel: val } : p
                        )
                      );
                    }}
                    className="flex-1 accent-sage-600"
                  />
                  <span className="text-xs text-warm-400 w-6">10</span>
                  <span
                    className={`w-8 text-center text-sm font-bold ${
                      pa.painLevel <= 3
                        ? "text-green-600"
                        : pa.painLevel <= 6
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {pa.painLevel}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Optional note (e.g. felt good, shoulder worse after X)"
                  value={pa.notes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPainAssessments((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, notes: val } : p
                      )
                    );
                  }}
                  className="mt-2 w-full rounded-xl border border-warm-200 px-3 py-1.5 text-sm text-warm-700 placeholder-warm-400"
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSaveAssessment}
            disabled={savingAssessment}
            className="inline-flex items-center rounded-xl bg-sage-600 px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-sage-700 disabled:opacity-50"
          >
            {savingAssessment ? "Saving..." : "Save Assessment"}
          </button>
          <button
            onClick={() => setView("routine")}
            className="inline-flex items-center rounded-xl border border-warm-300 bg-white px-4 py-2.5 text-sm font-medium text-warm-700 hover:bg-warm-50"
          >
            Back to Routine
          </button>
        </div>
      </div>
    );
  }

  // ── Done view (before/after comparison) ──
  if (view === "done" && plan) {
    return (
      <div className="pb-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-warm-900">
            Session Complete!
          </h1>
          <p className="mt-2 text-sm text-warm-500">
            {completedExercises.length} exercises &middot; ~{totalTimeMin} min
            &middot; {regionsWorked.length} region
            {regionsWorked.length !== 1 ? "s" : ""}
          </p>
        </div>

        {comparison.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-warm-700 mb-3">
              Pain: Before vs After
            </h2>
            <div className="space-y-2">
              {comparison.map((c) => {
                const change = c.change ?? 0;
                const changeLabel =
                  change < 0
                    ? `${change} (improved)`
                    : change > 0
                      ? `+${change} (worse)`
                      : "no change";
                const changeColour =
                  change < 0
                    ? "text-green-600"
                    : change > 0
                      ? "text-red-600"
                      : "text-warm-500";
                return (
                  <div
                    key={c.ailmentId}
                    className="flex items-center justify-between rounded-2xl border border-warm-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      {c.bodyRegion && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${REGION_COLOURS[c.bodyRegion] ?? "bg-warm-100 text-warm-800"}`}
                        >
                          {REGION_LABELS[c.bodyRegion] ?? c.bodyRegion}
                        </span>
                      )}
                      <span className="text-sm font-medium text-warm-900">
                        {c.ailmentName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-warm-500">
                        {c.prePainLevel ?? "—"}
                      </span>
                      <span className="text-warm-300">&rarr;</span>
                      <span className="font-medium text-warm-900">
                        {c.postPainLevel ?? "—"}
                      </span>
                      <span className={`text-xs font-medium ${changeColour}`}>
                        {c.prePainLevel != null ? changeLabel : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-warm-700 mb-2">
            Regions Worked
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {regionsWorked.map((r) => (
              <span
                key={r}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REGION_COLOURS[r] ?? "bg-warm-100 text-warm-800"}`}
              >
                {REGION_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl bg-sage-600 px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-sage-700"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => setView("routine")}
            className="inline-flex items-center rounded-xl border border-warm-300 bg-white px-4 py-2.5 text-sm font-medium text-warm-700 hover:bg-warm-50"
          >
            View Routine
          </button>
        </div>
      </div>
    );
  }

  // ── Plan display (features 4-7) ──
  return (
    <div className="pb-4 md:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-warm-900">
            Today&apos;s Routine
          </h1>
          <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-warm-500">
            {today} — {plan.totalMinutes} min plan —{" "}
            {plan.source === "AI" ? "AI-generated" : "Manual"}
          </p>
        </div>
        <button
          onClick={() => setShowRegenerate(!showRegenerate)}
          className="shrink-0 inline-flex items-center rounded-xl border border-warm-300 bg-white px-3 py-1.5 text-sm font-medium text-warm-700 shadow-soft hover:bg-warm-50"
        >
          Regenerate
        </button>
      </div>

      {/* Regenerate panel (feature 7) */}
      {showRegenerate && (
        <div className="mt-3 rounded-2xl border border-warm-200 bg-white p-4 shadow-soft">
          <h3 className="text-sm font-semibold text-warm-900">
            Regenerate Plan
          </h3>
          <p className="mt-1 text-xs text-warm-500">
            This will replace your current plan. Completion progress will be
            lost.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm text-warm-600">Time budget:</label>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={regenTimeBudget}
              onChange={(e) => setRegenTimeBudget(Number(e.target.value))}
              className="w-40 accent-sage-600"
            />
            <span className="text-sm font-medium text-warm-900 w-12">
              {regenTimeBudget}m
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="inline-flex items-center rounded-xl bg-sage-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sage-700 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Regenerate"}
            </button>
            <button
              onClick={() => setShowRegenerate(false)}
              className="inline-flex items-center rounded-xl border border-warm-300 bg-white px-4 py-1.5 text-sm font-medium text-warm-700 hover:bg-warm-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
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
          <span className="text-sm font-medium text-warm-700">
            Progress: {completedCount}/{totalCount} exercises
          </span>
          <span className="text-sm font-medium text-warm-700">
            {Math.round(progressPct)}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-warm-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPct === 100 ? "bg-green-500" : "bg-sage-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {progressPct === 100 && (
          <p className="mt-2 text-sm font-medium text-green-700">
            All exercises completed! Great work today.
          </p>
        )}
        {completedCount > 0 && (
          <button
            onClick={handleFinishRoutine}
            className={`mt-3 w-full rounded-xl py-2.5 text-sm font-medium shadow-soft ${
              progressPct === 100
                ? "bg-green-600 text-white hover:bg-green-700"
                : "border border-warm-300 bg-white text-warm-700 hover:bg-warm-50"
            }`}
          >
            {progressPct === 100
              ? "Finish & Rate How You Feel"
              : "Finish Early & Rate How You Feel"}
          </button>
        )}
      </div>

      {/* Warm-up note */}
      {warmUpText && (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">{warmUpText.replace(/^\*\*Warm-up \(2-3 min\):\*\*\s*/, "")}</p>
          <span className="mt-1 block text-xs text-green-600">Warm-up (2-3 min)</span>
        </div>
      )}

      {/* General notes */}
      {generalNotes && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
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
        <div className="mt-4 rounded-2xl border border-sage-200 bg-sage-50 p-4">
          <p className="text-sm text-sage-700">{coolDownText.replace(/^\*\*Cool-down \(2 min\):\*\*\s*/, "")}</p>
          <span className="mt-1 block text-xs text-sage-600">Cool-down (2 min)</span>
        </div>
      )}

      {/* Deprioritised section (feature 6) */}
      {deprioritisedText && (
        <div className="mt-6 rounded-2xl border border-warm-200 bg-warm-50 p-4">
          <h3 className="text-sm font-semibold text-warm-700 mb-2">
            Deprioritised Today
          </h3>
          <div className="space-y-1">
            {deprioritisedText
              .replace(/^\*\*Deprioritised today:\*\*\s*/, "")
              .split("; ")
              .map((item, i) => (
                <p key={i} className="text-sm text-warm-600">
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
  const regionColour = REGION_COLOURS[ex.targetBodyRegion] ?? "bg-warm-100 text-warm-800";

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
      className={`rounded-2xl border bg-white shadow-soft transition-all ${
        pe.completed
          ? "border-green-200 bg-green-50/50 opacity-80"
          : "border-warm-200"
      }`}
    >
      <div className="p-4">
        {/* Top row: checkbox + name + region */}
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className={`mt-0.5 flex h-7 w-7 md:h-5 md:w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              pe.completed
                ? "border-green-500 bg-green-500 text-white"
                : "border-warm-300 hover:border-sage-400"
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
                  pe.completed ? "text-warm-500 line-through" : "text-warm-900"
                }`}
              >
                {ex.name}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${regionColour}`}
              >
                {regionLabel}
              </span>
              <span className="text-xs text-warm-400">
                for {ex.ailmentName}
              </span>
            </div>

            {/* Details */}
            <p className="mt-1 text-xs text-warm-500">
              {details.join(" · ")}
            </p>

            {/* Description/instructions */}
            {ex.description && (
              <p className="mt-1.5 text-sm text-warm-600">
                {ex.description}
              </p>
            )}

            {/* Reason for inclusion */}
            {pe.reason && (
              <p className="mt-1 text-xs text-warm-400 italic">
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
              className="inline-flex items-center rounded border border-warm-200 bg-white px-3 py-2 md:px-2.5 md:py-1 text-xs font-medium text-warm-600 hover:bg-warm-50 active:bg-warm-100 disabled:opacity-50"
            >
              {swapping ? "Swapping..." : "This hurts / Swap"}
            </button>
          </div>
        )}

        {/* Swap reason menu */}
        {showSwapMenu && !pe.completed && (
          <div className="mt-2 ml-8 rounded-xl border border-warm-200 bg-warm-50 p-3">
            <p className="text-xs font-medium text-warm-700 mb-2">
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
                  className="rounded-full border border-warm-200 bg-white px-3.5 py-2 md:px-3 md:py-1 text-xs text-warm-700 hover:bg-sage-50 hover:border-sage-300 active:bg-sage-100 disabled:opacity-50"
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

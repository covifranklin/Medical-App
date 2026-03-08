"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PlanForm from "@/components/plans/PlanForm";
import ExerciseForm from "@/components/plans/ExerciseForm";
import AIReviewDisplay from "@/components/plans/AIReviewDisplay";
import { SkeletonPlanDetail } from "@/components/shared/Skeleton";
import { useToast } from "@/components/shared/Toast";
import type { PlanFormData } from "@/components/plans/PlanForm";
import type { PlanReviewResult } from "@/types";
import type { ExerciseFrequency, BodyRegion, SeverityLevel, AilmentStatus } from "@prisma/client";

interface ExerciseEntry {
  id: string;
  name: string;
  description: string | null;
  targetBodyRegion: BodyRegion;
  contraindications: string | null;
  durationMinutes: number;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  frequencyPerWeek: number | null;
  videoUrl: string | null;
  sortOrder: number;
}

interface AilmentSummary {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
}

interface LatestReview {
  id: string;
  result: PlanReviewResult;
  modelUsed: string;
  createdAt: string;
}

interface PlanDetail {
  id: string;
  ailmentId: string;
  title: string;
  prescribedBy: string | null;
  frequency: ExerciseFrequency;
  startDate: string;
  rawContent: string | null;
  aiReview: unknown;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ailment: AilmentSummary;
  exercises: ExerciseEntry[];
  latestReview: LatestReview | null;
}

const SEVERITY_BADGE: Record<string, string> = {
  MILD: "bg-green-100 text-green-800",
  MODERATE: "bg-orange-100 text-orange-800",
  SEVERE: "bg-red-100 text-red-800",
  CRITICAL: "bg-red-200 text-red-900",
};

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: "Daily",
  ALTERNATE_DAYS: "Alternate Days",
  WEEKLY: "Weekly",
  AS_NEEDED: "As Needed",
};

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

export default function PlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Exercise management state
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  // AI Review state
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/${params.id}`);
      if (res.status === 404) {
        setError("Treatment plan not found.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load treatment plan.");
        return;
      }
      setPlan(await res.json());
      setError(null);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Plan deleted");
        router.push(`/conditions/${plan!.ailmentId}`);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to delete plan.");
        setDeleting(false);
      }
    } catch {
      setError("Network error.");
      setDeleting(false);
    }
  }

  async function handleDeleteExercise(exerciseId: string) {
    setDeletingExerciseId(exerciseId);
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Exercise deleted");
        fetchPlan();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to delete exercise.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setDeletingExerciseId(null);
    }
  }

  async function handleMoveExercise(exerciseId: string, direction: "up" | "down") {
    if (!plan) return;
    const exercises = [...plan.exercises];
    const idx = exercises.findIndex((ex) => ex.id === exerciseId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= exercises.length) return;

    setReordering(true);

    // Swap sortOrder values
    const currentSort = exercises[idx].sortOrder;
    const targetSort = exercises[targetIdx].sortOrder;

    try {
      await Promise.all([
        fetch(`/api/exercises/${exercises[idx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: targetSort }),
        }),
        fetch(`/api/exercises/${exercises[targetIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: currentSort }),
        }),
      ]);
      await fetchPlan();
    } catch {
      setError("Failed to reorder exercises.");
    } finally {
      setReordering(false);
    }
  }

  async function handleRequestReview() {
    setReviewing(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/plans/${params.id}/review`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setReviewError(data.error ?? "Failed to generate review.");
        setReviewing(false);
        return;
      }
      // Refresh plan to get the new latestReview
      await fetchPlan();
      toast("AI review complete");
    } catch {
      setReviewError("Network error. Please try again.");
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return <SkeletonPlanDetail />;
  }

  if (error || !plan) {
    return (
      <div>
        <Link href="/conditions" className="text-sm text-warm-500 hover:text-warm-700">
          &larr; Back to Ailments
        </Link>
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? "Treatment plan not found."}
        </div>
      </div>
    );
  }

  if (editing) {
    const formData: Partial<PlanFormData> = {
      title: plan.title,
      rawContent: plan.rawContent ?? "",
      prescribedBy: plan.prescribedBy ?? "",
      frequency: plan.frequency,
      startDate: plan.startDate,
    };

    return (
      <div>
        <Link
          href={`/conditions/${plan.ailmentId}`}
          className="text-sm text-warm-500 hover:text-warm-700"
        >
          &larr; Back to {plan.ailment.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-warm-900">Edit Treatment Plan</h1>
        <div className="mt-4 rounded-2xl border border-warm-200 bg-white p-6 shadow-soft">
          <PlanForm
            ailmentId={plan.ailmentId}
            initialData={formData}
            planId={plan.id}
            onSuccess={() => {
              setEditing(false);
              setLoading(true);
              fetchPlan();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/conditions/${plan.ailmentId}`}
        className="text-sm text-warm-500 hover:text-warm-700"
      >
        &larr; Back to {plan.ailment.name}
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">{plan.title}</h1>
          <p className="mt-1 text-sm text-warm-500">
            {plan.prescribedBy && <>Prescribed by {plan.prescribedBy} &middot; </>}
            {FREQUENCY_LABEL[plan.frequency] ?? plan.frequency} &middot; since {plan.startDate}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {plan.latestReview && (
            <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-800 px-2.5 py-1 text-xs font-medium">
              Reviewed {(() => {
                const days = Math.floor((Date.now() - new Date(plan.latestReview.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                return days === 0 ? "today" : days === 1 ? "yesterday" : `${days}d ago`;
              })()}
            </span>
          )}
          <Link
            href={`/conditions/${plan.ailment.id}`}
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_BADGE[plan.ailment.severityLevel]} hover:opacity-80`}
          >
            {plan.ailment.name}
          </Link>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center rounded-xl border border-warm-300 bg-white px-3 py-1.5 text-sm font-medium text-warm-700 shadow-soft hover:bg-warm-50"
        >
          Edit
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-soft hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Delete &ldquo;{plan.title}&rdquo;? This will also remove all
            linked exercises. This cannot be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="inline-flex items-center rounded-xl border border-warm-300 bg-white px-3 py-1.5 text-sm font-medium text-warm-700 hover:bg-warm-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plan Info card */}
      <div className="mt-6 rounded-2xl border border-warm-200 bg-white p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-warm-900 mb-3">Plan Info</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-warm-500">Ailment</dt>
            <dd>
              <Link href={`/conditions/${plan.ailment.id}`} className="text-warm-900 hover:text-sage-600">
                {plan.ailment.name}
              </Link>
              <span className="ml-2 text-xs text-warm-500">
                {REGION_LABELS[plan.ailment.bodyRegion] ?? plan.ailment.bodyRegion}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-warm-500">Frequency</dt>
            <dd className="text-warm-900">{FREQUENCY_LABEL[plan.frequency] ?? plan.frequency}</dd>
          </div>
          <div>
            <dt className="text-warm-500">Start Date</dt>
            <dd className="text-warm-900">{plan.startDate}</dd>
          </div>
          {plan.prescribedBy && (
            <div>
              <dt className="text-warm-500">Prescribed By</dt>
              <dd className="text-warm-900">{plan.prescribedBy}</dd>
            </div>
          )}
          <div>
            <dt className="text-warm-500">Created</dt>
            <dd className="text-warm-900">{new Date(plan.createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-warm-500">Last updated</dt>
            <dd className="text-warm-900">{new Date(plan.updatedAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      {/* Exercises section */}
      <div className="mt-6 rounded-2xl border border-warm-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-warm-900">
            Exercises ({plan.exercises.length})
          </h2>
          {!showAddExercise && !editingExerciseId && (
            <button
              onClick={() => setShowAddExercise(true)}
              className="inline-flex items-center rounded-xl bg-sage-600 px-3 py-1.5 text-xs font-medium text-white shadow-soft hover:bg-sage-700"
            >
              + Add Exercise
            </button>
          )}
        </div>

        {/* Add exercise form */}
        {showAddExercise && (
          <div className="mb-4 rounded-xl border border-sage-200 bg-sage-50/30 p-4">
            <h3 className="text-sm font-medium text-warm-900 mb-3">New Exercise</h3>
            <ExerciseForm
              planId={plan.id}
              defaultBodyRegion={plan.ailment.bodyRegion}
              onSuccess={() => {
                setShowAddExercise(false);
                fetchPlan();
              }}
              onCancel={() => setShowAddExercise(false)}
            />
          </div>
        )}

        {/* Exercise list */}
        {plan.exercises.length === 0 && !showAddExercise ? (
          <p className="text-sm text-warm-500">
            No exercises added yet.{" "}
            <button
              onClick={() => setShowAddExercise(true)}
              className="text-sage-600 hover:text-sage-700"
            >
              Add your first exercise
            </button>
          </p>
        ) : (
          <ul className="space-y-3">
            {plan.exercises.map((ex, idx) => (
              <li key={ex.id}>
                {editingExerciseId === ex.id ? (
                  /* Inline edit form */
                  <div className="rounded-xl border border-sage-200 bg-sage-50/30 p-4">
                    <h3 className="text-sm font-medium text-warm-900 mb-3">Edit Exercise</h3>
                    <ExerciseForm
                      planId={plan.id}
                      defaultBodyRegion={plan.ailment.bodyRegion}
                      exerciseId={ex.id}
                      initialData={{
                        name: ex.name,
                        description: ex.description ?? "",
                        targetBodyRegion: ex.targetBodyRegion,
                        sets: ex.sets?.toString() ?? "",
                        reps: ex.reps?.toString() ?? "",
                        holdSeconds: ex.holdSeconds?.toString() ?? "",
                        durationMinutes: ex.durationMinutes.toString(),
                        frequencyPerWeek: ex.frequencyPerWeek?.toString() ?? "",
                        contraindications: ex.contraindications ?? "",
                        videoUrl: ex.videoUrl ?? "",
                      }}
                      onSuccess={() => {
                        setEditingExerciseId(null);
                        fetchPlan();
                      }}
                      onCancel={() => setEditingExerciseId(null)}
                    />
                  </div>
                ) : (
                  /* Exercise card */
                  <div className="rounded-xl border border-warm-100 p-3 hover:border-warm-300 hover:shadow-soft transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-warm-400 shrink-0 w-5 text-right">
                          {idx + 1}.
                        </span>
                        <span className="text-sm font-medium text-warm-900 truncate">
                          {ex.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-xs text-warm-500">
                        {ex.sets && ex.reps && (
                          <span className="rounded bg-warm-100 px-1.5 py-0.5 font-medium">
                            {ex.sets}&times;{ex.reps}
                          </span>
                        )}
                        {ex.holdSeconds && (
                          <span className="rounded bg-warm-100 px-1.5 py-0.5 font-medium">
                            {ex.holdSeconds}s hold
                          </span>
                        )}
                        <span className="rounded bg-warm-100 px-1.5 py-0.5">
                          {ex.durationMinutes} min
                        </span>
                      </div>
                    </div>

                    {ex.description && (
                      <p className="mt-1 ml-7 text-xs text-warm-600">{ex.description}</p>
                    )}

                    <div className="mt-1.5 ml-7 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-warm-500">
                        {REGION_LABELS[ex.targetBodyRegion] ?? ex.targetBodyRegion}
                      </span>
                      {ex.frequencyPerWeek && (
                        <span className="text-warm-500">
                          {ex.frequencyPerWeek}x/week
                        </span>
                      )}
                      {ex.contraindications && (
                        <span className="text-orange-600">
                          ⚠ {ex.contraindications}
                        </span>
                      )}
                      {ex.videoUrl && (
                        <a
                          href={ex.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sage-600 hover:text-sage-700"
                        >
                          Video
                        </a>
                      )}
                    </div>

                    {/* Exercise actions */}
                    <div className="mt-2 ml-7 flex items-center gap-1.5">
                      {/* Reorder buttons */}
                      <button
                        onClick={() => handleMoveExercise(ex.id, "up")}
                        disabled={idx === 0 || reordering}
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-xs text-warm-500 hover:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveExercise(ex.id, "down")}
                        disabled={idx === plan.exercises.length - 1 || reordering}
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-xs text-warm-500 hover:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>

                      <span className="mx-1 h-3 border-l border-warm-200" />

                      <button
                        onClick={() => setEditingExerciseId(ex.id)}
                        className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-warm-600 hover:bg-warm-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(ex.id)}
                        disabled={deletingExerciseId === ex.id}
                        className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        {deletingExerciseId === ex.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI Review section */}
      <div className="mt-6 rounded-2xl border border-warm-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-warm-900">AI Review</h2>
          <button
            onClick={handleRequestReview}
            disabled={reviewing}
            className="inline-flex items-center rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-soft hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reviewing ? (
              <>
                <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Reviewing...
              </>
            ) : plan.latestReview ? (
              "Re-run Review"
            ) : (
              "Get AI Review"
            )}
          </button>
        </div>

        {reviewError && (
          <div className="mb-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {reviewError}
          </div>
        )}

        {plan.latestReview ? (
          <AIReviewDisplay
            result={plan.latestReview.result}
            createdAt={plan.latestReview.createdAt}
            exerciseNames={Object.fromEntries(
              plan.exercises.map((ex) => [ex.id, ex.name])
            )}
          />
        ) : (
          <p className="text-sm text-warm-500">
            No AI review yet. Click &ldquo;Get AI Review&rdquo; to analyse this plan against evidence-based practices
            and check for cross-condition interactions.
          </p>
        )}
      </div>

      {/* Raw plan content */}
      {plan.rawContent && (
        <div className="mt-6 rounded-2xl border border-warm-200 bg-white p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-warm-900 mb-3">Plan Content</h2>
          <pre className="whitespace-pre-wrap text-sm text-warm-700 font-mono bg-warm-50 rounded-xl p-4 max-h-96 overflow-y-auto">
            {plan.rawContent}
          </pre>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PlanForm from "@/components/plans/PlanForm";
import type { PlanFormData } from "@/components/plans/PlanForm";
import type { BodyRegion, ExerciseFrequency } from "@prisma/client";

interface ExerciseEntry {
  id: string;
  name: string;
  description: string | null;
  targetBodyRegion: BodyRegion;
  contraindications: string | null;
  durationMinutes: number;
  sets: number | null;
  reps: number | null;
  createdAt: string;
}

interface PlanDetail {
  id: string;
  title: string;
  prescribedBy: string | null;
  frequency: ExerciseFrequency;
  isActive: boolean;
  startDate: string;
  rawContent: string | null;
  aiReview: unknown;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ailment: {
    id: string;
    name: string;
    bodyRegion: BodyRegion;
  };
  exercises: ExerciseEntry[];
}

const FREQUENCY_LABELS: Record<string, string> = {
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
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/${params.id}`);
      if (res.status === 404) {
        setError("Plan not found.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load plan.");
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
      const res = await fetch(`/api/plans/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/conditions/${plan!.ailment.id}`);
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

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Loading plan...
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div>
        <Link href="/plans" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to Plans
        </Link>
        <div className="mt-6 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? "Plan not found."}
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
      isActive: plan.isActive,
    };

    return (
      <div>
        <Link href={`/conditions/${plan.ailment.id}`} className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to {plan.ailment.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Plan</h1>
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <PlanForm
            ailmentId={plan.ailment.id}
            planId={plan.id}
            initialData={formData}
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
      <Link href={`/conditions/${plan.ailment.id}`} className="text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to {plan.ailment.name}
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            For{" "}
            <Link href={`/conditions/${plan.ailment.id}`} className="text-blue-600 hover:text-blue-700">
              {plan.ailment.name}
            </Link>
            {" "}({REGION_LABELS[plan.ailment.bodyRegion] ?? plan.ailment.bodyRegion})
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {plan.isActive ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
              active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              inactive
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Delete &ldquo;{plan.title}&rdquo;? This will also remove all
            linked exercises. This cannot be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Detail cards */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Details</h2>
          <dl className="space-y-2 text-sm">
            {plan.prescribedBy && (
              <div>
                <dt className="text-gray-500">Prescribed by</dt>
                <dd className="text-gray-900">{plan.prescribedBy}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Frequency</dt>
              <dd className="text-gray-900">{FREQUENCY_LABELS[plan.frequency] ?? plan.frequency}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Start date</dt>
              <dd className="text-gray-900">{plan.startDate}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="text-gray-900">{new Date(plan.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Last updated</dt>
              <dd className="text-gray-900">{new Date(plan.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {/* Exercises card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Exercises ({plan.exercises.length})
          </h2>
          {plan.exercises.length === 0 ? (
            <p className="text-sm text-gray-500">
              No exercises added yet. Exercises will be available in a future update.
            </p>
          ) : (
            <ul className="space-y-2">
              {plan.exercises.map((ex) => (
                <li
                  key={ex.id}
                  className="rounded-md border border-gray-100 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {ex.name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {REGION_LABELS[ex.targetBodyRegion] ?? ex.targetBodyRegion}
                    </span>
                  </div>
                  {ex.description && (
                    <p className="mt-1 text-xs text-gray-600">{ex.description}</p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs text-gray-500">
                    <span>{ex.durationMinutes} min</span>
                    {ex.sets && <span>{ex.sets} sets</span>}
                    {ex.reps && <span>{ex.reps} reps</span>}
                  </div>
                  {ex.contraindications && (
                    <p className="mt-1 text-xs text-red-600">
                      Caution: {ex.contraindications}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Plan content (pasted handout) */}
      {plan.rawContent && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Plan Content
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
            {plan.rawContent}
          </pre>
        </div>
      )}
    </div>
  );
}

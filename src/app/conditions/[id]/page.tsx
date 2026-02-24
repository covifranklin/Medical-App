"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AilmentForm from "@/components/ailments/AilmentForm";
import type { AilmentFormData } from "@/components/ailments/AilmentForm";
import type { BodyRegion, SeverityLevel, AilmentStatus } from "@prisma/client";

interface PainLogEntry {
  id: string;
  painLevel: number;
  date: string;
  notes: string | null;
}

interface TreatmentPlanEntry {
  id: string;
  title: string;
  prescribedBy: string | null;
  frequency: string;
  startDate: string;
  createdAt: string;
}

interface AilmentDetail {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
  diagnosis: string | null;
  dateDiagnosed: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  painLogs: PainLogEntry[];
  treatmentPlans: TreatmentPlanEntry[];
}

const SEVERITY_BADGE: Record<string, string> = {
  MILD: "bg-green-100 text-green-800",
  MODERATE: "bg-orange-100 text-orange-800",
  SEVERE: "bg-red-100 text-red-800",
  CRITICAL: "bg-red-200 text-red-900",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  MANAGED: "bg-gray-100 text-gray-700",
  RESOLVED: "bg-green-100 text-green-700",
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

export default function AilmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [ailment, setAilment] = useState<AilmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchAilment = useCallback(async () => {
    try {
      const res = await fetch(`/api/ailments/${params.id}`);
      if (res.status === 404) {
        setError("Ailment not found.");
        return;
      }
      if (!res.ok) {
        setError("Failed to load ailment.");
        return;
      }
      setAilment(await res.json());
      setError(null);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchAilment();
  }, [fetchAilment]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/ailments/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/conditions");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to delete ailment.");
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
        Loading ailment...
      </div>
    );
  }

  if (error || !ailment) {
    return (
      <div>
        <Link href="/conditions" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to Ailments
        </Link>
        <div className="mt-6 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error ?? "Ailment not found."}
        </div>
      </div>
    );
  }

  if (editing) {
    const formData: Partial<AilmentFormData> = {
      name: ailment.name,
      bodyRegion: ailment.bodyRegion,
      severityLevel: ailment.severityLevel,
      status: ailment.status,
      diagnosis: ailment.diagnosis ?? "",
      dateDiagnosed: ailment.dateDiagnosed ?? "",
      notes: ailment.notes ?? "",
    };

    return (
      <div>
        <Link href="/conditions" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to Ailments
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Ailment</h1>
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <AilmentForm
            initialData={formData}
            ailmentId={ailment.id}
            onSuccess={() => {
              setEditing(false);
              setLoading(true);
              fetchAilment();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/conditions" className="text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to Ailments
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ailment.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {REGION_LABELS[ailment.bodyRegion] ?? ailment.bodyRegion}
            {ailment.dateDiagnosed && ` — Diagnosed ${ailment.dateDiagnosed}`}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_BADGE[ailment.severityLevel]}`}>
            {ailment.severityLevel.toLowerCase()}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[ailment.status]}`}>
            {ailment.status.toLowerCase()}
          </span>
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
            Delete &ldquo;{ailment.name}&rdquo;? This will also remove all
            linked pain logs and treatment plans. This cannot be undone.
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
            {ailment.diagnosis && (
              <div>
                <dt className="text-gray-500">Diagnosis</dt>
                <dd className="text-gray-900">{ailment.diagnosis}</dd>
              </div>
            )}
            {ailment.notes && (
              <div>
                <dt className="text-gray-500">Notes</dt>
                <dd className="text-gray-900 whitespace-pre-wrap">{ailment.notes}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="text-gray-900">{new Date(ailment.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Last updated</dt>
              <dd className="text-gray-900">{new Date(ailment.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {/* Pain logs card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Recent Pain Logs
          </h2>
          {ailment.painLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No pain logs recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {ailment.painLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">
                    {log.date}
                    {log.notes && (
                      <span className="ml-2 text-gray-400">— {log.notes}</span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {log.painLevel}/10
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Treatment plans */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Treatment Plans
          </h2>
          <Link
            href={`/plans/new?ailmentId=${ailment.id}`}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Add Plan
          </Link>
        </div>
        {ailment.treatmentPlans.length === 0 ? (
          <p className="text-sm text-gray-500">
            No treatment plans linked yet.{" "}
            <Link
              href={`/plans/new?ailmentId=${ailment.id}`}
              className="text-blue-600 hover:text-blue-700"
            >
              Add your first plan
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {ailment.treatmentPlans.map((plan) => (
              <li
                key={plan.id}
                className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div>
                  <Link
                    href={`/plans/${plan.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    {plan.title}
                  </Link>
                  {plan.prescribedBy && (
                    <span className="ml-2 text-xs text-gray-500">
                      by {plan.prescribedBy}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {plan.frequency.toLowerCase()} — since {plan.startDate}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

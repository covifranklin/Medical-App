"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BodyRegion, SeverityLevel, AilmentStatus, PriorityLevel, GoalTimeframe } from "@prisma/client";

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

const SEVERITY_OPTIONS: { value: SeverityLevel; label: string; description: string }[] = [
  { value: "MILD", label: "Mild", description: "Pain level 1-3" },
  { value: "MODERATE", label: "Moderate", description: "Pain level 4-6" },
  { value: "SEVERE", label: "Severe", description: "Pain level 7-8" },
  { value: "CRITICAL", label: "Critical", description: "Pain level 9-10" },
];

const STATUS_OPTIONS: { value: AilmentStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "MANAGED", label: "Managed" },
  { value: "RESOLVED", label: "Resolved" },
];

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string; description: string }[] = [
  { value: "HIGH", label: "High", description: "Prioritise in daily plan" },
  { value: "MEDIUM", label: "Medium", description: "Normal weighting" },
  { value: "LOW", label: "Low", description: "Include when time allows" },
];

const GOAL_OPTIONS: { value: GoalTimeframe; label: string; description: string }[] = [
  { value: "ACUTE_RELIEF", label: "Acute Relief", description: "Immediate pain management" },
  { value: "THIS_WEEK", label: "This Week", description: "Short-term goals" },
  { value: "THIS_MONTH", label: "This Month", description: "Medium-term rehab" },
  { value: "MAINTENANCE", label: "Maintenance", description: "Ongoing management" },
];

export interface AilmentFormData {
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
  priorityLevel: PriorityLevel;
  goalTimeframe: GoalTimeframe;
  diagnosis: string;
  dateDiagnosed: string;
  notes: string;
}

interface AilmentFormProps {
  /** Pre-filled values for editing or body-map-initiated creation */
  initialData?: Partial<AilmentFormData>;
  /** If set, the form sends PUT to this ailment ID instead of POST */
  ailmentId?: string;
  /** Called on successful save */
  onSuccess?: () => void;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

export default function AilmentForm({
  initialData,
  ailmentId,
  onSuccess,
  onCancel,
}: AilmentFormProps) {
  const router = useRouter();
  const isEditing = Boolean(ailmentId);

  const [form, setForm] = useState<AilmentFormData>({
    name: initialData?.name ?? "",
    bodyRegion: initialData?.bodyRegion ?? "LOWER_BACK",
    severityLevel: initialData?.severityLevel ?? "MODERATE",
    status: initialData?.status ?? "ACTIVE",
    priorityLevel: initialData?.priorityLevel ?? "MEDIUM",
    goalTimeframe: initialData?.goalTimeframe ?? "THIS_MONTH",
    diagnosis: initialData?.diagnosis ?? "",
    dateDiagnosed: initialData?.dateDiagnosed ?? "",
    notes: initialData?.notes ?? "",
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof AilmentFormData>(
    key: K,
    value: AilmentFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    // Client-side check
    if (!form.name.trim()) {
      setErrors(["Name is required."]);
      setSubmitting(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      bodyRegion: form.bodyRegion,
      severityLevel: form.severityLevel,
      status: form.status,
      priorityLevel: form.priorityLevel,
      goalTimeframe: form.goalTimeframe,
      diagnosis: form.diagnosis.trim() || null,
      dateDiagnosed: form.dateDiagnosed || null,
      notes: form.notes.trim() || null,
    };

    try {
      const url = ailmentId ? `/api/ailments/${ailmentId}` : "/api/ailments";
      const method = ailmentId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors(data.errors ?? [data.error ?? "Something went wrong."]);
        setSubmitting(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/conditions");
        router.refresh();
      }
    } catch {
      setErrors(["Network error. Please try again."]);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3">
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-warm-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          maxLength={200}
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="e.g. Lower back disc herniation"
          className="mt-1 block w-full rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
        />
      </div>

      {/* Body Region + Severity row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bodyRegion" className="block text-sm font-medium text-warm-700">
            Body Region <span className="text-red-500">*</span>
          </label>
          <select
            id="bodyRegion"
            value={form.bodyRegion}
            onChange={(e) => updateField("bodyRegion", e.target.value as BodyRegion)}
            className="mt-1 block w-full rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
          >
            {BODY_REGION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="severityLevel" className="block text-sm font-medium text-warm-700">
            Severity
          </label>
          <select
            id="severityLevel"
            value={form.severityLevel}
            onChange={(e) => updateField("severityLevel", e.target.value as SeverityLevel)}
            className="mt-1 block w-full rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.description})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-warm-700">
          Status
        </label>
        <select
          id="status"
          value={form.status}
          onChange={(e) => updateField("status", e.target.value as AilmentStatus)}
          className="mt-1 block w-full rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Priority + Goal row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="priorityLevel" className="block text-sm font-medium text-warm-700">
            Daily Plan Priority
          </label>
          <select
            id="priorityLevel"
            value={form.priorityLevel}
            onChange={(e) => updateField("priorityLevel", e.target.value as PriorityLevel)}
            className="mt-1 block w-full rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="goalTimeframe" className="block text-sm font-medium text-warm-700">
            Goal Timeframe
          </label>
          <select
            id="goalTimeframe"
            value={form.goalTimeframe}
            onChange={(e) => updateField("goalTimeframe", e.target.value as GoalTimeframe)}
            className="mt-1 block w-full rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
          >
            {GOAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Diagnosis + Date row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="diagnosis" className="block text-sm font-medium text-warm-700">
            Diagnosis
          </label>
          <input
            id="diagnosis"
            type="text"
            maxLength={1000}
            value={form.diagnosis}
            onChange={(e) => updateField("diagnosis", e.target.value)}
            placeholder="Clinical diagnosis details"
            className="mt-1 block w-full rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
          />
        </div>

        <div>
          <label htmlFor="dateDiagnosed" className="block text-sm font-medium text-warm-700">
            Date Diagnosed
          </label>
          <input
            id="dateDiagnosed"
            type="date"
            value={form.dateDiagnosed}
            onChange={(e) => updateField("dateDiagnosed", e.target.value)}
            className="mt-1 block w-full rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-warm-700">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          maxLength={2000}
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Additional context, triggers, observations..."
          className="mt-1 block w-full rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-xl bg-sage-600 px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Ailment"}
        </button>
        <button
          type="button"
          onClick={onCancel ?? (() => router.push("/conditions"))}
          className="inline-flex items-center rounded-xl border border-warm-300 bg-white px-4 py-2 text-sm font-medium text-warm-700 shadow-soft hover:bg-warm-50 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

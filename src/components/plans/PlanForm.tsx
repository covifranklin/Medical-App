"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseFrequency } from "@prisma/client";

const FREQUENCY_OPTIONS: { value: ExerciseFrequency; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "ALTERNATE_DAYS", label: "Alternate Days" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "AS_NEEDED", label: "As Needed" },
];

export interface PlanFormData {
  title: string;
  rawContent: string;
  prescribedBy: string;
  frequency: ExerciseFrequency;
  startDate: string;
  isActive: boolean;
}

interface PlanFormProps {
  /** Ailment ID this plan belongs to */
  ailmentId: string;
  /** Pre-filled values for editing */
  initialData?: Partial<PlanFormData>;
  /** If set, sends PUT to this plan ID instead of POST */
  planId?: string;
  /** Called on successful save */
  onSuccess?: () => void;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

export default function PlanForm({
  ailmentId,
  initialData,
  planId,
  onSuccess,
  onCancel,
}: PlanFormProps) {
  const router = useRouter();
  const isEditing = Boolean(planId);

  const [form, setForm] = useState<PlanFormData>({
    title: initialData?.title ?? "",
    rawContent: initialData?.rawContent ?? "",
    prescribedBy: initialData?.prescribedBy ?? "",
    frequency: initialData?.frequency ?? "DAILY",
    startDate: initialData?.startDate ?? new Date().toISOString().split("T")[0],
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof PlanFormData>(
    key: K,
    value: PlanFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    if (!form.title.trim()) {
      setErrors(["Title is required."]);
      setSubmitting(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      rawContent: form.rawContent.trim() || null,
      prescribedBy: form.prescribedBy.trim() || null,
      frequency: form.frequency,
      startDate: form.startDate || null,
      isActive: form.isActive,
    };

    try {
      const url = planId
        ? `/api/plans/${planId}`
        : `/api/ailments/${ailmentId}/plans`;
      const method = planId ? "PUT" : "POST";

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
        router.push(`/conditions/${ailmentId}`);
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
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder='e.g. "Physio plan from Dr. Smith"'
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Prescribed By + Start Date row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="prescribedBy" className="block text-sm font-medium text-gray-700">
            Prescribed By
          </label>
          <input
            id="prescribedBy"
            type="text"
            maxLength={200}
            value={form.prescribedBy}
            onChange={(e) => updateField("prescribedBy", e.target.value)}
            placeholder="e.g. Dr. Smith, PhysioClinic"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Frequency + Active toggle row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
            Frequency
          </label>
          <select
            id="frequency"
            value={form.frequency}
            onChange={(e) => updateField("frequency", e.target.value as ExerciseFrequency)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end pb-1">
          <label className="relative inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>
      </div>

      {/* Plan Content — generous textarea */}
      <div>
        <label htmlFor="rawContent" className="block text-sm font-medium text-gray-700">
          Plan Details
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Paste your physio handout, treatment instructions, or exercise list here.
        </p>
        <textarea
          id="rawContent"
          rows={12}
          maxLength={20000}
          value={form.rawContent}
          onChange={(e) => updateField("rawContent", e.target.value)}
          placeholder={`e.g.\n1. Bird-dog hold — 3 sets x 10 reps, hold 5s\n2. Dead bug — 3 sets x 8 reps each side\n3. Cat-cow stretch — 2 min\n4. Prone press-up — 3 sets x 10\n\nAvoid: heavy squats, seated leg press\nFrequency: daily, morning preferred\nProgress: increase hold time weekly`}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Plan"}
        </button>
        <button
          type="button"
          onClick={onCancel ?? (() => router.push(`/conditions/${ailmentId}`))}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

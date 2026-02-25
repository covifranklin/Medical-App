"use client";

import { useState } from "react";
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

export interface ExerciseFormData {
  name: string;
  description: string;
  targetBodyRegion: BodyRegion;
  sets: string;
  reps: string;
  holdSeconds: string;
  durationMinutes: string;
  frequencyPerWeek: string;
  contraindications: string;
  videoUrl: string;
}

interface ExerciseFormProps {
  /** Plan this exercise belongs to */
  planId: string;
  /** Default body region from the parent ailment */
  defaultBodyRegion?: BodyRegion;
  /** Pre-filled values for editing */
  initialData?: Partial<ExerciseFormData>;
  /** If set, PUT to this exercise ID instead of POST */
  exerciseId?: string;
  /** Called on successful save */
  onSuccess?: () => void;
  /** Called when cancel is clicked */
  onCancel?: () => void;
}

export default function ExerciseForm({
  planId,
  defaultBodyRegion,
  initialData,
  exerciseId,
  onSuccess,
  onCancel,
}: ExerciseFormProps) {
  const isEditing = Boolean(exerciseId);

  const [form, setForm] = useState<ExerciseFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    targetBodyRegion: initialData?.targetBodyRegion ?? defaultBodyRegion ?? "LOWER_BACK",
    sets: initialData?.sets ?? "",
    reps: initialData?.reps ?? "",
    holdSeconds: initialData?.holdSeconds ?? "",
    durationMinutes: initialData?.durationMinutes ?? "5",
    frequencyPerWeek: initialData?.frequencyPerWeek ?? "",
    contraindications: initialData?.contraindications ?? "",
    videoUrl: initialData?.videoUrl ?? "",
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof ExerciseFormData>(
    key: K,
    value: ExerciseFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    if (!form.name.trim()) {
      setErrors(["Name is required."]);
      setSubmitting(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      targetBodyRegion: form.targetBodyRegion,
      sets: form.sets ? Number(form.sets) : null,
      reps: form.reps ? Number(form.reps) : null,
      holdSeconds: form.holdSeconds ? Number(form.holdSeconds) : null,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : 5,
      frequencyPerWeek: form.frequencyPerWeek ? Number(form.frequencyPerWeek) : null,
      contraindications: form.contraindications.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
    };

    try {
      const url = exerciseId
        ? `/api/exercises/${exerciseId}`
        : `/api/plans/${planId}/exercises`;
      const method = exerciseId ? "PUT" : "POST";

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

      onSuccess?.();
    } catch {
      setErrors(["Network error. Please try again."]);
      setSubmitting(false);
    }
  }

  const inputCls =
    "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="ex-name" className={labelCls}>
          Exercise Name <span className="text-red-500">*</span>
        </label>
        <input
          id="ex-name"
          type="text"
          required
          maxLength={300}
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder='e.g. "Bird-dog hold"'
          className={inputCls}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="ex-description" className={labelCls}>
          Description
        </label>
        <textarea
          id="ex-description"
          rows={3}
          maxLength={2000}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="How to perform the exercise, cues, etc."
          className={inputCls}
        />
      </div>

      {/* Target Region + Frequency/week row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ex-targetBodyRegion" className={labelCls}>
            Target Body Region <span className="text-red-500">*</span>
          </label>
          <select
            id="ex-targetBodyRegion"
            value={form.targetBodyRegion}
            onChange={(e) => updateField("targetBodyRegion", e.target.value as BodyRegion)}
            className={inputCls}
          >
            {BODY_REGION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ex-frequencyPerWeek" className={labelCls}>
            Frequency (per week)
          </label>
          <input
            id="ex-frequencyPerWeek"
            type="number"
            min={0}
            max={21}
            value={form.frequencyPerWeek}
            onChange={(e) => updateField("frequencyPerWeek", e.target.value)}
            placeholder="e.g. 5"
            className={inputCls}
          />
        </div>
      </div>

      {/* Sets + Reps + Hold + Duration row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label htmlFor="ex-sets" className={labelCls}>Sets</label>
          <input
            id="ex-sets"
            type="number"
            min={0}
            max={100}
            value={form.sets}
            onChange={(e) => updateField("sets", e.target.value)}
            placeholder="3"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="ex-reps" className={labelCls}>Reps</label>
          <input
            id="ex-reps"
            type="number"
            min={0}
            max={1000}
            value={form.reps}
            onChange={(e) => updateField("reps", e.target.value)}
            placeholder="10"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="ex-holdSeconds" className={labelCls}>Hold (sec)</label>
          <input
            id="ex-holdSeconds"
            type="number"
            min={0}
            max={3600}
            value={form.holdSeconds}
            onChange={(e) => updateField("holdSeconds", e.target.value)}
            placeholder="30"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="ex-durationMinutes" className={labelCls}>Duration (min)</label>
          <input
            id="ex-durationMinutes"
            type="number"
            min={0}
            max={600}
            value={form.durationMinutes}
            onChange={(e) => updateField("durationMinutes", e.target.value)}
            placeholder="5"
            className={inputCls}
          />
        </div>
      </div>

      {/* Contraindications */}
      <div>
        <label htmlFor="ex-contraindications" className={labelCls}>
          Contraindications
        </label>
        <textarea
          id="ex-contraindications"
          rows={2}
          maxLength={1000}
          value={form.contraindications}
          onChange={(e) => updateField("contraindications", e.target.value)}
          placeholder="When NOT to do this exercise (e.g. during flare-up, post-surgery)"
          className={inputCls}
        />
      </div>

      {/* Video URL */}
      <div>
        <label htmlFor="ex-videoUrl" className={labelCls}>
          Video URL <span className="text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="ex-videoUrl"
          type="url"
          maxLength={500}
          value={form.videoUrl}
          onChange={(e) => updateField("videoUrl", e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className={inputCls}
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
            ? isEditing ? "Saving..." : "Adding..."
            : isEditing ? "Save Changes" : "Add Exercise"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PlanForm from "@/components/plans/PlanForm";

interface AilmentOption {
  id: string;
  name: string;
  bodyRegion: string;
}

function NewPlanContent() {
  const searchParams = useSearchParams();
  const ailmentIdParam = searchParams.get("ailmentId");

  const [ailmentId, setAilmentId] = useState(ailmentIdParam ?? "");
  const [ailments, setAilments] = useState<AilmentOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAilments() {
      try {
        const res = await fetch("/api/ailments");
        if (res.ok) {
          const data = await res.json();
          setAilments(data);
          // If no ailmentId and there are ailments, default to first
          if (!ailmentIdParam && data.length > 0) {
            setAilmentId(data[0].id);
          }
        }
      } catch {
        // silently fail — the form will show validation errors
      } finally {
        setLoading(false);
      }
    }
    fetchAilments();
  }, [ailmentIdParam]);

  const selectedAilment = ailments.find((a) => a.id === ailmentId);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-warm-500">Loading...</div>
    );
  }

  if (ailments.length === 0) {
    return (
      <div>
        <Link href="/conditions" className="text-sm text-warm-500 hover:text-warm-700">
          &larr; Back to Ailments
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-warm-900">Add Treatment Plan</h1>
        <div className="mt-6 rounded-2xl border-2 border-dashed border-warm-300 p-12 text-center text-warm-500">
          <p>You need at least one ailment before creating a treatment plan.</p>
          <Link
            href="/conditions/new"
            className="mt-3 inline-block text-sm font-medium text-sage-600 hover:text-sage-700"
          >
            + Add your first ailment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={ailmentIdParam ? `/conditions/${ailmentIdParam}` : "/conditions"}
          className="text-sm text-warm-500 hover:text-warm-700"
        >
          &larr; {selectedAilment ? `Back to ${selectedAilment.name}` : "Back to Ailments"}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-warm-900">Add Treatment Plan</h1>
        {selectedAilment && (
          <p className="mt-1 text-sm text-warm-600">
            Adding plan for {selectedAilment.name}
          </p>
        )}
      </div>

      {/* Ailment picker — shown only if no ailmentId was pre-selected */}
      {!ailmentIdParam && (
        <div className="mb-4">
          <label htmlFor="ailmentPicker" className="block text-sm font-medium text-warm-700">
            Ailment <span className="text-red-500">*</span>
          </label>
          <select
            id="ailmentPicker"
            value={ailmentId}
            onChange={(e) => setAilmentId(e.target.value)}
            className="mt-1 block w-full max-w-md rounded-xl border border-warm-300 px-3 py-2 text-sm shadow-soft focus:border-sage-400 focus:outline-none focus:ring-1 focus:ring-sage-400"
          >
            {ailments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.bodyRegion.toLowerCase().replace(/_/g, " ")})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-soft">
        <PlanForm ailmentId={ailmentId} />
      </div>
    </div>
  );
}

export default function NewPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-warm-500">
          Loading...
        </div>
      }
    >
      <NewPlanContent />
    </Suspense>
  );
}

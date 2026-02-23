"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PlanForm from "@/components/plans/PlanForm";

interface AilmentInfo {
  id: string;
  name: string;
}

export default function NewPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const [ailment, setAilment] = useState<AilmentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAilment() {
      try {
        const res = await fetch(`/api/ailments/${params.id}`);
        if (!res.ok) {
          setError("Ailment not found.");
          return;
        }
        const data = await res.json();
        setAilment({ id: data.id, name: data.name });
      } catch {
        setError("Failed to load ailment.");
      }
    }
    fetchAilment();
  }, [params.id]);

  if (error) {
    return (
      <div>
        <Link href="/conditions" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to Ailments
        </Link>
        <div className="mt-6 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!ailment) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/conditions/${ailment.id}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to {ailment.name}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        New Treatment Plan
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        For {ailment.name}
      </p>
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <PlanForm ailmentId={ailment.id} />
      </div>
    </div>
  );
}

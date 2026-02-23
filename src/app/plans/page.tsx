"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ExerciseFrequency } from "@prisma/client";

interface PlanListItem {
  id: string;
  title: string;
  prescribedBy: string | null;
  frequency: ExerciseFrequency;
  isActive: boolean;
  startDate: string;
  exerciseCount: number;
  ailmentName: string;
  ailmentId: string;
  createdAt: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  ALTERNATE_DAYS: "Alternate Days",
  WEEKLY: "Weekly",
  AS_NEEDED: "As Needed",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans ?? data);
        }
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    fetchPlans();
  }, []);

  const filtered = plans.filter((p) => {
    if (filter === "ACTIVE") return p.isActive;
    if (filter === "INACTIVE") return !p.isActive;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatment Plans</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage your treatment plans.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-1 border-b border-gray-200">
        {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === s
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Loading plans...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">
              {filter === "ALL"
                ? "No treatment plans yet. Add one from an ailment page."
                : `No ${filter.toLowerCase()} plans.`}
            </p>
            <Link
              href="/conditions"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Go to Ailments
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/plans/${plan.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {plan.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        For{" "}
                        <span className="font-medium text-gray-700">
                          {plan.ailmentName}
                        </span>
                        {plan.prescribedBy && ` — by ${plan.prescribedBy}`}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {plan.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span>{FREQUENCY_LABELS[plan.frequency] ?? plan.frequency}</span>
                    <span>Since {plan.startDate}</span>
                    {plan.exerciseCount > 0 && (
                      <span>
                        {plan.exerciseCount} exercise{plan.exerciseCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

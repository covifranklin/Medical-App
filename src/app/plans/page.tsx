"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SkeletonAilmentList } from "@/components/shared/Skeleton";

interface PlanListItem {
  id: string;
  title: string;
  prescribedBy: string | null;
  frequency: string;
  startDate: string;
  ailment: {
    id: string;
    name: string;
    bodyRegion: string;
  };
  _count: { exercises: number };
}

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: "Daily",
  ALTERNATE_DAYS: "Alternate Days",
  WEEKLY: "Weekly",
  AS_NEEDED: "As Needed",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/plans");
        if (res.ok) {
          setPlans(await res.json());
        }
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatment Plans</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage your treatment plans. Get AI-powered reviews.
          </p>
        </div>
        <Link
          href="/plans/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Add Plan
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <SkeletonAilmentList count={3} />
        ) : plans.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <svg
              className="mx-auto h-10 w-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-500">
              No treatment plans yet
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Create a plan from an ailment page, or add one directly.
            </p>
            <Link
              href="/plans/new"
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create your first plan
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {plans.map((plan) => (
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
                        for {plan.ailment.name}
                        {plan.prescribedBy && ` — by ${plan.prescribedBy}`}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {FREQUENCY_LABEL[plan.frequency] ?? plan.frequency}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span>
                      {plan._count.exercises} exercise
                      {plan._count.exercises !== 1 ? "s" : ""}
                    </span>
                    <span>Since {plan.startDate}</span>
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

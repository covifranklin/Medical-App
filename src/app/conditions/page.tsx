"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SkeletonAilmentList } from "@/components/shared/Skeleton";
import type { BodyRegion, SeverityLevel, AilmentStatus } from "@prisma/client";

interface AilmentListItem {
  id: string;
  name: string;
  bodyRegion: BodyRegion;
  severityLevel: SeverityLevel;
  status: AilmentStatus;
  diagnosis: string | null;
  dateDiagnosed: string | null;
  treatmentPlanCount: number;
  latestPainLog: { painLevel: number; date: string } | null;
  updatedAt: string;
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

export default function AilmentsPage() {
  const [ailments, setAilments] = useState<AilmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | AilmentStatus>("ALL");

  useEffect(() => {
    async function fetchAilments() {
      try {
        const params = filter !== "ALL" ? `?status=${filter}` : "";
        const res = await fetch(`/api/ailments${params}`);
        if (res.ok) {
          setAilments(await res.json());
        }
      } catch (err) {
        console.error("Failed to load ailments:", err);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    fetchAilments();
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ailments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your ailments and track their severity.
          </p>
        </div>
        <Link
          href="/conditions/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Add Ailment
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="mt-4 flex gap-1 border-b border-gray-200">
        {(["ALL", "ACTIVE", "MANAGED", "RESOLVED"] as const).map((s) => (
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
          <SkeletonAilmentList count={3} />
        ) : ailments.length === 0 ? (
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
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-500">
              {filter === "ALL"
                ? "No ailments recorded yet"
                : `No ${filter.toLowerCase()} ailments`}
            </p>
            {filter === "ALL" && (
              <p className="mt-1 text-sm text-gray-400">
                Track your conditions to get personalised exercise plans.
              </p>
            )}
            <Link
              href="/conditions/new"
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add your first ailment
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {ailments.map((ailment) => (
              <li key={ailment.id}>
                <Link
                  href={`/conditions/${ailment.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 hover:shadow transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {ailment.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {REGION_LABELS[ailment.bodyRegion] ?? ailment.bodyRegion}
                        {ailment.diagnosis && ` — ${ailment.diagnosis}`}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[ailment.severityLevel]}`}>
                        {ailment.severityLevel.toLowerCase()}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[ailment.status]}`}>
                        {ailment.status.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    {ailment.latestPainLog && (
                      <span>
                        Pain: {ailment.latestPainLog.painLevel}/10 ({ailment.latestPainLog.date})
                      </span>
                    )}
                    {ailment.treatmentPlanCount > 0 && (
                      <span>
                        {ailment.treatmentPlanCount} plan{ailment.treatmentPlanCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {ailment.dateDiagnosed && (
                      <span>Diagnosed: {ailment.dateDiagnosed}</span>
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

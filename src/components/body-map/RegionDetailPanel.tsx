"use client";

import Link from "next/link";
import type { BodyRegion } from "@prisma/client";
import type { AilmentWithPain } from "@/types";
import { getRegionLabel } from "./regions";
import { getColourForPainLevel } from "./colours";

interface RegionDetailPanelProps {
  bodyRegion: BodyRegion;
  ailments: AilmentWithPain[];
  onClose: () => void;
}

const SEVERITY_BADGE: Record<string, string> = {
  MILD: "bg-green-100 text-green-800",
  MODERATE: "bg-orange-100 text-orange-800",
  SEVERE: "bg-red-100 text-red-800",
  CRITICAL: "bg-red-200 text-red-900",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-sage-100 text-sage-700",
  MANAGED: "bg-warm-100 text-warm-700",
  RESOLVED: "bg-green-100 text-green-700",
};

export default function RegionDetailPanel({
  bodyRegion,
  ailments,
  onClose,
}: RegionDetailPanelProps) {
  const label = getRegionLabel(bodyRegion);

  return (
    <div className="rounded-2xl border border-warm-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-warm-100 px-4 py-3">
        <h2 className="text-lg font-semibold text-warm-900">{label}</h2>
        <button
          onClick={onClose}
          className="rounded-xl p-1 text-warm-400 hover:bg-warm-100 hover:text-warm-600 transition-colors"
          aria-label="Close panel"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        {ailments.length === 0 ? (
          <div>
            <p className="text-sm text-warm-500">No ailments recorded for this region.</p>
            <Link
              href={`/conditions/new?bodyRegion=${bodyRegion}`}
              className="mt-3 inline-block text-sm font-medium text-sage-600 hover:text-sage-700"
            >
              + Add ailment here
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {ailments.map((ailment) => (
                <li key={ailment.id} className="rounded-xl border border-warm-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/conditions/${ailment.id}`} className="text-sm font-medium text-warm-900 hover:text-sage-600">{ailment.name}</Link>
                    <div className="flex gap-1.5 shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[ailment.severityLevel]}`}>
                        {ailment.severityLevel.toLowerCase()}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[ailment.status]}`}>
                        {ailment.status.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {ailment.diagnosis && (
                    <p className="mt-1 text-xs text-warm-600">
                      <span className="font-medium">Diagnosis:</span> {ailment.diagnosis}
                    </p>
                  )}

                  {ailment.notes && (
                    <p className="mt-1 text-xs text-warm-500">{ailment.notes}</p>
                  )}

                  {ailment.treatmentPlanCount > 0 && (
                    <div className="mt-1.5">
                      <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 text-xs font-medium">
                        {ailment.treatmentPlanCount} plan{ailment.treatmentPlanCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {ailment.latestPainLog ? (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-warm-500">Latest pain:</span>
                        <PainLevelIndicator level={ailment.latestPainLog.painLevel} />
                      </div>
                      <span className="text-xs text-warm-400">
                        {ailment.latestPainLog.date}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-warm-400">No pain logs recorded</p>
                  )}

                  <div className="mt-2 flex gap-2">
                    <Link
                      href={`/conditions/${ailment.id}`}
                      className="inline-flex items-center rounded px-2 py-1 text-xs font-medium text-warm-600 bg-warm-100 hover:bg-warm-200 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href="/check-in"
                      className="inline-flex items-center rounded px-2 py-1 text-xs font-medium text-sage-600 bg-sage-50 hover:bg-sage-100 transition-colors"
                    >
                      Log pain
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={`/conditions/new?bodyRegion=${bodyRegion}`}
              className="mt-3 inline-block text-sm font-medium text-sage-600 hover:text-sage-700"
            >
              + Add ailment here
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function PainLevelIndicator({ level }: { level: number }) {
  const colour = getColourForPainLevel(level);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
      style={{ backgroundColor: colour.fill, color: "#1f2937" }}
    >
      {level}/10
    </span>
  );
}

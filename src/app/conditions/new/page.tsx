"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AilmentForm from "@/components/ailments/AilmentForm";
import type { BodyRegion } from "@prisma/client";

const VALID_REGIONS: string[] = [
  "HEAD", "NECK", "LEFT_SHOULDER", "RIGHT_SHOULDER", "UPPER_BACK",
  "LOWER_BACK", "CHEST", "LEFT_ARM", "RIGHT_ARM", "LEFT_HAND",
  "RIGHT_HAND", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_HIP", "RIGHT_HIP",
  "LEFT_KNEE", "RIGHT_KNEE", "LEFT_ANKLE", "RIGHT_ANKLE", "LEFT_FOOT",
  "RIGHT_FOOT",
];

function NewAilmentContent() {
  const searchParams = useSearchParams();
  const regionParam = searchParams.get("bodyRegion");

  // Pre-fill body region if coming from body map
  const initialData = regionParam && VALID_REGIONS.includes(regionParam)
    ? { bodyRegion: regionParam as BodyRegion }
    : undefined;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/conditions"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Ailments
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Add New Ailment
        </h1>
        {regionParam && VALID_REGIONS.includes(regionParam) && (
          <p className="mt-1 text-sm text-gray-600">
            Adding ailment for the selected body region.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <AilmentForm initialData={initialData} />
      </div>
    </div>
  );
}

export default function NewAilmentPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-gray-500">
          Loading...
        </div>
      }
    >
      <NewAilmentContent />
    </Suspense>
  );
}

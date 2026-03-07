"use client";

import type { PlanReviewResult, ExerciseReview } from "@/types";

interface AIReviewDisplayProps {
  result: PlanReviewResult;
  createdAt: string;
  /** Map of exercise IDs to names for display */
  exerciseNames: Record<string, string>;
}

const RATING_BADGE: Record<string, { className: string; label: string }> = {
  good: { className: "bg-green-100 text-green-800", label: "Good" },
  fair: { className: "bg-orange-100 text-orange-800", label: "Fair" },
  needs_improvement: { className: "bg-red-100 text-red-800", label: "Needs Improvement" },
};

const CONFIDENCE_BADGE: Record<string, { className: string; label: string }> = {
  low: { className: "bg-warm-100 text-warm-700", label: "Low confidence" },
  medium: { className: "bg-sage-100 text-sage-700", label: "Medium confidence" },
  high: { className: "bg-green-100 text-green-700", label: "High confidence" },
};

const EXERCISE_RATING_STYLE: Record<string, { border: string; bg: string; icon: string }> = {
  good: { border: "border-green-200", bg: "bg-green-50", icon: "text-green-600" },
  caution: { border: "border-orange-200", bg: "bg-orange-50", icon: "text-orange-600" },
  concern: { border: "border-red-200", bg: "bg-red-50", icon: "text-red-600" },
};

function ExerciseReviewCard({
  review,
  exerciseName,
}: {
  review: ExerciseReview;
  exerciseName: string;
}) {
  const style = EXERCISE_RATING_STYLE[review.rating] ?? EXERCISE_RATING_STYLE.good;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-3`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-warm-900">{exerciseName}</span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          review.rating === "good"
            ? "bg-green-200 text-green-800"
            : review.rating === "caution"
              ? "bg-orange-200 text-orange-800"
              : "bg-red-200 text-red-800"
        }`}>
          {review.rating}
        </span>
      </div>
      <p className="mt-1 text-sm text-warm-700">{review.feedback}</p>
      {review.suggestedAlternative && (
        <p className="mt-1.5 text-sm text-warm-600">
          <span className="font-medium">Alternative:</span> {review.suggestedAlternative}
        </p>
      )}
    </div>
  );
}

export default function AIReviewDisplay({
  result,
  createdAt,
  exerciseNames,
}: AIReviewDisplayProps) {
  const rating = RATING_BADGE[result.overallRating] ?? RATING_BADGE.fair;
  const confidence = CONFIDENCE_BADGE[result.confidenceLevel] ?? CONFIDENCE_BADGE.medium;
  const reviewDate = new Date(createdAt);
  const daysAgo = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeLabel = daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
        <div className="flex gap-2">
          <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">AI-generated suggestions — not medical advice.</span>{" "}
            Always consult your healthcare provider before making changes to your treatment plan.
          </p>
        </div>
      </div>

      {/* Header with badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${rating.className}`}>
            {rating.label}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${confidence.className}`}>
            {confidence.label}
          </span>
        </div>
        <span className="text-xs text-warm-400">
          Reviewed {timeLabel}
        </span>
      </div>

      {/* Overall assessment */}
      <div>
        <p className="text-sm text-warm-900">{result.overallAssessment}</p>
      </div>

      {/* Exercise reviews */}
      {result.exerciseReviews && result.exerciseReviews.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-warm-900 mb-2">Exercise Reviews</h3>
          <div className="space-y-2">
            {result.exerciseReviews.map((review) => (
              <ExerciseReviewCard
                key={review.exerciseId}
                review={review}
                exerciseName={exerciseNames[review.exerciseId] ?? "Unknown exercise"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cross-condition warnings */}
      {result.crossConditionWarnings && result.crossConditionWarnings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-warm-900 mb-2">Cross-Condition Warnings</h3>
          <ul className="space-y-1.5">
            {result.crossConditionWarnings.map((warning, i) => (
              <li key={i} className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                <span className="text-red-500 shrink-0">⚠</span>
                <span className="text-sm text-red-800">{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths & Concerns side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {result.strengths && result.strengths.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-warm-900 mb-1.5">Strengths</h3>
            <ul className="space-y-1">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-warm-700">
                  <span className="text-green-500 shrink-0">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.concerns && result.concerns.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-warm-900 mb-1.5">Concerns</h3>
            <ul className="space-y-1">
              {result.concerns.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-warm-700">
                  <span className="text-orange-500 shrink-0">-</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {result.suggestions && result.suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-warm-900 mb-1.5">Suggestions</h3>
          <ul className="space-y-1">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-warm-700">
                <span className="text-sage-500 shrink-0">*</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

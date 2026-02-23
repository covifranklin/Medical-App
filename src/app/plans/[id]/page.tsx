export default function PlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Plan Detail</h1>
      <p className="mt-2 text-gray-600">
        Plan {params.id} — exercises and AI review.
      </p>
      <div className="mt-8 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-gray-400">
        Plan detail + AI review — Phase 2
      </div>
    </div>
  );
}

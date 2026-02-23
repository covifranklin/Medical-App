export default function ConditionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Condition Detail</h1>
      <p className="mt-2 text-gray-600">
        Condition {params.id} — with linked treatment plans.
      </p>
      <div className="mt-8 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-gray-400">
        Condition detail + treatment plans — Phase 1 &amp; 2
      </div>
    </div>
  );
}

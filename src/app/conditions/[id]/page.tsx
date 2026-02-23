export default function AilmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Ailment Detail</h1>
      <p className="mt-2 text-gray-600">
        Ailment {params.id} — with linked treatment plans.
      </p>
      <div className="mt-8 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-gray-400">
        Ailment detail + treatment plans — Phase 1 &amp; 2
      </div>
    </div>
  );
}

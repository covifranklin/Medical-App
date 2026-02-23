import BodyMap from "@/components/body-map/BodyMap";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Body Map</h1>
        <p className="mt-1 text-sm text-gray-600">
          Click a body region to view ailments and latest pain levels.
        </p>
      </div>
      <BodyMap />
    </div>
  );
}

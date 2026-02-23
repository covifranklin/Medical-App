import Link from "next/link";
import BodyMap from "@/components/body-map/BodyMap";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Body Map</h1>
          <p className="mt-1 text-sm text-gray-600">
            Click a body region to view ailments and latest pain levels.
          </p>
        </div>
        <Link
          href="/check-in"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Daily Check-in
        </Link>
      </div>
      <BodyMap />
    </div>
  );
}

/** Reusable skeleton loading primitives */

function shimmer() {
  return "animate-pulse bg-gray-200 rounded";
}

export function SkeletonLine({
  width = "w-full",
  height = "h-4",
}: {
  width?: string;
  height?: string;
}) {
  return <div className={`${shimmer()} ${width} ${height}`} />;
}

export function SkeletonCircle({ size = "h-8 w-8" }: { size?: string }) {
  return <div className={`${shimmer()} ${size} rounded-full`} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <SkeletonLine width="w-2/3" height="h-4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} width={i % 2 === 0 ? "w-full" : "w-4/5"} height="h-3" />
      ))}
    </div>
  );
}

/** Body map skeleton: two side-by-side rectangles representing front/back views */
export function SkeletonBodyMap() {
  return (
    <div className="space-y-4">
      <SkeletonLine width="w-48" height="h-5" />
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <div className="flex flex-col items-center gap-2">
          <SkeletonLine width="w-12" height="h-3" />
          <div className={`${shimmer()} w-[150px] h-[300px] sm:w-[180px] sm:h-[400px] md:w-[200px] md:h-[450px] rounded-xl`} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <SkeletonLine width="w-12" height="h-3" />
          <div className={`${shimmer()} w-[150px] h-[300px] sm:w-[180px] sm:h-[400px] md:w-[200px] md:h-[450px] rounded-xl`} />
        </div>
      </div>
    </div>
  );
}

/** Ailment list skeleton: n cards in a column */
export function SkeletonAilmentList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <SkeletonLine width="w-1/3" height="h-4" />
              <SkeletonLine width="w-1/2" height="h-3" />
            </div>
            <div className="flex gap-1.5">
              <div className={`${shimmer()} w-14 h-5 rounded-full`} />
              <div className={`${shimmer()} w-14 h-5 rounded-full`} />
            </div>
          </div>
          <div className="mt-2 flex gap-4">
            <SkeletonLine width="w-20" height="h-3" />
            <SkeletonLine width="w-16" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dashboard summary skeleton: grid of cards */
export function SkeletonDashboardSummary() {
  return (
    <div className="mt-8 space-y-6">
      <div>
        <SkeletonLine width="w-32" height="h-3" />
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <SkeletonCircle size="h-2 w-2" />
                <SkeletonLine width="w-24" height="h-4" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonCircle size="h-8 w-8" />
                <SkeletonLine width="w-8" height="h-3" />
              </div>
              <SkeletonLine width="w-16" height="h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Check-in skeleton: region groups with sliders */
export function SkeletonCheckIn() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g}>
          <SkeletonLine width="w-24" height="h-3" />
          <div className="mt-2 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SkeletonLine width="w-28" height="h-4" />
                    <div className={`${shimmer()} w-14 h-5 rounded-full`} />
                  </div>
                  <SkeletonLine width="w-20" height="h-3" />
                </div>
                <div className="flex items-center gap-3">
                  <SkeletonLine width="w-full" height="h-2" />
                  <SkeletonCircle size="h-8 w-8" />
                  <SkeletonLine width="w-16" height="h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** History/charts skeleton: chart placeholders */
export function SkeletonCharts() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <SkeletonLine width="w-48" height="h-5" />
          <div className={`mt-3 rounded-lg border border-gray-200 bg-white p-4 ${shimmer()}`} style={{ height: i === 0 ? 220 : 200 }} />
        </div>
      ))}
    </div>
  );
}

/** Plan detail skeleton */
export function SkeletonPlanDetail() {
  return (
    <div className="space-y-6">
      <SkeletonLine width="w-32" height="h-3" />
      <div className="space-y-2">
        <SkeletonLine width="w-2/3" height="h-7" />
        <SkeletonLine width="w-1/2" height="h-4" />
      </div>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { SkeletonCharts } from "@/components/shared/Skeleton";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Types ──

interface AilmentInfo {
  id: string;
  name: string;
  bodyRegion: string;
  status: string;
}

interface AilmentTrend {
  ailmentId: string;
  ailmentName: string;
  bodyRegion: string;
  data: Array<{ date: string; painLevel: number }>;
}

interface OverallPainPoint {
  date: string;
  avgPain: number;
  count: number;
}

interface CompletionPoint {
  date: string;
  total: number;
  completed: number;
  rate: number;
  totalMinutes: number;
  minutesCompleted: number;
}

interface BeforeAfterPoint {
  date: string;
  avgBefore: number;
  avgAfter: number;
}

interface HeatmapRegion {
  region: string;
  avgPain: number;
  logCount: number;
  maxPain: number;
}

interface AnalyticsData {
  days: number;
  ailments: AilmentInfo[];
  ailmentPainTrends: AilmentTrend[];
  overallPainTrend: OverallPainPoint[];
  exerciseCompletionRate: CompletionPoint[];
  beforeAfterComparison: BeforeAfterPoint[];
  exerciseVsRest: {
    exerciseDays: { count: number; avgPain: number | null };
    restDays: { count: number; avgPain: number | null };
  };
  bodyMapHeatmap: HeatmapRegion[];
}

// ── Constants ──

const TIME_RANGES = [
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

const AILMENT_COLOURS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316",
];

const REGION_LABELS: Record<string, string> = {
  HEAD: "Head", NECK: "Neck", LEFT_SHOULDER: "L Shoulder",
  RIGHT_SHOULDER: "R Shoulder", UPPER_BACK: "Upper Back",
  LOWER_BACK: "Lower Back", CHEST: "Chest", LEFT_ARM: "L Arm",
  RIGHT_ARM: "R Arm", LEFT_HAND: "L Hand", RIGHT_HAND: "R Hand",
  LEFT_WRIST: "L Wrist", RIGHT_WRIST: "R Wrist",
  LEFT_HIP: "L Hip", RIGHT_HIP: "R Hip", LEFT_KNEE: "L Knee",
  RIGHT_KNEE: "R Knee", LEFT_ANKLE: "L Ankle",
  RIGHT_ANKLE: "R Ankle", LEFT_FOOT: "L Foot", RIGHT_FOOT: "R Foot",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ── Main Page ──

export default function HistoryPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAilment, setSelectedAilment] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div>
        <div className="flex items-start justify-between gap-2 md:gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-warm-900">History</h1>
            <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-warm-500">
              Pain trends, exercise tracking, and body insights.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <SkeletonCharts />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-warm-900">History</h1>
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error ?? "No data available."}
        </div>
      </div>
    );
  }

  // Build merged per-ailment data for the multi-line chart
  const ailmentTrend =
    selectedAilment === "all"
      ? data.ailmentPainTrends
      : data.ailmentPainTrends.filter((t) => t.ailmentId === selectedAilment);

  // Merge ailment data into a single array keyed by date
  const mergedAilmentData = mergeAilmentTrends(ailmentTrend);

  return (
    <div className="pb-4 md:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 md:gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-warm-900">History</h1>
          <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-warm-500">
            Pain trends, exercise tracking, and body insights.
          </p>
        </div>
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`rounded-xl px-3 py-2 md:py-1.5 text-xs md:text-sm font-medium ${
                days === r.value
                  ? "bg-sage-600 text-white"
                  : "bg-warm-100 text-warm-600 hover:bg-warm-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 1. Per-ailment pain trend ── */}
      <ErrorBoundary section="Pain Trends">
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold text-warm-900">
            Pain Trends by Condition
          </h2>
          <select
            value={selectedAilment}
            onChange={(e) => setSelectedAilment(e.target.value)}
            className="rounded-xl border border-warm-300 px-2 py-1 text-sm text-warm-700"
          >
            <option value="all">All conditions</option>
            {data.ailments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        {mergedAilmentData.length > 0 ? (
          <div className="rounded-2xl border border-warm-200 bg-white p-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mergedAilmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={30} />
                <Tooltip
                  labelFormatter={(v) => `Date: ${v}`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {ailmentTrend.map((t, i) => (
                  <Line
                    key={t.ailmentId}
                    type="monotone"
                    dataKey={t.ailmentName}
                    stroke={AILMENT_COLOURS[i % AILMENT_COLOURS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="No pain data logged yet." />
        )}
      </section>
      </ErrorBoundary>

      {/* ── 2. Overall pain score ── */}
      <ErrorBoundary section="Overall Pain">
      <section className="mt-8">
        <h2 className="text-base md:text-lg font-semibold text-warm-900 mb-3">
          Overall Pain Score
        </h2>
        {data.overallPainTrend.length > 0 ? (
          <div className="rounded-2xl border border-warm-200 bg-white p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.overallPainTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={30} />
                <Tooltip
                  labelFormatter={(v) => `Date: ${v}`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgPain"
                  name="Avg pain"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="No pain data logged yet." />
        )}
      </section>
      </ErrorBoundary>

      {/* ── 3. Exercise completion rate ── */}
      <ErrorBoundary section="Exercise Completion">
      <section className="mt-8">
        <h2 className="text-base md:text-lg font-semibold text-warm-900 mb-3">
          Exercise Completion Rate
        </h2>
        {data.exerciseCompletionRate.length > 0 ? (
          <div className="rounded-2xl border border-warm-200 bg-white p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.exerciseCompletionRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  width={35}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  labelFormatter={(v) => `Date: ${v}`}
                  formatter={(value) => [`${value}%`, "Completion"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="rate"
                  name="Completion %"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            {/* Summary stats */}
            <div className="mt-3 flex gap-6 text-sm text-warm-500">
              <span>
                Avg completion:{" "}
                <span className="font-medium text-warm-900">
                  {Math.round(
                    data.exerciseCompletionRate.reduce(
                      (s, d) => s + d.rate,
                      0
                    ) / data.exerciseCompletionRate.length
                  )}
                  %
                </span>
              </span>
              <span>
                Days exercised:{" "}
                <span className="font-medium text-warm-900">
                  {data.exerciseCompletionRate.length}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <EmptyChart message="No exercise plans generated yet." />
        )}
      </section>
      </ErrorBoundary>

      {/* ── 4. Before/after pain comparison ── */}
      <ErrorBoundary section="Before/After Comparison">
      <section className="mt-8">
        <h2 className="text-base md:text-lg font-semibold text-warm-900 mb-3">
          Pain: Before vs After Exercise
        </h2>
        {data.beforeAfterComparison.length > 0 ? (
          <div className="rounded-2xl border border-warm-200 bg-white p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.beforeAfterComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={30} />
                <Tooltip
                  labelFormatter={(v) => `Date: ${v}`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="avgBefore"
                  name="Before"
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="avgAfter"
                  name="After"
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Exercise days vs rest days summary */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-xs text-green-700">Exercise days</p>
                <p className="text-lg font-bold text-green-800">
                  {data.exerciseVsRest.exerciseDays.avgPain ?? "—"}
                </p>
                <p className="text-xs text-green-600">
                  avg pain ({data.exerciseVsRest.exerciseDays.count} days)
                </p>
              </div>
              <div className="rounded-xl bg-warm-50 border border-warm-200 p-3 text-center">
                <p className="text-xs text-warm-600">Rest days</p>
                <p className="text-lg font-bold text-warm-800">
                  {data.exerciseVsRest.restDays.avgPain ?? "—"}
                </p>
                <p className="text-xs text-warm-500">
                  avg pain ({data.exerciseVsRest.restDays.count} days)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <EmptyChart message="Complete a check-in before and after exercise to see comparisons." />
        )}
      </section>
      </ErrorBoundary>

      {/* ── 5. Body map heatmap ── */}
      <ErrorBoundary section="Body Heatmap">
      <section className="mt-8">
        <h2 className="text-base md:text-lg font-semibold text-warm-900 mb-3">
          Body Pain Heatmap
          <span className="ml-2 text-sm font-normal text-warm-500">
            (avg over {days} days)
          </span>
        </h2>
        {data.bodyMapHeatmap.length > 0 ? (
          <BodyHeatmap regions={data.bodyMapHeatmap} />
        ) : (
          <EmptyChart message="No pain data to show on the heatmap." />
        )}
      </section>
      </ErrorBoundary>
    </div>
  );
}

// ── Empty chart placeholder ──

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-warm-200 p-8 text-center text-sm text-warm-400">
      {message}
    </div>
  );
}

// ── Merge ailment trends into one date-keyed array ──

function mergeAilmentTrends(
  trends: AilmentTrend[]
): Array<Record<string, string | number | null>> {
  const dateMap = new Map<string, Record<string, string | number | null>>();

  for (const trend of trends) {
    for (const point of trend.data) {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { date: point.date });
      }
      dateMap.get(point.date)![trend.ailmentName] = point.painLevel;
    }
  }

  return Array.from(dateMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );
}

// ── Body heatmap component ──

function painToColour(avgPain: number): string {
  if (avgPain >= 7) return "#fca5a5"; // red-300
  if (avgPain >= 5) return "#fdba74"; // orange-300
  if (avgPain >= 3) return "#fde68a"; // amber-200
  if (avgPain >= 1) return "#bbf7d0"; // green-200
  return "#e5e7eb"; // gray-200
}

function painToTextColour(avgPain: number): string {
  if (avgPain >= 7) return "text-red-800";
  if (avgPain >= 5) return "text-orange-800";
  if (avgPain >= 3) return "text-amber-800";
  if (avgPain >= 1) return "text-green-800";
  return "text-warm-500";
}

function BodyHeatmap({ regions }: { regions: HeatmapRegion[] }) {
  // Sort by avg pain descending for the list
  const sorted = [...regions].sort((a, b) => b.avgPain - a.avgPain);

  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {sorted.map((r) => (
          <div
            key={r.region}
            className="rounded-2xl p-3 text-center"
            style={{ backgroundColor: painToColour(r.avgPain) }}
          >
            <p className={`text-xs font-medium ${painToTextColour(r.avgPain)}`}>
              {REGION_LABELS[r.region] ?? r.region}
            </p>
            <p className={`text-xl font-bold mt-1 ${painToTextColour(r.avgPain)}`}>
              {r.avgPain}
            </p>
            <p className={`text-[10px] mt-0.5 ${painToTextColour(r.avgPain)} opacity-70`}>
              avg · peak {r.maxPain} · {r.logCount} logs
            </p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-warm-500">
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#bbf7d0" }} />
          <span>Low (1-2)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#fde68a" }} />
          <span>Mild (3-4)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#fdba74" }} />
          <span>Moderate (5-6)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: "#fca5a5" }} />
          <span>Severe (7+)</span>
        </div>
      </div>
    </div>
  );
}

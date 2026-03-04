import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/user";

// GET /api/analytics?days=30
// Returns all data needed for the history/analytics page in one request
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const daysParam = request.nextUrl.searchParams.get("days");
    const days = Math.min(Math.max(Number(daysParam) || 30, 7), 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const todayDate = new Date();
    todayDate.setHours(23, 59, 59, 999);

    // Fetch all data in parallel
    const [ailments, painLogs, dailyPlans] = await Promise.all([
      // All non-resolved ailments
      prisma.ailment.findMany({
        where: { userId: user.id, status: { not: "RESOLVED" } },
        select: {
          id: true,
          name: true,
          bodyRegion: true,
          severityLevel: true,
          status: true,
          priorityLevel: true,
        },
        orderBy: { name: "asc" },
      }),

      // All pain logs in the date range (both pre and post exercise)
      prisma.painLog.findMany({
        where: {
          userId: user.id,
          date: { gte: startDate, lte: todayDate },
        },
        select: {
          id: true,
          ailmentId: true,
          painLevel: true,
          isPostExercise: true,
          date: true,
        },
        orderBy: { date: "asc" },
      }),

      // All daily plans with exercise completion data
      prisma.dailyPlan.findMany({
        where: {
          userId: user.id,
          date: { gte: startDate, lte: todayDate },
        },
        select: {
          id: true,
          date: true,
          totalMinutes: true,
          exercises: {
            select: {
              id: true,
              completed: true,
              estimatedMinutes: true,
              exercise: {
                select: { targetBodyRegion: true },
              },
            },
          },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    // ── 1. Per-ailment pain trend data ──
    const ailmentPainTrends: Record<
      string,
      { ailmentId: string; ailmentName: string; bodyRegion: string; data: Array<{ date: string; painLevel: number }> }
    > = {};

    for (const a of ailments) {
      ailmentPainTrends[a.id] = {
        ailmentId: a.id,
        ailmentName: a.name,
        bodyRegion: a.bodyRegion,
        data: [],
      };
    }

    for (const log of painLogs) {
      if (log.isPostExercise) continue; // Use pre-exercise logs for trend
      const dateStr = log.date.toISOString().split("T")[0];
      if (ailmentPainTrends[log.ailmentId]) {
        ailmentPainTrends[log.ailmentId].data.push({
          date: dateStr,
          painLevel: log.painLevel,
        });
      }
    }

    // ── 2. Overall pain score per day (average across all ailments) ──
    const dailyPainMap = new Map<string, number[]>();
    for (const log of painLogs) {
      if (log.isPostExercise) continue;
      const dateStr = log.date.toISOString().split("T")[0];
      if (!dailyPainMap.has(dateStr)) dailyPainMap.set(dateStr, []);
      dailyPainMap.get(dateStr)!.push(log.painLevel);
    }

    const overallPainTrend = Array.from(dailyPainMap.entries())
      .map(([date, levels]) => ({
        date,
        avgPain: Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10,
        count: levels.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── 3. Exercise completion rate per day ──
    const exerciseCompletionRate = dailyPlans.map((plan) => {
      const total = plan.exercises.length;
      const completed = plan.exercises.filter((e) => e.completed).length;
      const minutesCompleted = plan.exercises
        .filter((e) => e.completed)
        .reduce((sum, e) => sum + e.estimatedMinutes, 0);
      return {
        date: plan.date.toISOString().split("T")[0],
        total,
        completed,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        totalMinutes: plan.totalMinutes,
        minutesCompleted,
      };
    });

    // ── 4. Before/after pain comparison ──
    // Group by date: exercise days (have a DailyPlan) vs rest days
    const planDateSet = new Set(
      dailyPlans.map((p) => p.date.toISOString().split("T")[0])
    );

    const beforeAfterByDate = new Map<
      string,
      { preLevels: number[]; postLevels: number[] }
    >();

    for (const log of painLogs) {
      const dateStr = log.date.toISOString().split("T")[0];
      if (!planDateSet.has(dateStr)) continue; // Only exercise days
      if (!beforeAfterByDate.has(dateStr)) {
        beforeAfterByDate.set(dateStr, { preLevels: [], postLevels: [] });
      }
      const entry = beforeAfterByDate.get(dateStr)!;
      if (log.isPostExercise) {
        entry.postLevels.push(log.painLevel);
      } else {
        entry.preLevels.push(log.painLevel);
      }
    }

    const beforeAfterComparison = Array.from(beforeAfterByDate.entries())
      .filter(([, v]) => v.preLevels.length > 0 && v.postLevels.length > 0)
      .map(([date, v]) => ({
        date,
        avgBefore:
          Math.round(
            (v.preLevels.reduce((a, b) => a + b, 0) / v.preLevels.length) * 10
          ) / 10,
        avgAfter:
          Math.round(
            (v.postLevels.reduce((a, b) => a + b, 0) / v.postLevels.length) * 10
          ) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Also compute rest day vs exercise day averages
    const exerciseDayPain: number[] = [];
    const restDayPain: number[] = [];

    Array.from(dailyPainMap.entries()).forEach(([dateStr, levels]) => {
      const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
      if (planDateSet.has(dateStr)) {
        exerciseDayPain.push(avg);
      } else {
        restDayPain.push(avg);
      }
    });

    const exerciseVsRest = {
      exerciseDays: {
        count: exerciseDayPain.length,
        avgPain:
          exerciseDayPain.length > 0
            ? Math.round(
                (exerciseDayPain.reduce((a, b) => a + b, 0) /
                  exerciseDayPain.length) *
                  10
              ) / 10
            : null,
      },
      restDays: {
        count: restDayPain.length,
        avgPain:
          restDayPain.length > 0
            ? Math.round(
                (restDayPain.reduce((a, b) => a + b, 0) /
                  restDayPain.length) *
                  10
              ) / 10
            : null,
      },
    };

    // ── 5. Body map heatmap data ──
    // Average pain per body region over the selected period
    const regionPainMap = new Map<string, number[]>();
    for (const log of painLogs) {
      if (log.isPostExercise) continue;
      const ailment = ailments.find((a) => a.id === log.ailmentId);
      if (!ailment) continue;
      if (!regionPainMap.has(ailment.bodyRegion)) {
        regionPainMap.set(ailment.bodyRegion, []);
      }
      regionPainMap.get(ailment.bodyRegion)!.push(log.painLevel);
    }

    const bodyMapHeatmap = Array.from(regionPainMap.entries()).map(
      ([region, levels]) => ({
        region,
        avgPain:
          Math.round(
            (levels.reduce((a, b) => a + b, 0) / levels.length) * 10
          ) / 10,
        logCount: levels.length,
        maxPain: Math.max(...levels),
      })
    );

    return NextResponse.json({
      days,
      ailments: ailments.map((a) => ({
        id: a.id,
        name: a.name,
        bodyRegion: a.bodyRegion,
        status: a.status,
      })),
      ailmentPainTrends: Object.values(ailmentPainTrends).filter(
        (t) => t.data.length > 0
      ),
      overallPainTrend,
      exerciseCompletionRate,
      beforeAfterComparison,
      exerciseVsRest,
      bodyMapHeatmap,
    });
  } catch (error) {
    return handleApiError(error, "fetch analytics data");
  }
}

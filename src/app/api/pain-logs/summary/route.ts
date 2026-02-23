import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/pain-logs/summary
// Returns: { loggedToday, ailments: [{ id, name, bodyRegion, severityLevel, status, latestPainLevel, trend }] }
export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 7 days ago (for trend calculation)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get all non-resolved ailments
    const ailments = await prisma.ailment.findMany({
      where: { status: { not: "RESOLVED" } },
      include: {
        painLogs: {
          where: { date: { gte: weekAgo } },
          orderBy: { date: "desc" },
        },
      },
      orderBy: [{ severityLevel: "desc" }, { name: "asc" }],
    });

    let loggedToday = false;

    const result = ailments.map((ailment) => {
      const logs = ailment.painLogs;
      const todayLog = logs.find(
        (l) => l.date.toISOString().split("T")[0] === today.toISOString().split("T")[0]
      );

      if (todayLog) loggedToday = true;

      const latestPainLevel = logs.length > 0 ? logs[0].painLevel : null;

      // Trend: compare average of last 3 days vs previous 4 days
      let trend: "up" | "down" | "stable" | null = null;
      if (logs.length >= 2) {
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const recent = logs.filter((l) => l.date >= threeDaysAgo);
        const older = logs.filter((l) => l.date < threeDaysAgo);

        if (recent.length > 0 && older.length > 0) {
          const recentAvg =
            recent.reduce((sum, l) => sum + l.painLevel, 0) / recent.length;
          const olderAvg =
            older.reduce((sum, l) => sum + l.painLevel, 0) / older.length;

          const diff = recentAvg - olderAvg;
          if (diff > 0.5) trend = "up";
          else if (diff < -0.5) trend = "down";
          else trend = "stable";
        } else {
          trend = "stable";
        }
      }

      return {
        id: ailment.id,
        name: ailment.name,
        bodyRegion: ailment.bodyRegion,
        severityLevel: ailment.severityLevel,
        status: ailment.status,
        latestPainLevel,
        todayPainLevel: todayLog?.painLevel ?? null,
        trend,
        logCount7d: logs.length,
      };
    });

    return NextResponse.json({ loggedToday, ailments: result });
  } catch (error) {
    console.error("Failed to fetch pain log summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch pain log summary" },
      { status: 500 }
    );
  }
}

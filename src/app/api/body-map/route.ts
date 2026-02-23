import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import type { AilmentWithPain, RegionData } from "@/types";
import type { BodyRegion } from "@prisma/client";

// GET /api/body-map — fetch ailments grouped by body region for the authenticated user
export async function GET() {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const ailments = await prisma.ailment.findMany({
      where: {
        userId,
        status: { not: "RESOLVED" },
      },
      include: {
        painLogs: {
          orderBy: { date: "desc" },
          take: 1,
        },
        _count: {
          select: {
            treatmentPlans: { where: { isActive: true } },
          },
        },
      },
      orderBy: { severityLevel: "desc" },
    });

    // Group ailments by body region
    const regions: Record<string, RegionData> = {};

    for (const ailment of ailments) {
      const region = ailment.bodyRegion as BodyRegion;
      if (!regions[region]) {
        regions[region] = {
          bodyRegion: region,
          ailments: [],
        };
      }

      const latestLog = ailment.painLogs[0] ?? null;

      const ailmentWithPain: AilmentWithPain = {
        id: ailment.id,
        name: ailment.name,
        bodyRegion: ailment.bodyRegion,
        severityLevel: ailment.severityLevel,
        status: ailment.status,
        diagnosis: ailment.diagnosis,
        notes: ailment.notes,
        activePlanCount: ailment._count.treatmentPlans,
        latestPainLog: latestLog
          ? {
              painLevel: latestLog.painLevel,
              date: latestLog.date.toISOString().split("T")[0],
              notes: latestLog.notes,
            }
          : null,
      };

      regions[region].ailments.push(ailmentWithPain);
    }

    return NextResponse.json({ regions });
  } catch (error) {
    console.error("Failed to fetch body map data:", error);
    return NextResponse.json(
      { error: "Failed to fetch body map data" },
      { status: 500 }
    );
  }
}

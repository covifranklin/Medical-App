import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/user";
import type { AilmentWithPain, RegionData } from "@/types";
import type { BodyRegion } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/body-map — fetch current user's ailments grouped by body region
export async function GET() {
  try {
    const user = await getCurrentUser();

    const ailments = await prisma.ailment.findMany({
      where: {
        userId: user.id,
        status: { not: "RESOLVED" },
      },
      include: {
        painLogs: {
          orderBy: { date: "desc" },
          take: 1,
        },
        _count: {
          select: { treatmentPlans: true },
        },
      },
      orderBy: { severityLevel: "desc" },
    });

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
        treatmentPlanCount: ailment._count.treatmentPlans,
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
    return handleApiError(error, "fetch body map data");
  }
}

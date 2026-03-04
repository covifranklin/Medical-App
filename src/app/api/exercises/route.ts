import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/user";

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// GET /api/exercises — list exercises for the current user, optionally filtered by planId
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    const where: Record<string, unknown> = {
      treatmentPlan: { ailment: { userId: user.id } },
    };

    if (planId && isValidUUID(planId)) {
      where.treatmentPlanId = planId;
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(
      exercises.map((ex) => ({
        id: ex.id,
        treatmentPlanId: ex.treatmentPlanId,
        name: ex.name,
        description: ex.description,
        targetBodyRegion: ex.targetBodyRegion,
        contraindications: ex.contraindications,
        durationMinutes: ex.durationMinutes,
        sets: ex.sets,
        reps: ex.reps,
        holdSeconds: ex.holdSeconds,
        frequencyPerWeek: ex.frequencyPerWeek,
        videoUrl: ex.videoUrl,
        sortOrder: ex.sortOrder,
        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    return handleApiError(error, "fetch exercises");
  }
}

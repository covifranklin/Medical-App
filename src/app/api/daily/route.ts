import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";
import type { BodyRegion } from "@prisma/client";

function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const DAILY_PLAN_INCLUDE = {
  exercises: {
    orderBy: [{ orderIndex: "asc" as const }],
    include: {
      exercise: {
        include: {
          treatmentPlan: {
            select: {
              ailment: { select: { name: true } },
            },
          },
        },
      },
    },
  },
};

// GET /api/daily — get today's daily plan (if one exists)
export async function GET() {
  try {
    const user = await getCurrentUser();
    const today = getToday();

    const plan = await prisma.dailyPlan.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
      include: DAILY_PLAN_INCLUDE,
    });

    if (!plan) {
      return NextResponse.json({ plan: null });
    }

    return NextResponse.json({
      plan: {
        id: plan.id,
        date: plan.date.toISOString().split("T")[0],
        source: plan.source,
        totalMinutes: plan.totalMinutes,
        notes: plan.notes,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
        exercises: plan.exercises.map((dpe) => ({
          id: dpe.id,
          exerciseId: dpe.exerciseId,
          orderIndex: dpe.orderIndex,
          completed: dpe.completed,
          completedAt: dpe.completedAt?.toISOString() ?? null,
          estimatedMinutes: dpe.estimatedMinutes,
          reason: dpe.reason,
          exercise: {
            id: dpe.exercise.id,
            name: dpe.exercise.name,
            description: dpe.exercise.description,
            targetBodyRegion: dpe.exercise.targetBodyRegion as BodyRegion,
            sets: dpe.exercise.sets,
            reps: dpe.exercise.reps,
            holdSeconds: dpe.exercise.holdSeconds,
            durationMinutes: dpe.exercise.durationMinutes,
            contraindications: dpe.exercise.contraindications,
            ailmentName: dpe.exercise.treatmentPlan.ailment.name,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch daily plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily plan" },
      { status: 500 }
    );
  }
}

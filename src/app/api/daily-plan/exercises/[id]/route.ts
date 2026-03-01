import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";

// PATCH /api/daily-plan/exercises/[id] — toggle exercise completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    // Find the daily plan exercise and verify ownership
    const dpe = await prisma.dailyPlanExercise.findUnique({
      where: { id: params.id },
      include: { dailyPlan: { select: { userId: true } } },
    });

    if (!dpe || dpe.dailyPlan.userId !== user.id) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    // Toggle completion
    const nowCompleted = !dpe.completed;
    const updated = await prisma.dailyPlanExercise.update({
      where: { id: params.id },
      data: {
        completed: nowCompleted,
        completedAt: nowCompleted ? new Date() : null,
      },
    });

    return NextResponse.json({
      id: updated.id,
      completed: updated.completed,
      completedAt: updated.completedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Failed to toggle exercise completion:", error);
    return NextResponse.json(
      { error: "Failed to update exercise" },
      { status: 500 }
    );
  }
}

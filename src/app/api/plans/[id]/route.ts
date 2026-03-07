import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/user";
import type { ExerciseFrequency } from "@prisma/client";

export const dynamic = "force-dynamic";

const EXERCISE_FREQUENCIES: ExerciseFrequency[] = [
  "DAILY", "ALTERNATE_DAYS", "WEEKLY", "AS_NEEDED",
];

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// GET /api/plans/:id — fetch a single treatment plan (must belong to current user)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const user = await getCurrentUser();

    const plan = await prisma.treatmentPlan.findFirst({
      where: { id, ailment: { userId: user.id } },
      include: {
        ailment: {
          select: {
            id: true,
            name: true,
            bodyRegion: true,
            severityLevel: true,
            status: true,
          },
        },
        exercises: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: plan.id,
      ailmentId: plan.ailmentId,
      title: plan.title,
      prescribedBy: plan.prescribedBy,
      frequency: plan.frequency,
      startDate: plan.startDate.toISOString().split("T")[0],
      rawContent: plan.rawContent,
      aiReview: plan.aiReview,
      reviewedAt: plan.reviewedAt?.toISOString() ?? null,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      ailment: {
        id: plan.ailment.id,
        name: plan.ailment.name,
        bodyRegion: plan.ailment.bodyRegion,
        severityLevel: plan.ailment.severityLevel,
        status: plan.ailment.status,
      },
      exercises: plan.exercises.map((ex) => ({
        id: ex.id,
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
      })),
      latestReview: plan.reviews[0]
        ? {
            id: plan.reviews[0].id,
            result: plan.reviews[0].result,
            modelUsed: plan.reviews[0].modelUsed,
            createdAt: plan.reviews[0].createdAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error, "fetch treatment plan");
  }
}

// PUT /api/plans/:id — update a treatment plan (must belong to current user)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const user = await getCurrentUser();

    const existing = await prisma.treatmentPlan.findFirst({
      where: { id, ailment: { userId: user.id } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 });
    }

    const body = await request.json();
    const errors: string[] = [];

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        errors.push("Title cannot be empty.");
      } else if (body.title.trim().length > 300) {
        errors.push("Title must be 300 characters or fewer.");
      }
    }

    if (body.prescribedBy !== undefined && body.prescribedBy !== null) {
      if (typeof body.prescribedBy !== "string") {
        errors.push("prescribedBy must be a string.");
      } else if (body.prescribedBy.length > 200) {
        errors.push("prescribedBy must be 200 characters or fewer.");
      }
    }

    if (body.frequency !== undefined && !EXERCISE_FREQUENCIES.includes(body.frequency)) {
      errors.push(`frequency must be one of: ${EXERCISE_FREQUENCIES.join(", ")}`);
    }

    if (body.startDate !== undefined && body.startDate !== null) {
      const d = new Date(body.startDate);
      if (isNaN(d.getTime())) {
        errors.push("startDate must be a valid date.");
      }
    }

    if (body.rawContent !== undefined && body.rawContent !== null) {
      if (typeof body.rawContent !== "string") {
        errors.push("rawContent must be a string.");
      } else if (body.rawContent.length > 10000) {
        errors.push("rawContent must be 10000 characters or fewer.");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.prescribedBy !== undefined) data.prescribedBy = body.prescribedBy?.trim() || null;
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.startDate !== undefined) {
      data.startDate = body.startDate ? new Date(body.startDate) : new Date();
    }
    if (body.rawContent !== undefined) data.rawContent = body.rawContent?.trim() || null;

    const updated = await prisma.treatmentPlan.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      ailmentId: updated.ailmentId,
      title: updated.title,
      prescribedBy: updated.prescribedBy,
      frequency: updated.frequency,
      startDate: updated.startDate.toISOString().split("T")[0],
      rawContent: updated.rawContent,
      aiReview: updated.aiReview,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error, "update treatment plan");
  }
}

// DELETE /api/plans/:id — delete a treatment plan (must belong to current user)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const user = await getCurrentUser();

    const existing = await prisma.treatmentPlan.findFirst({
      where: { id, ailment: { userId: user.id } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 });
    }

    await prisma.treatmentPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "delete treatment plan");
  }
}

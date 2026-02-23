import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import type { ExerciseFrequency } from "@prisma/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FREQUENCIES: ExerciseFrequency[] = ["DAILY", "ALTERNATE_DAYS", "WEEKLY", "AS_NEEDED"];

/** Find a plan and verify it belongs to the authenticated user (via ailment ownership) */
async function findUserPlan(planId: string, userId: string) {
  return prisma.treatmentPlan.findFirst({
    where: {
      id: planId,
      ailment: { userId },
    },
  });
}

// GET /api/plans/:id — fetch a single plan with exercises
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const { id } = params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const plan = await prisma.treatmentPlan.findFirst({
      where: {
        id,
        ailment: { userId },
      },
      include: {
        ailment: {
          select: { id: true, name: true, bodyRegion: true },
        },
        exercises: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: plan.id,
      title: plan.title,
      prescribedBy: plan.prescribedBy,
      frequency: plan.frequency,
      isActive: plan.isActive,
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
        createdAt: ex.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}

// PUT /api/plans/:id — update a treatment plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const { id } = params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const existing = await findUserPlan(id, userId);
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const body = await request.json();
    const errors: string[] = [];

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        errors.push("Title cannot be empty.");
      } else if (body.title.trim().length > 200) {
        errors.push("Title must be 200 characters or fewer.");
      }
    }

    if (body.frequency !== undefined && !FREQUENCIES.includes(body.frequency)) {
      errors.push(`frequency must be one of: ${FREQUENCIES.join(", ")}`);
    }

    if (body.startDate !== undefined) {
      const d = new Date(body.startDate);
      if (isNaN(d.getTime())) {
        errors.push("startDate must be a valid date.");
      }
    }

    if (body.rawContent !== undefined && body.rawContent !== null) {
      if (typeof body.rawContent === "string" && body.rawContent.length > 20000) {
        errors.push("Plan content must be 20,000 characters or fewer.");
      }
    }

    if (body.prescribedBy !== undefined && body.prescribedBy !== null) {
      if (typeof body.prescribedBy === "string" && body.prescribedBy.length > 200) {
        errors.push("prescribedBy must be 200 characters or fewer.");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.rawContent !== undefined) data.rawContent = body.rawContent?.trim() || null;
    if (body.prescribedBy !== undefined) data.prescribedBy = body.prescribedBy?.trim() || null;
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate);

    const updated = await prisma.treatmentPlan.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update plan:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

// DELETE /api/plans/:id — delete a treatment plan
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const { id } = params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const existing = await findUserPlan(id, userId);
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    await prisma.treatmentPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete plan:", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}

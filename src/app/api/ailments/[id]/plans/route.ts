import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ExerciseFrequency } from "@prisma/client";

const EXERCISE_FREQUENCIES: ExerciseFrequency[] = [
  "DAILY", "ALTERNATE_DAYS", "WEEKLY", "AS_NEEDED",
];

// UUID v4 format check
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// GET /api/ailments/:id/plans — list all treatment plans for an ailment
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid ailment ID" }, { status: 400 });
    }

    const ailment = await prisma.ailment.findUnique({ where: { id } });
    if (!ailment) {
      return NextResponse.json({ error: "Ailment not found" }, { status: 404 });
    }

    const plans = await prisma.treatmentPlan.findMany({
      where: { ailmentId: id },
      include: {
        _count: {
          select: { exercises: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = plans.map((plan) => ({
      id: plan.id,
      ailmentId: plan.ailmentId,
      title: plan.title,
      prescribedBy: plan.prescribedBy,
      frequency: plan.frequency,
      startDate: plan.startDate.toISOString().split("T")[0],
      rawContent: plan.rawContent,
      aiReview: plan.aiReview,
      reviewedAt: plan.reviewedAt?.toISOString() ?? null,
      exerciseCount: plan._count.exercises,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch treatment plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch treatment plans" },
      { status: 500 }
    );
  }
}

// POST /api/ailments/:id/plans — create a treatment plan for an ailment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid ailment ID" }, { status: 400 });
    }

    const ailment = await prisma.ailment.findUnique({ where: { id } });
    if (!ailment) {
      return NextResponse.json({ error: "Ailment not found" }, { status: 404 });
    }

    const body = await request.json();
    const errors: string[] = [];

    // title — required
    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      errors.push("Title is required.");
    } else if (body.title.trim().length > 300) {
      errors.push("Title must be 300 characters or fewer.");
    }

    // prescribedBy — optional
    if (body.prescribedBy !== undefined && body.prescribedBy !== null) {
      if (typeof body.prescribedBy !== "string") {
        errors.push("prescribedBy must be a string.");
      } else if (body.prescribedBy.length > 200) {
        errors.push("prescribedBy must be 200 characters or fewer.");
      }
    }

    // frequency — optional, defaults to DAILY
    if (body.frequency !== undefined && !EXERCISE_FREQUENCIES.includes(body.frequency)) {
      errors.push(`frequency must be one of: ${EXERCISE_FREQUENCIES.join(", ")}`);
    }

    // startDate — optional, defaults to now
    if (body.startDate !== undefined && body.startDate !== null) {
      const d = new Date(body.startDate);
      if (isNaN(d.getTime())) {
        errors.push("startDate must be a valid date.");
      }
    }

    // rawContent — optional
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

    const plan = await prisma.treatmentPlan.create({
      data: {
        ailmentId: id,
        title: body.title.trim(),
        prescribedBy: body.prescribedBy?.trim() || null,
        frequency: (body.frequency as ExerciseFrequency) ?? "DAILY",
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        rawContent: body.rawContent?.trim() || null,
      },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create treatment plan:", error);
    return NextResponse.json(
      { error: "Failed to create treatment plan" },
      { status: 500 }
    );
  }
}

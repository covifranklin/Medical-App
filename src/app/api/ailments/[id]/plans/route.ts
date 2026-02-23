import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import type { ExerciseFrequency } from "@prisma/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FREQUENCIES: ExerciseFrequency[] = ["DAILY", "ALTERNATE_DAYS", "WEEKLY", "AS_NEEDED"];

// GET /api/ailments/:id/plans — list treatment plans for an ailment
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const { id } = params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid ailment ID" }, { status: 400 });
    }

    // Verify ailment belongs to user
    const ailment = await prisma.ailment.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!ailment) {
      return NextResponse.json({ error: "Ailment not found" }, { status: 404 });
    }

    const plans = await prisma.treatmentPlan.findMany({
      where: { ailmentId: id },
      include: {
        _count: { select: { exercises: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    const result = plans.map((p) => ({
      id: p.id,
      title: p.title,
      prescribedBy: p.prescribedBy,
      frequency: p.frequency,
      isActive: p.isActive,
      startDate: p.startDate.toISOString().split("T")[0],
      exerciseCount: p._count.exercises,
      hasAiReview: p.aiReview !== null,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

interface CreatePlanBody {
  title?: string;
  rawContent?: string;
  prescribedBy?: string;
  frequency?: string;
  startDate?: string;
  isActive?: boolean;
}

// POST /api/ailments/:id/plans — create a treatment plan for an ailment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const { id } = params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid ailment ID" }, { status: 400 });
    }

    // Verify ailment belongs to user
    const ailment = await prisma.ailment.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!ailment) {
      return NextResponse.json({ error: "Ailment not found" }, { status: 404 });
    }

    const body: CreatePlanBody = await request.json();
    const errors: string[] = [];

    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      errors.push("Title is required.");
    } else if (body.title.trim().length > 200) {
      errors.push("Title must be 200 characters or fewer.");
    }

    if (body.frequency && !FREQUENCIES.includes(body.frequency as ExerciseFrequency)) {
      errors.push(`frequency must be one of: ${FREQUENCIES.join(", ")}`);
    }

    if (body.startDate) {
      const d = new Date(body.startDate);
      if (isNaN(d.getTime())) {
        errors.push("startDate must be a valid date.");
      }
    }

    if (body.rawContent && typeof body.rawContent === "string" && body.rawContent.length > 20000) {
      errors.push("Plan content must be 20,000 characters or fewer.");
    }

    if (body.prescribedBy && typeof body.prescribedBy === "string" && body.prescribedBy.length > 200) {
      errors.push("prescribedBy must be 200 characters or fewer.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const plan = await prisma.treatmentPlan.create({
      data: {
        ailmentId: id,
        title: body.title!.trim(),
        rawContent: body.rawContent?.trim() || null,
        prescribedBy: body.prescribedBy?.trim() || null,
        frequency: (body.frequency as ExerciseFrequency) ?? "DAILY",
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Failed to create plan:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

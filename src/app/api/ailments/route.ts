import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/user";
import type { BodyRegion, SeverityLevel, AilmentStatus, PriorityLevel, GoalTimeframe } from "@prisma/client";

const BODY_REGIONS: BodyRegion[] = [
  "HEAD", "NECK", "LEFT_SHOULDER", "RIGHT_SHOULDER", "UPPER_BACK",
  "LOWER_BACK", "CHEST", "LEFT_ARM", "RIGHT_ARM", "LEFT_HAND",
  "RIGHT_HAND", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_HIP", "RIGHT_HIP",
  "LEFT_KNEE", "RIGHT_KNEE", "LEFT_ANKLE", "RIGHT_ANKLE", "LEFT_FOOT",
  "RIGHT_FOOT",
];

const SEVERITY_LEVELS: SeverityLevel[] = ["MILD", "MODERATE", "SEVERE", "CRITICAL"];
const AILMENT_STATUSES: AilmentStatus[] = ["ACTIVE", "MANAGED", "RESOLVED"];
const PRIORITY_LEVELS: PriorityLevel[] = ["HIGH", "MEDIUM", "LOW"];
const GOAL_TIMEFRAMES: GoalTimeframe[] = ["ACUTE_RELIEF", "THIS_WEEK", "THIS_MONTH", "MAINTENANCE"];

interface CreateAilmentBody {
  name?: string;
  bodyRegion?: string;
  severityLevel?: string;
  status?: string;
  priorityLevel?: string;
  goalTimeframe?: string;
  diagnosis?: string;
  dateDiagnosed?: string;
  notes?: string;
}

function validateAilmentInput(body: CreateAilmentBody) {
  const errors: string[] = [];

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("Name is required.");
  } else if (body.name.trim().length > 200) {
    errors.push("Name must be 200 characters or fewer.");
  }

  if (!body.bodyRegion || !BODY_REGIONS.includes(body.bodyRegion as BodyRegion)) {
    errors.push(`bodyRegion must be one of: ${BODY_REGIONS.join(", ")}`);
  }

  if (body.severityLevel && !SEVERITY_LEVELS.includes(body.severityLevel as SeverityLevel)) {
    errors.push(`severityLevel must be one of: ${SEVERITY_LEVELS.join(", ")}`);
  }

  if (body.status && !AILMENT_STATUSES.includes(body.status as AilmentStatus)) {
    errors.push(`status must be one of: ${AILMENT_STATUSES.join(", ")}`);
  }

  if (body.priorityLevel && !PRIORITY_LEVELS.includes(body.priorityLevel as PriorityLevel)) {
    errors.push(`priorityLevel must be one of: ${PRIORITY_LEVELS.join(", ")}`);
  }

  if (body.goalTimeframe && !GOAL_TIMEFRAMES.includes(body.goalTimeframe as GoalTimeframe)) {
    errors.push(`goalTimeframe must be one of: ${GOAL_TIMEFRAMES.join(", ")}`);
  }

  if (body.diagnosis && typeof body.diagnosis === "string" && body.diagnosis.length > 1000) {
    errors.push("Diagnosis must be 1000 characters or fewer.");
  }

  if (body.notes && typeof body.notes === "string" && body.notes.length > 2000) {
    errors.push("Notes must be 2000 characters or fewer.");
  }

  if (body.dateDiagnosed) {
    const d = new Date(body.dateDiagnosed);
    if (isNaN(d.getTime())) {
      errors.push("dateDiagnosed must be a valid date.");
    }
  }

  return errors;
}

// GET /api/ailments — list current user's ailments with latest pain log
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const bodyRegion = searchParams.get("bodyRegion");

    const where: Record<string, unknown> = { userId: user.id };
    if (status && AILMENT_STATUSES.includes(status as AilmentStatus)) {
      where.status = status;
    }
    if (bodyRegion && BODY_REGIONS.includes(bodyRegion as BodyRegion)) {
      where.bodyRegion = bodyRegion;
    }

    const ailments = await prisma.ailment.findMany({
      where,
      include: {
        painLogs: {
          orderBy: { date: "desc" },
          take: 1,
        },
        _count: {
          select: { treatmentPlans: true },
        },
      },
      orderBy: [{ status: "asc" }, { severityLevel: "desc" }, { updatedAt: "desc" }],
    });

    const result = ailments.map((a) => ({
      id: a.id,
      name: a.name,
      bodyRegion: a.bodyRegion,
      severityLevel: a.severityLevel,
      status: a.status,
      diagnosis: a.diagnosis,
      dateDiagnosed: a.dateDiagnosed?.toISOString().split("T")[0] ?? null,
      notes: a.notes,
      priorityLevel: a.priorityLevel,
      goalTimeframe: a.goalTimeframe,
      treatmentPlanCount: a._count.treatmentPlans,
      latestPainLog: a.painLogs[0]
        ? {
            painLevel: a.painLogs[0].painLevel,
            date: a.painLogs[0].date.toISOString().split("T")[0],
          }
        : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "fetch ailments");
  }
}

// POST /api/ailments — create a new ailment for current user
export async function POST(request: NextRequest) {
  try {
    const body: CreateAilmentBody = await request.json();
    const errors = validateAilmentInput(body);

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const user = await getCurrentUser();

    const ailment = await prisma.ailment.create({
      data: {
        userId: user.id,
        name: body.name!.trim(),
        bodyRegion: body.bodyRegion as BodyRegion,
        severityLevel: (body.severityLevel as SeverityLevel) ?? "MODERATE",
        status: (body.status as AilmentStatus) ?? "ACTIVE",
        priorityLevel: (body.priorityLevel as PriorityLevel) ?? "MEDIUM",
        goalTimeframe: (body.goalTimeframe as GoalTimeframe) ?? "THIS_MONTH",
        diagnosis: body.diagnosis?.trim() || null,
        dateDiagnosed: body.dateDiagnosed ? new Date(body.dateDiagnosed) : null,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json(ailment, { status: 201 });
  } catch (error) {
    return handleApiError(error, "create ailment");
  }
}

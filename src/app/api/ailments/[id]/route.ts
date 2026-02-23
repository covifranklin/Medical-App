import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import type { BodyRegion, SeverityLevel, AilmentStatus } from "@prisma/client";

const BODY_REGIONS: BodyRegion[] = [
  "HEAD", "NECK", "LEFT_SHOULDER", "RIGHT_SHOULDER", "UPPER_BACK",
  "LOWER_BACK", "CHEST", "LEFT_ARM", "RIGHT_ARM", "LEFT_HAND",
  "RIGHT_HAND", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_HIP", "RIGHT_HIP",
  "LEFT_KNEE", "RIGHT_KNEE", "LEFT_ANKLE", "RIGHT_ANKLE", "LEFT_FOOT",
  "RIGHT_FOOT",
];

const SEVERITY_LEVELS: SeverityLevel[] = ["MILD", "MODERATE", "SEVERE", "CRITICAL"];
const AILMENT_STATUSES: AilmentStatus[] = ["ACTIVE", "MANAGED", "RESOLVED"];

// UUID v4 format check
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// GET /api/ailments/:id — fetch a single ailment (scoped to user)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid ailment ID" }, { status: 400 });
    }

    const ailment = await prisma.ailment.findFirst({
      where: { id, userId },
      include: {
        painLogs: {
          orderBy: { date: "desc" },
          take: 10,
        },
        treatmentPlans: {
          orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            prescribedBy: true,
            frequency: true,
            isActive: true,
            startDate: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ailment) {
      return NextResponse.json({ error: "Ailment not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: ailment.id,
      name: ailment.name,
      bodyRegion: ailment.bodyRegion,
      severityLevel: ailment.severityLevel,
      status: ailment.status,
      diagnosis: ailment.diagnosis,
      dateDiagnosed: ailment.dateDiagnosed?.toISOString().split("T")[0] ?? null,
      notes: ailment.notes,
      createdAt: ailment.createdAt.toISOString(),
      updatedAt: ailment.updatedAt.toISOString(),
      painLogs: ailment.painLogs.map((log) => ({
        id: log.id,
        painLevel: log.painLevel,
        date: log.date.toISOString().split("T")[0],
        notes: log.notes,
      })),
      treatmentPlans: ailment.treatmentPlans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        prescribedBy: plan.prescribedBy,
        frequency: plan.frequency,
        isActive: plan.isActive,
        startDate: plan.startDate.toISOString().split("T")[0],
        createdAt: plan.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch ailment:", error);
    return NextResponse.json(
      { error: "Failed to fetch ailment" },
      { status: 500 }
    );
  }
}

// PUT /api/ailments/:id — update an ailment (scoped to user)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid ailment ID" }, { status: 400 });
    }

    const existing = await prisma.ailment.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Ailment not found" }, { status: 404 });
    }

    const body = await request.json();
    const errors: string[] = [];

    // Validate only provided fields
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        errors.push("Name cannot be empty.");
      } else if (body.name.trim().length > 200) {
        errors.push("Name must be 200 characters or fewer.");
      }
    }

    if (body.bodyRegion !== undefined && !BODY_REGIONS.includes(body.bodyRegion)) {
      errors.push(`bodyRegion must be one of: ${BODY_REGIONS.join(", ")}`);
    }

    if (body.severityLevel !== undefined && !SEVERITY_LEVELS.includes(body.severityLevel)) {
      errors.push(`severityLevel must be one of: ${SEVERITY_LEVELS.join(", ")}`);
    }

    if (body.status !== undefined && !AILMENT_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${AILMENT_STATUSES.join(", ")}`);
    }

    if (body.diagnosis !== undefined && body.diagnosis !== null) {
      if (typeof body.diagnosis === "string" && body.diagnosis.length > 1000) {
        errors.push("Diagnosis must be 1000 characters or fewer.");
      }
    }

    if (body.notes !== undefined && body.notes !== null) {
      if (typeof body.notes === "string" && body.notes.length > 2000) {
        errors.push("Notes must be 2000 characters or fewer.");
      }
    }

    if (body.dateDiagnosed !== undefined && body.dateDiagnosed !== null) {
      const d = new Date(body.dateDiagnosed);
      if (isNaN(d.getTime())) {
        errors.push("dateDiagnosed must be a valid date.");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Build update data from provided fields only
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.bodyRegion !== undefined) data.bodyRegion = body.bodyRegion;
    if (body.severityLevel !== undefined) data.severityLevel = body.severityLevel;
    if (body.status !== undefined) data.status = body.status;
    if (body.diagnosis !== undefined) data.diagnosis = body.diagnosis?.trim() || null;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
    if (body.dateDiagnosed !== undefined) {
      data.dateDiagnosed = body.dateDiagnosed ? new Date(body.dateDiagnosed) : null;
    }

    const updated = await prisma.ailment.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update ailment:", error);
    return NextResponse.json(
      { error: "Failed to update ailment" },
      { status: 500 }
    );
  }
}

// DELETE /api/ailments/:id — delete an ailment (scoped to user)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    if (userId instanceof NextResponse) return userId;

    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid ailment ID" }, { status: 400 });
    }

    const existing = await prisma.ailment.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Ailment not found" }, { status: 404 });
    }

    await prisma.ailment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete ailment:", error);
    return NextResponse.json(
      { error: "Failed to delete ailment" },
      { status: 500 }
    );
  }
}

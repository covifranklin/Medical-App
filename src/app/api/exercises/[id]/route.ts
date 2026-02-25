import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { BodyRegion } from "@prisma/client";

const BODY_REGIONS: BodyRegion[] = [
  "HEAD", "NECK", "LEFT_SHOULDER", "RIGHT_SHOULDER", "UPPER_BACK",
  "LOWER_BACK", "CHEST", "LEFT_ARM", "RIGHT_ARM", "LEFT_HAND",
  "RIGHT_HAND", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_HIP", "RIGHT_HIP",
  "LEFT_KNEE", "RIGHT_KNEE", "LEFT_ANKLE", "RIGHT_ANKLE", "LEFT_FOOT",
  "RIGHT_FOOT",
];

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// GET /api/exercises/:id — fetch a single exercise
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid exercise ID" }, { status: 400 });
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: exercise.id,
      treatmentPlanId: exercise.treatmentPlanId,
      name: exercise.name,
      description: exercise.description,
      targetBodyRegion: exercise.targetBodyRegion,
      contraindications: exercise.contraindications,
      durationMinutes: exercise.durationMinutes,
      sets: exercise.sets,
      reps: exercise.reps,
      holdSeconds: exercise.holdSeconds,
      frequencyPerWeek: exercise.frequencyPerWeek,
      videoUrl: exercise.videoUrl,
      sortOrder: exercise.sortOrder,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch exercise:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise" },
      { status: 500 }
    );
  }
}

// PUT /api/exercises/:id — update an exercise (partial)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid exercise ID" }, { status: 400 });
    }

    const existing = await prisma.exercise.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    const body = await request.json();
    const errors: string[] = [];

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        errors.push("Name cannot be empty.");
      } else if (body.name.trim().length > 300) {
        errors.push("Name must be 300 characters or fewer.");
      }
    }

    if (body.targetBodyRegion !== undefined && !BODY_REGIONS.includes(body.targetBodyRegion)) {
      errors.push(`targetBodyRegion must be one of: ${BODY_REGIONS.join(", ")}`);
    }

    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== "string") {
        errors.push("description must be a string.");
      } else if (body.description.length > 2000) {
        errors.push("description must be 2000 characters or fewer.");
      }
    }

    if (body.contraindications !== undefined && body.contraindications !== null) {
      if (typeof body.contraindications !== "string") {
        errors.push("contraindications must be a string.");
      } else if (body.contraindications.length > 1000) {
        errors.push("contraindications must be 1000 characters or fewer.");
      }
    }

    if (body.durationMinutes !== undefined && body.durationMinutes !== null) {
      const dur = Number(body.durationMinutes);
      if (!Number.isInteger(dur) || dur < 0 || dur > 600) {
        errors.push("durationMinutes must be an integer between 0 and 600.");
      }
    }

    if (body.sets !== undefined && body.sets !== null) {
      const s = Number(body.sets);
      if (!Number.isInteger(s) || s < 0 || s > 100) {
        errors.push("sets must be an integer between 0 and 100.");
      }
    }

    if (body.reps !== undefined && body.reps !== null) {
      const r = Number(body.reps);
      if (!Number.isInteger(r) || r < 0 || r > 1000) {
        errors.push("reps must be an integer between 0 and 1000.");
      }
    }

    if (body.holdSeconds !== undefined && body.holdSeconds !== null) {
      const h = Number(body.holdSeconds);
      if (!Number.isInteger(h) || h < 0 || h > 3600) {
        errors.push("holdSeconds must be an integer between 0 and 3600.");
      }
    }

    if (body.frequencyPerWeek !== undefined && body.frequencyPerWeek !== null) {
      const f = Number(body.frequencyPerWeek);
      if (!Number.isInteger(f) || f < 0 || f > 21) {
        errors.push("frequencyPerWeek must be an integer between 0 and 21.");
      }
    }

    if (body.videoUrl !== undefined && body.videoUrl !== null) {
      if (typeof body.videoUrl !== "string") {
        errors.push("videoUrl must be a string.");
      } else if (body.videoUrl.length > 500) {
        errors.push("videoUrl must be 500 characters or fewer.");
      }
    }

    if (body.sortOrder !== undefined && body.sortOrder !== null) {
      const so = Number(body.sortOrder);
      if (!Number.isInteger(so) || so < 0) {
        errors.push("sortOrder must be a non-negative integer.");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Build update data from provided fields only
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.targetBodyRegion !== undefined) data.targetBodyRegion = body.targetBodyRegion;
    if (body.contraindications !== undefined) data.contraindications = body.contraindications?.trim() || null;
    if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes != null ? Number(body.durationMinutes) : 5;
    if (body.sets !== undefined) data.sets = body.sets != null ? Number(body.sets) : null;
    if (body.reps !== undefined) data.reps = body.reps != null ? Number(body.reps) : null;
    if (body.holdSeconds !== undefined) data.holdSeconds = body.holdSeconds != null ? Number(body.holdSeconds) : null;
    if (body.frequencyPerWeek !== undefined) data.frequencyPerWeek = body.frequencyPerWeek != null ? Number(body.frequencyPerWeek) : null;
    if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl?.trim() || null;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

    const updated = await prisma.exercise.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      treatmentPlanId: updated.treatmentPlanId,
      name: updated.name,
      description: updated.description,
      targetBodyRegion: updated.targetBodyRegion,
      contraindications: updated.contraindications,
      durationMinutes: updated.durationMinutes,
      sets: updated.sets,
      reps: updated.reps,
      holdSeconds: updated.holdSeconds,
      frequencyPerWeek: updated.frequencyPerWeek,
      videoUrl: updated.videoUrl,
      sortOrder: updated.sortOrder,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update exercise:", error);
    return NextResponse.json(
      { error: "Failed to update exercise" },
      { status: 500 }
    );
  }
}

// DELETE /api/exercises/:id — delete an exercise
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid exercise ID" }, { status: 400 });
    }

    const existing = await prisma.exercise.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    await prisma.exercise.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete exercise:", error);
    return NextResponse.json(
      { error: "Failed to delete exercise" },
      { status: 500 }
    );
  }
}

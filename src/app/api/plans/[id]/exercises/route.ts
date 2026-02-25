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

function serializeExercise(ex: {
  id: string;
  name: string;
  description: string | null;
  targetBodyRegion: BodyRegion;
  contraindications: string | null;
  durationMinutes: number;
  sets: number | null;
  reps: number | null;
  holdSeconds: number | null;
  frequencyPerWeek: number | null;
  videoUrl: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
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
  };
}

// GET /api/plans/:planId/exercises — list exercises for a plan
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;
    if (!isValidUUID(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: planId },
      select: { id: true },
    });
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 });
    }

    const exercises = await prisma.exercise.findMany({
      where: { treatmentPlanId: planId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(exercises.map(serializeExercise));
  } catch (error) {
    console.error("Failed to fetch exercises:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}

// POST /api/plans/:planId/exercises — create an exercise within a plan
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;
    if (!isValidUUID(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: planId },
      select: { id: true },
    });
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 });
    }

    const body = await request.json();
    const errors: string[] = [];

    // name — required
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      errors.push("Name is required.");
    } else if (body.name.trim().length > 300) {
      errors.push("Name must be 300 characters or fewer.");
    }

    // targetBodyRegion — required
    if (!body.targetBodyRegion || !BODY_REGIONS.includes(body.targetBodyRegion)) {
      errors.push(`targetBodyRegion must be one of: ${BODY_REGIONS.join(", ")}`);
    }

    // description — optional string
    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== "string") {
        errors.push("description must be a string.");
      } else if (body.description.length > 2000) {
        errors.push("description must be 2000 characters or fewer.");
      }
    }

    // contraindications — optional string
    if (body.contraindications !== undefined && body.contraindications !== null) {
      if (typeof body.contraindications !== "string") {
        errors.push("contraindications must be a string.");
      } else if (body.contraindications.length > 1000) {
        errors.push("contraindications must be 1000 characters or fewer.");
      }
    }

    // durationMinutes — optional int, default 5
    if (body.durationMinutes !== undefined && body.durationMinutes !== null) {
      const dur = Number(body.durationMinutes);
      if (!Number.isInteger(dur) || dur < 0 || dur > 600) {
        errors.push("durationMinutes must be an integer between 0 and 600.");
      }
    }

    // sets — optional int
    if (body.sets !== undefined && body.sets !== null) {
      const s = Number(body.sets);
      if (!Number.isInteger(s) || s < 0 || s > 100) {
        errors.push("sets must be an integer between 0 and 100.");
      }
    }

    // reps — optional int
    if (body.reps !== undefined && body.reps !== null) {
      const r = Number(body.reps);
      if (!Number.isInteger(r) || r < 0 || r > 1000) {
        errors.push("reps must be an integer between 0 and 1000.");
      }
    }

    // holdSeconds — optional int
    if (body.holdSeconds !== undefined && body.holdSeconds !== null) {
      const h = Number(body.holdSeconds);
      if (!Number.isInteger(h) || h < 0 || h > 3600) {
        errors.push("holdSeconds must be an integer between 0 and 3600.");
      }
    }

    // frequencyPerWeek — optional int
    if (body.frequencyPerWeek !== undefined && body.frequencyPerWeek !== null) {
      const f = Number(body.frequencyPerWeek);
      if (!Number.isInteger(f) || f < 0 || f > 21) {
        errors.push("frequencyPerWeek must be an integer between 0 and 21.");
      }
    }

    // videoUrl — optional string
    if (body.videoUrl !== undefined && body.videoUrl !== null) {
      if (typeof body.videoUrl !== "string") {
        errors.push("videoUrl must be a string.");
      } else if (body.videoUrl.length > 500) {
        errors.push("videoUrl must be 500 characters or fewer.");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Determine next sortOrder
    const maxSort = await prisma.exercise.aggregate({
      where: { treatmentPlanId: planId },
      _max: { sortOrder: true },
    });
    const nextSort = (maxSort._max.sortOrder ?? -1) + 1;

    const exercise = await prisma.exercise.create({
      data: {
        treatmentPlanId: planId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        targetBodyRegion: body.targetBodyRegion as BodyRegion,
        contraindications: body.contraindications?.trim() || null,
        durationMinutes: body.durationMinutes != null ? Number(body.durationMinutes) : 5,
        sets: body.sets != null ? Number(body.sets) : null,
        reps: body.reps != null ? Number(body.reps) : null,
        holdSeconds: body.holdSeconds != null ? Number(body.holdSeconds) : null,
        frequencyPerWeek: body.frequencyPerWeek != null ? Number(body.frequencyPerWeek) : null,
        videoUrl: body.videoUrl?.trim() || null,
        sortOrder: nextSort,
      },
    });

    return NextResponse.json(serializeExercise(exercise), { status: 201 });
  } catch (error) {
    console.error("Failed to create exercise:", error);
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    );
  }
}

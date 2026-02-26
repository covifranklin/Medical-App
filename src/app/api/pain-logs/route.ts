import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";

// GET /api/pain-logs?date=2026-02-23&ailmentId=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = request.nextUrl;
    const date = searchParams.get("date");
    const ailmentId = searchParams.get("ailmentId");

    const where: Record<string, unknown> = { userId: user.id };

    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      where.date = d;
    }

    if (ailmentId) {
      where.ailmentId = ailmentId;
    }

    const logs = await prisma.painLog.findMany({
      where,
      include: {
        ailment: {
          select: { name: true, bodyRegion: true, severityLevel: true },
        },
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    const result = logs.map((log) => ({
      id: log.id,
      ailmentId: log.ailmentId,
      ailmentName: log.ailment.name,
      bodyRegion: log.ailment.bodyRegion,
      painLevel: log.painLevel,
      notes: log.notes,
      date: log.date.toISOString().split("T")[0],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch pain logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch pain logs" },
      { status: 500 }
    );
  }
}

interface PainLogEntry {
  ailmentId: string;
  painLevel: number;
  notes?: string | null;
  date?: string;
}

// POST /api/pain-logs — batch upsert pain logs for a day
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entries: PainLogEntry[] = body.entries;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { errors: ["entries must be a non-empty array."] },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!e.ailmentId || typeof e.ailmentId !== "string") {
        errors.push(`Entry ${i}: ailmentId is required.`);
      }
      if (
        typeof e.painLevel !== "number" ||
        !Number.isInteger(e.painLevel) ||
        e.painLevel < 1 ||
        e.painLevel > 10
      ) {
        errors.push(`Entry ${i}: painLevel must be an integer 1-10.`);
      }
      if (e.notes && typeof e.notes !== "string") {
        errors.push(`Entry ${i}: notes must be a string.`);
      }
      if (e.date) {
        const d = new Date(e.date);
        if (isNaN(d.getTime())) {
          errors.push(`Entry ${i}: invalid date.`);
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const user = await getCurrentUser();

    // Verify all ailment IDs belong to the current user
    const ailmentIds = Array.from(new Set(entries.map((e) => e.ailmentId)));
    const existingAilments = await prisma.ailment.findMany({
      where: { id: { in: ailmentIds }, userId: user.id },
      select: { id: true },
    });
    const existingIds = new Set(existingAilments.map((a) => a.id));
    const missingIds = ailmentIds.filter((id) => !existingIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { errors: [`Ailments not found: ${missingIds.join(", ")}`] },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      entries.map((e) => {
        const logDate = e.date ? new Date(e.date) : new Date();
        const dateOnly = new Date(
          logDate.getFullYear(),
          logDate.getMonth(),
          logDate.getDate()
        );

        return prisma.painLog.upsert({
          where: {
            userId_ailmentId_date: {
              userId: user.id,
              ailmentId: e.ailmentId,
              date: dateOnly,
            },
          },
          update: {
            painLevel: e.painLevel,
            notes: e.notes?.trim() || null,
          },
          create: {
            userId: user.id,
            ailmentId: e.ailmentId,
            painLevel: e.painLevel,
            notes: e.notes?.trim() || null,
            date: dateOnly,
          },
        });
      })
    );

    return NextResponse.json(
      { count: results.length, message: "Pain logs saved." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save pain logs:", error);
    return NextResponse.json(
      { error: "Failed to save pain logs" },
      { status: 500 }
    );
  }
}

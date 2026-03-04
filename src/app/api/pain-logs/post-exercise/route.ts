import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/user";

// POST /api/pain-logs/post-exercise — save post-exercise pain assessments
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { entries, dailyPlanId } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "entries array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate entries
    for (const entry of entries) {
      if (!entry.ailmentId || typeof entry.ailmentId !== "string") {
        return NextResponse.json(
          { error: "Each entry must have a valid ailmentId" },
          { status: 400 }
        );
      }
      if (
        typeof entry.painLevel !== "number" ||
        entry.painLevel < 1 ||
        entry.painLevel > 10 ||
        !Number.isInteger(entry.painLevel)
      ) {
        return NextResponse.json(
          { error: "painLevel must be an integer from 1 to 10" },
          { status: 400 }
        );
      }
    }

    // Verify all ailments belong to the current user
    const ailmentIds = entries.map((e: { ailmentId: string }) => e.ailmentId);
    const ownedAilments = await prisma.ailment.findMany({
      where: { id: { in: ailmentIds }, userId: user.id },
      select: { id: true },
    });
    const ownedIds = new Set(ownedAilments.map((a) => a.id));

    for (const id of ailmentIds) {
      if (!ownedIds.has(id)) {
        return NextResponse.json(
          { error: `Ailment ${id} not found or not owned` },
          { status: 403 }
        );
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const dateObj = new Date(today + "T00:00:00.000Z");

    // Upsert post-exercise pain logs
    const upserts = entries.map(
      (entry: { ailmentId: string; painLevel: number; notes?: string }) =>
        prisma.painLog.upsert({
          where: {
            userId_ailmentId_date_isPostExercise: {
              userId: user.id,
              ailmentId: entry.ailmentId,
              date: dateObj,
              isPostExercise: true,
            },
          },
          create: {
            userId: user.id,
            ailmentId: entry.ailmentId,
            painLevel: entry.painLevel,
            notes: entry.notes?.trim() || null,
            isPostExercise: true,
            date: dateObj,
          },
          update: {
            painLevel: entry.painLevel,
            notes: entry.notes?.trim() || null,
          },
        })
    );

    await prisma.$transaction(upserts);

    // Fetch before/after comparison for the response
    const preLogs = await prisma.painLog.findMany({
      where: {
        userId: user.id,
        ailmentId: { in: ailmentIds },
        date: dateObj,
        isPostExercise: false,
      },
      include: { ailment: { select: { name: true, bodyRegion: true } } },
    });

    const postLogs = await prisma.painLog.findMany({
      where: {
        userId: user.id,
        ailmentId: { in: ailmentIds },
        date: dateObj,
        isPostExercise: true,
      },
      include: { ailment: { select: { name: true, bodyRegion: true } } },
    });

    const comparison = ailmentIds.map((ailmentId: string) => {
      const pre = preLogs.find((l) => l.ailmentId === ailmentId);
      const post = postLogs.find((l) => l.ailmentId === ailmentId);
      return {
        ailmentId,
        ailmentName: post?.ailment.name ?? pre?.ailment.name ?? "Unknown",
        bodyRegion: post?.ailment.bodyRegion ?? pre?.ailment.bodyRegion ?? null,
        prePainLevel: pre?.painLevel ?? null,
        postPainLevel: post?.painLevel ?? null,
        change: pre && post ? post.painLevel - pre.painLevel : null,
      };
    });

    return NextResponse.json({
      count: entries.length,
      dailyPlanId: dailyPlanId ?? null,
      comparison,
      message: "Post-exercise pain logs saved.",
    });
  } catch (error) {
    return handleApiError(error, "save post-exercise pain logs");
  }
}

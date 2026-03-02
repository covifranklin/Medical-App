import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/user";
import type { BodyRegion } from "@prisma/client";

const BODY_REGIONS: BodyRegion[] = [
  "HEAD", "NECK", "LEFT_SHOULDER", "RIGHT_SHOULDER", "UPPER_BACK",
  "LOWER_BACK", "CHEST", "LEFT_ARM", "RIGHT_ARM", "LEFT_HAND",
  "RIGHT_HAND", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_HIP", "RIGHT_HIP",
  "LEFT_KNEE", "RIGHT_KNEE", "LEFT_ANKLE", "RIGHT_ANKLE", "LEFT_FOOT",
  "RIGHT_FOOT",
];

// GET /api/preferences — fetch current user's preferences (create defaults if none exist)
export async function GET() {
  try {
    const user = await getCurrentUser();

    let prefs = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!prefs) {
      prefs = await prisma.userPreferences.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json({
      id: prefs.id,
      dailyTimeBudgetMinutes: prefs.dailyTimeBudgetMinutes,
      weeklyFocusAreas: prefs.weeklyFocusAreas as BodyRegion[],
      createdAt: prefs.createdAt.toISOString(),
      updatedAt: prefs.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/preferences — update current user's preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const errors: string[] = [];

    if (body.dailyTimeBudgetMinutes !== undefined) {
      const mins = Number(body.dailyTimeBudgetMinutes);
      if (!Number.isInteger(mins) || mins < 5 || mins > 180) {
        errors.push("dailyTimeBudgetMinutes must be an integer between 5 and 180.");
      }
    }

    if (body.weeklyFocusAreas !== undefined) {
      if (!Array.isArray(body.weeklyFocusAreas)) {
        errors.push("weeklyFocusAreas must be an array of body regions.");
      } else {
        for (const area of body.weeklyFocusAreas) {
          if (!BODY_REGIONS.includes(area)) {
            errors.push(`Invalid focus area: ${area}. Must be one of: ${BODY_REGIONS.join(", ")}`);
            break;
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.dailyTimeBudgetMinutes !== undefined) {
      data.dailyTimeBudgetMinutes = Number(body.dailyTimeBudgetMinutes);
    }
    if (body.weeklyFocusAreas !== undefined) {
      data.weeklyFocusAreas = body.weeklyFocusAreas;
    }

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: data,
      create: {
        userId: user.id,
        ...data,
      },
    });

    return NextResponse.json({
      id: prefs.id,
      dailyTimeBudgetMinutes: prefs.dailyTimeBudgetMinutes,
      weeklyFocusAreas: prefs.weeklyFocusAreas as BodyRegion[],
      createdAt: prefs.createdAt.toISOString(),
      updatedAt: prefs.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

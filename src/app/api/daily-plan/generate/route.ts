import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/user";
import { anthropic } from "@/lib/ai";
import { checkDailyRateLimit } from "@/lib/rate-limit";
import {
  DAILY_PLAN_SYSTEM,
  buildDailyPlanPrompt,
} from "@/lib/prompts/daily-routine";
import type { DailyPlanContext } from "@/lib/prompts/daily-routine";
import type { GeneratedDailyPlan } from "@/types";
import type { BodyRegion } from "@prisma/client";

const MODEL_ID = "claude-sonnet-4-5-20241022";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const REGION_LABELS: Record<string, string> = {
  HEAD: "Head", NECK: "Neck", LEFT_SHOULDER: "Left Shoulder",
  RIGHT_SHOULDER: "Right Shoulder", UPPER_BACK: "Upper Back",
  LOWER_BACK: "Lower Back", CHEST: "Chest", LEFT_ARM: "Left Arm",
  RIGHT_ARM: "Right Arm", LEFT_HAND: "Left Hand", RIGHT_HAND: "Right Hand",
  LEFT_WRIST: "Left Wrist", RIGHT_WRIST: "Right Wrist",
  LEFT_HIP: "Left Hip", RIGHT_HIP: "Right Hip", LEFT_KNEE: "Left Knee",
  RIGHT_KNEE: "Right Knee", LEFT_ANKLE: "Left Ankle",
  RIGHT_ANKLE: "Right Ankle", LEFT_FOOT: "Left Foot", RIGHT_FOOT: "Right Foot",
};

function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function serializeDailyPlan(plan: {
  id: string;
  date: Date;
  source: string;
  totalMinutes: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  exercises: Array<{
    id: string;
    exerciseId: string;
    orderIndex: number;
    completed: boolean;
    completedAt: Date | null;
    estimatedMinutes: number;
    reason: string | null;
    exercise: {
      id: string;
      name: string;
      description: string | null;
      targetBodyRegion: BodyRegion;
      sets: number | null;
      reps: number | null;
      holdSeconds: number | null;
      durationMinutes: number;
      contraindications: string | null;
      treatmentPlan: {
        ailment: {
          name: string;
        };
      };
    };
  }>;
}) {
  return {
    id: plan.id,
    date: plan.date.toISOString().split("T")[0],
    source: plan.source,
    totalMinutes: plan.totalMinutes,
    notes: plan.notes,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    exercises: plan.exercises.map((dpe) => ({
      id: dpe.id,
      exerciseId: dpe.exerciseId,
      orderIndex: dpe.orderIndex,
      completed: dpe.completed,
      completedAt: dpe.completedAt?.toISOString() ?? null,
      estimatedMinutes: dpe.estimatedMinutes,
      reason: dpe.reason,
      exercise: {
        id: dpe.exercise.id,
        name: dpe.exercise.name,
        description: dpe.exercise.description,
        targetBodyRegion: dpe.exercise.targetBodyRegion,
        sets: dpe.exercise.sets,
        reps: dpe.exercise.reps,
        holdSeconds: dpe.exercise.holdSeconds,
        durationMinutes: dpe.exercise.durationMinutes,
        contraindications: dpe.exercise.contraindications,
        ailmentName: dpe.exercise.treatmentPlan.ailment.name,
      },
    })),
  };
}

const DAILY_PLAN_INCLUDE = {
  exercises: {
    orderBy: [{ orderIndex: "asc" as const }],
    include: {
      exercise: {
        include: {
          treatmentPlan: {
            select: {
              ailment: { select: { name: true } },
            },
          },
        },
      },
    },
  },
};

// POST /api/daily-plan/generate — generate (or return existing) daily plan
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const today = getToday();

    // Check for force regeneration flag
    let force = false;
    try {
      const body = await request.json();
      force = body.force === true;
    } catch {
      // Empty body is fine — default to non-force
    }

    // ── Return existing plan if one exists (unless force) ──
    if (!force) {
      const existingPlan = await prisma.dailyPlan.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
        include: DAILY_PLAN_INCLUDE,
      });

      if (existingPlan) {
        return NextResponse.json({
          plan: serializeDailyPlan(existingPlan),
          generated: false,
          message: "Returning existing plan for today.",
        });
      }
    }

    // Rate limit: 3 AI daily plan generations per day per user
    const rl = checkDailyRateLimit(user.id, "daily-plan-generate", 3);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Daily plan generation limit reached (3/day). Resets in ${Math.ceil(rl.resetInSeconds / 3600)} hours.` },
        { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } }
      );
    }

    // ── Gather all context data in parallel ──
    const [
      preferences,
      ailmentsWithPlans,
      todayPainLogs,
      weekPainLogs,
      recentDailyPlans,
    ] = await Promise.all([
      // User preferences
      prisma.userPreferences.findUnique({ where: { userId: user.id } }),

      // All non-resolved ailments with their active treatment plans and exercises
      prisma.ailment.findMany({
        where: { userId: user.id, status: { not: "RESOLVED" } },
        include: {
          treatmentPlans: {
            include: {
              exercises: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              },
            },
          },
        },
      }),

      // Today's pain logs
      prisma.painLog.findMany({
        where: { userId: user.id, date: today },
        include: { ailment: { select: { name: true } } },
      }),

      // Last 7 days of pain logs (for average calculation)
      (() => {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return prisma.painLog.findMany({
          where: {
            userId: user.id,
            date: { gte: weekAgo, lt: today },
          },
          include: { ailment: { select: { name: true } } },
        });
      })(),

      // Last 7 days of daily plans (for rotation context)
      (() => {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return prisma.dailyPlan.findMany({
          where: {
            userId: user.id,
            date: { gte: weekAgo, lt: today },
          },
          include: {
            exercises: {
              include: {
                exercise: {
                  select: {
                    name: true,
                    targetBodyRegion: true,
                  },
                },
              },
            },
          },
          orderBy: { date: "desc" },
        });
      })(),
    ]);

    const timeBudget = preferences?.dailyTimeBudgetMinutes ?? 30;
    const focusAreas = (preferences?.weeklyFocusAreas ?? []) as BodyRegion[];

    // ── Build pain averages per ailment ──
    const painByAilment: Record<string, number[]> = {};
    for (const log of weekPainLogs) {
      if (!painByAilment[log.ailmentId]) painByAilment[log.ailmentId] = [];
      painByAilment[log.ailmentId].push(log.painLevel);
    }

    const todayPainByAilment: Record<string, { painLevel: number; notes: string | null }> = {};
    for (const log of todayPainLogs) {
      todayPainByAilment[log.ailmentId] = {
        painLevel: log.painLevel,
        notes: log.notes,
      };
    }

    // ── Build ailment context ──
    const ailmentCtx: DailyPlanContext["ailments"] = ailmentsWithPlans.map(
      (a) => {
        const weekLogs = painByAilment[a.id] ?? [];
        const avg =
          weekLogs.length > 0
            ? weekLogs.reduce((s, v) => s + v, 0) / weekLogs.length
            : null;

        return {
          name: a.name,
          bodyRegion: REGION_LABELS[a.bodyRegion] ?? a.bodyRegion,
          severityLevel: a.severityLevel,
          priorityLevel: a.priorityLevel,
          goalTimeframe: a.goalTimeframe,
          todayPainLevel: todayPainByAilment[a.id]?.painLevel ?? null,
          avgPainLevel7d: avg,
        };
      }
    );

    // ── Build exercises context ──
    const exerciseCtx: DailyPlanContext["exercises"] = [];
    const exerciseIdSet = new Set<string>();

    for (const ailment of ailmentsWithPlans) {
      for (const plan of ailment.treatmentPlans) {
        for (const ex of plan.exercises) {
          if (exerciseIdSet.has(ex.id)) continue;
          exerciseIdSet.add(ex.id);

          exerciseCtx.push({
            id: ex.id,
            name: ex.name,
            description: ex.description,
            sets: ex.sets,
            reps: ex.reps,
            holdSeconds: ex.holdSeconds,
            durationMinutes: ex.durationMinutes,
            frequencyPerWeek: ex.frequencyPerWeek,
            bodyRegion:
              REGION_LABELS[ex.targetBodyRegion] ?? ex.targetBodyRegion,
            contraindications: ex.contraindications,
            ailmentName: ailment.name,
            planFrequency: plan.frequency,
          });
        }
      }
    }

    // ── Check we have exercises to work with ──
    if (exerciseCtx.length === 0) {
      return NextResponse.json(
        {
          error:
            "No exercises found. Add exercises to your treatment plans before generating a daily plan.",
        },
        { status: 400 }
      );
    }

    // ── Build recent history context ──
    const recentHistory: DailyPlanContext["recentHistory"] =
      recentDailyPlans.map((dp) => ({
        date: dp.date.toISOString().split("T")[0],
        exerciseNames: dp.exercises.map((e) => e.exercise.name),
        bodyRegionsWorked: Array.from(
          new Set(
            dp.exercises.map(
              (e) =>
                REGION_LABELS[e.exercise.targetBodyRegion] ??
                e.exercise.targetBodyRegion
            )
          )
        ),
      }));

    // ── Build today's pain logs context ──
    const todayPainCtx: DailyPlanContext["todayPainLogs"] = todayPainLogs.map(
      (l) => ({
        ailmentName: l.ailment.name,
        painLevel: l.painLevel,
        notes: l.notes,
      })
    );

    // ── Build the prompt ──
    const promptCtx: DailyPlanContext = {
      dayOfWeek: DAYS[today.getDay()],
      timeBudgetMinutes: timeBudget,
      weeklyFocusAreas: focusAreas.map(
        (r) => REGION_LABELS[r] ?? r
      ),
      ailments: ailmentCtx,
      exercises: exerciseCtx,
      recentHistory,
      todayPainLogs: todayPainCtx,
    };

    const userPrompt = buildDailyPlanPrompt(promptCtx);

    // ── Call Claude ──
    const message = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: 2048,
      system: DAILY_PLAN_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "AI returned no text response" },
        { status: 502 }
      );
    }

    // Strip code fences if present
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "");
    }

    let result: GeneratedDailyPlan;
    try {
      result = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse daily plan JSON:", jsonText);
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    // ── Validate exercise IDs exist ──
    const validExerciseIds = new Set(exerciseCtx.map((e) => e.id));
    const validExercises = result.exercises.filter((e) =>
      validExerciseIds.has(e.exerciseId)
    );

    // ── Delete existing plan if force regenerating ──
    if (force) {
      await prisma.dailyPlan.deleteMany({
        where: { userId: user.id, date: today },
      });
    }

    // ── Save the plan ──
    // Combine warmUp/coolDown into the notes field
    const notesText = [
      result.warmUp ? `**Warm-up (2-3 min):** ${result.warmUp}` : null,
      result.notes || null,
      result.coolDown ? `**Cool-down (2 min):** ${result.coolDown}` : null,
      result.skippedExercises.length > 0
        ? `**Deprioritised today:** ${result.skippedExercises
            .map(
              (s) =>
                `${s.exerciseName ?? "Exercise"} — ${s.reason}${s.suggestedReturn ? ` (returns: ${s.suggestedReturn})` : ""}`
            )
            .join("; ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const dailyPlan = await prisma.dailyPlan.create({
      data: {
        userId: user.id,
        date: today,
        source: "AI",
        totalMinutes: result.totalMinutes ?? timeBudget,
        notes: notesText || null,
        exercises: {
          create: validExercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            orderIndex: ex.order,
            estimatedMinutes: ex.estimatedMinutes ?? 5,
            reason: ex.reason ?? null,
          })),
        },
      },
      include: DAILY_PLAN_INCLUDE,
    });

    return NextResponse.json(
      {
        plan: serializeDailyPlan(dailyPlan),
        generated: true,
        aiResponse: result,
        message: force
          ? "Daily plan regenerated."
          : "Daily plan generated for today.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "generate daily plan");
  }
}

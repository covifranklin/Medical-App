import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ── User 1: Default User ───────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: "default@physiotracker.local" },
    update: {},
    create: {
      email: "default@physiotracker.local",
      name: "Default User",
      password: "not-set",
    },
  });
  console.log(`User 1: ${user.id} (${user.email})`);

  // ── User 2: Test User (for data isolation testing) ─────
  const user2 = await prisma.user.upsert({
    where: { email: "testuser@physiotracker.local" },
    update: {},
    create: {
      email: "testuser@physiotracker.local",
      name: "Test User",
      password: "not-set",
    },
  });
  console.log(`User 2: ${user2.id} (${user2.email})`);

  // ── User Preferences ────────────────────────────────────
  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      dailyTimeBudgetMinutes: 30,
      weeklyFocusAreas: ["LOWER_BACK", "RIGHT_KNEE"],
    },
  });
  console.log("  Default user preferences set (30min, focus: lower back + right knee)");

  // ── Ailments for User 1 ────────────────────────────────
  const ailments = [
    {
      name: "L4-L5 Disc Herniation",
      bodyRegion: "LOWER_BACK" as const,
      severityLevel: "SEVERE" as const,
      status: "ACTIVE" as const,
      priorityLevel: "HIGH" as const,
      goalTimeframe: "ACUTE_RELIEF" as const,
      diagnosis: "Posterior disc herniation at L4-L5 with nerve root impingement",
      notes: "Aggravated by prolonged sitting. MRI confirmed Feb 2026.",
    },
    {
      name: "Right Knee Patellofemoral Syndrome",
      bodyRegion: "RIGHT_KNEE" as const,
      severityLevel: "MODERATE" as const,
      status: "ACTIVE" as const,
      priorityLevel: "MEDIUM" as const,
      goalTimeframe: "THIS_MONTH" as const,
      diagnosis: "Patellofemoral pain syndrome with mild chondromalacia",
      notes: "Worse going downstairs. Started after increasing running volume.",
    },
    {
      name: "Tension Headaches",
      bodyRegion: "HEAD" as const,
      severityLevel: "MILD" as const,
      status: "MANAGED" as const,
      priorityLevel: "LOW" as const,
      goalTimeframe: "MAINTENANCE" as const,
      diagnosis: "Chronic tension-type headache",
      notes: "Typically 2-3x per week, worse in afternoon. Related to neck posture.",
    },
  ];

  const createdAilments = [];
  for (const data of ailments) {
    const existing = await prisma.ailment.findFirst({
      where: { userId: user.id, name: data.name },
    });

    if (existing) {
      console.log(`  Ailment exists: ${data.name} (${existing.id})`);
      createdAilments.push(existing);
    } else {
      const ailment = await prisma.ailment.create({
        data: { ...data, userId: user.id },
      });
      console.log(`  Created: ${data.name} (${ailment.id})`);
      createdAilments.push(ailment);
    }
  }

  // ── Ailment for User 2 (data isolation testing) ────────
  const user2Ailment = await prisma.ailment.findFirst({
    where: { userId: user2.id, name: "Left Shoulder Impingement" },
  });
  const user2AilmentData = user2Ailment ?? await prisma.ailment.create({
    data: {
      userId: user2.id,
      name: "Left Shoulder Impingement",
      bodyRegion: "LEFT_SHOULDER",
      severityLevel: "MODERATE",
      status: "ACTIVE",
      diagnosis: "Subacromial impingement syndrome",
      notes: "Pain with overhead movements. User 2's data — should NOT appear for User 1.",
    },
  });
  console.log(`  User 2 ailment: ${user2AilmentData.name} (${user2AilmentData.id})`);

  // ── Pain Logs for User 1 ───────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const painPatterns: Record<number, number[]> = {
    0: [8, 7, 7, 6, 7, 6, 5],
    1: [5, 4, 5, 5, 4, 5, 4],
    2: [3, 2, 3, 2, 2, 3, 2],
  };

  for (let i = 0; i < createdAilments.length; i++) {
    const ailment = createdAilments[i];
    const pattern = painPatterns[i];

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const painLevel = pattern[6 - dayOffset];

      await prisma.painLog.upsert({
        where: {
          userId_ailmentId_date_isPostExercise: {
            userId: user.id,
            ailmentId: ailment.id,
            date,
            isPostExercise: false,
          },
        },
        update: { painLevel },
        create: {
          userId: user.id,
          ailmentId: ailment.id,
          painLevel,
          date,
          notes:
            dayOffset === 0 && i === 0
              ? "Better after morning stretches"
              : null,
        },
      });
    }
    console.log(`  7-day pain logs for: ${ailment.name}`);
  }

  // ── Treatment Plan + Exercises for L4-L5 Disc Herniation ──
  const backAilment = createdAilments[0];
  let backPlan = await prisma.treatmentPlan.findFirst({
    where: { ailmentId: backAilment.id, title: "Physio Plan from Dr. Smith" },
  });

  if (!backPlan) {
    backPlan = await prisma.treatmentPlan.create({
      data: {
        ailmentId: backAilment.id,
        title: "Physio Plan from Dr. Smith",
        prescribedBy: "Dr. Smith, PT",
        frequency: "DAILY",
        rawContent: [
          "Treatment plan for L4-L5 disc herniation recovery.",
          "Focus on core stabilisation, nerve gliding, and gradual return to function.",
          "Avoid loaded spinal flexion. No heavy lifting above 10kg for 6 weeks.",
          "Re-assess in 4 weeks. Progress to standing exercises once pain < 4/10.",
        ].join("\n"),
      },
    });
    console.log(`  Created plan: ${backPlan.title}`);

    const exercises = [
      {
        name: "Bird-Dog Hold",
        description: "From hands and knees, extend opposite arm and leg. Hold. Maintain neutral spine.",
        targetBodyRegion: "LOWER_BACK" as const,
        sets: 3, reps: 10, holdSeconds: 10, durationMinutes: 5,
        contraindications: "Stop if sharp radiating pain down the leg.",
        sortOrder: 0,
      },
      {
        name: "Sciatic Nerve Glide",
        description: "Seated, extend knee while dorsiflexing ankle. Gently move through range. Do not force stretch.",
        targetBodyRegion: "LOWER_BACK" as const,
        sets: 2, reps: 15, holdSeconds: null, durationMinutes: 5,
        contraindications: "Avoid if numbness worsens during the exercise.",
        sortOrder: 1,
      },
      {
        name: "Dead Bug",
        description: "Lying supine, alternate extending opposite arm and leg while keeping lower back pressed into floor.",
        targetBodyRegion: "LOWER_BACK" as const,
        sets: 3, reps: 12, holdSeconds: null, durationMinutes: 5,
        contraindications: "If lower back lifts off floor, reduce range of motion.",
        sortOrder: 2,
      },
      {
        name: "Cat-Cow Stretch",
        description: "Hands and knees. Alternate arching and rounding the spine through comfortable range.",
        targetBodyRegion: "LOWER_BACK" as const,
        sets: 2, reps: 10, holdSeconds: null, durationMinutes: 3,
        contraindications: null,
        sortOrder: 3,
      },
      {
        name: "Glute Bridge",
        description: "Lying supine with knees bent. Lift hips towards ceiling, squeezing glutes at top.",
        targetBodyRegion: "LOWER_BACK" as const,
        sets: 3, reps: 12, holdSeconds: 5, durationMinutes: 5,
        contraindications: "Avoid if causes pain in the sacroiliac joint.",
        sortOrder: 4,
      },
    ];

    for (const ex of exercises) {
      await prisma.exercise.create({
        data: { ...ex, treatmentPlanId: backPlan.id },
      });
    }
    console.log(`  Created ${exercises.length} exercises for: ${backPlan.title}`);
  }

  // ── Treatment Plan + Exercises for Right Knee ─────────────
  const kneeAilment = createdAilments[1];
  let kneePlan = await prisma.treatmentPlan.findFirst({
    where: { ailmentId: kneeAilment.id, title: "Knee Rehab — Running Return" },
  });

  if (!kneePlan) {
    kneePlan = await prisma.treatmentPlan.create({
      data: {
        ailmentId: kneeAilment.id,
        title: "Knee Rehab — Running Return",
        prescribedBy: "Dr. Patel, Sports Medicine",
        frequency: "ALTERNATE_DAYS",
        rawContent: [
          "Patellofemoral rehab program. VMO strengthening and hip stability.",
          "Avoid deep squats (>90 deg). No running until pain-free on stairs.",
          "Ice after exercises for 10 minutes.",
        ].join("\n"),
      },
    });
    console.log(`  Created plan: ${kneePlan.title}`);

    const kneeExercises = [
      {
        name: "Terminal Knee Extension",
        description: "With resistance band, extend knee from 30 degrees to full extension. Focus on VMO activation.",
        targetBodyRegion: "RIGHT_KNEE" as const,
        sets: 3, reps: 15, holdSeconds: 3, durationMinutes: 5,
        contraindications: "Stop if patella tracking feels off or causes clicking.",
        sortOrder: 0,
      },
      {
        name: "Single-Leg Calf Raise",
        description: "Stand on right leg, slowly raise onto toes and lower. Hold wall for balance.",
        targetBodyRegion: "RIGHT_KNEE" as const,
        sets: 3, reps: 15, holdSeconds: null, durationMinutes: 4,
        contraindications: null,
        sortOrder: 1,
      },
      {
        name: "Clamshell",
        description: "Side-lying with band around knees. Open knees apart keeping feet together. Slow and controlled.",
        targetBodyRegion: "RIGHT_HIP" as const,
        sets: 3, reps: 15, holdSeconds: null, durationMinutes: 4,
        contraindications: null,
        sortOrder: 2,
      },
    ];

    for (const ex of kneeExercises) {
      await prisma.exercise.create({
        data: { ...ex, treatmentPlanId: kneePlan.id },
      });
    }
    console.log(`  Created ${kneeExercises.length} exercises for: ${kneePlan.title}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

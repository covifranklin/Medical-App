import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Upsert default user
  const user = await prisma.user.upsert({
    where: { email: "default@physiotracker.local" },
    update: {},
    create: {
      email: "default@physiotracker.local",
      name: "Default User",
      password: "not-set",
    },
  });
  console.log(`User: ${user.id} (${user.email})`);

  // Create 3 ailments across different regions and severities
  const ailments = [
    {
      name: "L4-L5 Disc Herniation",
      bodyRegion: "LOWER_BACK" as const,
      severityLevel: "SEVERE" as const,
      status: "ACTIVE" as const,
      diagnosis: "Posterior disc herniation at L4-L5 with nerve root impingement",
      notes: "Aggravated by prolonged sitting. MRI confirmed Feb 2026.",
    },
    {
      name: "Right Knee Patellofemoral Syndrome",
      bodyRegion: "RIGHT_KNEE" as const,
      severityLevel: "MODERATE" as const,
      status: "ACTIVE" as const,
      diagnosis: "Patellofemoral pain syndrome with mild chondromalacia",
      notes: "Worse going downstairs. Started after increasing running volume.",
    },
    {
      name: "Tension Headaches",
      bodyRegion: "HEAD" as const,
      severityLevel: "MILD" as const,
      status: "MANAGED" as const,
      diagnosis: "Chronic tension-type headache",
      notes: "Typically 2-3x per week, worse in afternoon. Related to neck posture.",
    },
  ];

  const createdAilments = [];
  for (const data of ailments) {
    // Check if exists by name + user to avoid duplicates on re-seed
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

  // Generate 7 days of pain logs for each ailment
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Base pain levels and patterns per ailment (simulating realistic trends)
  const painPatterns: Record<number, number[]> = {
    // L4-L5: severe, trending slightly down (improvement)
    0: [8, 7, 7, 6, 7, 6, 5],
    // Right knee: moderate, stable
    1: [5, 4, 5, 5, 4, 5, 4],
    // Headaches: mild, stable/low
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
          userId_ailmentId_date: {
            userId: user.id,
            ailmentId: ailment.id,
            date,
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

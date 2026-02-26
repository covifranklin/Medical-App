import { prisma } from "@/lib/db";

const DEFAULT_USER_EMAIL = "default@physiotracker.local";

/**
 * Get the current user. In single-user mode, returns the default user.
 * When auth is added later, this will read from session/cookie instead.
 */
export async function getCurrentUser() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_USER_EMAIL,
      name: "Default User",
      password: "not-set",
    },
  });
  return user;
}

/**
 * Verify that an ailment belongs to the given user.
 * Returns the ailment if owned, null otherwise.
 */
export async function verifyAilmentOwnership(ailmentId: string, userId: string) {
  return prisma.ailment.findFirst({
    where: { id: ailmentId, userId },
  });
}

/**
 * Verify that a treatment plan belongs to the given user (through ailment).
 * Returns the plan with ailment if owned, null otherwise.
 */
export async function verifyPlanOwnership(planId: string, userId: string) {
  return prisma.treatmentPlan.findFirst({
    where: { id: planId, ailment: { userId } },
  });
}

/**
 * Verify that an exercise belongs to the given user (through plan -> ailment).
 * Returns the exercise if owned, null otherwise.
 */
export async function verifyExerciseOwnership(exerciseId: string, userId: string) {
  return prisma.exercise.findFirst({
    where: { id: exerciseId, treatmentPlan: { ailment: { userId } } },
  });
}

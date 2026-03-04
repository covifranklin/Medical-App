import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Get the current authenticated user from the session cookie.
 * Throws AuthError if not authenticated.
 */
export async function getCurrentUser() {
  const session = await validateSession();
  if (!session) {
    throw new AuthError("Not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    throw new AuthError("User not found");
  }

  return user;
}

/**
 * Standard error handler for API routes.
 * Returns 401 for auth errors, 500 for everything else.
 */
export function handleApiError(error: unknown, context: string) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(`Failed to ${context}:`, error);
  return NextResponse.json(
    { error: `Failed to ${context}` },
    { status: 500 }
  );
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

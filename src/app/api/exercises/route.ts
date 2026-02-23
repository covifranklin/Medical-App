import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";

// GET /api/exercises — list exercises (optionally filtered by plan)
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 2 — fetch exercises from database filtered by userId
  return NextResponse.json({ exercises: [] });
}

// POST /api/exercises — create a new exercise
export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 2 — create exercise in database with userId
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

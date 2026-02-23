import { NextResponse } from "next/server";

// GET /api/exercises — list exercises (optionally filtered by plan)
export async function GET() {
  // TODO: Phase 2 — fetch exercises from database
  return NextResponse.json({ exercises: [] });
}

// POST /api/exercises — create a new exercise
export async function POST() {
  // TODO: Phase 2 — create exercise in database
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

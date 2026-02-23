import { NextResponse } from "next/server";

// GET /api/conditions — list all ailments
export async function GET() {
  // TODO: Phase 1 — fetch ailments from database
  return NextResponse.json({ ailments: [] });
}

// POST /api/conditions — create a new ailment
export async function POST() {
  // TODO: Phase 1 — create ailment in database
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

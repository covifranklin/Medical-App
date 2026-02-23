import { NextResponse } from "next/server";

// GET /api/plans — list all treatment plans
export async function GET() {
  // TODO: Phase 2 — fetch plans from database
  return NextResponse.json({ plans: [] });
}

// POST /api/plans — create a new treatment plan
export async function POST() {
  // TODO: Phase 2 — create plan in database
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

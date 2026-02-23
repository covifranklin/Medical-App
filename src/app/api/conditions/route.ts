import { NextResponse } from "next/server";

// GET /api/conditions — list all conditions
export async function GET() {
  // TODO: Phase 1 — fetch conditions from database
  return NextResponse.json({ conditions: [] });
}

// POST /api/conditions — create a new condition
export async function POST() {
  // TODO: Phase 1 — create condition in database
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

import { NextResponse } from "next/server";

// GET /api/daily — get today's routine
export async function GET() {
  // TODO: Phase 3 — fetch or generate today's routine
  return NextResponse.json({ routine: null });
}

// POST /api/daily — generate a new daily routine via AI
export async function POST() {
  // TODO: Phase 3 — call Claude API with daily-routine prompt
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

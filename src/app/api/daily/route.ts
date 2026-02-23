import { NextResponse } from "next/server";

// GET /api/daily — get today's daily plan
export async function GET() {
  // TODO: Phase 3 — fetch or generate today's daily plan
  return NextResponse.json({ dailyPlan: null });
}

// POST /api/daily — generate a new daily plan via AI
export async function POST() {
  // TODO: Phase 3 — call Claude API with daily-plan prompt
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

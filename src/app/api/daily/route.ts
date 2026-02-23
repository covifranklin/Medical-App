import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";

// GET /api/daily — get today's daily plan
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 3 — fetch or generate today's daily plan for userId
  return NextResponse.json({ dailyPlan: null });
}

// POST /api/daily — generate a new daily plan via AI
export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 3 — call Claude API with daily-plan prompt for userId
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

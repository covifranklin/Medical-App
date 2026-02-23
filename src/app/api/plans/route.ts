import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";

// GET /api/plans — list all treatment plans
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 2 — fetch plans from database filtered by userId
  return NextResponse.json({ plans: [] });
}

// POST /api/plans — create a new treatment plan
export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 2 — create plan in database with userId
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

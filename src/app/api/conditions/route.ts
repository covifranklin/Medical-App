import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";

// GET /api/conditions — list all ailments
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 1 — fetch ailments from database filtered by userId
  return NextResponse.json({ ailments: [] });
}

// POST /api/conditions — create a new ailment
export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 1 — create ailment in database with userId
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

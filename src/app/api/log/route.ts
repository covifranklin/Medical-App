import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";

// POST /api/log — create a pain log entry
export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 3 — create pain log entry in database with userId
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

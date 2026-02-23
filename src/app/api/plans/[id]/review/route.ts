import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";

// POST /api/plans/:id/review — trigger AI review of a treatment plan
export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  // TODO: Phase 2 — call Claude API with plan-review prompt, scoped to userId
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

import { NextResponse } from "next/server";

// POST /api/plans/:id/review — trigger AI review of a treatment plan
export async function POST() {
  // TODO: Phase 2 — call Claude API with plan-review prompt
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

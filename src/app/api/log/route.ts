import { NextResponse } from "next/server";

// POST /api/log — create a pain log entry
export async function POST() {
  // TODO: Phase 3 — create pain log entry in database
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

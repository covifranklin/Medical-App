import { NextResponse } from "next/server";
import { getCurrentUser, handleApiError } from "@/lib/user";

export const dynamic = "force-dynamic";

// POST /api/log — create a pain log entry (stub — use /api/pain-logs instead)
export async function POST() {
  try {
    await getCurrentUser();
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
  } catch (error) {
    return handleApiError(error, "create log entry");
  }
}

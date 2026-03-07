import { NextResponse } from "next/server";
import { getCurrentUser, handleApiError } from "@/lib/user";

export const dynamic = "force-dynamic";

// GET /api/conditions — list all ailments (stub — use /api/ailments instead)
export async function GET() {
  try {
    await getCurrentUser();
    return NextResponse.json({ ailments: [] });
  } catch (error) {
    return handleApiError(error, "fetch conditions");
  }
}

// POST /api/conditions — create a new ailment (stub — use /api/ailments instead)
export async function POST() {
  try {
    await getCurrentUser();
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
  } catch (error) {
    return handleApiError(error, "create condition");
  }
}

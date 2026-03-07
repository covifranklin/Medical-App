import { NextResponse } from "next/server";
import { getCurrentUser, handleApiError } from "@/lib/user";

export const dynamic = "force-dynamic";

// GET /api/plans — list all treatment plans (stub — use /api/ailments/[id]/plans instead)
export async function GET() {
  try {
    await getCurrentUser();
    return NextResponse.json({ plans: [] });
  } catch (error) {
    return handleApiError(error, "fetch plans");
  }
}

// POST /api/plans — create a new treatment plan (stub)
export async function POST() {
  try {
    await getCurrentUser();
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
  } catch (error) {
    return handleApiError(error, "create plan");
  }
}

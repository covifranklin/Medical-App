import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * Get the authenticated user's ID from the session.
 * Returns the userId string, or a 401 NextResponse if not authenticated.
 */
export async function requireUserId(): Promise<string | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return session.user.id;
}

import { NextResponse } from "next/server";
import { validateSession, destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await validateSession();

  if (session) {
    await destroySession(session.sessionId);
  }

  return NextResponse.json({ ok: true });
}

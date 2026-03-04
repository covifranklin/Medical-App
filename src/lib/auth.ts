import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

// ── Config ──────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "physiotracker-dev-secret-change-in-production"
);
const SESSION_COOKIE = "pt_session";
const SESSION_DURATION_DAYS = 7;
const REFRESH_THRESHOLD_DAYS = 1; // reissue if less than this left

// ── Password hashing ────────────────────────────────────

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// ── JWT / Session ───────────────────────────────────────

interface SessionPayload {
  sessionId: string;
  userId: string;
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  const token = await new SignJWT({
    sessionId: session.id,
    userId,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .sign(JWT_SECRET);

  return token;
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Validate the session cookie and return the payload.
 * Returns null if invalid, expired, or session revoked.
 * Automatically refreshes the token if close to expiry.
 */
export async function validateSession(): Promise<{
  userId: string;
  sessionId: string;
} | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { sessionId, userId } = payload as unknown as SessionPayload;

    // Verify session exists in DB and hasn't been revoked
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.expiresAt < new Date()) {
      // Session revoked or expired in DB
      if (session) {
        await prisma.session.delete({ where: { id: sessionId } });
      }
      clearSessionCookie();
      return null;
    }

    // Sliding window: refresh if less than REFRESH_THRESHOLD_DAYS remaining
    const remainingMs = session.expiresAt.getTime() - Date.now();
    const thresholdMs = REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

    if (remainingMs < thresholdMs) {
      const newExpiresAt = new Date(
        Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
      );
      await prisma.session.update({
        where: { id: sessionId },
        data: { expiresAt: newExpiresAt },
      });

      const newToken = await new SignJWT({
        sessionId,
        userId,
      } satisfies SessionPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(newExpiresAt)
        .setIssuedAt()
        .sign(JWT_SECRET);

      setSessionCookie(newToken);
    }

    return { userId, sessionId };
  } catch {
    clearSessionCookie();
    return null;
  }
}

/**
 * Destroy a specific session (logout).
 */
export async function destroySession(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  clearSessionCookie();
}

/**
 * Destroy all sessions for a user (force logout everywhere).
 */
export async function destroyAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
  clearSessionCookie();
}

// ── CSRF ────────────────────────────────────────────────

/**
 * Validate CSRF for mutation requests.
 * Uses SameSite=Lax cookies as primary protection.
 * Additionally checks for custom header on non-GET requests,
 * which browsers won't send on cross-origin form submissions.
 */
export function validateCsrf(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD") return true;

  // Check for custom header (fetch API always sends these, forms don't)
  const contentType = request.headers.get("content-type");
  const hasJsonContent = contentType?.includes("application/json");

  // Cross-origin form submissions can't set Content-Type: application/json
  // This acts as a CSRF check without needing tokens
  return !!hasJsonContent;
}

// ── Password validation ─────────────────────────────────

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be under 128 characters.";
  return null;
}

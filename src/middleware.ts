import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "physiotracker-dev-secret-change-in-production"
);

const SESSION_COOKIE = "pt_session";

// Routes that don't require authentication
const PUBLIC_PATHS = ["/login", "/register", "/api/auth/"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and public paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    // Redirect pages to login, return 401 for API routes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify JWT (lightweight check — no DB hit in middleware)
  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Token invalid/expired — clear cookie and redirect
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Session expired" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));

    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

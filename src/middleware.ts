export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /auth (login/register page)
     * - /api/auth (NextAuth endpoints + registration)
     * - /_next (Next.js internals)
     * - /fonts, favicon, static assets
     */
    "/((?!auth|api/auth|_next/static|_next/image|fonts|favicon.ico).*)",
  ],
};

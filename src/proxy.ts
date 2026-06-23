import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Edge middleware — lightweight auth guard.
 *
 * We use cookie-presence detection here (not a full session validation) because
 * middleware runs on every request on the edge and a Redis round-trip per
 * request would be too slow.  The session token is a signed opaque value; if
 * tampered it will fail validation on the first protected API/page call.
 *
 * Full session validation (including expiry and revocation checks) happens
 * server-side inside `requireAuth()` and `getSession()` in lib/session.ts.
 *
 * CSRF: Next.js Server Actions include CSRF protection by default (same-site
 * cookie + origin header check). The cookie `SameSite=Lax` attribute prevents
 * cross-site cookie transmission for state-mutating requests.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ------------------------------------------------------------------
  // 1. Always allow static assets and Next.js internals
  // ------------------------------------------------------------------
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ------------------------------------------------------------------
  // 2. Allow all auth-related routes through (no session required)
  // ------------------------------------------------------------------
  const isAuthRoute =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");

  if (isAuthRoute) {
    // If user already has a valid session and tries to visit auth pages,
    // redirect them to the dashboard instead.
    if (!pathname.startsWith("/api/auth")) {
      const sessionCookie = getSessionCookie(request, {
        cookiePrefix: "rf",
        cookieName: "session_token",
      });
      if (sessionCookie) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // ------------------------------------------------------------------
  // 3. All other routes require an authenticated session cookie
  // ------------------------------------------------------------------
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "rf",
    cookieName: "session_token",
  });

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the originally requested URL so we can redirect back after login
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add security headers to authenticated responses
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

export const config = {
  /*
   * Run middleware on every path except:
   *  - _next/static  (Next.js static chunks)
   *  - _next/image   (Next.js image optimizer)
   *  - favicon.ico
   *
   * Auth routes and API routes are handled by the logic above.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

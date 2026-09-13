import { auth } from "@/auth"
import { NextResponse, type NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"

/**
 * Locale handling for the public surface only.
 *
 * The private areas below are matched by prefix, and a locale segment in front
 * of `/dashboard` would stop those prefixes from matching: `/it/dashboard`
 * would not look protected. Rather than teach every list here to strip a
 * locale, the private areas stay outside the prefix entirely, so those URLs do
 * not exist. See `src/i18n/routing.ts` for how to lift that if you want your
 * dashboard localized.
 */
const intlMiddleware = createIntlMiddleware(routing)

/**
 * Everything that must never carry a locale prefix.
 *
 * Two kinds of thing end up here. The private areas and the sign-in pages,
 * which live outside `src/app/[locale]/` by design. And the root level
 * metadata routes, which Next serves from `src/app/` directly: prefixing those
 * asks for `/en/sitemap.xml`, which does not exist, so the file 404s instead of
 * being served. That failure is quiet in the worst way, since nothing links to
 * a favicon or a sitemap from inside the app.
 *
 * Adding a file at the root of `src/app/` means adding it here too.
 */
const UNLOCALIZED = [
  // Private areas and auth, matched by prefix.
  "/dashboard",
  "/admin",
  "/api",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-request",
  "/2fa",
  // Root level metadata routes.
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/icon",
  "/opengraph-image",
]

/**
 * Private surfaces, matched by prefix. Anything not listed here falls through
 * to the router, so a URL that does not exist renders your 404 page.
 *
 * This is a denylist on purpose. With the allowlist it replaced, every path
 * the list did not know about looked private: a typo like `/doc` instead of
 * `/docs` was bounced to `/login`, and an anonymous visitor never saw the 404
 * page at all. Loosening the proxy opens nothing, because each private area
 * already gates itself server-side: `(dashboard)/layout.tsx` and
 * `(admin)/layout.tsx` call `auth()` and redirect, and the private API routes
 * each return 401 on their own. Treat this file as defence in depth, and add
 * a prefix here when you add a private area outside `/dashboard`.
 */
const PROTECTED_ROUTES = ["/dashboard", "/api/checkout", "/api/billing"]
const ADMIN_ROUTES = ["/admin", "/api/admin"]
// `/2fa` belongs here for the same reason as the other two: it is a step on the
// way in, so somebody who already holds a session has nothing to do on it. The
// second factor is asked for BEFORE a session exists, which is why sending a
// signed-in visitor to the dashboard cannot interrupt a verification.
const AUTH_ROUTES = ["/login", "/signup", "/2fa"]

// Reading the session here means one database round trip per request, where
// the old JWT was verified in memory. `session.cookieCache` in src/auth.ts is
// what buys most of them back. Next.js 16 is what makes this possible at all:
// on older versions the proxy could only look at the cookie without validating
// it, which the Better Auth docs are blunt about ("THIS IS NOT SECURE").
//
// Either way this is a redirect layer, not the authorization: the real check
// lives in requireUser() and requireAdmin(), on the page.
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = await auth.api.getSession({ headers: req.headers })
  const isLoggedIn = !!session
  const isAdmin = session?.user?.role === "ADMIN"

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))

  // `/api/auth` and the inbound webhooks (e.g. Stripe) carry no session and
  // need no special case here: they are not in the lists above, so they pass.
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  if (isAdminRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl))
    if (!isAdmin) return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    return NextResponse.next()
  }

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // Past the guards. Anything that is not a private area is public surface, so
  // it goes through locale resolution; the private areas keep the plain
  // response they have always had.
  if (UNLOCALIZED.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

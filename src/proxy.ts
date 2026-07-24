import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/changelog",
  "/login",
  "/signup",
  "/verify-request",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/cookies",
  "/about",
  "/contact",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
]
const AUTH_ROUTES = ["/login", "/signup"]
const ADMIN_ROUTES = ["/admin"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.role === "ADMIN"

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  // /docs and /blog have nested pages (and the RSS feed), so they match by
  // prefix instead of exactly.
  const isPublicRoute =
    PUBLIC_ROUTES.some((r) => pathname === r) ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/blog") ||
    // Newsletter signup + the emailed confirm/unsubscribe links (no session).
    pathname.startsWith("/newsletter") ||
    pathname.startsWith("/api/newsletter") ||
    // Generated metadata images: the favicon and the Open Graph cards. Browsers
    // and crawlers fetch them without a session, and they carry no extension,
    // so the matcher below doesn't exclude them.
    pathname.startsWith("/icon") ||
    pathname.startsWith("/opengraph-image")
  const isApiAuthRoute = pathname.startsWith("/api/auth")
  // Inbound webhooks (e.g. Stripe) are server-to-server and carry no session —
  // they must bypass auth or they'd be redirected to /login and never run.
  const isWebhookRoute = pathname.startsWith("/api/webhooks")

  if (isApiAuthRoute || isWebhookRoute) return NextResponse.next()

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  if (isAdminRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl))
    if (!isAdmin) return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    return NextResponse.next()
  }

  if (!isPublicRoute && !isAuthRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

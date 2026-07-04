import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/", "/pricing", "/login", "/privacy", "/terms", "/cookies"]
const AUTH_ROUTES = ["/login"]
const ADMIN_ROUTES = ["/admin"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user?.role === "ADMIN"

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r)
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

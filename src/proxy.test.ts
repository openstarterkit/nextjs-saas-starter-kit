import { describe, expect, it, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

/**
 * Which requests read the session (2.3.6).
 *
 * The proxy used to read it on every request, public pages included. Nothing
 * failed: the pages were right, the redirects were right, and the only sign
 * was the CPU bill on Vercel. A test is the only place that regression shows.
 */

const getSession = vi.fn()
const intl = vi.fn(() => NextResponse.next({ headers: { "x-intl": "1" } }))

vi.mock("@/auth", () => ({
  auth: { api: { getSession: (...a: unknown[]) => getSession(...a) } },
}))
vi.mock("next-intl/middleware", () => ({ default: () => intl }))
vi.mock("@/i18n/routing", () => ({ routing: {} }))

const { default: proxy } = await import("./proxy")

const run = (path: string) => proxy(new NextRequest(new URL(path, "http://localhost")))
const location = (res: Response) => res.headers.get("location")

beforeEach(() => {
  getSession.mockReset()
  intl.mockClear()
})

describe("proxy: the session is read only where it is used", () => {
  it.each(["/", "/it", "/blog/some-post", "/docs/getting-started", "/pricing", "/api/auth/session", "/sitemap.xml"])(
    "%s does not read it",
    async (path) => {
      await run(path)
      expect(getSession).not.toHaveBeenCalled()
    },
  )

  it.each(["/login", "/2fa", "/dashboard", "/dashboard/settings", "/admin", "/api/billing/portal"])(
    "%s reads it",
    async (path) => {
      getSession.mockResolvedValue(null)
      await run(path)
      expect(getSession).toHaveBeenCalledOnce()
    },
  )
})

describe("proxy: the redirects are unchanged", () => {
  it("sends a signed-out visitor from /dashboard to /login", async () => {
    getSession.mockResolvedValue(null)
    expect(location(await run("/dashboard"))).toBe("http://localhost/login")
  })

  it("sends a signed-in user from /login to /dashboard", async () => {
    getSession.mockResolvedValue({ user: { role: "USER" } })
    expect(location(await run("/login"))).toBe("http://localhost/dashboard")
  })

  it("keeps a non-admin out of /admin", async () => {
    getSession.mockResolvedValue({ user: { role: "USER" } })
    expect(location(await run("/admin"))).toBe("http://localhost/dashboard")
  })

  it("lets an admin into /admin", async () => {
    getSession.mockResolvedValue({ user: { role: "ADMIN" } })
    expect(location(await run("/admin"))).toBeNull()
  })

  it("hands public pages to the locale middleware", async () => {
    const res = await run("/blog")
    expect(intl).toHaveBeenCalledOnce()
    expect(res.headers.get("x-intl")).toBe("1")
  })
})

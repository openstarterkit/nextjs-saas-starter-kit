import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { GET } from "./route"
import { siteConfig } from "@/config/site"

const original = { ...process.env }

afterEach(() => {
  process.env = { ...original }
})

beforeEach(() => {
  delete process.env.VERCEL_GIT_COMMIT_SHA
  delete process.env.DEMO_MODE
})

describe("GET /api/health", () => {
  it("reports the version the build was cut from", async () => {
    const body = await GET().json()
    expect(body.status).toBe("ok")
    expect(body.version).toBe(siteConfig.version)
  })

  it("shortens the Vercel commit sha, and reports null without one", async () => {
    expect((await GET().json()).commit).toBeNull()

    process.env.VERCEL_GIT_COMMIT_SHA = "0123456789abcdef"
    expect((await GET().json()).commit).toBe("0123456")
  })

  it("tells the smoke test whether this deployment is the demo", async () => {
    expect((await GET().json()).demo).toBe(false)

    process.env.DEMO_MODE = "true"
    expect((await GET().json()).demo).toBe(true)
  })

  // A cached health response reports the version of whatever build filled the
  // cache, which is exactly the failure this endpoint exists to catch.
  it("is never cached", () => {
    expect(GET().headers.get("cache-control")).toContain("no-store")
  })
})

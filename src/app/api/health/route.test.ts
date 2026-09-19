import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// The route asks the database whether it has every migration. That question has
// its own tests in src/lib/schema-status.test.ts; here the answer is fixed, so
// these tests are about what the endpoint does with it.
const schema = vi.hoisted(() => ({
  current: { aligned: true, pending: 0 } as { aligned: boolean | null; pending: number | null },
}))
vi.mock("@/lib/schema-status", () => ({ getSchemaStatus: async () => schema.current }))

import { GET } from "./route"
import { siteConfig } from "@/config/site"

const original = { ...process.env }
const read = async () => (await GET()).json()

afterEach(() => {
  process.env = { ...original }
  schema.current = { aligned: true, pending: 0 }
})

beforeEach(() => {
  delete process.env.VERCEL_GIT_COMMIT_SHA
  delete process.env.DEMO_MODE
})

describe("GET /api/health", () => {
  it("reports the version the build was cut from", async () => {
    const body = await read()
    expect(body.status).toBe("ok")
    expect(body.version).toBe(siteConfig.version)
  })

  it("shortens the Vercel commit sha, and reports null without one", async () => {
    expect((await read()).commit).toBeNull()

    process.env.VERCEL_GIT_COMMIT_SHA = "0123456789abcdef"
    expect((await read()).commit).toBe("0123456")
  })

  it("tells the smoke test whether this deployment is the demo", async () => {
    expect((await read()).demo).toBe(false)

    process.env.DEMO_MODE = "true"
    expect((await read()).demo).toBe(true)
  })

  it("reports whether the database has every migration this build ships", async () => {
    expect((await read()).schema).toEqual({ aligned: true, pending: 0 })

    schema.current = { aligned: false, pending: 3 }
    expect((await read()).schema).toEqual({ aligned: false, pending: 3 })
  })

  // Unknown is its own answer: a database that cannot be asked is not reported
  // as behind, and it does not take the endpoint down with it.
  it("stays up and says unknown when the database cannot be asked", async () => {
    schema.current = { aligned: null, pending: null }
    const response = await GET()
    expect(response.status).toBe(200)
    expect((await response.json()).schema).toEqual({ aligned: null, pending: null })
  })

  // The endpoint is public. How many migrations a deployment is missing is what
  // a smoke test needs; which ones is nobody else's business.
  it("never names a migration", async () => {
    schema.current = { aligned: false, pending: 2 }
    expect(Object.keys((await read()).schema).sort()).toEqual(["aligned", "pending"])
  })

  // A cached health response reports the version of whatever build filled the
  // cache, which is exactly the failure this endpoint exists to catch.
  it("is never cached", async () => {
    expect((await GET()).headers.get("cache-control")).toContain("no-store")
  })
})

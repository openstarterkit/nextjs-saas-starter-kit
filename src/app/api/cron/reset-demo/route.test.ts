import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const seedDemoData = vi.fn()
vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("@/lib/demo-seed", () => ({ seedDemoData: (...a: unknown[]) => seedDemoData(...a) }))

const { GET } = await import("./route")

const original = { ...process.env }
const call = (auth?: string) =>
  GET(new Request("http://localhost/api/cron/reset-demo", auth ? { headers: { authorization: auth } } : undefined))

beforeEach(() => {
  seedDemoData.mockReset()
  seedDemoData.mockResolvedValue({ users: 17, subscriptions: 8, purchases: 1, projects: 12 })
  process.env.DEMO_MODE = "true"
  process.env.CRON_SECRET = "s3cret"
})

afterEach(() => {
  process.env = { ...original }
})

describe("GET /api/cron/reset-demo", () => {
  it("reseeds and reports the counts when called correctly", async () => {
    const response = await call("Bearer s3cret")
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({ status: "ok", users: 17, projects: 12 })
    expect(seedDemoData).toHaveBeenCalledOnce()
  })

  // The guard that matters: this endpoint deletes every user, so a deployment
  // serving real customers must refuse even when the secret is right.
  it("refuses on a non-demo deployment, valid secret or not", async () => {
    process.env.DEMO_MODE = "false"
    const response = await call("Bearer s3cret")
    expect(response.status).toBe(403)
    expect(seedDemoData).not.toHaveBeenCalled()
  })

  it("refuses when DEMO_MODE is unset", async () => {
    delete process.env.DEMO_MODE
    expect((await call("Bearer s3cret")).status).toBe(403)
    expect(seedDemoData).not.toHaveBeenCalled()
  })

  it("rejects a wrong or missing secret", async () => {
    expect((await call("Bearer wrong")).status).toBe(401)
    expect((await call()).status).toBe(401)
    expect(seedDemoData).not.toHaveBeenCalled()
  })

  // Unset must mean closed, not open.
  it("refuses to run when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET
    const response = await call("Bearer s3cret")
    expect(response.status).toBe(500)
    expect(seedDemoData).not.toHaveBeenCalled()
  })

  it("does not leak the failure details when the reset throws", async () => {
    seedDemoData.mockRejectedValue(new Error("connection to db-prod-9 refused"))
    const response = await call("Bearer s3cret")
    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain("db-prod-9")
  })
})

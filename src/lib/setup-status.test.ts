import { afterEach, describe, expect, it, vi } from "vitest"

/**
 * The page this feeds is the first thing a new clone sees, so the two things
 * worth pinning are that it names the right step and that it never speaks in
 * production.
 */
const prismaMock = { plan: { count: vi.fn() } }
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

const { pendingSetup, stepFromError } = await import("./setup-status")

afterEach(() => {
  vi.unstubAllEnvs()
  prismaMock.plan.count.mockReset()
})

describe("stepFromError", () => {
  it("reads a connection failure as the address being wrong", () => {
    expect(stepFromError({ code: "P1001" })).toBe("database-unreachable")
    expect(stepFromError({ code: "P1000" })).toBe("database-unreachable")
    expect(stepFromError({ code: "P1013" })).toBe("database-unreachable")
  })

  it("reads anything else as migrations still to apply", () => {
    expect(stepFromError({ code: "P2021" })).toBe("migrations")
    expect(stepFromError(new Error('relation "Plan" does not exist'))).toBe("migrations")
    expect(stepFromError(null)).toBe("migrations")
  })
})

describe("pendingSetup", () => {
  it("says nothing in production, whatever the database does", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("DATABASE_URL", "")
    expect(await pendingSetup()).toBeNull()
    expect(prismaMock.plan.count).not.toHaveBeenCalled()
  })

  it("asks for the connection string when there is none", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("DATABASE_URL", "")
    expect(await pendingSetup()).toBe("database-url")
    expect(prismaMock.plan.count).not.toHaveBeenCalled()
  })

  it("says nothing once a query goes through", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host/db")
    prismaMock.plan.count.mockResolvedValue(6)
    expect(await pendingSetup()).toBeNull()
  })

  it("names the step the failed query points at", async () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host/db")
    prismaMock.plan.count.mockRejectedValue({ code: "P2021" })
    expect(await pendingSetup()).toBe("migrations")
    prismaMock.plan.count.mockRejectedValue({ code: "P1001" })
    expect(await pendingSetup()).toBe("database-unreachable")
  })
})

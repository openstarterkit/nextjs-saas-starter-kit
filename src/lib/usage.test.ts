import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const findUnique = vi.fn()
const createMeterEvent = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}))
vi.mock("@/lib/stripe", () => ({
  stripe: { billing: { meterEvents: { create: (...args: unknown[]) => createMeterEvent(...args) } } },
}))

const { recordUsage } = await import("./usage")

const withCustomer = (id: string | null) => findUnique.mockResolvedValue({ stripeCustomerId: id })

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123")
  vi.spyOn(console, "warn").mockImplementation(() => {})
  findUnique.mockReset()
  createMeterEvent.mockReset()
  createMeterEvent.mockResolvedValue({ id: "mbe_1" })
  withCustomer("cus_123")
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("recordUsage", () => {
  it("reports the event against the user's Stripe customer", async () => {
    await expect(recordUsage("u1", "api_request")).resolves.toEqual({ id: "mbe_1" })

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { stripeCustomerId: true },
    })
    expect(createMeterEvent).toHaveBeenCalledWith({
      event_name: "api_request",
      payload: { stripe_customer_id: "cus_123", value: "1" },
    })
  })

  it("counts more than one at a time", async () => {
    await recordUsage("u1", "api_request", 42)

    expect(createMeterEvent).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { stripe_customer_id: "cus_123", value: "42" } })
    )
  })

  // Stripe's dedupe key, for a caller that might retry. It travels only when
  // given: sending an empty one would make every event look like the same one.
  it("passes an identifier through when there is one, and omits it otherwise", async () => {
    await recordUsage("u1", "api_request", 1, { identifier: "req_7" })
    expect(createMeterEvent).toHaveBeenCalledWith(expect.objectContaining({ identifier: "req_7" }))

    createMeterEvent.mockClear()
    await recordUsage("u1", "api_request")
    expect(createMeterEvent.mock.calls[0][0]).not.toHaveProperty("identifier")
  })

  // Instrumented code has to stay safe in a keyless install and in demo mode,
  // or adding a meter call means the feature around it starts throwing.
  it("drops the event instead of throwing when Stripe is not configured", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "")

    await expect(recordUsage("u1", "api_request")).resolves.toBeNull()
    expect(findUnique).not.toHaveBeenCalled()
    expect(createMeterEvent).not.toHaveBeenCalled()
  })

  it("drops the event when the user has no Stripe customer yet", async () => {
    withCustomer(null)

    await expect(recordUsage("u1", "api_request")).resolves.toBeNull()
    expect(createMeterEvent).not.toHaveBeenCalled()
  })

  it("drops the event when the user does not exist", async () => {
    findUnique.mockResolvedValue(null)

    await expect(recordUsage("u1", "api_request")).resolves.toBeNull()
    expect(createMeterEvent).not.toHaveBeenCalled()
  })

  // A meter event is billing input. Validation runs before the call so a bad
  // value fails at the caller rather than becoming a charge nobody can explain.
  it("refuses input that is not a countable event", async () => {
    await expect(recordUsage("", "api_request")).rejects.toThrow()
    await expect(recordUsage("u1", "")).rejects.toThrow()
    await expect(recordUsage("u1", "api_request", 0)).rejects.toThrow()
    await expect(recordUsage("u1", "api_request", -1)).rejects.toThrow()
    await expect(recordUsage("u1", "api_request", 1.5)).rejects.toThrow()

    expect(createMeterEvent).not.toHaveBeenCalled()
  })
})

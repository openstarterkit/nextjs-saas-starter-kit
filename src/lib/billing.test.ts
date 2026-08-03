import { describe, it, expect, vi } from "vitest"

// getEntitlement queries the database; importing the module must not construct
// a real client just to read the constant below.
vi.mock("@/lib/prisma", () => ({ prisma: {} }))

const { CHECKOUT_BLOCKING_STATUSES } = await import("@/lib/billing")

describe("CHECKOUT_BLOCKING_STATUSES", () => {
  it("lists the statuses Stripe still manages", () => {
    expect([...CHECKOUT_BLOCKING_STATUSES]).toEqual(["ACTIVE", "TRIALING", "PAST_DUE", "UNPAID"])
  })

  // These two carry real money consequences, which is why they get their own
  // assertion rather than relying on the list above.
  //
  // CANCELED in the list would leave a user who cancelled unable to subscribe
  // again, since checkout refuses to create a second subscription.
  it("does not block checkout for a cancelled subscription", () => {
    expect(CHECKOUT_BLOCKING_STATUSES).not.toContain("CANCELED")
  })

  // INCOMPLETE means the first payment never went through: the user has to be
  // able to try again, and getEntitlement must not treat that row as paid access.
  it("does not block checkout when the initial payment never completed", () => {
    expect(CHECKOUT_BLOCKING_STATUSES).not.toContain("INCOMPLETE")
  })
})

import { describe, it, expect, vi } from "vitest"

// The module builds its default check around the real client; importing it
// must not need a Stripe key.
vi.mock("@/lib/stripe", () => ({ stripe: {} }))

const { AUTOMATIC_TAX_PARAMS, stripeTaxWarning, createStripeTaxCheck } = await import("@/lib/stripe-tax")

describe("AUTOMATIC_TAX_PARAMS", () => {
  it("turns on tax, tax ID collection and a required billing address", () => {
    expect(AUTOMATIC_TAX_PARAMS.automatic_tax).toEqual({ enabled: true })
    expect(AUTOMATIC_TAX_PARAMS.tax_id_collection).toEqual({ enabled: true })
    expect(AUTOMATIC_TAX_PARAMS.billing_address_collection).toBe("required")
  })

  // Checkout always gets an existing customer here. Stripe refuses automatic
  // tax without `address: "auto"` (customer_tax_location_invalid) and tax ID
  // collection without `name: "auto"`: drop either and every checkout fails.
  it("lets Checkout save the address and the business name onto the customer", () => {
    expect(AUTOMATIC_TAX_PARAMS.customer_update).toEqual({ address: "auto", name: "auto" })
  })
})

describe("stripeTaxWarning", () => {
  it("says nothing when Stripe Tax is active", () => {
    expect(stripeTaxWarning({ status: "active", status_details: {} } as never)).toBeNull()
  })

  it("names what Stripe says is missing, and what happens meanwhile", () => {
    const warning = stripeTaxWarning({
      status: "pending",
      status_details: { pending: { missing_fields: ["head_office"] } },
    } as never)
    expect(warning).toMatch(/STRIPE_AUTOMATIC_TAX is on/)
    expect(warning).toMatch(/missing: head_office/)
    expect(warning).toMatch(/no tax is charged/)
  })

  it("still warns when Stripe gives no list of missing fields", () => {
    expect(stripeTaxWarning({ status: "pending", status_details: {} } as never)).toMatch(/not active/)
  })
})

describe("createStripeTaxCheck", () => {
  const settings = (status: string) => ({ status, status_details: {} }) as never

  it("asks once, and not again, after Stripe says active", async () => {
    const retrieve = vi.fn(async () => settings("active"))
    const warn = vi.fn()
    const check = createStripeTaxCheck(retrieve, warn)
    await check()
    await check()
    expect(retrieve).toHaveBeenCalledTimes(1)
    expect(warn).not.toHaveBeenCalled()
  })

  it("warns on every checkout while Stripe Tax is not active", async () => {
    const retrieve = vi.fn(async () => settings("pending"))
    const warn = vi.fn()
    const check = createStripeTaxCheck(retrieve, warn)
    await check()
    await check()
    expect(retrieve).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalledTimes(2)
  })

  // The check guards the seller's setup, not the sale.
  it("never throws, and stays quiet, when Stripe cannot be reached", async () => {
    const retrieve = vi.fn(async () => {
      throw new Error("network")
    })
    const warn = vi.fn()
    const check = createStripeTaxCheck(retrieve, warn)
    await expect(check()).resolves.toBeUndefined()
    await check()
    expect(retrieve).toHaveBeenCalledTimes(2)
    expect(warn).not.toHaveBeenCalled()
  })
})

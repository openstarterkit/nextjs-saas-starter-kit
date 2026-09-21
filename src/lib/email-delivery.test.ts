import { afterEach, describe, expect, it, vi } from "vitest"
import { deliver, maskAddresses } from "./email-delivery"

/**
 * The failure this guards is silent by construction: the Resend SDK resolves
 * with `{ error }` instead of throwing, and logs nothing in production. So the
 * tests below are about what reaches the log, and about what never may.
 */
describe("deliver", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {})
  afterEach(() => log.mockClear())

  it("reports an accepted send and logs nothing", async () => {
    const sent = await deliver("magic-link", async () => ({ error: null }))
    expect(sent).toBe(true)
    expect(log).not.toHaveBeenCalled()
  })

  it("reports a refused send and says which email it was and why", async () => {
    const sent = await deliver("password-reset", async () => ({
      error: { name: "validation_error", statusCode: 403, message: "The example.com domain is not verified." },
    }))
    expect(sent).toBe(false)
    expect(log).toHaveBeenCalledOnce()
    const [line, detail] = log.mock.calls[0]
    expect(line).toBe("[email] password-reset rejected by Resend")
    expect(detail).toMatchObject({ name: "validation_error", statusCode: 403 })
  })

  // Some of Resend's validation errors quote the recipient back. The log is
  // read by anyone with access to the deployment, so the address is masked
  // even though no caller ever passes it in.
  it("never lets an address from Resend's message reach the log", async () => {
    await deliver("newsletter-confirm", async () => ({
      error: { name: "validation_error", statusCode: 422, message: "Invalid `to` field: jane.doe+kit@example.co.uk" },
    }))
    const logged = JSON.stringify(log.mock.calls)
    expect(logged).not.toContain("jane.doe")
    expect(logged).not.toContain("example.co.uk")
    expect(logged).toContain("[address]")
  })

  it("carries the instruction for a human when there is one", async () => {
    await deliver(
      "audience-remove",
      async () => ({ error: { name: "rate_limit_exceeded", statusCode: 429, message: "Too many requests" } }),
      "remove the contact by hand",
    )
    expect(log.mock.calls[0][1]).toMatchObject({ todo: "remove the contact by hand" })
  })

  // Thrown errors keep the path they had before: a missing API key already
  // reaches the caller's catch, and changing that is not what this is for.
  it("lets an exception from the send through untouched", async () => {
    await expect(
      deliver("welcome", async () => {
        throw new Error("RESEND_API_KEY is not set")
      }),
    ).rejects.toThrow("RESEND_API_KEY is not set")
    expect(log).not.toHaveBeenCalled()
  })
})

describe("maskAddresses", () => {
  it("masks every address and leaves the rest of the sentence alone", () => {
    expect(maskAddresses("from a@b.io to c.d+e@f-g.co.uk, retry later")).toBe(
      "from [address] to [address], retry later",
    )
  })

  it("leaves text without addresses as it is", () => {
    expect(maskAddresses("The domain is not verified.")).toBe("The domain is not verified.")
  })
})

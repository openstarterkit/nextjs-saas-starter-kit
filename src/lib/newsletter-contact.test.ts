import { describe, expect, it } from "vitest"
import { contactStateFrom } from "./newsletter-contact"

describe("contactStateFrom", () => {
  it("reads a contact Resend does not have as missing, so the person can sign up again", () => {
    expect(contactStateFrom({ data: null, error: { name: "not_found" } })).toBe("missing")
  })

  it("reads any other error as unknown, so nothing is sent while Resend is down", () => {
    expect(contactStateFrom({ data: null, error: { name: "rate_limit_exceeded" } })).toBe("unknown")
    expect(contactStateFrom({ data: null, error: { name: "internal_server_error" } })).toBe("unknown")
  })

  it("tells an unsubscribed contact from a receiving one", () => {
    expect(contactStateFrom({ data: { unsubscribed: true }, error: null })).toBe("unsubscribed")
    expect(contactStateFrom({ data: { unsubscribed: false }, error: null })).toBe("subscribed")
  })

  it("reads an empty answer as unknown", () => {
    expect(contactStateFrom({ data: null, error: null })).toBe("unknown")
  })
})

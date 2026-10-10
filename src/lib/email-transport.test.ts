import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The contract of the one place email leaves the kit. Whoever replaces Resend
 * with another provider keeps these: false on a refusal instead of an
 * exception, the reply-to passed through, nothing sent without a key.
 */

const send = vi.fn()
vi.mock("resend", () => ({
  Resend: class {
    emails = { send }
  },
}))

const original = { ...process.env }

beforeEach(() => {
  send.mockReset()
  vi.resetModules()
})

afterEach(() => {
  process.env = { ...original }
})

describe("emailEnabled", () => {
  it("follows the provider key", async () => {
    delete process.env.RESEND_API_KEY
    const { emailEnabled } = await import("./email-transport")
    expect(emailEnabled()).toBe(false)
    process.env.RESEND_API_KEY = "re_test"
    expect(emailEnabled()).toBe(true)
  })
})

describe("sendEmail", () => {
  it("hands the provider the sender, the recipient and the reply-to", async () => {
    process.env.RESEND_API_KEY = "re_test"
    process.env.EMAIL_FROM = "Acme <hello@acme.test>"
    send.mockResolvedValue({ error: null })
    const { sendEmail } = await import("./email-transport")

    const accepted = await sendEmail({
      kind: "contact-message",
      to: "owner@acme.test",
      replyTo: "visitor@example.test",
      subject: "Hi",
      html: "<p>Hi</p>",
    })

    expect(accepted).toBe(true)
    expect(send).toHaveBeenCalledWith({
      from: "Acme <hello@acme.test>",
      to: "owner@acme.test",
      replyTo: "visitor@example.test",
      subject: "Hi",
      html: "<p>Hi</p>",
    })
  })

  it("says false when the provider refuses, without throwing", async () => {
    process.env.RESEND_API_KEY = "re_test"
    send.mockResolvedValue({ error: { name: "validation_error", message: "domain not verified" } })
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { sendEmail } = await import("./email-transport")

    await expect(sendEmail({ kind: "welcome", to: "a@b.test", subject: "s", html: "h" })).resolves.toBe(false)
  })

  it("throws without a key, as before: nothing can be sent", async () => {
    delete process.env.RESEND_API_KEY
    const { sendEmail } = await import("./email-transport")
    await expect(sendEmail({ kind: "welcome", to: "a@b.test", subject: "s", html: "h" })).rejects.toThrow(
      "RESEND_API_KEY is not set"
    )
    expect(send).not.toHaveBeenCalled()
  })
})

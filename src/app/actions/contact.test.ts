import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The contact form is the one place where a refused email has to reach the
 * person: they wrote a message, and if it did not go they need the address to
 * write to instead. Until 2.3.2 a refusal from Resend did not throw, so this
 * form answered "sent" for messages that were lost.
 */

const sendContactMessage = vi.fn()

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string, values?: Record<string, string>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async () => true,
  rateLimitKeyFromIp: async () => "contact:test",
}))
vi.mock("@/lib/email", () => ({ sendContactMessage }))

const { sendContactRequest } = await import("./contact")

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

const message = form({ email: "visitor@example.com", message: "Hello, I would like to know more." })
const idle = { status: "idle" as const }

beforeEach(() => vi.clearAllMocks())

describe("sendContactRequest", () => {
  it("says sent when Resend accepted the message", async () => {
    sendContactMessage.mockResolvedValue(true)
    expect(await sendContactRequest(idle, message)).toEqual({ status: "sent" })
  })

  it("says it failed, with an address to write to, when Resend refused it", async () => {
    sendContactMessage.mockResolvedValue(false)
    const state = await sendContactRequest(idle, message)
    expect(state.status).toBe("error")
    expect(state.error).toContain("contactSendFailed")
  })

  it("says it failed when the send throws, as it did before", async () => {
    sendContactMessage.mockRejectedValue(new Error("RESEND_API_KEY is not set"))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const state = await sendContactRequest(idle, message)
    expect(state.status).toBe("error")
    log.mockRestore()
  })
})

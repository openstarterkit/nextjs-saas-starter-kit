import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The newsletter endpoint answers the same neutral 200 whatever happens, so
 * that nobody can use it to learn who is on the list. 2.3.2 made a refused
 * confirmation visible in the logs; these tests pin that it stayed invisible
 * to the caller, which is the half that matters for privacy.
 */

const prismaMock = {
  newsletterSubscriber: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
}
const sendNewsletterConfirmEmail = vi.fn()

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async () => true,
  rateLimitKeyFromIp: async () => "newsletter:test",
}))
vi.mock("@/lib/email", () => ({ sendNewsletterConfirmEmail }))

const { POST } = await import("./route")

const signup = (email: string) =>
  new Request("http://localhost/api/newsletter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, source: "pricing-card" }),
  })

/** Status and body together: the caller sees nothing else. */
async function answer(response: Response) {
  return { status: response.status, body: await response.json() }
}

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.newsletterSubscriber.create.mockResolvedValue({ confirmToken: "t" })
  prismaMock.newsletterSubscriber.update.mockResolvedValue({ confirmToken: "t" })
})

describe("POST /api/newsletter: the answer never depends on the outcome", () => {
  it("answers a new address whose confirmation Resend refused exactly like an accepted one", async () => {
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(null)

    sendNewsletterConfirmEmail.mockResolvedValue(true)
    const accepted = await answer(await POST(signup("new@example.com")))

    sendNewsletterConfirmEmail.mockResolvedValue(false)
    const refused = await answer(await POST(signup("new@example.com")))

    expect(refused).toEqual(accepted)
    expect(refused).toEqual({ status: 200, body: { ok: true } })
  })

  it("answers an address already confirmed exactly like a new one whose email was refused", async () => {
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue({
      confirmedAt: new Date(),
      unsubscribedAt: null,
    })
    const known = await answer(await POST(signup("known@example.com")))

    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(null)
    sendNewsletterConfirmEmail.mockResolvedValue(false)
    const unknown = await answer(await POST(signup("unknown@example.com")))

    expect(known).toEqual(unknown)
    // The known address gets no email at all: there is nothing to confirm.
    expect(sendNewsletterConfirmEmail).toHaveBeenCalledOnce()
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import Stripe from "stripe"

/**
 * Integration test for the Stripe webhook, with real signatures.
 *
 * This is the "webhooks" line of the roadmap, and it is deliberately not a
 * Playwright test: Stripe signs the request body with STRIPE_WEBHOOK_SECRET,
 * so the thing worth testing is the signature check, and no browser can drive
 * that. Stripe's own SDK generates valid test signatures, so these run in CI
 * with no network, no Stripe account and no browser.
 *
 * What is covered is the gate, not the bookkeeping: a forged or replayed
 * request must never reach the database writes behind it.
 */

const SECRET = "whsec_test_secret"

const prismaMock = {
  user: { findUnique: vi.fn(), update: vi.fn() },
  subscription: { upsert: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn() },
  purchase: { create: vi.fn(), findFirst: vi.fn() },
  plan: { findFirst: vi.fn(), findUnique: vi.fn() },
}

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
vi.mock("@/lib/email", () => ({
  sendSubscriptionWelcomeEmail: vi.fn(),
  sendPurchaseReceiptEmail: vi.fn(),
  sendSubscriptionCancelledEmail: vi.fn(),
  sendPaymentFailedEmail: vi.fn(),
}))

const { POST } = await import("./route")

const original = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_WEBHOOK_SECRET = SECRET
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder"
})

afterEach(() => {
  process.env = { ...original }
})

// Only used to generate signatures locally; it never opens a connection.
const stripe = new Stripe("sk_test_placeholder")

function event(type: string, data: Record<string, unknown> = {}) {
  return JSON.stringify({
    id: "evt_test",
    object: "event",
    type,
    data: { object: data },
  })
}

/** A request signed the way Stripe signs one. */
function signed(payload: string, { secret = SECRET, timestamp = Math.floor(Date.now() / 1000) } = {}) {
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp })
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": header, "content-type": "application/json" },
    body: payload,
  })
}

describe("POST /api/webhooks/stripe: signature gate", () => {
  it("accepts a correctly signed event", async () => {
    const response = await POST(signed(event("customer.subscription.deleted", { id: "sub_1" })) as never)
    expect(response.status).toBe(200)
  })

  it("rejects a body that was tampered with after signing", async () => {
    const payload = event("checkout.session.completed", { id: "cs_1" })
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET })
    const tampered = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": header },
      body: event("checkout.session.completed", { id: "cs_ATTACKER" }),
    })
    const response = await POST(tampered as never)
    expect(response.status).toBe(400)
  })

  it("rejects an event signed with a different secret", async () => {
    const payload = event("customer.subscription.deleted", { id: "sub_1" })
    const response = await POST(signed(payload, { secret: "whsec_wrong" }) as never)
    expect(response.status).toBe(400)
  })

  it("rejects an unsigned request", async () => {
    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: event("customer.subscription.deleted"),
    })
    expect((await POST(request as never)).status).toBe(400)
  })

  // Stripe's tolerance window is what stops a captured request from being
  // replayed later; a signature alone stays valid forever.
  it("rejects a signature older than the tolerance window", async () => {
    const payload = event("customer.subscription.deleted", { id: "sub_1" })
    const oldTimestamp = Math.floor(Date.now() / 1000) - 60 * 60
    const response = await POST(signed(payload, { timestamp: oldTimestamp }) as never)
    expect(response.status).toBe(400)
  })

  it("refuses to process anything when the webhook secret is not configured", async () => {
    const payload = event("customer.subscription.deleted", { id: "sub_1" })
    const request = signed(payload)
    delete process.env.STRIPE_WEBHOOK_SECRET
    expect((await POST(request as never)).status).toBe(400)
  })

  // The point of the gate: nothing behind it runs unless the signature checks out.
  it("never touches the database on a rejected request", async () => {
    await POST(signed(event("checkout.session.completed", { id: "cs_1" }), { secret: "whsec_wrong" }) as never)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
    expect(prismaMock.subscription.upsert).not.toHaveBeenCalled()
    expect(prismaMock.purchase.create).not.toHaveBeenCalled()
  })
})

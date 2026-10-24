import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { APIError } from "better-auth/api"

/**
 * Changing the address the account signs in with (2.2).
 *
 * The library does the two-hop work; what is tested here is what this project
 * adds around it — four refusals and one silence. The silence is the one worth
 * keeping honest: when the new address already belongs to somebody else,
 * Better Auth answers exactly as it does on success, and we must answer the
 * same way too. A settings form that admitted "taken" would be a way to ask
 * which addresses have accounts, which is the property the sign-in page and
 * the password reset both defend.
 *
 * Deleting the account is tested for the order of its refusals: the ones that
 * keep the account have to come before the subscription is cancelled at Stripe.
 */

const changeEmailApi = vi.fn()
const getCurrentUser = vi.fn()
const allowRateLimit = vi.fn()
const findUser = vi.fn()
const countUsers = vi.fn()
const deleteUser = vi.fn()
const cancelSubscription = vi.fn()

vi.mock("@/auth", () => ({
  auth: {
    api: {
      changeEmail: (...a: unknown[]) => changeEmailApi(...a),
      signOut: async () => ({}),
    },
  },
}))
vi.mock("@/lib/auth", () => ({ getCurrentUser: () => getCurrentUser() }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => findUser(...a),
      count: (...a: unknown[]) => countUsers(...a),
      delete: (...a: unknown[]) => deleteUser(...a),
    },
  },
}))
vi.mock("@/lib/stripe", () => ({
  stripe: { subscriptions: { cancel: (...a: unknown[]) => cancelSubscription(...a) } },
}))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => allowRateLimit() }))
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
}))

const { changeEmail, deleteAccount } = await import("./account")

async function redirectOf(run: () => Promise<unknown>): Promise<string> {
  try {
    await run()
  } catch (error) {
    const message = (error as Error).message
    if (message.startsWith("REDIRECT:")) return message.slice("REDIRECT:".length)
    throw error
  }
  throw new Error("the action returned without redirecting")
}

const form = (email: string) => {
  const data = new FormData()
  data.append("email", email)
  return data
}

const demoMode = process.env.DEMO_MODE

beforeEach(() => {
  vi.resetAllMocks()
  allowRateLimit.mockReturnValue(true)
  getCurrentUser.mockResolvedValue({ id: "u1", email: "old@example.com", role: "USER" })
  changeEmailApi.mockResolvedValue({ status: true })
})

afterEach(() => {
  if (demoMode === undefined) delete process.env.DEMO_MODE
  else process.env.DEMO_MODE = demoMode
})

describe("changeEmail", () => {
  it("hands a valid address to the library, lowercased and trimmed", async () => {
    expect(await redirectOf(() => changeEmail(form("  NEW@Example.COM  ")))).toBe(
      "/dashboard/settings?ok=email-sent"
    )
    expect(changeEmailApi).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { newEmail: "new@example.com", callbackURL: "/dashboard/settings" },
      })
    )
  })

  it("refuses something that is not an address, without calling out", async () => {
    expect(await redirectOf(() => changeEmail(form("not-an-email")))).toBe(
      "/dashboard/settings?error=email-invalid"
    )
    expect(changeEmailApi).not.toHaveBeenCalled()
  })

  /** Otherwise you get an email about nothing. */
  it("refuses the address the account already has, whatever its case", async () => {
    expect(await redirectOf(() => changeEmail(form("OLD@example.com")))).toBe(
      "/dashboard/settings?error=email-same"
    )
    expect(changeEmailApi).not.toHaveBeenCalled()
  })

  it("refuses on a demo deployment, where accounts are shared and reset nightly", async () => {
    process.env.DEMO_MODE = "true"
    expect(await redirectOf(() => changeEmail(form("new@example.com")))).toBe(
      "/dashboard/settings?error=demo"
    )
    expect(changeEmailApi).not.toHaveBeenCalled()
  })

  it("stops before the library when the caller is over the limit", async () => {
    allowRateLimit.mockReturnValue(false)
    expect(await redirectOf(() => changeEmail(form("new@example.com")))).toBe(
      "/dashboard/settings?error=rate"
    )
    expect(changeEmailApi).not.toHaveBeenCalled()
  })

  it("keeps one generic outcome when the library refuses", async () => {
    changeEmailApi.mockRejectedValue(new APIError("BAD_REQUEST", { message: "nope" }))
    expect(await redirectOf(() => changeEmail(form("new@example.com")))).toBe(
      "/dashboard/settings?error=email-change"
    )
  })

  /**
   * The library returns `{ status: true }` for an address that is already
   * taken, sending nothing. Our answer has to be indistinguishable from the
   * real success above, or the silence is pointless.
   */
  it("answers an already-taken address exactly as a successful one", async () => {
    changeEmailApi.mockResolvedValue({ status: true })
    const taken = await redirectOf(() => changeEmail(form("taken@example.com")))
    const fresh = await redirectOf(() => changeEmail(form("fresh@example.com")))
    expect(taken).toBe(fresh)
  })
})

describe("deleteAccount", () => {
  const confirm = (email: string) => {
    const data = new FormData()
    data.append("confirm", email)
    return data
  }
  const live = { status: "ACTIVE", stripeSubscriptionId: "sub_1" }

  beforeEach(() => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "me@example.com", role: "ADMIN" })
    cancelSubscription.mockResolvedValue({})
    deleteUser.mockResolvedValue({})
  })

  /**
   * The refusal keeps the account, so it has to keep the subscription too: an
   * admin told "you are the last one" must not find their plan cancelled.
   */
  it("refuses the last admin before touching the subscription", async () => {
    findUser.mockResolvedValue({ email: "me@example.com", role: "ADMIN", subscription: live })
    countUsers.mockResolvedValue(1)
    expect(await redirectOf(() => deleteAccount(confirm("me@example.com")))).toBe(
      "/dashboard/settings?error=last-admin"
    )
    expect(cancelSubscription).not.toHaveBeenCalled()
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it("cancels a live subscription, then deletes, when another admin remains", async () => {
    findUser.mockResolvedValue({ email: "me@example.com", role: "ADMIN", subscription: live })
    countUsers.mockResolvedValue(2)
    expect(await redirectOf(() => deleteAccount(confirm("ME@example.com")))).toBe("/")
    expect(cancelSubscription).toHaveBeenCalledWith("sub_1")
    expect(deleteUser).toHaveBeenCalledWith({ where: { id: "u1" } })
  })

  it("deletes nothing when Stripe refuses the cancel", async () => {
    findUser.mockResolvedValue({ email: "me@example.com", role: "USER", subscription: live })
    cancelSubscription.mockRejectedValue(Object.assign(new Error("down"), { code: "api_error" }))
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(await redirectOf(() => deleteAccount(confirm("me@example.com")))).toBe(
      "/dashboard/settings?error=subscription"
    )
    expect(deleteUser).not.toHaveBeenCalled()
  })
})

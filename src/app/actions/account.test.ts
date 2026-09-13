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
 */

const changeEmailApi = vi.fn()
const getCurrentUser = vi.fn()
const allowRateLimit = vi.fn()

vi.mock("@/auth", () => ({
  auth: { api: { changeEmail: (...a: unknown[]) => changeEmailApi(...a) } },
}))
vi.mock("@/lib/auth", () => ({ getCurrentUser: () => getCurrentUser() }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/lib/prisma", () => ({ prisma: {} }))
vi.mock("@/lib/stripe", () => ({ stripe: {} }))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => allowRateLimit() }))
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
}))

const { changeEmail } = await import("./account")

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

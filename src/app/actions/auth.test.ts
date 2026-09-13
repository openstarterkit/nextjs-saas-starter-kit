import { describe, expect, it, vi, beforeEach } from "vitest"
import { APIError } from "better-auth/api"

/**
 * The sign-in branches that two-factor authentication added (2.2).
 *
 * The one that matters most is the first: with 2FA on, the password call
 * returns `twoFactorRedirect` and creates NO session. A version of this action
 * that ignored the answer would send the user to /dashboard signed out — no
 * error anywhere, nothing in a log, and the same shape of quiet failure the
 * kit already shipped once in 2.0.2. It is cheap to assert and impossible to
 * notice by reading.
 */

const signInEmail = vi.fn()
const signInMagicLink = vi.fn()
const verifyTOTP = vi.fn()
const verifyBackupCode = vi.fn()
const findUnique = vi.fn()
const allowRateLimit = vi.fn()

vi.mock("@/auth", () => ({
  auth: {
    api: {
      signInEmail: (...a: unknown[]) => signInEmail(...a),
      signInMagicLink: (...a: unknown[]) => signInMagicLink(...a),
      verifyTOTP: (...a: unknown[]) => verifyTOTP(...a),
      verifyBackupCode: (...a: unknown[]) => verifyBackupCode(...a),
    },
  },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: (...a: unknown[]) => findUnique(...a) } },
}))
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => allowRateLimit(),
  rateLimitKeyFromIp: async (scope: string) => `${scope}:test`,
}))

// redirect() works by throwing, which is exactly what the actions rely on.
// Reproducing that here is what makes "returns before sending" testable.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
}))

const {
  signInWithPassword,
  signInWithMagicLink,
  verifyTwoFactorCode,
  verifyTwoFactorBackupCode,
} = await import("./auth")

/** Runs the action and returns the path it redirected to. */
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

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [k, v] of Object.entries(fields)) data.append(k, v)
  return data
}

beforeEach(() => {
  vi.resetAllMocks()
  allowRateLimit.mockReturnValue(true)
  signInEmail.mockResolvedValue({ token: "t", user: { id: "u1" } })
  findUnique.mockResolvedValue({ twoFactorEnabled: false })
})

describe("signInWithPassword", () => {
  it("goes to the dashboard when the account has no second factor", async () => {
    expect(await redirectOf(() => signInWithPassword(form({ email: "a@b.co", password: "pw" })))).toBe(
      "/dashboard"
    )
  })

  it("goes to /2fa when the library asks for a second factor instead of opening a session", async () => {
    signInEmail.mockResolvedValue({ twoFactorRedirect: true })
    expect(await redirectOf(() => signInWithPassword(form({ email: "a@b.co", password: "pw" })))).toBe(
      "/2fa"
    )
  })

  it("keeps one generic error for every credential failure", async () => {
    signInEmail.mockRejectedValue(new APIError("UNAUTHORIZED", { message: "nope" }))
    expect(await redirectOf(() => signInWithPassword(form({ email: "a@b.co", password: "pw" })))).toBe(
      "/login?error=credentials"
    )
  })

  it("lowercases and trims the address before handing it over", async () => {
    await redirectOf(() => signInWithPassword(form({ email: "  A@B.CO  ", password: "pw" })))
    expect(signInEmail).toHaveBeenCalledWith(
      expect.objectContaining({ body: { email: "a@b.co", password: "pw" } })
    )
  })
})

describe("signInWithMagicLink", () => {
  it("sends the link when the account has no second factor", async () => {
    expect(await redirectOf(() => signInWithMagicLink(form({ email: "a@b.co" })))).toBe(
      "/verify-request"
    )
    expect(signInMagicLink).toHaveBeenCalled()
  })

  /**
   * The hole this closes: Better Auth applies the second factor to
   * /sign-in/email only, so a magic link would sign a 2FA account straight in
   * without ever asking the authenticator.
   */
  it("does not send a link to an account with two-factor on", async () => {
    findUnique.mockResolvedValue({ twoFactorEnabled: true })
    await redirectOf(() => signInWithMagicLink(form({ email: "a@b.co" })))
    expect(signInMagicLink).not.toHaveBeenCalled()
  })

  it("answers identically either way, so it cannot be asked who has 2FA", async () => {
    const without = await redirectOf(() => signInWithMagicLink(form({ email: "a@b.co" })))
    findUnique.mockResolvedValue({ twoFactorEnabled: true })
    const with2fa = await redirectOf(() => signInWithMagicLink(form({ email: "a@b.co" })))
    findUnique.mockResolvedValue(null)
    const unknown = await redirectOf(() => signInWithMagicLink(form({ email: "nobody@b.co" })))
    expect(with2fa).toBe(without)
    expect(unknown).toBe(without)
  })
})

describe("verifyTwoFactorCode", () => {
  it("opens the dashboard once the code checks out", async () => {
    expect(await redirectOf(() => verifyTwoFactorCode(form({ code: "123456" })))).toBe("/dashboard")
  })

  it("accepts a code typed with spaces", async () => {
    await redirectOf(() => verifyTwoFactorCode(form({ code: "123 456" })))
    expect(verifyTOTP).toHaveBeenCalledWith(expect.objectContaining({ body: { code: "123456" } }))
  })

  it("says the same thing for a wrong code and an expired challenge", async () => {
    verifyTOTP.mockRejectedValue(new APIError("BAD_REQUEST", { message: "invalid" }))
    expect(await redirectOf(() => verifyTwoFactorCode(form({ code: "000000" })))).toBe(
      "/2fa?error=code"
    )
  })

  it("stops before the library when the caller is over the limit", async () => {
    allowRateLimit.mockReturnValue(false)
    expect(await redirectOf(() => verifyTwoFactorCode(form({ code: "123456" })))).toBe(
      "/2fa?error=rate"
    )
    expect(verifyTOTP).not.toHaveBeenCalled()
  })
})

describe("verifyTwoFactorBackupCode", () => {
  /**
   * Deliberately not the dashboard. Spending a backup code means one fewer way
   * back in, and the person who just did it is the one least likely to know
   * how many are left, so the sign-in ends in front of the button that makes
   * more.
   */
  it("lands in settings, with the code marked as spent", async () => {
    expect(await redirectOf(() => verifyTwoFactorBackupCode(form({ code: "abcd-efgh" })))).toBe(
      "/dashboard/settings?ok=backup-used"
    )
  })

  /**
   * The Copy button on the card takes all ten, so pasting all ten is the most
   * likely thing a person does here. "Wrong code" would be true and would send
   * them looking for the wrong problem.
   */
  it("recognises the whole list being pasted, and says so", async () => {
    const wholeList = "43Z84-C8X66 XHFW5-Z23U2 FKAJ5-MC8BP 5LLBC-6ZQP6"
    expect(await redirectOf(() => verifyTwoFactorBackupCode(form({ code: wholeList })))).toBe(
      "/2fa?mode=backup&error=multiple"
    )
    expect(verifyBackupCode).not.toHaveBeenCalled()
  })

  it("does not mistake one badly typed code for the whole list", async () => {
    verifyBackupCode.mockRejectedValue(new APIError("BAD_REQUEST", { message: "invalid" }))
    expect(await redirectOf(() => verifyTwoFactorBackupCode(form({ code: "43Z84-C8X6" })))).toBe(
      "/2fa?mode=backup&error=backup"
    )
  })

  it("stays on the backup form when the code is wrong or already spent", async () => {
    verifyBackupCode.mockRejectedValue(new APIError("BAD_REQUEST", { message: "invalid" }))
    expect(await redirectOf(() => verifyTwoFactorBackupCode(form({ code: "nope" })))).toBe(
      "/2fa?mode=backup&error=backup"
    )
  })
})

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { APIError } from "better-auth/api"

/**
 * The refusals around two-factor setup (2.2).
 *
 * The demo one is the reason this file exists. Demo deployments sign every
 * visitor into the same seeded account and a cron resets it overnight; a second
 * factor bound to that account would survive just long enough to lock the next
 * visitor out of the showcase, and the person it happens to is the one who
 * cared enough to try the newest feature.
 */

const enableTwoFactor = vi.fn()
const generateBackupCodes = vi.fn()
const getCurrentUser = vi.fn()

vi.mock("@/auth", () => ({
  auth: {
    api: {
      enableTwoFactor: (...a: unknown[]) => enableTwoFactor(...a),
      generateBackupCodes: (...a: unknown[]) => generateBackupCodes(...a),
      verifyTOTP: vi.fn(),
      disableTwoFactor: vi.fn(),
    },
  },
}))
vi.mock("@/lib/auth", () => ({ getCurrentUser: () => getCurrentUser() }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => true }))
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
}))

const { startTwoFactorSetup, regenerateBackupCodes } = await import("./two-factor")

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [k, v] of Object.entries(fields)) data.append(k, v)
  return data
}

const demoMode = process.env.DEMO_MODE

beforeEach(() => {
  vi.resetAllMocks()
  getCurrentUser.mockResolvedValue({ id: "u1", role: "USER" })
  enableTwoFactor.mockResolvedValue({
    method: "totp",
    totpURI: "otpauth://totp/Acme:a@b.co?secret=JBSWY3DPEHPK3PXP&issuer=Acme",
    backupCodes: ["aaaa-bbbb", "cccc-dddd"],
  })
  generateBackupCodes.mockResolvedValue({ backupCodes: ["eeee-ffff"] })
})

afterEach(() => {
  if (demoMode === undefined) delete process.env.DEMO_MODE
  else process.env.DEMO_MODE = demoMode
})

describe("startTwoFactorSetup", () => {
  it("returns the pairing data, with the secret pulled out for manual entry", async () => {
    const state = await startTwoFactorSetup({}, form({ password: "pw" }))
    expect(state.setup?.secret).toBe("JBSWY3DPEHPK3PXP")
    expect(state.setup?.backupCodes).toHaveLength(2)
    expect(state.setup?.qrSvg).toContain("<svg")
  })

  it("asks for the authenticator flavour explicitly, not the default", async () => {
    await startTwoFactorSetup({}, form({ password: "pw" }))
    expect(enableTwoFactor).toHaveBeenCalledWith(
      expect.objectContaining({ body: { password: "pw", method: "totp" } })
    )
  })

  it("refuses on a demo deployment without touching the library", async () => {
    process.env.DEMO_MODE = "true"
    expect(await startTwoFactorSetup({}, form({ password: "pw" }))).toEqual({ error: "demo" })
    expect(enableTwoFactor).not.toHaveBeenCalled()
  })

  it("does not call out with an empty password", async () => {
    expect(await startTwoFactorSetup({}, form({ password: "" }))).toEqual({ error: "password" })
    expect(enableTwoFactor).not.toHaveBeenCalled()
  })

  it("reports a wrong password as a wrong password, and nothing more", async () => {
    enableTwoFactor.mockRejectedValue(new APIError("BAD_REQUEST", { message: "invalid password" }))
    expect(await startTwoFactorSetup({}, form({ password: "wrong" }))).toEqual({ error: "password" })
  })
})

describe("regenerateBackupCodes", () => {
  it("hands back the new set", async () => {
    const state = await regenerateBackupCodes({}, form({ password: "pw" }))
    expect(state.backupCodes).toEqual(["eeee-ffff"])
  })

  it("is refused on a demo deployment too", async () => {
    process.env.DEMO_MODE = "true"
    expect(await regenerateBackupCodes({}, form({ password: "pw" }))).toEqual({ error: "demo" })
    expect(generateBackupCodes).not.toHaveBeenCalled()
  })
})

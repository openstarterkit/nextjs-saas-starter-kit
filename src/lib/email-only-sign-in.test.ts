import { describe, expect, it } from "vitest"
import { refusesEmailOnlySession } from "./email-only-sign-in"

/**
 * One refusal, and the cases around it that must keep working: a rule like
 * this fails in both directions, too loose and the second factor is
 * decorative, too strict and nobody without 2FA can use the magic link.
 */
describe("refusesEmailOnlySession", () => {
  it("refuses a magic link session for a 2FA account", () => {
    expect(refusesEmailOnlySession({ path: "/magic-link/verify", twoFactorEnabled: true })).toBe(true)
  })

  it("refuses the auto sign-in after email verification for a 2FA account", () => {
    expect(refusesEmailOnlySession({ path: "/verify-email", twoFactorEnabled: true })).toBe(true)
  })

  it("allows the magic link for an account without 2FA", () => {
    expect(refusesEmailOnlySession({ path: "/magic-link/verify", twoFactorEnabled: false })).toBe(false)
  })

  it("allows the auto sign-in after verification for an account without 2FA", () => {
    expect(refusesEmailOnlySession({ path: "/verify-email", twoFactorEnabled: false })).toBe(false)
  })

  it("leaves the second-factor step alone: that session comes after the code", () => {
    expect(refusesEmailOnlySession({ path: "/two-factor/verify-totp", twoFactorEnabled: true })).toBe(false)
  })

  it("leaves sessions created outside a request alone", () => {
    expect(refusesEmailOnlySession({ path: undefined, twoFactorEnabled: true })).toBe(false)
  })
})

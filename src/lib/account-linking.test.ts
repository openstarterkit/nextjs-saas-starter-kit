import { describe, expect, it } from "vitest"
import { refusesAutomaticLink, type LinkAttempt } from "./account-linking"

/**
 * Four booleans, and only one combination is refused. These tests exist to
 * pin down the three that are NOT: a rule of this kind fails badly in both
 * directions — too loose and the second factor is decorative, too strict and
 * people cannot connect a provider they actually want.
 */

const attempt = (over: Partial<LinkAttempt> = {}): LinkAttempt => ({
  method: "oauth",
  action: "link-account",
  twoFactorEnabled: true,
  hasOwnSession: false,
  ...over,
})

describe("refusesAutomaticLink", () => {
  /**
   * The hole: somebody controlling a Google account with the same address
   * presses "Continue with Google" and is attached to an account they cannot
   * otherwise enter, bypassing a second factor its owner turned on.
   */
  it("refuses a provider attaching itself at sign-in to a 2FA account", () => {
    expect(refusesAutomaticLink(attempt())).toBe(true)
  })

  it("allows connecting a provider from Settings, where a session proves who is asking", () => {
    expect(refusesAutomaticLink(attempt({ hasOwnSession: true }))).toBe(false)
  })

  /** T1: no TOTP on top of Google for people who chose Google. */
  it("allows signing in with a provider that is already linked", () => {
    expect(refusesAutomaticLink(attempt({ action: "sign-in" }))).toBe(false)
  })

  it("allows a brand new account created through the provider", () => {
    expect(refusesAutomaticLink(attempt({ action: "create-user" }))).toBe(false)
  })

  it("leaves accounts without a second factor exactly as they were", () => {
    expect(refusesAutomaticLink(attempt({ twoFactorEnabled: false }))).toBe(false)
  })

  it("does not interfere with anything that is not OAuth", () => {
    for (const method of ["email-password", "magic-link", "email-otp"]) {
      expect(refusesAutomaticLink(attempt({ method }))).toBe(false)
    }
  })
})

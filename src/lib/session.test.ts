import { describe, expect, it } from "vitest"
import { isSessionCheckDue, verifySession, SESSION_RECHECK_MS } from "@/lib/session"

const NOW = 1_700_000_000_000

describe("isSessionCheckDue", () => {
  it("holds off inside the window", () => {
    expect(isSessionCheckDue({ svAt: NOW - 1_000 }, NOW)).toBe(false)
  })

  it("comes due once the window has passed", () => {
    expect(isSessionCheckDue({ svAt: NOW - SESSION_RECHECK_MS - 1 }, NOW)).toBe(true)
  })

  it("comes due for a token that has never been checked", () => {
    // A token minted before this mechanism existed carries no svAt, and must
    // not be trusted forever on the strength of a missing field.
    expect(isSessionCheckDue({}, NOW)).toBe(true)
  })
})

describe("verifySession", () => {
  it("kills the session of a user that no longer exists", () => {
    expect(verifySession({ sv: 1 }, null, NOW)).toEqual({ keep: false })
  })

  it("kills the session when sessionVersion has moved", () => {
    // This is what a password reset does: every other session goes with it.
    const verdict = verifySession({ role: "ADMIN", sv: 1 }, { role: "ADMIN", sessionVersion: 2 }, NOW)
    expect(verdict).toEqual({ keep: false })
  })

  it("keeps the session and stamps the check time when the version matches", () => {
    const verdict = verifySession({ role: "USER", sv: 3 }, { role: "USER", sessionVersion: 3 }, NOW)
    expect(verdict).toEqual({ keep: true, role: "USER", checkedAt: NOW })
  })

  /**
   * The regression this module was extracted for.
   *
   * The role used to be stamped once, at sign-in, and never read again: the
   * check that ran every minute selected sessionVersion alone. Changing a role
   * in the database therefore did nothing until the person signed out, which
   * with a 30 day token could be a month. Both directions were broken, and the
   * one people met first was promotion, because "Make Admin" is the documented
   * way to create the first admin of a deployment.
   */
  it("takes the role from the database when a user has been promoted", () => {
    const verdict = verifySession({ role: "USER", sv: 1 }, { role: "ADMIN", sessionVersion: 1 }, NOW)
    expect(verdict).toEqual({ keep: true, role: "ADMIN", checkedAt: NOW })
  })

  it("takes the role from the database when a user has been demoted", () => {
    // The privileges have to go away without the token being invalidated:
    // bumping sessionVersion would work too, but it signs the person out.
    const verdict = verifySession({ role: "ADMIN", sv: 1 }, { role: "USER", sessionVersion: 1 }, NOW)
    expect(verdict).toEqual({ keep: true, role: "USER", checkedAt: NOW })
  })
})

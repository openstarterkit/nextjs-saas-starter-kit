import { describe, expect, it } from "vitest"
import { blockedOnDemo } from "./demo-api-paths"

describe("blockedOnDemo", () => {
  it.each([
    "/list-sessions",
    "/revoke-session",
    "/revoke-sessions",
    "/revoke-other-sessions",
    "/delete-user",
    "/change-email",
    "/change-password",
    "/sign-up/email",
    "/request-password-reset",
    "/reset-password",
    "/two-factor/enable",
    "/two-factor/disable",
    "/two-factor/generate-backup-codes",
  ])("refuses %s, which the demo's actions already refuse", (path) => {
    expect(blockedOnDemo(path)).toBe(true)
  })

  it.each(["/get-session", "/sign-out", "/demo-login/sign-in", "/sign-in/email", "/update-user"])(
    "leaves %s open, so the demo still signs in, reads and signs out",
    (path) => {
      expect(blockedOnDemo(path)).toBe(false)
    }
  )
})

import { describe, expect, it } from "vitest"
import { CONSENT_MAX_AGE, mayLoad, parseConsent } from "./consent"

describe("parseConsent", () => {
  it("reads the stored choice wherever it sits in the cookie string", () => {
    expect(parseConsent("cookie_consent=accepted")).toBe("accepted")
    expect(parseConsent("theme=dark; cookie_consent=rejected; other=1")).toBe("rejected")
  })

  it("is null when there is no choice, or the value is not one we write", () => {
    expect(parseConsent("")).toBeNull()
    expect(parseConsent("theme=dark")).toBeNull()
    expect(parseConsent("cookie_consent=yes")).toBeNull()
    expect(parseConsent("cookie_consent=accepted-ish")).toBeNull()
  })

  it("does not mistake a cookie with a longer name for ours", () => {
    expect(parseConsent("my_cookie_consent=accepted")).toBeNull()
  })
})

describe("mayLoad", () => {
  it("gates nothing while consent is off", () => {
    expect(mayLoad(false, null)).toBe(true)
    expect(mayLoad(false, "rejected")).toBe(true)
  })

  it("loads only after an explicit yes once consent is on", () => {
    expect(mayLoad(true, null)).toBe(false)
    expect(mayLoad(true, "rejected")).toBe(false)
    expect(mayLoad(true, "accepted")).toBe(true)
  })
})

it("keeps the choice for about six months, never longer", () => {
  const days = CONSENT_MAX_AGE / 86400
  expect(days).toBeGreaterThanOrEqual(180)
  expect(days).toBeLessThanOrEqual(183)
})

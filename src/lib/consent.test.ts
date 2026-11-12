import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  mayLoad,
  openConsentSettings,
  parseConsent,
  readConsent,
  subscribeConsent,
  subscribeConsentOpen,
  writeConsent,
} from "./consent"

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

describe("in the browser", () => {
  // A minimal browser: one cookie jar and an event target are all the module touches.
  let jar: string[]
  beforeEach(() => {
    jar = []
    const target = new EventTarget()
    vi.stubGlobal("window", Object.assign(target, { location: { protocol: "https:" } }))
    vi.stubGlobal("document", {
      get cookie() {
        return jar.map((c) => c.split(";")[0]).join("; ")
      },
      set cookie(value: string) {
        jar = [...jar.filter((c) => !c.startsWith(value.split("=")[0] + "=")), value]
      },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("stores the choice as a technical cookie for six months, secure on https", () => {
    writeConsent("accepted")
    const set = jar.find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    expect(set).toContain(`${CONSENT_COOKIE}=accepted`)
    expect(set).toContain(`Max-Age=${CONSENT_MAX_AGE}`)
    expect(set).toContain("SameSite=Lax")
    expect(set).toContain("Secure")
    expect(readConsent()).toBe("accepted")
  })

  it("tells subscribers when the choice changes, and stops when they leave", () => {
    const seen: string[] = []
    const stop = subscribeConsent(() => seen.push(readConsent() ?? "none"))
    writeConsent("rejected")
    stop()
    writeConsent("accepted")
    expect(seen).toEqual(["rejected"])
  })

  it("reopens the banner from Cookie settings", () => {
    let opened = 0
    const stop = subscribeConsentOpen(() => opened++)
    openConsentSettings()
    stop()
    openConsentSettings()
    expect(opened).toBe(1)
  })
})


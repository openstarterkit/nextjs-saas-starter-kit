import { describe, expect, it } from "vitest"
import { describeUserAgent, formatDevice, formatIpAddress } from "./user-agent"

/**
 * The ordering cases are the ones worth having. Every modern user agent lies
 * about being something else — Edge says Chrome, Chrome says Safari — so a
 * naive "does it contain Chrome" check reports the wrong browser for a large
 * share of real visitors, and nobody would notice from the code alone.
 */

const UA = {
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
  chromeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  curl: "curl/8.4.0",
}

describe("describeUserAgent", () => {
  it("does not call Edge Chrome, even though Edge says Chrome", () => {
    expect(describeUserAgent(UA.edge)).toEqual({ browser: "Edge", platform: "Windows" })
  })

  it("does not call Chrome Safari, even though Chrome says Safari", () => {
    expect(describeUserAgent(UA.chromeWindows)).toEqual({ browser: "Chrome", platform: "Windows" })
  })

  it("recognises Safari when it really is Safari", () => {
    expect(describeUserAgent(UA.safariMac)).toEqual({ browser: "Safari", platform: "macOS" })
  })

  it("prefers iOS over macOS on an iPhone, which claims both", () => {
    expect(describeUserAgent(UA.safariIphone)).toEqual({ browser: "Safari", platform: "iOS" })
  })

  it("prefers Android over Linux, which it also claims", () => {
    expect(describeUserAgent(UA.chromeAndroid)).toEqual({ browser: "Chrome", platform: "Android" })
  })

  it("reads Firefox on Linux", () => {
    expect(describeUserAgent(UA.firefoxLinux)).toEqual({ browser: "Firefox", platform: "Linux" })
  })

  /** Better to say nothing than to invent a device. */
  it("returns null for something it does not recognise", () => {
    expect(describeUserAgent(UA.curl)).toBeNull()
    expect(describeUserAgent("")).toBeNull()
    expect(describeUserAgent(null)).toBeNull()
  })
})

describe("formatDevice", () => {
  it("reads as a sentence", () => {
    expect(formatDevice(UA.chromeWindows)).toBe("Chrome on Windows")
  })

  it("gives whichever half it has", () => {
    expect(formatDevice("Mozilla/5.0 (Windows NT 10.0)")).toBe("Windows")
  })

  it("stays null when it knows nothing", () => {
    expect(formatDevice(UA.curl)).toBeNull()
  })
})

describe("formatIpAddress", () => {
  /** What local development writes into every row. */
  it("hides loopback addresses instead of printing noise", () => {
    for (const ip of ["::1", "127.0.0.1", "0000:0000:0000:0000:0000:0000:0000:0000", "0:0:0:0:0:0:0:1"]) {
      expect(formatIpAddress(ip)).toBeNull()
    }
  })

  it("keeps a real address", () => {
    expect(formatIpAddress("203.0.113.7")).toBe("203.0.113.7")
    expect(formatIpAddress("2001:db8::1")).toBe("2001:db8::1")
  })

  it("treats empty and missing the same way", () => {
    expect(formatIpAddress("   ")).toBeNull()
    expect(formatIpAddress(null)).toBeNull()
  })
})

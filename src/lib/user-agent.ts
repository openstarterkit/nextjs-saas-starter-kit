/**
 * A user agent string, turned into something a person recognises.
 *
 * Deliberately small, and deliberately not a library. Matching user agents
 * exhaustively is a losing game — the strings lie by design, Chrome still
 * claims to be Safari and Mozilla — and the job here is narrow: help somebody
 * looking at their own session list answer "is that me?". For that, "Chrome on
 * Windows" is enough, and being wrong about an obscure browser costs nothing.
 *
 * What it must not do is pretend to more certainty than it has, which is why
 * anything unrecognised comes back as null and the UI says so plainly instead
 * of inventing a device.
 */

type Match = { pattern: RegExp; name: string }

// Order matters, and this is the whole trick: Edge and Opera both contain
// "Chrome", and Chrome contains "Safari". Most specific first.
const BROWSERS: Match[] = [
  { pattern: /Edg[A-Z]?\//, name: "Edge" },
  { pattern: /OPR\/|Opera/, name: "Opera" },
  { pattern: /Firefox\//, name: "Firefox" },
  { pattern: /Chrome\//, name: "Chrome" },
  { pattern: /Safari\//, name: "Safari" },
]

const PLATFORMS: Match[] = [
  { pattern: /iPhone|iPad|iPod/, name: "iOS" },
  { pattern: /Android/, name: "Android" },
  { pattern: /Windows NT/, name: "Windows" },
  { pattern: /Mac OS X|Macintosh/, name: "macOS" },
  { pattern: /Linux/, name: "Linux" },
]

export type DeviceDescription = {
  browser: string | null
  platform: string | null
}

export function describeUserAgent(userAgent?: string | null): DeviceDescription | null {
  if (!userAgent) return null
  const browser = BROWSERS.find((b) => b.pattern.test(userAgent))?.name ?? null
  const platform = PLATFORMS.find((p) => p.pattern.test(userAgent))?.name ?? null
  if (!browser && !platform) return null
  return { browser, platform }
}

/**
 * The same thing as one line of text. Kept beside the parser because the two
 * change together, and because "Chrome on Windows" reads better than a table
 * cell with two columns, one of which is often empty.
 */
export function formatDevice(userAgent?: string | null): string | null {
  const device = describeUserAgent(userAgent)
  if (!device) return null
  if (device.browser && device.platform) return `${device.browser} on ${device.platform}`
  return device.browser ?? device.platform
}

/**
 * An IP worth showing. Loopback addresses are what local development produces,
 * and printing `::1` or a row of zeroes to somebody checking their sessions is
 * noise dressed as information.
 */
export function formatIpAddress(ip?: string | null): string | null {
  if (!ip) return null
  const trimmed = ip.trim()
  if (!trimmed) return null
  const loopback = ["::1", "127.0.0.1", "0:0:0:0:0:0:0:1", "0000:0000:0000:0000:0000:0000:0000:0000"]
  if (loopback.includes(trimmed) || /^0+(:0+)*$/.test(trimmed)) return null
  return trimmed
}

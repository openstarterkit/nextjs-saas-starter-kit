import { describe, it, expect, vi, beforeEach } from "vitest"

// The parser reads one file at module scope; the mock lets us feed it a
// changelog we control instead of asserting against the real one, which
// changes at every release.
const readFileSync = vi.fn()
vi.mock("node:fs", () => ({ default: { readFileSync: (...args: unknown[]) => readFileSync(...args) } }))

const { getChangelog } = await import("@/lib/changelog")

const CHANGELOG = `# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

### Added
- Something in progress

## [1.3.0] - 2026-07-24

### Added
- Waitlist with double opt-in

### Fixed
- Sitemap no longer lists private routes

## [1.2.0] - 2026-07-16

### Changed
- Reworked the pricing page

[1.3.0]: https://github.com/example/repo/releases/tag/v1.3.0
[1.2.0]: https://github.com/example/repo/releases/tag/v1.2.0
`

describe("getChangelog", () => {
  beforeEach(() => {
    readFileSync.mockReset()
    readFileSync.mockReturnValue(CHANGELOG)
  })

  it("splits every release section, newest first", () => {
    const { releases } = getChangelog()
    expect(releases.map((r) => r.version)).toEqual(["Unreleased", "1.3.0", "1.2.0"])
  })

  it("reads the date from the heading, and null when there is none", () => {
    const { releases } = getChangelog()
    expect(releases[0].date).toBeNull()
    expect(releases[1].date).toBe("2026-07-24")
  })

  it("keeps each release body within its own section", () => {
    const { releases } = getChangelog()
    expect(releases[1].body).toContain("Waitlist with double opt-in")
    expect(releases[1].body).toContain("Sitemap no longer lists private routes")
    // The next release's content must not bleed into this one.
    expect(releases[1].body).not.toContain("Reworked the pricing page")
  })

  // The regression this guards: link-reference definitions are invisible in
  // rendered Markdown but would show up as stray text at the end of the last
  // release if they were not stripped first.
  it("strips the trailing link references", () => {
    const { releases } = getChangelog()
    const last = releases[releases.length - 1]
    expect(last.body).not.toContain("https://github.com")
    expect(last.body).toBe("### Changed\n- Reworked the pricing page")
  })

  it("returns the intro without the H1, which the page renders itself", () => {
    const { intro } = getChangelog()
    expect(intro).toBe("All notable changes to this project are documented here.")
  })

  it("handles a file with no releases yet", () => {
    readFileSync.mockReturnValue("# Changelog\n\nNothing released so far.\n")
    const { intro, releases } = getChangelog()
    expect(releases).toEqual([])
    expect(intro).toBe("Nothing released so far.")
  })
})

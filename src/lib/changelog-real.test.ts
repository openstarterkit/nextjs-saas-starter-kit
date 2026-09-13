import { describe, it, expect, beforeAll, vi } from "vitest"
import fs from "node:fs"
import path from "node:path"
import type { Changelog } from "@/lib/changelog"

/**
 * The repository's own CHANGELOG.md, parsed.
 *
 * The other changelog tests run against fixtures, which is right for the
 * parser but leaves the real file unchecked: it only renders when
 * KIT_SITE="true", so a release entry with a malformed heading would ship and
 * be found by a reader instead of by the build. This asserts the file the
 * release actually carries, and that it leads with the version the kit
 * declares, which is the one number a release can leave behind.
 *
 * KIT_SITE is stubbed and the module re-imported because `isKitSite` is read
 * once, at module load, to choose between this file and the example changelog
 * a clone ships.
 */
describe("the repository CHANGELOG", () => {
  let changelog: Changelog

  beforeAll(async () => {
    vi.stubEnv("KIT_SITE", "true")
    vi.resetModules()
    const { getChangelog } = await import("@/lib/changelog")
    changelog = getChangelog()
  })

  it("parses, newest release first", () => {
    expect(changelog.releases.length).toBeGreaterThan(10)
    expect(changelog.releases[0].version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it("leads with the version the kit declares", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"))
    expect(changelog.releases[0].version).toBe(pkg.version)
  })

  it("gives every release a date and a body", () => {
    for (const r of changelog.releases) {
      expect(r.date, `${r.version} has no date`).toBeTruthy()
      expect(r.body.trim().length, `${r.version} has an empty body`).toBeGreaterThan(0)
    }
  })
})

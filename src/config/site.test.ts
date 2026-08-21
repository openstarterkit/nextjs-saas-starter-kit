import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { siteConfig } from "@/config/site"

/**
 * The version is declared in three places, and nothing used to compare them.
 *
 * `package.json` is the number npm sees, `siteConfig.version` is the number
 * the app serves at `/api/health`, and `package-lock.json` carries its own
 * copy that **npm does not update when you edit `package.json`**. The release
 * smoke catches a stale `site.ts` because it calls the health endpoint, but
 * nothing looked at the lockfile: it said 1.6.0 at the 1.6.2 release and 1.6.2
 * at the 1.6.3 one, in a file the public repository shows to anyone.
 *
 * No technical impact, npm treats it as metadata. It is a number that lies,
 * in the file people open to check what a project actually depends on.
 *
 * If this fails after a version bump, the fix is `npm install --package-lock-only`
 * and committing the result.
 */
const ROOT = process.cwd()
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"))

describe("declared version", () => {
  const pkg = read("package.json")
  const lock = read("package-lock.json")

  it("matches between package.json and the app config", () => {
    expect(siteConfig.version).toBe(pkg.version)
  })

  it("matches in package-lock.json, which npm will not update on its own", () => {
    expect(lock.version).toBe(pkg.version)
    // The lockfile repeats it inside the root package entry, and that copy is
    // the one npm actually reads back.
    expect(lock.packages[""].version).toBe(pkg.version)
  })
})

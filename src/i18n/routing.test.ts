import { describe, expect, it } from "vitest"
import { routing } from "./routing"

/**
 * These tests exist for one reason, and it is not tidiness.
 *
 * The private areas are matched by prefix in `src/proxy.ts`. If a locale
 * segment could appear in front of them, `/it/dashboard` would not start with
 * `/dashboard` and would stop looking protected. The design answer is that
 * those URLs do not exist at all, because the route groups live outside
 * `src/app/[locale]/`.
 *
 * That property is easy to break later by moving a folder, and nothing else
 * would notice: the build stays green and the page renders. These tests pin
 * the two halves of it.
 */
describe("locale routing", () => {
  it("keeps English URLs unprefixed so existing links do not move", () => {
    expect(routing.localePrefix).toBe("as-needed")
    expect(routing.defaultLocale).toBe("en")
  })

  it("never redirects on browser headers, so a shared link opens the same for everyone", () => {
    expect(routing.localeDetection).toBe(false)
  })

  it("declares exactly the locales that have a message file", async () => {
    const { existsSync } = await import("node:fs")
    const { join } = await import("node:path")
    expect([...routing.locales]).toEqual(["en", "it"])
    // The list and the folder have to agree in both directions. A locale with
    // no file is a 500 the first time somebody opens its URL, and the array on
    // its own cannot tell you that: it was green for a day while `it.json` did
    // not exist yet.
    for (const locale of routing.locales) {
      const file = join(process.cwd(), "src", "locales", `${locale}.json`)
      expect(existsSync(file), `missing src/locales/${locale}.json`).toBe(true)
    }
  })
})

describe("private areas stay outside the locale prefix", () => {
  // Mirrors the lists in src/proxy.ts.
  const PRIVATE = ["/dashboard", "/admin", "/api"]

  it("a locale prefix would break prefix matching, which is why it must never occur", () => {
    for (const route of PRIVATE) {
      const prefixed = `/it${route}`
      // The assertion is the failure mode itself: this is exactly why the
      // route groups must not move under `[locale]`.
      expect(prefixed.startsWith(route)).toBe(false)
    }
  })

  it("the app router has no localized copy of a private area", async () => {
    const { existsSync } = await import("node:fs")
    const { join } = await import("node:path")
    const localeDir = join(process.cwd(), "src", "app", "[locale]")
    for (const group of ["(dashboard)", "(admin)", "(auth)", "api"]) {
      expect(existsSync(join(localeDir, group))).toBe(false)
    }
  })
})

/**
 * The other half of the same rule, and it cost every image on the blog.
 *
 * `proxy.ts` skips requests ending in an image extension, so nothing rewrites
 * `/blog/covers/x.svg` to a locale. While that route lived under `[locale]`
 * the only address that answered was `/en/blog/covers/x.svg`, which no post
 * links to: **every cover 404'd for two days with a green build**, because
 * nothing type checks a URL.
 *
 * The rule this pins: a route the proxy does not rewrite cannot live under the
 * locale prefix, or it is unreachable at the address people actually use.
 */
describe("routes the proxy skips stay outside the locale prefix", () => {
  it("serves blog covers from a path no rewrite is needed to reach", async () => {
    const { existsSync } = await import("node:fs")
    const { join } = await import("node:path")
    const app = join(process.cwd(), "src", "app")
    expect(existsSync(join(app, "blog", "covers", "[file]", "route.ts"))).toBe(true)
    expect(existsSync(join(app, "[locale]", "(public)", "blog", "covers"))).toBe(false)
  })

  /**
   * The same defect a third time, so this one is a check rather than a comment.
   *
   * A component that compares the path against something it knows, to
   * highlight a link or hide a header, is asking "which page is this". Read
   * from `next/navigation` the answer carries the locale, so every comparison
   * quietly stops matching in every language but the default: the navbar kept
   * showing on the Italian docs, the nav links never highlighted, and the
   * landing scroll spy switched itself off. Nothing threw, and the English
   * site was fine, which is why it took someone opening the Italian one.
   */
  it("no client component under the localized surface reads the raw pathname", async () => {
    const { readdirSync, readFileSync } = await import("node:fs")
    const { join, relative } = await import("node:path")
    const roots = [
      join(process.cwd(), "src", "components", "landing"),
      join(process.cwd(), "src", "components", "docs"),
    ]
    const offenders: string[] = []
    for (const root of roots) {
      for (const name of readdirSync(root)) {
        if (!/\.tsx?$/.test(name)) continue
        const file = join(root, name)
        const src = readFileSync(file, "utf8")
        if (/import\s*\{[^}]*\busePathname\b[^}]*\}\s*from\s*"next\/navigation"/.test(src)) {
          offenders.push(relative(process.cwd(), file).replace(/\\/g, "/"))
        }
      }
    }
    expect(
      offenders,
      `usePathname va preso da @/i18n/navigation:\n${offenders.join("\n")}`
    ).toEqual([])
  })

  it("still has the matcher exclusion that makes the rule necessary", async () => {
    const { readFileSync } = await import("node:fs")
    const { join } = await import("node:path")
    const proxy = readFileSync(join(process.cwd(), "src", "proxy.ts"), "utf8")
    // If this ever stops excluding images, the reasoning above changes and the
    // test above should be revisited rather than silently kept.
    expect(proxy).toContain("svg|png|jpg|jpeg|gif|webp")
  })
})

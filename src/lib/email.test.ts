import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { collapseMessages } from "@/i18n/collapse"

/**
 * Guards one specific way the transactional emails go wrong silently.
 *
 * Several email bodies carry inline markup, so they are read with `t.raw()`
 * and their placeholders are substituted by hand: `.replace("{plan}", plan)`.
 * Nothing else checks that the two sides agree. Rename the placeholder in the
 * message and the build stays green, the email still sends, and the recipient
 * reads `Your {plan} subscription is now active`.
 *
 * Rendering them for real would be the stronger test, but `next-intl/server`
 * resolves to its client build under Vitest and throws before any copy comes
 * out. This checks the same failure statically instead.
 */
const ROOT = process.cwd()
const source = fs.readFileSync(path.join(ROOT, "src", "lib", "email.ts"), "utf8")
const messages = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "locales", "en.json"), "utf8"))

/** The `t.raw("…")` calls, with the placeholders each one substitutes after. */
function rawUsages(): { key: string; substituted: string[] }[] {
  const re = /t\.raw\("([^"]+)"\)((?:\s*\.replace\("\{[a-zA-Z]+\}",[^)]*\))*)/g
  return [...source.matchAll(re)].map((m) => ({
    key: m[1],
    substituted: [...m[2].matchAll(/\.replace\("\{([a-zA-Z]+)\}"/g)].map((r) => r[1]),
  }))
}

/**
 * The message a key resolves to on each deployment that has it.
 *
 * Read through `collapseMessages` and not off the raw file: a body that
 * differs between the kit's own site and the product it ships as lives under
 * `$kit`/`$product`, so its dotted path exists in neither view of the raw
 * JSON. Checking the collapsed views also checks the right thing, which is the
 * message as the template will actually receive it.
 */
const VIEWS: [string, Record<string, unknown>][] = [
  ["vetrina", collapseMessages(messages, true) as Record<string, unknown>],
  ["clone", collapseMessages(messages, false) as Record<string, unknown>],
]

function messagesAt(key: string): { view: string; text: string }[] {
  const found = VIEWS.flatMap(([view, tree]) => {
    const value = ["email", ...key.split(".")].reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown>)?.[part],
      tree
    )
    return typeof value === "string" ? [{ view, text: value }] : []
  })
  expect(found.length, `key missing from en.json on every deployment: email.${key}`).toBeGreaterThan(0)
  return found
}

describe("email placeholders", () => {
  it("finds the raw messages it is meant to check", () => {
    // Without this the regex could silently stop matching and the suite would
    // go green on nothing, which is how a check quietly stops being one.
    expect(rawUsages().length).toBeGreaterThan(0)
  })

  it("substitutes exactly the placeholders each message declares", () => {
    for (const { key, substituted } of rawUsages()) {
      for (const { view, text } of messagesAt(key)) {
        const declared = [...text.matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1])
        expect(declared.sort(), `messaggio email.${key} (${view})`).toEqual([...substituted].sort())
      }
    }
  })
})

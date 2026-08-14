import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { collapseMessages } from "./collapse"
import { routing } from "./routing"

/**
 * Keeps the code and the message files honest about each other.
 *
 * Two failures this catches, both silent otherwise. A key read from the code
 * that does not exist in `en.json`: the page renders the key itself, and
 * neither the build nor the type checker objects. And a key left in `en.json`
 * that nothing reads any more: dead copy a translator will faithfully
 * translate.
 *
 * Deliberately not attempted: "no hardcoded string is left in a component".
 * That can only be done by heuristic, and it would flag every `aria-label` and
 * every technical constant. A check that cries wolf is one people learn to
 * skip, so this one only asserts what it can prove.
 */
const ROOT = process.cwd()
const SRC = path.join(ROOT, "src")
const raw = JSON.parse(fs.readFileSync(path.join(SRC, "locales", "en.json"), "utf8"))

type Node = Record<string, unknown>

// The same function production runs, imported rather than copied: the two
// earlier copies drifted apart within one commit, and the runtime one turned
// arrays into objects.
/** Both deployments run the same components, so a key has to exist in both. */
const views: [string, Node][] = [
  ["vetrina", collapseMessages(raw, true) as Node],
  ["clone", collapseMessages(raw, false) as Node],
]

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return []
    return [full]
  })
}

/** Namespaces a file declares, in any of the forms this codebase uses. */
function namespacesIn(src: string): string[] {
  const found = [
    ...src.matchAll(/(?:useTranslations|getTranslations)\("([^"]+)"\)/g),
    ...src.matchAll(/namespace:\s*"([^"]+)"/g),
  ].map((m) => m[1])
  return [...new Set(found)]
}

/**
 * Local variable to the namespace it was bound to, where that is visible.
 *
 * Both call shapes count. `getTranslations({ locale, namespace: "docs" })` is
 * the form `generateMetadata` has to use, and while it was unmatched here a
 * file holding two namespaces attributed every one of its keys to whichever
 * one was bound by name: the check kept running and started reading the wrong
 * half of the file.
 */
function bindings(src: string): Map<string, string> {
  const out = new Map<string, string>()
  const re =
    /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:"([^"]+)"|\{[^}]*namespace:\s*"([^"]+)"[^}]*\})/g
  for (const m of src.matchAll(re)) out.set(m[1], m[2] ?? m[3])

  // `const [t, tCommon] = await Promise.all([getTranslations("docs"), …])`,
  // which is how a component that needs two namespaces avoids two round
  // trips. Unread, the file looked like it declared namespaces nobody was
  // bound to, and every key it addressed went unattributed: the check kept
  // passing while covering less of the file than it claimed.
  const grouped = /const\s*\[([^\]]+)\]\s*=\s*await\s+Promise\.all\(\[([\s\S]*?)\]\s*\)/g
  const call =
    /(?:useTranslations|getTranslations)\(\s*(?:"([^"]+)"|\{[^}]*namespace:\s*"([^"]+)"[^}]*\})\s*\)|[A-Za-z_$][\w.]*\([^()]*\)/g
  for (const m of src.matchAll(grouped)) {
    const names = m[1].split(",").map((n) => n.trim())
    // Every call counts, translations or not, so a `getLocale()` sitting in
    // the middle does not shift the ones after it onto the wrong name.
    const calls = [...m[2].matchAll(call)]
    names.forEach((name, i) => {
      const ns = calls[i]?.[1] ?? calls[i]?.[2]
      if (name && ns) out.set(name, ns)
    })
  }
  return out
}

type Usage = { file: string; ns: string; key: string; raw: boolean }

function scan(): { usages: Usage[]; dynamic: Set<string> } {
  const usages: Usage[] = []
  const dynamic = new Set<string>()

  for (const file of sourceFiles(SRC)) {
    const src = fs.readFileSync(file, "utf8")
    const declared = namespacesIn(src)
    if (declared.length === 0) continue

    const bound = bindings(src)
    // A file with a single namespace can bind it indirectly (a helper that
    // returns `getTranslations`), so unresolved variables fall back to it.
    const only = declared.length === 1 ? declared[0] : null
    const resolve = (v: string) => bound.get(v) ?? (/^t\w*$/.test(v) ? only : null)

    // Searched by binding name rather than by "any call": a generic pattern
    // consumes the outer call in `toast.success(t("created"))` and `matchAll`
    // resumes past the inner one, losing every nested usage.
    const names = new Set([...bound.keys(), ...(only ? ["t"] : [])])
    for (const name of names) {
      const ns = resolve(name)
      if (!ns) continue
      const call = new RegExp(`\\b${name}(\\.(?:raw|rich))?\\(`, "g")
      for (const m of src.matchAll(call)) {
        const arg = src.slice(m.index + m[0].length).split(/[,)]/)[0]
        // A key that is not a literal cannot be resolved here, so the branch
        // it addresses is exempted from the unused-key check below.
        //
        // The exemption is as narrow as the call allows: `t(`messages.${c}`)`
        // only shields `messages.*`, not the whole namespace, because a blanket
        // exemption would hide every dead key that happens to sit beside a
        // computed one. Only a key with no static prefix at all, such as
        // `t(`${item.key}.title`)` or `t(item.key)`, shields the namespace.
        const template = arg.match(/^\s*`([^$`]*)\$\{/)
        if (template) {
          const prefix = template[1].replace(/\.$/, "")
          dynamic.add(prefix ? `${ns}.${prefix}` : ns)
          continue
        }
        if (/^\s*`/.test(arg) || /^\s*[a-zA-Z_$][\w.]*\s*$/.test(arg)) {
          dynamic.add(ns)
          continue
        }
        // Covers `t("k")` and the ternary form `t(cond ? "a" : "b")`, which
        // contributes both keys.
        const raw = m[1] === ".raw"
        for (const lit of arg.matchAll(/"([a-zA-Z][\w.]*)"/g)) {
          usages.push({ file: path.relative(ROOT, file), ns, key: lit[1], raw })
        }
      }
    }

    // The email module reaches its namespace through a helper, so the call
    // reads `(await emailStrings())("welcome", …)`.
    if (only) {
      for (const m of src.matchAll(/\)\("([a-zA-Z][\w.]*)"/g)) {
        usages.push({ file: path.relative(ROOT, file), ns: only, key: m[1], raw: false })
      }
    }
  }
  return { usages, dynamic }
}

function lookup(view: Node, fullKey: string): unknown {
  return fullKey.split(".").reduce<unknown>((acc, part) => (acc as Node)?.[part], view)
}

/**
 * Every leaf in the raw file, as a dotted path. An array counts as one leaf:
 * it is a single message read whole with `t.raw()`, not a numbered family.
 */
function leaves(node: unknown, prefix = ""): string[] {
  if (typeof node === "string" || Array.isArray(node)) return [prefix]
  return Object.entries(node as Node).flatMap(([k, v]) =>
    leaves(v, prefix ? `${prefix}.${k}` : k)
  )
}

const { usages, dynamic } = scan()

describe("message keys", () => {
  it("finds the usages it is meant to check", () => {
    // Without this the regexes could stop matching and the suite would go
    // green on an empty set, which is how a check quietly stops being one.
    expect(usages.length).toBeGreaterThan(50)
  })

  /** Present in one deployment only, because it is declared under one branch. */
  function branchScoped(fullKey: string): boolean {
    const inKit = lookup(views[0][1], fullKey) !== undefined
    const inClone = lookup(views[1][1], fullKey) !== undefined
    return inKit !== inClone
  }

  it.each(views)("every key read from the code exists (%s)", (_name, view) => {
    const missing = [
      ...new Set(
        usages
          .filter((u) => {
            const full = `${u.ns}.${u.key}`
            // A key declared for one deployment only is legitimately absent
            // from the other; whatever reads it is guarded by `isKitSite`.
            if (branchScoped(full)) return false
            const value = lookup(view, full)
            // `t.raw` legitimately returns a list; `t` must find a string.
            return u.raw ? !(typeof value === "string" || Array.isArray(value)) : typeof value !== "string"
          })
          .map((u) => `${u.ns}.${u.key} (${u.file})`)
      ),
    ]
    expect(missing, `keys read from the code that en.json does not have:\n${missing.join("\n")}`).toEqual([])
  })

  it("every key in another locale exists in en.json too", () => {
    // English is the source: a key only a translation has is either a typo or
    // copy that no code reads. Neither shows up at runtime, because the merge
    // in `request.ts` keeps whatever it is handed, so the page renders the
    // English text and the translator's work goes nowhere with no complaint.
    const source = new Set(leaves(raw))
    for (const locale of routing.locales) {
      if (locale === routing.defaultLocale) continue
      const file = path.join(SRC, "locales", `${locale}.json`)
      const strays = leaves(JSON.parse(fs.readFileSync(file, "utf8"))).filter(
        (key) => !source.has(key)
      )
      expect(strays, `keys in ${locale}.json that en.json does not have:\n${strays.join("\n")}`).toEqual(
        []
      )
    }
  })

  it("every key in en.json is read from somewhere", () => {
    const used = new Set(usages.map((u) => `${u.ns}.${u.key}`))
    const orphans = [
      ...new Set(
        leaves(raw)
          // Declared paths carry the branch segment; the code addresses the
          // collapsed one, so strip it before comparing. It can sit in the
          // middle (`hero.kit.subtitle`) or at the end (`footer.blurb.kit`).
          .map((key) => key.replace(/\.\$(kit|product)(\.|$)/, "$2").replace(/\.$/, ""))
          .filter((key) => !used.has(key))
          // Namespaces addressed with a computed key: which leaves are
          // reachable cannot be known from the source, so they are not judged.
          .filter((key) => ![...dynamic].some((ns) => key.startsWith(`${ns}.`)))
      ),
    ]
    expect(orphans, `keys in en.json that nothing reads:\n${orphans.join("\n")}`).toEqual([])
  })
})

/**
 * A template literal inside a message file is not a placeholder, it is text.
 * `${siteConfig.name}` in JSON renders literally, and in the case that produced
 * this test it reached two FAQ answers and the `FAQPage` JSON-LD on the home
 * page, so search engines were served the source code as well.
 *
 * Nothing already here could catch it: the key exists, the type is right, the
 * value is a valid string, and the build stays green. It is only visible by
 * opening the page.
 *
 * Real interpolation has two forms, both with single braces: `t("key", { site })`
 * for a message read on its own, and substitution by hand after `t.raw()`, which
 * returns lists and email bodies untouched.
 */
describe("message files", () => {
  const locales = fs
    .readdirSync(path.join(SRC, "locales"))
    .filter((f) => f.endsWith(".json"))

  it.each(locales)("%s carries no template literal", (file) => {
    const messages = JSON.parse(fs.readFileSync(path.join(SRC, "locales", file), "utf8"))
    const found: string[] = []
    const walk = (node: unknown, at: string) => {
      if (typeof node === "string") {
        const hits = node.match(/\$\{[^}]*\}/g)
        if (hits) found.push(`${at}: ${hits.join(" ")}`)
      } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${at}.${i}`))
      else if (node && typeof node === "object")
        Object.entries(node).forEach(([k, v]) => walk(v, at ? `${at}.${k}` : k))
    }
    walk(messages, "")
    expect(
      found,
      `template literal syntax in ${file}, rendered literally on screen:\n${found.join("\n")}`
    ).toEqual([])
  })
})

#!/usr/bin/env node
/**
 * Tells you which translated docs have fallen behind their English source.
 *
 *   npm run check:translations
 *
 * A translation never breaks. It keeps rendering, keeps looking finished, and
 * quietly becomes instructions for an older version of the product. The only
 * way to notice by reading is to open both files side by side and compare, so
 * nobody does, and a year later the page is wrong in a language its author no
 * longer checks.
 *
 * The convention that makes this checkable: a translated file is named after
 * its source with the locale in the middle (`getting-started.it.md`), and its
 * frontmatter records a checksum of the source it was written from.
 *
 *   ---
 *   translated_from: getting-started.md
 *   source_checksum: 3f9a1c04b7e2
 *   ---
 *
 * When the source changes, its checksum changes, and this reports the file as
 * stale until you update the translation and the marker. The failure message
 * prints the value to paste, so there is no command to remember.
 *
 * Why a checksum of the content and not a git revision: a commit hash is only
 * meaningful inside the history it was created in. Clone this kit and your
 * history starts fresh, so every recorded hash points at a commit your
 * repository has never seen and the check fails on all of them at once. The
 * content is the same everywhere, which is what makes the marker portable.
 * As a side effect this needs no git at all, so it also works on a source
 * archive downloaded from a release.
 *
 * Line endings are normalised before hashing: the same file checked out on
 * Windows and on Linux differs by a carriage return per line, which would
 * otherwise produce two different checksums for one unchanged file.
 *
 * Exits non-zero when a translation is stale or unmarked, so the release
 * checklist can gate on it.
 */

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

const DIRS = ["docs", path.join("content", "docs")]
const TRANSLATION = /^(.+)\.([a-z]{2})\.md$/

/** Frontmatter fields, read without pulling in a YAML parser for two keys. */
function frontmatter(file) {
  const text = fs.readFileSync(file, "utf8")
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!match) return {}
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z_][\w-]*):\s*(.*?)\s*$/.exec(line)
    if (pair) fields[pair[1]] = pair[2].replace(/^["']|["']$/g, "")
  }
  return fields
}

/** Short content hash of a file, stable across platforms and repositories. */
function checksum(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n")
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 12)
}

const problems = []
let checked = 0

for (const dir of DIRS) {
  if (!fs.existsSync(dir)) continue
  for (const name of fs.readdirSync(dir).sort()) {
    const match = TRANSLATION.exec(name)
    if (!match) continue

    const file = path.posix.join(dir.split(path.sep).join("/"), name)
    const source = path.posix.join(dir.split(path.sep).join("/"), `${match[1]}.md`)
    checked++

    if (!fs.existsSync(source)) {
      problems.push(`${file}: translates ${source}, which does not exist`)
      continue
    }

    const fields = frontmatter(path.join(dir, name))
    const recorded = fields.source_checksum
    const from = fields.translated_from
    const current = checksum(source)

    if (!recorded) {
      // Kits translated before this marker changed shape record a git revision
      // instead. Say so by name, or the message reads as a missing field on a
      // file that clearly has one.
      const hint = fields.source_commit
        ? `has "source_commit: ${fields.source_commit}", which this version replaced`
        : 'has no "source_checksum"'
      problems.push(`${file}: ${hint}. Set "source_checksum: ${current}"`)
      continue
    }
    if (from && from !== path.basename(source)) {
      problems.push(`${file}: "translated_from: ${from}" does not match ${source}`)
      continue
    }

    if (recorded !== current) {
      problems.push(
        `${file}: ${source} has changed since this was translated\n` +
          `      recorded ${recorded}, current ${current}`
      )
    }
  }
}

if (checked === 0) {
  // Not a failure: a kit with no translations yet is the normal starting
  // point. It is worth saying out loud, though, because a scan that silently
  // finds nothing looks exactly like a scan that passed.
  console.log("No translated docs found. Nothing to check.")
  process.exit(0)
}

if (problems.length === 0) {
  console.log(`${checked} translated doc(s) up to date with their source.`)
  process.exit(0)
}

console.error(`${problems.length} of ${checked} translated doc(s) need attention:\n`)
for (const problem of problems) console.error(`  - ${problem}`)
console.error(
  "\nUpdate the translation, then set source_checksum to the value printed above."
)
process.exit(1)

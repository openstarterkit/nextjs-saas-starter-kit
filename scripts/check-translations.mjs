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
 * frontmatter records which revision of that source it was written from.
 *
 *   ---
 *   translated_from: getting-started.md
 *   source_commit: 1ed5f58
 *   ---
 *
 * After updating a translation, move `source_commit` to the current revision
 * of the English file. `git log -1 --format=%h -- docs/getting-started.md`
 * prints it.
 *
 * Exits non-zero when a translation is stale or unmarked, so the release
 * checklist can gate on it.
 */

import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

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

/** Commits touching `file` since `commit`, newest first. Empty means current. */
function commitsSince(commit, file) {
  return execFileSync("git", ["log", "--oneline", `${commit}..HEAD`, "--", file], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean)
}

function isKnownCommit(commit) {
  try {
    execFileSync("git", ["cat-file", "-e", `${commit}^{commit}`], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
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

    const { source_commit: commit, translated_from: from } = frontmatter(path.join(dir, name))

    if (!commit) {
      problems.push(`${file}: no "source_commit" in frontmatter, so staleness cannot be checked`)
      continue
    }
    if (from && from !== path.basename(source)) {
      problems.push(`${file}: "translated_from: ${from}" does not match ${source}`)
      continue
    }
    if (!isKnownCommit(commit)) {
      problems.push(`${file}: "source_commit: ${commit}" is not a commit in this repository`)
      continue
    }

    const behind = commitsSince(commit, source)
    if (behind.length > 0) {
      problems.push(
        `${file}: ${source} changed ${behind.length} time(s) since ${commit}\n` +
          behind.map((line) => `      ${line}`).join("\n")
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
  "\nUpdate the translation, then set source_commit to the source's current revision:" +
    "\n  git log -1 --format=%h -- <source file>"
)
process.exit(1)

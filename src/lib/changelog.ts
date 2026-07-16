import fs from "node:fs"
import path from "node:path"

export type ChangelogRelease = {
  version: string
  /** ISO date from the heading, null when the section has no date (e.g. Unreleased). */
  date: string | null
  /** Markdown body of the release section. */
  body: string
}

export type Changelog = {
  /** Markdown between the H1 and the first release heading. */
  intro: string
  /** Releases in file order (newest first, per Keep a Changelog). */
  releases: ChangelogRelease[]
}

/**
 * Parses the repo root CHANGELOG.md (Keep a Changelog format) into
 * per-release sections for the /changelog page. The Markdown file stays the
 * single source of truth, same philosophy as the docs.
 */
export function getChangelog(): Changelog {
  const raw = fs.readFileSync(path.join(process.cwd(), "CHANGELOG.md"), "utf8")

  // Drop the trailing link-reference definitions ([1.0.0]: https://...) so
  // they don't render as stray text inside the last release's body.
  const content = raw.replace(/^\[[^\]]+\]:\s+\S+\s*$/gm, "").trimEnd()

  const headingRe = /^## \[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?\s*$/gm
  const matches = [...content.matchAll(headingRe)]

  const introEnd = matches.length > 0 ? matches[0].index : content.length
  const intro = content
    .slice(0, introEnd)
    .replace(/^# .*$/m, "") // the page renders its own H1
    .replace(/^---\s*$/m, "")
    .trim()

  const releases: ChangelogRelease[] = matches.map((m, i) => {
    const start = m.index + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length
    return {
      version: m[1],
      date: m[2] ?? null,
      body: content.slice(start, end).trim(),
    }
  })

  return { intro, releases }
}

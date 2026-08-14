import { getDocs } from "@/lib/docs"
import { siteConfig } from "@/config/site"

/**
 * Repo-relative Markdown links to URLs that work in the rendered site.
 *
 * The Markdown files are the single source of truth and are read in two
 * places: on GitHub, where `./docs/blog.md` is correct, and here, where the
 * same string would ask the browser for a page that does not exist. So the
 * links stay written for the repository, and the renderers translate.
 *
 * `baseDir` is where the file being rendered lives in the repository, because
 * the same href means different things depending on it: `./README.md` from
 * `docs/` is the docs index, from the root it is the project README.
 *
 * Resolution order: a published docs page if there is one, the file on GitHub
 * otherwise, and the untouched href when no repository URL is configured,
 * which is better than inventing a link that goes nowhere.
 */
export function mapRepoHref(href: string, baseDir = ""): string {
  if (!href || /^(https?:|mailto:|tel:|#|\/)/.test(href)) return href

  const hashAt = href.indexOf("#")
  const hash = hashAt === -1 ? "" : href.slice(hashAt)
  const rawPath = hashAt === -1 ? href : href.slice(0, hashAt)
  if (!rawPath) return href

  const repoPath = resolveRepoPath(baseDir, rawPath)
  if (!repoPath) return href

  if (repoPath === "docs/README.md") return `/docs${siteAnchor(hash)}`

  // Matched against the English source, not the rendered file: a link inside
  // `billing.it.md` still reads `./configuration.md`, because that is the file
  // name on GitHub, and it has to resolve to the same page either way.
  const doc = getDocs().find((d) => `docs/${basename(d.source)}` === repoPath)
  if (doc) return `/docs/${doc.slug}${siteAnchor(hash)}`

  const repo = siteConfig.links.github
  return repo ? `${repo}/blob/main/${repoPath}${hash}` : href
}

/**
 * GitHub's heading anchors to the ones this site generates.
 *
 * The two disagree on one point: for "Branding & theming" GitHub drops the
 * `&` and turns each remaining space into a dash, giving `branding--theming`,
 * while `slugify` in lib/docs collapses whitespace and gives
 * `branding-theming`. An anchor written for the repository therefore lands on
 * the right page and the wrong place, which is the kind of half-broken link
 * nobody reports. Only runs of dashes are collapsed, so anchors that already
 * agree pass through untouched. Anchors pointing at files kept on GitHub are
 * left alone by the caller, since there GitHub's form is the correct one.
 */
function siteAnchor(hash: string): string {
  return hash.replace(/-{2,}/g, "-")
}

/** Collapses `.` and `..` into a repository path, or null if it escapes the root. */
function resolveRepoPath(baseDir: string, relative: string): string | null {
  const segments: string[] = []
  for (const part of `${baseDir}/${relative}`.split("/")) {
    if (!part || part === ".") continue
    if (part === "..") {
      if (segments.length === 0) return null
      segments.pop()
      continue
    }
    segments.push(part)
  }
  return segments.join("/") || null
}

function basename(file: string): string {
  const parts = file.split(/[\\/]/)
  return parts[parts.length - 1]
}

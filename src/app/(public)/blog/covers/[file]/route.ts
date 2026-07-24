import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { brand } from "@/config/brand"
import { isKitSite } from "@/config/kit"

/**
 * Blog cover art, painted with your accent color.
 *
 * The sources live in `content/blog/covers/*.svg` next to the posts, drawn in
 * neutral grays with two placeholders, `__ACCENT_1__` and `__ACCENT_2__`, that
 * this route fills in. Ship as-is and the covers are grayscale; set
 * NEXT_PUBLIC_BRAND_PRIMARY (and _2) and the same artwork comes out in your
 * brand, with no file to redraw.
 *
 * The kit's own site (KIT_SITE="true") draws from `content/blog-kit/covers/`
 * instead, alongside its own posts. Two deployments of one repo would
 * otherwise illustrate their blogs with identical artwork, so each keeps its
 * own set.
 *
 * A static file dropped in `public/blog/covers/` wins over this route, so
 * hand-made covers (a photo, an exported PNG) keep working: just point the
 * post's `cover` frontmatter at it.
 */

const COVERS_DIR = path.join(
  process.cwd(),
  "content",
  isKitSite ? "blog-kit" : "blog",
  "covers",
)

// Light on the dark canvas of the artwork, so the neutral default stays
// legible. The kit's site falls back to its own blues rather than the grays,
// so its covers match the brand even with no NEXT_PUBLIC_BRAND_* set.
const ACCENT_1 = brand.primary ?? (isKitSite ? "#2563eb" : "#e5e5e5")
const ACCENT_2 = brand.primary2 ?? brand.primary ?? (isKitSite ? "#38bdf8" : "#737373")

export async function generateStaticParams() {
  const files = await readdir(COVERS_DIR)
  return files.filter((f) => f.endsWith(".svg")).map((file) => ({ file }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  // Names come from post frontmatter, so keep the lookup to plain slugs: no
  // separators, no traversal out of the covers directory.
  if (!/^[a-z0-9-]+\.svg$/.test(file)) {
    return new Response("Not found", { status: 404 })
  }

  let svg: string
  try {
    svg = await readFile(path.join(COVERS_DIR, file), "utf8")
  } catch {
    return new Response("Not found", { status: 404 })
  }

  return new Response(svg.replaceAll("__ACCENT_1__", ACCENT_1).replaceAll("__ACCENT_2__", ACCENT_2), {
    headers: {
      "Content-Type": "image/svg+xml",
      // Cached hard in production. In development it must not be: the two
      // cover sets share filenames, so switching KIT_SITE on the same
      // localhost would otherwise leave stale artwork from the other set in
      // the browser and look like the folders got mixed up.
      "Cache-Control":
        process.env.NODE_ENV === "development"
          ? "no-store"
          : "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  })
}

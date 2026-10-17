import fs from "node:fs"
import path from "node:path"
import { isVideoPath } from "@/lib/markdown-links"

/**
 * An image or a video in a guide, written in the Markdown as an image:
 * `![What it shows](../public/media/file.webp "Optional caption")`.
 *
 * Two kinds, on purpose, after the Next.js docs:
 *
 * - A short clip that loops, like a GIF, is an animated WebP. It moves on its
 *   own here and on GitHub alike, which a video cannot: GitHub turns a video
 *   written as an image into a broken one.
 * - A real video (`.mp4`, `.webm`) gets controls and waits for the reader. It
 *   loads only its first frame until then, so a guide does not download
 *   megabytes nobody asked to watch.
 *
 * An image with a sibling named `file.dark.webp` shows that one in dark mode.
 * GitHub keeps the light one: the variant is a bonus of the site, not a
 * requirement of the guide.
 *
 * `src` arrives already mapped to a site URL (see mapRepoMedia).
 */
export function DocMedia({ src, alt, title }: { src: string; alt: string; title?: string }) {
  const frame = "w-full rounded-xl border border-border bg-muted/30"

  let media: React.ReactNode
  if (isVideoPath(src)) {
    media = <video src={src} aria-label={alt} className={frame} controls preload="metadata" playsInline />
  } else {
    const dark = darkVariant(src)
    media = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={dark ? `${frame} dark:hidden` : frame} loading="lazy" decoding="async" />
        {dark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dark} alt={alt} className={`${frame} hidden dark:block`} loading="lazy" decoding="async" />
        )}
      </>
    )
  }

  return (
    <figure className="not-prose my-8">
      {media}
      {title && <figcaption className="mt-3 text-center text-sm text-muted-foreground">{title}</figcaption>}
    </figure>
  )
}

/** `/media/x.webp` → `/media/x.dark.webp`, if that file is in public/. */
function darkVariant(src: string): string | null {
  if (!src.startsWith("/")) return null
  const dot = src.lastIndexOf(".")
  if (dot <= src.lastIndexOf("/")) return null
  const candidate = `${src.slice(0, dot)}.dark${src.slice(dot)}`
  return fs.existsSync(path.join(process.cwd(), "public", ...candidate.split("/"))) ? candidate : null
}

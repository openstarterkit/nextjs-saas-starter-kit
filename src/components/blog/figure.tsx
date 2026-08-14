"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Maximize2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

/**
 * A diagram in a post, enlarged in place instead of in a new tab.
 *
 * Diagrams in these posts are wide: readable in the column on a desktop,
 * unreadable on a phone. The obvious fix, linking the image to itself, opens
 * the raw file in a new tab and leaves the reader outside the article,
 * scrolled back to the top when they return. This keeps them where they were.
 *
 * **The markdown does not know this component exists**, and that is the point.
 * A post writes the portable form, an image inside a link to itself:
 *
 *     [![what the diagram shows](/blog/covers/x.svg)](/blog/covers/x.svg)
 *
 * which renders on GitHub, in any markdown preview and in an RSS reader as a
 * picture you can click. The renderer in `blog/[slug]/page.tsx` recognises the
 * shape and upgrades it here. Nothing to remember when writing, and nothing to
 * undo if you drop this component.
 */
export function Figure({ src, alt }: { src: string; alt?: string }) {
  const t = useTranslations("blog")
  const [open, setOpen] = useState(false)

  return (
    <figure className="not-prose my-8">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("figureOpen")}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} className="w-full" />
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/90 text-muted-foreground opacity-0 shadow-soft transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(1400px,94vw)] bg-card p-4 sm:p-6">
          {/* The alt text is the diagram's description, so it is also the
              right accessible name for the dialog. Hidden, because it is
              already announced with the image. */}
          <DialogTitle className="sr-only">{alt ?? t("figureTitle")}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt ?? ""} className="max-h-[82vh] w-full object-contain" />
        </DialogContent>
      </Dialog>
    </figure>
  )
}

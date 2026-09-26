"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Database, FileCode, FileJson, FileText, Palette, Terminal } from "lucide-react"

/**
 * A code block: syntax highlighted at build time, with a copy button and an
 * optional header naming the file it came from.
 *
 * This is the only client-side part of the whole feature. The colours are
 * already in the markup by the time this renders (Shiki runs in the build), so
 * what ships here is one button and, when a fence asked for it, one header.
 *
 * To name a file, write it on the fence:
 *
 *     ```ts title="src/lib/auth.ts"
 *
 * Without a title the block looks as it did before, with the button floating in
 * the corner.
 */

/**
 * The file type, as a small mark beside the name. Deliberately short: anything
 * unmapped gets the generic code icon, which is right far more often than a
 * guess would be.
 *
 * Written as returned elements rather than a lookup of components, because a
 * capitalised variable holding a component is indistinguishable, to the lint
 * rule and to a reader skimming, from a component being defined during render.
 */
function FileIcon({ filename }: { filename: string }) {
  const className = "h-3.5 w-3.5 shrink-0"
  if (/\.(sql|prisma)$/.test(filename)) return <Database className={className} aria-hidden="true" />
  if (/\.json$/.test(filename)) return <FileJson className={className} aria-hidden="true" />
  if (/\.(css|scss)$/.test(filename)) return <Palette className={className} aria-hidden="true" />
  if (/\.(md|mdx|txt)$/.test(filename)) return <FileText className={className} aria-hidden="true" />
  // "terminal" is not a file, and it is the honest label for a block you are
  // meant to run rather than save: the setup guide uses it.
  if (/\.(sh|bash|zsh)$|^\.env|^Dockerfile|^terminal$/.test(filename))
    return <Terminal className={className} aria-hidden="true" />
  return <FileCode className={className} aria-hidden="true" />
}

export function CodeBlock({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"pre"> & { "data-filename"?: string }) {
  const t = useTranslations("blog.code")
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const filename = props["data-filename"]

  async function copy() {
    const text = ref.current?.textContent ?? ""
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused, and there is nothing useful to say
      // about it: the code is on screen and can be selected by hand.
    }
  }

  const copyButton = (
    <button
      type="button"
      onClick={copy}
      // Always visible, never revealed on hover: a button that appears only
      // under the pointer is invisible on a touchscreen and unfindable for
      // anyone who does not already know it is there.
      className="shrink-0 rounded-md border border-border bg-background/90 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? t("copied") : t("copy")}
    </button>
  )

  if (!filename) {
    return (
      <div className="relative">
        <pre ref={ref} {...props}>
          {children}
        </pre>
        <div className="absolute right-2 top-2">{copyButton}</div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border">
      {/* The header carries the file name, so a reader knows where the snippet
          belongs before reading it — the question every code block in a
          tutorial raises and most leave unanswered. */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <FileIcon filename={filename} />
          <span className="truncate font-mono">{filename}</span>
        </span>
        {copyButton}
      </div>
      {/* The border and radius now belong to the wrapper, so the block inside
          loses its own: two nested rounded boxes read as a mistake. */}
      <pre ref={ref} {...props} className={`${props.className ?? ""} !m-0 !rounded-none !border-0`}>
        {children}
      </pre>
    </div>
  )
}

"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Database, FileCode, FileJson, FileText, Palette, Terminal } from "lucide-react"

/**
 * A code block: syntax highlighted at build time, under a header with a label
 * on the left and the copy button on the right. Every block has the header, so
 * the button is always in the same place and every snippet says what it is.
 *
 * This is the only client-side part of the whole feature. The colours are
 * already in the markup by the time this renders (Shiki runs in the build), so
 * what ships here is the header and its button.
 *
 * The label is the file name when the fence gives one:
 *
 *     ```ts title="src/lib/auth.ts"
 *
 * and otherwise the fence's language, in words ("TypeScript", "Terminal"), or
 * "Code" when the fence names no language at all.
 */

/** A fence's language as a reader would name it. Anything unmapped is shown as written. */
const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Terminal",
  sh: "Terminal",
  shell: "Terminal",
  zsh: "Terminal",
  powershell: "PowerShell",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JSX",
  json: "JSON",
  env: ".env",
  dotenv: ".env",
  yaml: "YAML",
  yml: "YAML",
  sql: "SQL",
  prisma: "Prisma",
  css: "CSS",
  html: "HTML",
  md: "Markdown",
  markdown: "Markdown",
  mdx: "MDX",
  text: "Text",
  txt: "Text",
}

/** The pseudo file name the icon is chosen from, for a block that names no file. */
const LANGUAGE_ICON_HINT: Record<string, string> = {
  Terminal: "terminal",
  PowerShell: "terminal",
  ".env": ".env",
  JSON: "x.json",
  SQL: "x.sql",
  Prisma: "x.prisma",
  CSS: "x.css",
  Markdown: "x.md",
  MDX: "x.mdx",
  Text: "x.txt",
}

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
}: React.ComponentPropsWithoutRef<"pre"> & { "data-filename"?: string; "data-language"?: string }) {
  const t = useTranslations("blog.code")
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const filename = props["data-filename"]
  const language = props["data-language"]
  const label = filename ?? (language ? (LANGUAGE_LABELS[language] ?? language) : "Code")
  const iconHint = filename ?? LANGUAGE_ICON_HINT[label] ?? "code"
  // Only the attributes a <pre> understands go on to the element.
  const preProps = { ...props }
  delete preProps["data-filename"]
  delete preProps["data-language"]

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

  return (
    // The vertical space a bare <pre> gets from the prose styles, which the
    // block inside no longer has (see !m-0 below): without it two blocks in a
    // row touch.
    <div className="my-[1.7em] overflow-hidden rounded-[var(--radius)] border border-border">
      {/* The header says what the snippet is, a file or a language, before
          the reader reads it: where it belongs, or what to run it in. */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <FileIcon filename={iconHint} />
          <span className={filename ? "truncate font-mono" : "truncate"}>{label}</span>
        </span>
        {copyButton}
      </div>
      {/* The border and radius now belong to the wrapper, so the block inside
          loses its own: two nested rounded boxes read as a mistake. */}
      <pre ref={ref} {...preProps} className={`${props.className ?? ""} !m-0 !rounded-none !border-0`}>
        {children}
      </pre>
    </div>
  )
}

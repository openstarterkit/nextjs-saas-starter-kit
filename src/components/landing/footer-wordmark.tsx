import { useId } from "react"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

/**
 * The brand name across the whole width of the page, under the footer: one
 * word, faint and fading towards the bottom, its lower 20% cut by the edge of
 * the page, so it closes the page without competing with the links above it.
 * From a tablet up only: on a phone it shrinks to a faint strip that adds
 * scrolling and says nothing.
 * Decoration only, so it is hidden from screen readers and cannot be selected.
 *
 * An SVG rather than a font size: `textLength` spreads the name over the
 * viewBox, so it fills the width exactly at every screen size, where a size in
 * `vw` would fit only one width. Only the spacing gives, not the letters: the
 * font size is set so a name as long as the kit's needs little of it.
 *
 * Barely there, in both themes: a watermark that closes the page, fading to
 * nothing at the edge. The same opacity reads stronger as light on dark than
 * as dark on light, so dark mode starts much lower to look the same.
 *
 * Off as the kit ships, so a clone's pages end at the footer until someone
 * chooses otherwise: NEXT_PUBLIC_SHOW_FOOTER_WORDMARK="true" turns it on. The
 * kit's own site always shows it.
 */
export function FooterWordmark() {
  const id = useId()
  if (!isKitSite && process.env.NEXT_PUBLIC_SHOW_FOOTER_WORDMARK !== "true") return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none mt-10 hidden select-none overflow-hidden text-foreground md:block [--wordmark-from:0.14] [--wordmark-to:0] dark:[--wordmark-from:0.045] dark:[--wordmark-to:0]"
    >
      <svg viewBox="0 18 1000 92" className="block w-full" preserveAspectRatio="xMidYMin meet">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" style={{ stopOpacity: "var(--wordmark-from)" }} />
            <stop offset="100%" stopColor="currentColor" style={{ stopOpacity: "var(--wordmark-to)" }} />
          </linearGradient>
        </defs>
        <text x="12" y="124" textLength="976" lengthAdjust="spacing" fontSize="128" fontWeight="800" fill={`url(#${id})`}>
          {siteConfig.name}
        </text>
      </svg>
    </div>
  )
}

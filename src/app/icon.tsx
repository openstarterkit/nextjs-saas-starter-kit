import { ImageResponse } from "next/og"
import { brand, neutralMarkPath } from "@/config/brand"
import { isKitSite } from "@/config/kit"

/**
 * Favicon, generated instead of shipped as a static .ico so it follows your
 * brand with no image editor: it ships neutral (black tile, white mark) and
 * picks up NEXT_PUBLIC_BRAND_PRIMARY when you set it.
 *
 * This file is the miniature of `LogoMark` in src/components/logo.tsx and has
 * to stay identical to it, colour included: the socket head for your app, the
 * lucide "zap" bolt on the kit's own site, which is the OpenStarterKit symbol.
 * The head itself comes from `neutralMarkPath`, so the two cannot drift. Swap
 * both together when you rebrand.
 */

/**
 * OpenStarterKit brand blue, the same value the logo uses. Spelled out rather
 * than taken from `--primary`, whose light value on the kit site is #1d4ed8.
 */
const OSK_BLUE = "#2563eb"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          backgroundColor: brand.primary ?? (isKitSite ? OSK_BLUE : "#0a0a0a"),
        }}
      >
        {isKitSite ? (
          // White on the brand tile, matching the logo in the page. It used to
          // be a royal-blue bolt on a navy tile, kept from the v1.2 icon, which
          // left the tab showing a different blue from the site.
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
          </svg>
        ) : (
          // The same head as LogoMark, a size down from the bolt so the solid
          // shape keeps some tile around it. The socket is a hole here too,
          // Satori hands the path to resvg, which honours fill-rule.
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d={neutralMarkPath} fill="#ffffff" fillRule="evenodd" />
          </svg>
        )}
      </div>
    ),
    size
  )
}

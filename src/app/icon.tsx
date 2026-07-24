import { ImageResponse } from "next/og"
import { brand } from "@/config/brand"
import { isKitSite } from "@/config/kit"

/**
 * Favicon, generated instead of shipped as a static .ico so it follows your
 * brand with no image editor: it ships neutral (black tile, white bolt) and
 * picks up NEXT_PUBLIC_BRAND_PRIMARY when you set it. The kit's own site
 * (KIT_SITE="true") gets its blue tile back.
 *
 * The bolt below is the same lucide "zap" mark used by `LogoMark` in
 * src/components/logo.tsx, so swap both together when you rebrand.
 */

/**
 * The kit site's original favicon look (v1.2 favicon.ico, colors sampled
 * from the shipped file): royal-blue bolt on a dark navy tile.
 */
const KIT_TILE = "#1c2340"
const KIT_BOLT = "#4568e2"

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
          backgroundColor: brand.primary ?? (isKitSite ? KIT_TILE : "#0a0a0a"),
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          // A brand override keeps the white bolt for contrast on any color.
          fill={!brand.primary && isKitSite ? KIT_BOLT : "#ffffff"}
        >
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
        </svg>
      </div>
    ),
    size
  )
}

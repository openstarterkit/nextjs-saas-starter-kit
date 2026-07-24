import { ImageResponse } from "next/og"
import { siteConfig } from "@/config/site"
import { ogBrand } from "@/config/brand"

/**
 * Default Open Graph image for every page that doesn't provide its own.
 * Rendered at request time with next/og: no design tool, no static asset,
 * and it follows siteConfig when you rebrand the kit.
 */

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0a0a0a",
          backgroundImage: `radial-gradient(circle at 20% 0%, ${ogBrand.glow}, transparent 55%)`,
          color: "#f8fafc",
          fontSize: 32,
        }}
      >
        <div
          style={{
            width: 96,
            height: 12,
            borderRadius: 6,
            backgroundImage: ogBrand.bar,
          }}
        />
        <div style={{ marginTop: 48, fontSize: 84, fontWeight: 700, letterSpacing: "-0.03em" }}>
          {siteConfig.name}
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: "#94a3b8" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size
  )
}

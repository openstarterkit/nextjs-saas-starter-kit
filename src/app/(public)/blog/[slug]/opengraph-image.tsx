import { ImageResponse } from "next/og"
import { getPost, formatPostDate } from "@/lib/blog"
import { siteConfig } from "@/config/site"
import { ogBrand } from "@/config/brand"

/** Per-post Open Graph image: category, title and date over the brand look. */

export const alt = "Blog post"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  const title = post?.title ?? "Blog"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#0a0a0a",
          backgroundImage: `radial-gradient(circle at 80% 0%, ${ogBrand.glow}, transparent 55%)`,
          color: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: "#cbd5e1" }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundImage: ogBrand.bar,
            }}
          />
          {post?.category ?? "Blog"}
        </div>
        <div
          style={{
            fontSize: title.length > 55 ? 60 : 72,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, color: "#94a3b8" }}>
          <div>{siteConfig.name}</div>
          {post && <div>{formatPostDate(post.date)}</div>}
        </div>
      </div>
    ),
    size
  )
}

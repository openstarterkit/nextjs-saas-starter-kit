/**
 * Brand theme colors, resolved from NEXT_PUBLIC_BRAND_* env with neutral
 * fallbacks. The kit ships neutral; set these on your deployment to apply
 * your brand from config, with no code edits (see docs/configuration.md).
 * Consumed by the CSS token override (src/app/layout.tsx) and the Open Graph
 * images. Colors should be hex (e.g. "#2563eb").
 */
import { isKitSite } from "@/config/kit"

const primary = process.env.NEXT_PUBLIC_BRAND_PRIMARY?.trim() || null
const primary2 = process.env.NEXT_PUBLIC_BRAND_PRIMARY_2?.trim() || null
const gradient = process.env.NEXT_PUBLIC_BRAND_GRADIENT?.trim() || null

/**
 * The kit's own palette, restored token by token on its site
 * (KIT_SITE="true"). The theme that ships is neutral (true black and
 * grayscale) so a clone starts blank; the kit's site predates that and is
 * built on slate blues, where dark mode is a navy canvas rather than black.
 * Overriding only the accent would leave the two half-mixed, so the whole set
 * comes back together. A clone is untouched, and any NEXT_PUBLIC_BRAND_*
 * override still wins on top of this.
 */
const KIT_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #38bdf8 100%)"
const KIT_CSS = [
  ":root{",
  "--background:#ffffff;--foreground:#0f172a;",
  "--muted:#f8fafc;--muted-foreground:#64748b;",
  "--border:#e2e8f0;--input:#e2e8f0;--ring:#3b82f6;",
  "--primary:#1d4ed8;--primary-foreground:#ffffff;",
  "--secondary:#f1f5f9;--secondary-foreground:#0f172a;",
  "--card:#ffffff;--card-foreground:#0f172a;",
  "--popover:#ffffff;--popover-foreground:#0f172a;",
  "--accent:#f1f5f9;--accent-foreground:#0f172a;",
  `--primary-2:#38bdf8;--gradient-brand:${KIT_GRADIENT}`,
  "}",
  ".dark{",
  "--background:#0f172a;--foreground:#f8fafc;",
  "--muted:#1e293b;--muted-foreground:#94a3b8;",
  "--border:#1e293b;--input:#1e293b;--ring:#3b82f6;",
  "--primary:#2563eb;--primary-foreground:#ffffff;",
  "--secondary:#1e293b;--secondary-foreground:#f8fafc;",
  "--card:#0f172a;--card-foreground:#f8fafc;",
  "--popover:#0f172a;--popover-foreground:#f8fafc;",
  "--accent:#1e293b;--accent-foreground:#f8fafc;",
  `--primary-2:#38bdf8;--gradient-brand:${KIT_GRADIENT}`,
  "}",
  ".dark .prose{--tw-prose-links:#60a5fa}",
].join("")

export const brand = {
  /** True when a brand override is configured for this deployment. */
  isCustom: Boolean(primary || gradient),
  primary,
  primary2,
  gradient:
    gradient ||
    (primary ? `linear-gradient(135deg, ${primary} 0%, ${primary2 ?? primary} 100%)` : null),
}

/**
 * Inline CSS overriding the neutral token defaults with the brand colors.
 * Applied at :root with !important so it wins in both light and dark. Returns
 * "" when no override is configured, so the kit and demo stay neutral.
 *
 * On the kit's site the full palette above is laid down first, then any env
 * override is applied on top of it.
 */
export function brandOverrideCss(): string {
  const base = isKitSite ? KIT_CSS : ""
  if (!brand.isCustom) return base
  const decls = [
    brand.primary && `--primary:${brand.primary}!important`,
    brand.primary && `--ring:${brand.primary}!important`,
    brand.primary2 && `--primary-2:${brand.primary2}!important`,
    brand.gradient && `--gradient-brand:${brand.gradient}!important`,
  ].filter(Boolean)
  return decls.length ? `${base}:root{${decls.join(";")}}` : base
}

/**
 * The neutral mark: a hex socket head, the screw you turn to fasten a part.
 * It stands in for your logo until you swap it, and it lives here because two
 * files draw it and they have to draw the same shape: the logo in the page
 * (src/components/logo.tsx) and the favicon (src/app/icon.tsx).
 *
 * One path, two subpaths, `fill-rule="evenodd"`: the socket is a hole, so the
 * tile shows through it. Painted as a solid shape it would need the tile's
 * colour, which in dark mode is a translucent tint and not a colour we can
 * name. It used to be the plain lucide hexagon, which is what every dark tile
 * with a lucide icon in it looks like, down to live sites already shipping
 * that exact one. The socket costs a subpath and is nobody else's.
 *
 * The head covers 19.5 of the 24-unit box, not the 18 a lucide icon covers.
 * That is deliberate: the hexagon was drawn filled *and* stroked at 1.5, and
 * the stroke added half its width all around. Filling alone at 18 would have
 * shrunk the mark by 8% in every place that asks for it by size, the auth
 * pages and the loader included. Drawn at 19.5 they all keep the size they
 * already ask for.
 */
export const neutralMarkPath =
  "M21.75 16.333V7.667a2.167 2.167 0 0 0 -1.083 -1.874l-7.583 -4.333a2.167 2.167 0 0 0 -2.167 0l-7.583 4.333A2.167 2.167 0 0 0 2.25 7.667v8.667a2.167 2.167 0 0 0 1.083 1.874l7.583 4.333a2.167 2.167 0 0 0 2.167 0l7.583 -4.333A2.167 2.167 0 0 0 21.75 16.333z" +
  "M12 6.475l4.767 2.762v5.525L12 17.525l-4.767 -2.762v-5.525z"

/** Solid brand accent for HTML emails (no CSS vars available there). */
export const emailAccent = brand.primary ?? (isKitSite ? "#2563eb" : "#0a0a0a")

/** Open Graph accent bar + glow, kept visible on the dark OG card. */
export const ogBrand = {
  bar: brand.gradient ?? (isKitSite ? KIT_GRADIENT : "linear-gradient(90deg, #737373, #d4d4d4)"),
  glow: brand.primary
    ? `${brand.primary}40`
    : isKitSite
      ? "rgba(37,99,235,0.25)"
      : "rgba(163,163,163,0.18)",
}

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

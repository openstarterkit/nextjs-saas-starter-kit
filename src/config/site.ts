/**
 * Site-wide brand configuration — the single source of truth for your app's
 * identity. To make the kit yours, edit the fallback values here and the logo
 * in `src/components/logo.tsx`; everything else (metadata, navbar, footer,
 * transactional emails, legal pages) reads from here.
 *
 * Every field can also be set per-deployment via a NEXT_PUBLIC_* env var
 * (see `.env.example` and `docs/configuration.md`), so you can rebrand from
 * config without editing code. The kit ships with neutral placeholders.
 */
import { isKitSite } from "@/config/kit"

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || (isKitSite ? "OpenStarterKit" : "Acme"),
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ||
    (isKitSite ? "Ship your SaaS this weekend" : "Ship your product faster"),

  /**
   * Title for `<title>` and search results, where the words people type matter
   * more than the claim that convinces them. Leave it unset and the title is
   * `name | tagline`, which is what a fresh clone gets: set it only when the
   * text for the machine and the text for the reader need to differ. The
   * tagline keeps its job on the page (hero, footer, social image, emails).
   */
  seoTitle:
    process.env.NEXT_PUBLIC_SEO_TITLE ||
    (isKitSite ? "Next.js SaaS Starter Kit | Free & Open Source" : null),
  version: "1.5.0",
  description:
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ||
    (isKitSite
      ? "A production-ready SaaS starter with Next.js, Auth.js, Stripe, Prisma, and Tailwind. No vendor lock-in."
      : "One workspace for your projects, your customers and your billing. Set up in minutes, cancel any time."),

  /** Base URL of this deployment — no trailing slash. */
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  /** Shown as the contact address in the footer and pre-filled emails. */
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    (isKitSite ? "hello@openstarterkit.dev" : "hello@example.com"),

  links: {
    /** Public repository — footer/pricing/docs buttons hide when unset. */
    github:
      process.env.NEXT_PUBLIC_GITHUB_URL ||
      (isKitSite ? "https://github.com/openstarterkit/nextjs-saas-starter-kit" : null),
    /**
     * General GitHub presence (org/profile) — used by the footer icon and
     * "Open Source" link; hides when unset.
     */
    githubOrg:
      process.env.NEXT_PUBLIC_GITHUB_ORG_URL ||
      (isKitSite ? "https://github.com/openstarterkit" : null),
    /** X / Twitter profile — the footer icon hides when unset. */
    x: process.env.NEXT_PUBLIC_X_URL || (isKitSite ? "https://x.com/openstarterkit" : null),
    /**
     * Live demo URL. When set, "Sign in" and "Demo" on the public pages
     * point here instead of the local /login — useful when this deployment
     * is a marketing site and the demo runs elsewhere.
     */
    demo: process.env.NEXT_PUBLIC_DEMO_URL || null,
  },

  /**
   * Who builds and maintains this deployment — shown in the "Who builds it"
   * section of the About page, which disappears entirely when the name is
   * unset. Both values live in env so they belong to the deployment rather
   * than to the code: a clone starts without them and adds its own.
   */
  maintainer: {
    name: process.env.NEXT_PUBLIC_MAINTAINER_NAME || null,
    url: process.env.NEXT_PUBLIC_MAINTAINER_URL || null,
  },
}

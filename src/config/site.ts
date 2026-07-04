/**
 * Site-wide brand configuration — the single source of truth for your app's
 * identity. To make the kit yours, edit this file and the logo in
 * `src/components/logo.tsx`; everything else (metadata, navbar, footer,
 * transactional emails, legal pages) reads from here.
 */
export const siteConfig = {
  name: "OpenStarterKit",
  tagline: "Ship your SaaS this weekend",
  description:
    "Production-ready SaaS boilerplate with Next.js 16, Auth.js, Stripe, Prisma, and Tailwind 4. No vendor lock-in.",

  /** Base URL of this deployment — no trailing slash. */
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  /** Shown as the contact address in the footer and pre-filled emails. */
  contactEmail: "hello@openstarterkit.dev",

  links: {
    /** Public repository — footer/pricing buttons hide when unset. */
    github: process.env.NEXT_PUBLIC_GITHUB_URL || null,
    /**
     * General GitHub presence (org/profile) — used by the footer icon and
     * "Open Source" link; the repository URL above drives the hero button
     * and the License link.
     */
    githubOrg: "https://github.com/openstarterkit",
    /** X / Twitter profile — the footer icon hides when null. */
    x: "https://x.com/openstarterkit",
    /**
     * Live demo URL. When set, "Sign in" and "Demo" on the public pages
     * point here instead of the local /login — useful when this deployment
     * is a marketing site and the demo runs elsewhere.
     */
    demo: process.env.NEXT_PUBLIC_DEMO_URL || null,
  },
}

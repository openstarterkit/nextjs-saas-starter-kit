# Roadmap

OpenStarterKit is **free and open source**, and ships continuously. Pull `main` to get every update and fix.

The kit's conventions are treated as an interface rather than an internal detail: where a thing lives, what it exports, what its shape is called. What you build on top of them survives an update, and where a release has to break one, [Upgrading](./docs/upgrading.md) says which and what to change.

> This roadmap is indicative and reorder-able based on community feedback: open an issue and tell us what matters to you.

---

## ✅ v1.0 - Foundation
The complete, production-ready core: auth, payments, dashboard, admin, projects, dark mode, emails. Free & MIT-licensed.
See [CHANGELOG.md](./CHANGELOG.md).

## ✅ v1.1 - Auth expansion & docs
- Magic link / email sign-in (passwordless)
- Email + password credentials (production-grade, not just dev) with password reset
- Account linking across providers, managed from Settings
- Base documentation in [docs/](./docs/README.md): getting started, configuration, authentication, deploy guide

## ✅ v1.2 - Payments & polish
- One-time payments (not just subscriptions)
- Multiple pricing tiers out of the box
- Usage-based billing example
- Polished onboarding flow
- Public changelog page + session revocation on password reset

## ✅ v1.3 - Content & SEO
- MDX blog: categories, RSS feed, cover images, reading time and drafts (file-based, no CMS)
- SEO: sitemap, robots, dynamic Open Graph images and Article JSON-LD
- Newsletter waitlist: double opt-in, one-click unsubscribe, admin CSV export and optional Resend Audience sync. It also powers the **Pro early adopter waitlist**: one short email when there is real news on the Pro, and a launch discount for subscribers
- Contact form done right (Resend + Zod validation + honeypot anti-spam + privacy notice)
- Per-endpoint rate limiting on the public forms
- Brand-neutral by default: rebrand the name, logo and colors from one config file or from env vars, no code changes. Plus a marketing pages scaffold (about, legal)
- AI-ready: agent instructions for Claude Code, Cursor and Copilot included

## ✅ v1.4 - Testing & Trust
- Vitest unit tests, Playwright end-to-end tests on signup and checkout, and integration tests on the Stripe webhook signed with Stripe's own SDK
- Typed environment validation with Zod (fail fast at boot)
- Dependabot with grouped updates and a declared dependency update cadence
- Test coverage visible in the README, reported by a command rather than a badge
- `/api/health` and a release smoke script that checks a live deployment from the outside, including the version it actually serves
- Scheduled daily reset for public demo deployments

## ✅ v1.5 - SEO foundations & runtime
- Canonical URLs on every public page, distinct meta descriptions, and the missing H1 on pricing
- Structured data beyond articles: `FAQPage` and `Organization` JSON-LD
- **Node 24 is the supported runtime**, declared in `engines`. Node 20 reached end of life in April 2026: the code still runs on it, the support promise no longer covers it
- TypeScript 6 and updated CI actions
- `npm audit` in the pipeline with a declared threshold, so a new advisory is a build signal instead of a discovery
- Maintainer name and site configurable from env, like the rest of the branding

## ✅ v1.6 - i18n & docs
- **i18n across the whole kit, with next-intl**: every user facing string moves out of the components and into message files. Shipping your product in one language that is not English becomes one file to fill, not a hundred components to edit
- `en.json` complete, and `it.json` populated **by us for the documentation only**: enough to exercise the whole path, so routing, switcher and fallback are proven rather than described. The rest is yours to fill, and it is a translation file rather than a refactor
- **No translation service and no account required.** Plain JSON in the standard layout: compatible with Crowdin or any other workflow, tied to none of them
- Routing with a prefix only for non-default languages, so your English URLs stay exactly as they are today. `hreflang`, `x-default`, and no automatic redirect based on browser headers: visitors switch language from a visible control
- Untranslated keys **fall back to English** instead of leaving a gap, so a partial translation is honest rather than broken
- **Bilingual documentation**: the docs carry their own language switch, English primary and Italian beside it, and it works the same way for the product docs your clone ships
- Every translated doc records the English revision it came from, so a stale translation is caught by the release checklist instead of by a reader
- **Blog**: a figure component with real zoom for diagrams, and a newsletter signup block usable inside posts. Both ship in the kit, so your own posts get them too
- `FAQPage` structured data generated from post frontmatter

## ✅ v1.7 - UI kit expansion
- The form primitives the kit left to plain HTML: select, checkbox, radio group, textarea, and a form layer that shares the Zod schema the server action already validates against, so the rules are not written twice
- Overlays and navigation: popover, sheet, alert and alert dialog, breadcrumb, pagination, skeleton
- **The blog is where that pagination primitive earns its keep**: `/blog` and the category pages split every 12 posts, as real prerendered routes rather than a query string, so every page has an address of its own and the feed stays whole. The page size is a single value in `src/lib/blog.ts`, and leaving it unset lists every post on one page, the way the kit already treats a value you leave out
- A recurring revenue chart on the admin panel, drawn from the subscriptions you already have
- An environment variable to turn Vercel Analytics off, which until now shipped mounted with no way to decline
- **Search engines and answer engines**: per-page Open Graph, so a link to your pricing page stops previewing like your home page. Offers as structured data built from the same rows the pricing table renders, an outline and heading anchors on posts, breadcrumbs, and an optional line in `/llms.txt` for the sentence you want repeated about you
- **Mobile audit across the whole kit**: every page and every flow opened on a phone, not the marketing pages alone
- **Groundwork for 2.0**: everything that reads the signed-in user now goes through `@/lib/auth`, so the release that changes the authentication library changes one file. See [Upgrading](./docs/upgrading.md)

## ✅ v2.0 - Better Auth *(major)*
One thing, and nothing else. The authentication layer moves to [Better Auth](https://better-auth.com), and no feature rides along: a major that only migrates is a major you can adopt in an afternoon, and one that also adds things is a major people postpone.

- All six ways in, on the new library: Google, GitHub, magic link, email plus password, and the dev and demo sign-ins
- **The `@/lib/auth` boundary keeps the same shape.** Changing library touched seven files, and they are the seven the 1.7 upgrade guide named in advance. Code written against the boundary does not change
- **Existing passwords keep working.** Better Auth hashes with scrypt by default; the kit keeps bcrypt through its own hash and verify functions, so nobody has to reset anything
- **Sessions become database rows**, so revoking one is deleting it rather than waiting out a token that cannot be recalled
- A migration that moves the data, with the counts to check before and after, because the one failure that matters here leaves a valid database and no error
- An upgrade guide written before the release, not after

## ✅ v2.1 - Better Auth 1.7.3 alignment *(current)*
Not the release this line was going to be. Better Auth removed the `issuer` column that 2.0 was built on, and a schema that disagrees with the library underneath it comes before new features. What was announced here moves down one, unchanged.

- **`Account.issuer` is gone and `@@unique([providerId, accountId])` is back**, which is the identity this kit used before 2.0 and the one Better Auth used in 1.6
- A migration that refuses to run on duplicate account keys and names them, rather than letting the database report a constraint violation at the end
- `scripts/verify-auth-migration.mjs` rewritten around the two questions that matter now, and useful before the upgrade as well as after
- **Every page has an Open Graph image again.** They all asked for the large card and handed it nothing, and the generated image was working the whole time

## 🔜 v2.2 - Auth depth & accessibility *(next)*
- Self-hosted two-factor authentication (TOTP), no third-party auth vendor required. It gets its own release rather than a corner of another one, because it touches the sign-in flow
- Active session management in Settings, which 2.0 made cheap: the rows are already there, with their IP address and user agent
- Syntax highlighting and a copy button on the code blocks in the docs and the blog
- Rate limiting on a shared store, so the limits hold across serverless instances instead of one bucket per instance
- **Accessibility audit** against WCAG 2.1 AA: keyboard navigation, visible focus, contrast, labelled forms and heading order, checked across the kit rather than on the marketing pages alone
- Account depth: change your email address, upload a profile photo

## 🔜 v2.3 - Billing depth
- Free trials, coupon and promo codes
- Stripe Tax and PDF invoices
- Upgrade and downgrade flows with proration in the UI

## 🎯 Pro - Teams & scale *(paid, coming)*
The paid tier, built for teams. The waitlist is open: subscribers get build updates when there is real news, and an early adopter discount at launch. Everything in the free kit, plus:
- Multi-tenancy / teams & organizations
- Role-based permissions (beyond USER/ADMIN)
- Team billing & seat management
- Get paid your way: extra payment methods and alternative providers, merchant of record included

---

## 💡 Have a request?
Community feedback reorders this roadmap. Open an issue or reply to any OpenStarterKit email: the features people actually ask for get built first.

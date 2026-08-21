# Roadmap

OpenStarterKit is **free and open source**, and ships continuously. Pull `main` to get every update and fix.

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

## ✅ v1.6 - i18n & docs *(current)*
- **i18n across the whole kit, with next-intl**: every user facing string moves out of the components and into message files. Shipping your product in one language that is not English becomes one file to fill, not a hundred components to edit
- `en.json` complete, and `it.json` populated **by us for the documentation only**: enough to exercise the whole path, so routing, switcher and fallback are proven rather than described. The rest is yours to fill, and it is a translation file rather than a refactor
- **No translation service and no account required.** Plain JSON in the standard layout: compatible with Crowdin or any other workflow, tied to none of them
- Routing with a prefix only for non-default languages, so your English URLs stay exactly as they are today. `hreflang`, `x-default`, and no automatic redirect based on browser headers: visitors switch language from a visible control
- Untranslated keys **fall back to English** instead of leaving a gap, so a partial translation is honest rather than broken
- **Bilingual documentation**: the docs carry their own language switch, English primary and Italian beside it, and it works the same way for the product docs your clone ships
- Every translated doc records the English revision it came from, so a stale translation is caught by the release checklist instead of by a reader
- **Blog**: a figure component with real zoom for diagrams, and a newsletter signup block usable inside posts. Both ship in the kit, so your own posts get them too
- `FAQPage` structured data generated from post frontmatter

## 🔜 v1.7 - UI kit expansion *(next)*
- The form primitives the kit still leaves to plain HTML: select, checkbox, radio group, textarea
- Overlays and navigation: popover, sheet, alert and alert dialog, breadcrumb, pagination, skeleton
- Dashboard chart components
- An environment variable to turn Vercel Analytics off, which today ships mounted in the root layout
- Form library with validation patterns, sharing the Zod schemas already used on the server
- **Mobile audit across the whole kit**: every page and every flow opened on a phone, not the marketing pages alone. Dashboard tables, settings tabs, billing cards, docs navigation and the admin panel are where a desktop first build breaks, and most of what an audit like that turns up is a primitive, which is why it belongs in the release that adds them

## 🔜 v1.8 - Billing depth
- Free trials, coupon and promo codes
- Stripe Tax and PDF invoices
- Upgrade and downgrade flows with proration in the UI

## 🔜 v1.9 - Auth depth & accessibility
- Self-hosted two-factor authentication (TOTP), no third-party auth vendor required
- Active session management in Settings
- Rate limiting on a shared store, so the limits hold across serverless instances instead of one bucket per instance
- **Accessibility audit** against WCAG 2.1 AA: keyboard navigation, visible focus, contrast, labelled forms and heading order, checked across the kit rather than on the marketing pages alone

## 🎯 v2.0 Pro - Teams & scale *(paid, coming)*
The paid tier, built for teams. The waitlist is open: subscribers get build updates when there is real news, and an early adopter discount at launch. Everything in the free kit, plus:
- Multi-tenancy / teams & organizations
- Role-based permissions (beyond USER/ADMIN)
- Team billing & seat management
- Get paid your way: extra payment methods and alternative providers, merchant of record included

---

## 💡 Have a request?
Community feedback reorders this roadmap. Open an issue or reply to any OpenStarterKit email: the features people actually ask for get built first.

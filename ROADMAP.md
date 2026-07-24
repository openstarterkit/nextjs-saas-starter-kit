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

## ✅ v1.3 - Content & SEO *(current)*
- MDX blog: categories, RSS feed, cover images, reading time and drafts (file-based, no CMS)
- SEO: sitemap, robots, dynamic Open Graph images and Article JSON-LD
- Newsletter waitlist: double opt-in, one-click unsubscribe, admin CSV export and optional Resend Audience sync. It also powers the **Pro early adopter waitlist**: one short email a week while we build the Pro, and a launch discount for subscribers
- Contact form done right (Resend + Zod validation + honeypot anti-spam + privacy notice)
- Per-endpoint rate limiting on the public forms
- Brand-neutral by default: rebrand the name, logo and colors from one config file or from env vars, no code changes. Plus a marketing pages scaffold (about, legal)
- AI-ready: agent instructions for Claude Code, Cursor and Copilot included

## 🔜 v1.4 - Testing & Trust
- Vitest unit tests and Playwright end-to-end tests on the critical flows (signup, checkout, webhooks)
- Typed environment validation with Zod (fail fast at boot)
- Dependabot and a declared dependency update cadence
- Test coverage visible in the README

## 🔜 v1.5 - UI kit expansion
- 20+ additional components (modal, dropdown, toast, tabs, tooltip…)
- Dashboard chart components
- Form library with validation patterns

## 🔜 v1.6 - Billing depth
- Free trials, coupon and promo codes
- Stripe Tax and PDF invoices
- Upgrade and downgrade flows with proration in the UI

## 🔜 v1.7 - Auth depth
- Self-hosted two-factor authentication (TOTP), no third-party auth vendor required
- Active session management in Settings

## 🎯 Pro - Teams & scale *(paid, coming)*
The paid tier, built for teams. A waitlist opens with v1.3: subscribers get weekly build updates and an early adopter discount at launch. Everything in the free kit, plus:
- Multi-tenancy / teams & organizations
- Role-based permissions (beyond USER/ADMIN)
- Team billing & seat management
- i18n (internationalization) scaffold

---

## 💡 Have a request?
Community feedback reorders this roadmap. Open an issue or reply to any OpenStarterKit email: the features people actually ask for get built first.

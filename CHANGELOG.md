# Changelog

All notable changes to OpenStarterKit are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/).

> 💡 **OpenStarterKit is free and open source (MIT).** It ships continuously: pull `main` to get every update and fix.

---

## [1.3.0] - 2026-07-24

📝 **Content & SEO.** A file-based blog, technical SEO, a pre-launch waitlist and a spam-safe contact form. The kit now ships agent instructions so your AI assistant is productive on day one, and goes fully brand-neutral so rebranding is one config or env away.

### Added
- **Theming and instant rebrand**: the kit now ships brand-neutral, with a placeholder name and a clean black + grayscale theme. Make it yours from `src/config/site.ts` and the color tokens in `globals.css`, or set the new `NEXT_PUBLIC_BRAND_*` env vars to change name, logo accent and colors with no code changes. The gradient, glow, Open Graph images and emails all follow your accent automatically. See [Configuration](./docs/configuration.md#branding--theming)
- **Blog**: file-based MDX blog at `/blog` with categories, per-category pages, an RSS feed at `/blog/rss.xml`, reading time, optional cover images and draft support. Writing a post is a Markdown file and a commit, no database. Six example posts included. See the [blog guide](./docs/blog.md)
- **Newsletter waitlist**: double opt-in signup (Zod + honeypot + per-IP and per-email rate limit), branded confirmation and welcome emails, one-click unsubscribe, optional Resend Audience sync for sending Broadcasts, and an admin view with counts and a CSV export that doubles as the consent record. Powers the Pro pre-launch waitlist on the pricing page. See the [newsletter guide](./docs/newsletter.md)
- **Contact form**: `/contact` with Zod validation, a honeypot, per-IP rate limiting and a privacy notice, delivered to the owner via Resend with the sender set as reply-to
- **Technical SEO**: `sitemap.xml` and `robots.txt` generated from the real routes and blog content, dynamic Open Graph images for pages and posts (`next/og`), and Article JSON-LD on posts
- **Marketing pages**: an `/about` scaffold and the `/contact` page, linked from the navbar and footer
- **AI-ready**: ships agent instructions for Claude Code, Cursor and Copilot, with `AGENTS.md` as the single source and `.cursor/rules/` and `.github/copilot-instructions.md` pointing to it
- **Shared rate limiter**: `checkRateLimit` gains a per-IP key helper and now guards the newsletter, contact and signup endpoints

### Changed
- The Pro pricing card now opens the waitlist signup instead of a mailto contact link
- Blog and Contact added to the navbar and footer navigation

### Notes
- One additive migration: `add_newsletter_subscriber`; run `npx prisma migrate deploy`
- Env: new optional `RESEND_AUDIENCE_ID` for the newsletter Audience sync (the database list works without it)
- New dependencies: `next-mdx-remote` and `gray-matter` for the blog

## [1.2.0] - 2026-07-16

💳 **Payments & polish.** The billing pillar is complete: one-time payments, multiple tiers, usage-based example. Plus onboarding and a public changelog.

### Added
- **One-time payments**: Stripe Checkout in `payment` mode with a new `Purchase` model, idempotent webhook handling (replay-safe on the PaymentIntent), refund handling via `charge.refunded`, purchase confirmation email, and invoices enabled on one-time checkouts
- **Multiple pricing tiers**: plan cards are driven by the `Plan` table; monthly and yearly variants of a tier pair up into one card (by slug convention) and the Monthly/Yearly toggle swaps only the price, animated and always shown as its monthly equivalent with a "billed yearly" note; the seed now ships 6 example plans (Starter and Pro in monthly and yearly variants, Lifetime, and an inactive metered example)
- **Usage-based billing example**: `recordUsage()` helper on Stripe Billing Meters, plus a new [billing guide](./docs/billing.md) covering subscriptions, one-time payments, usage-based metering and local testing
- **Onboarding**: a dismissable "Get started" checklist on the dashboard (items derived live from your data) and toasts on return from Stripe Checkout (success and canceled)
- **Public `/changelog` page**: this file rendered on the site with a version badge per release, linked in the navbar (after Docs) and in the footer
- **Demo pricing triad**: in demo mode the homepage, `/pricing` and the in-app billing grid all show the same Starter / Pro / Enterprise triad driven by the `Plan` table, closed by an example Enterprise "Contact us" card that opens the contact dialog with a pre-filled subject (`PlanCards` gains a `ctaHref` mode for public pages and an optional `contactCard` slot for a sales-led tier)
- **Session revocation**: a password reset now invalidates other active sessions within about a minute (`sessionVersion` claim with a throttled DB check)
- **Entitlement helper**: `getEntitlement()` in `src/lib/billing.ts` resolves lifetime vs subscription vs free, the pattern to copy for gating your own features

### Changed
- Checkout API hardened: valid requests require an active `Plan` price, and users with an active subscription or lifetime purchase get a clear error pointing to the Customer Portal instead of a second checkout
- The demo banner now stays pinned above the navbar while scrolling, so the "jump into the app" call to action is always visible on the demo
- Upgrade button requires an explicit price and surfaces errors as toasts
- Copy polish across the landing, dashboard, auth and legal pages

### Fixed
- Mobile menu: hash links now scroll to the section instead of bouncing
- CSS `mask` uses the standard property alongside the `-webkit-` prefix

### Notes
- Two new migrations (both additive): `add_one_time_payments` and `add_session_version_and_onboarding`; run `npx prisma migrate deploy`
- Env: new `STRIPE_STARTER_PRICE_ID`, `STRIPE_LIFETIME_PRICE_ID`, `STRIPE_METERED_PRICE_ID`; removed `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` (price IDs never needed to be public)
- Sessions issued before this release stay valid: the new session claim is backfilled without logging anyone out

## [1.1.0] - 2026-07-10

🔐 **Auth expansion & docs.** Four ways to sign in, one account. Plus a real documentation set.

### Added
- **Magic link sign-in**: passwordless one-time links by email (Resend), branded with the same template as the transactional emails, valid 15 minutes
- **Email + password**: production-grade credentials with signup, email verification via magic link, bcrypt hashing (cost 12), generic errors (no user enumeration), rate limiting
- **Password reset**: full forgot/reset flow with single-use SHA-256-hashed tokens, 30-minute expiry
- **Account linking**: automatic linking across Google/GitHub/email (verified-email providers), plus a "Sign-in methods" card in Settings to connect/disconnect providers and set or change the password, with a lock-out guard
- **Auth pages**: new `/signup`, `/verify-request`, `/forgot-password`, `/reset-password`
- **Documentation**: new `docs/` folder (getting started, configuration, authentication, deployment), rendered on the site at `/docs` with sidebar navigation; the Markdown files are the single source of truth

### Changed
- Login page now offers email + password and magic link alongside OAuth (hidden in demo mode)
- Settings page shows the real linked providers instead of a hardcoded label

### Notes
- New dependency: `bcryptjs` (pure JS, no native build steps)
- New migration: `add_password_auth` (User.passwordHash + PasswordResetToken); run `npx prisma migrate deploy`
- JWT sessions are unchanged; sessions issued before a password reset stay valid until expiry (documented in `docs/authentication.md`)

## [1.0.0] - 2026-06-25

🚀 **First public release.** The complete, production-ready SaaS core, free & open source.

### Added
- **Framework**: Next.js 16.2 (App Router, Turbopack) + TypeScript strict
- **Styling**: Tailwind CSS v4 with native CSS variables + dark mode (system detection + persist)
- **Auth**: Auth.js v5 with Google & GitHub OAuth, route protection, session management
- **Database**: Prisma 7 + PostgreSQL schema (User, Account, Session, Plan, Subscription, Project) with driver adapter
- **Payments**: Stripe Checkout, Customer Portal, and webhooks (Stripe API 2026-05-27)
- **User dashboard**: overview, billing with Stripe invoice history, profile settings (Zod-validated server actions)
- **Projects**: example single-tenant CRUD resource (schema, server actions with ownership checks, list/detail/forms)
- **Admin panel**: user list with search & pagination, MRR/users/subscriptions metrics, role management
- **Emails**: Resend transactional emails (welcome, subscription confirmation, cancellation)
- **Design system**: Radix-based components (Button, Card, Badge, Input, Table, dialog, dropdown, tabs, tooltip…) + `cn` utility
- **Landing page**: Hero, tech stack strip, Features, Pricing, FAQ, Footer
- **Security**: security headers, `SECURITY.md`, and a CI workflow (lint + build)
- **Attribution**: optional "Built with OpenStarterKit" badge, removable via env flag
- **DX**: 1-click Vercel deploy button, complete README, `.env.example`, dev-only credentials login
- **License**: MIT (use in unlimited projects, commercial included)

### Notes
- Production build: 0 TypeScript errors, 0 ESLint errors, 14 routes
- Stack chosen best-of-breed with **no vendor lock-in**: every component is swappable

[1.3.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.3.0
[1.2.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.2.0
[1.1.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.1.0
[1.0.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.0.0

# Changelog

All notable changes to OpenStarterKit are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/).

> 💡 **OpenStarterKit is free and open source (MIT).** It ships continuously: pull `main` to get every update and fix.

---

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

[1.1.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.1.0
[1.0.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.0.0

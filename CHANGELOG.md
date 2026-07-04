# Changelog

All notable changes to OpenStarterKit are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/).

> 💡 **OpenStarterKit is free and open source (MIT).** It ships continuously — pull `main` to get every update and fix.

---

## [1.0.0] — 2026-06-25

🚀 **First public release.** The complete, production-ready SaaS core — free & open source.

### Added
- **Framework** — Next.js 16.2 (App Router, Turbopack) + TypeScript strict
- **Styling** — Tailwind CSS v4 with native CSS variables + dark mode (system detection + persist)
- **Auth** — Auth.js v5 with Google & GitHub OAuth, route protection, session management
- **Database** — Prisma 7 + PostgreSQL schema (User, Account, Session, Plan, Subscription, Project) with driver adapter
- **Payments** — Stripe Checkout, Customer Portal, and webhooks (Stripe API 2026-05-27)
- **User dashboard** — overview, billing with Stripe invoice history, profile settings (Zod-validated server actions)
- **Projects** — example single-tenant CRUD resource (schema, server actions with ownership checks, list/detail/forms)
- **Admin panel** — user list with search & pagination, MRR/users/subscriptions metrics, role management
- **Emails** — Resend transactional emails (welcome, subscription confirmation, cancellation)
- **Design system** — Radix-based components (Button, Card, Badge, Input, Table, dialog, dropdown, tabs, tooltip…) + `cn` utility
- **Landing page** — Hero, tech stack strip, Features, Pricing, FAQ, Footer
- **Security** — security headers, `SECURITY.md`, and a CI workflow (lint + build)
- **Attribution** — optional "Built with OpenStarterKit" badge, removable via env flag
- **DX** — 1-click Vercel deploy button, complete README, `.env.example`, dev-only credentials login
- **License** — MIT (use in unlimited projects, commercial included)

### Notes
- Production build: 0 TypeScript errors, 0 ESLint errors, 14 routes
- Stack chosen best-of-breed with **no vendor lock-in** — every component is swappable

[1.0.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.0.0

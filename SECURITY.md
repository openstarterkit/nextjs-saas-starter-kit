# Security Policy

OpenStarterKit is an auth + payments starter kit. Security is part of the
product, so we take reports seriously and try to make the defaults safe.

## Supported versions

The kit is distributed as source you clone and own. We provide security fixes on
the latest `main`. There is no backport guarantee for older snapshots — pull the
latest `main` to get fixes.

| Version        | Supported |
| -------------- | --------- |
| latest `main`  | ✅        |
| older clones   | ⚠️ self-maintained |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Preferred channel: open a private report via GitHub's
[**Security Advisories**](https://github.com/openstarterkit/nextjs-saas-starter-kit/security/advisories/new)
("Report a vulnerability"). This keeps the details private until a fix ships.

Alternatively, email **security@openstarterkit.dev**.

Please include:

- a description of the issue and its impact,
- steps to reproduce (a minimal PoC if possible),
- the affected file(s)/route(s) and the commit or version you tested.

### What to expect

- We aim to acknowledge a report within a few days.
- We'll confirm the issue, agree on a fix and a disclosure timeline with you, and
  credit you in the advisory unless you prefer to stay anonymous.

## How the kit handles the sensitive parts

A quick map of where security-relevant logic lives, so you can review it:

- **Authentication** — Auth.js v5 (`src/auth.ts`), JWT session strategy. The
  dev-only credentials provider is double-gated and never active outside
  `NODE_ENV=development`.
- **Route protection** — defense in depth: edge middleware (`src/proxy.ts`) →
  `auth()` in the `(dashboard)`/`(admin)` layouts → a role re-check in the admin
  page. Inbound webhooks bypass auth deliberately (they carry no session).
- **Payments** — Stripe Checkout + Customer Portal. The webhook
  (`src/app/api/webhooks/stripe/route.ts`) verifies the signature against the raw
  body before trusting any event. Checkout validates the price against the DB
  Plans before creating a session.
- **Authorization** — server actions (`src/app/actions/*`) enforce auth + input
  validation (Zod) + ownership checks on every mutation.
- **Secrets** — only `.env.example` is committed; all real secrets live in
  `.env*` files that are git-ignored.
- **HTTP headers** — security headers (HSTS, `nosniff`, anti-clickjacking,
  `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`. A
  Content-Security-Policy is left for you to tune per deployment.

## Your responsibility when you ship

This kit gives you safe defaults, but your deployment is yours to secure:

- Set a strong, unique `AUTH_SECRET` and never reuse the example values.
- Use Stripe **live** keys and a real webhook signing secret in production.
- Consider adding a tuned Content-Security-Policy for your domain.
- Keep dependencies updated (`npm audit`).

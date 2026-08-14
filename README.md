<p align="center">
  <img src=".github/openstarterkit.webp" alt="OpenStarterKit" width="100%" />
</p>


<p align="center">
  <strong>The free, open-source Next.js SaaS starter kit.</strong><br/>
  Auth, payments, admin and emails, wired up and production-ready. Ship your product this weekend.
</p>

<p align="center">
  <a href="./ROADMAP.md"><img alt="Version" src="https://img.shields.io/badge/version-1.6.1-6366f1.svg" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <a href="https://github.com/openstarterkit/nextjs-saas-starter-kit/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/openstarterkit/nextjs-saas-starter-kit/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js_16-000000?logo=next.js&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Auth.js" src="https://img.shields.io/badge/Auth.js_v5-000000?logo=auth0&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" />
  <img alt="Stripe" src="https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white" />
  <img alt="Resend" src="https://img.shields.io/badge/Resend-000000?logo=resend&logoColor=white" />
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/openstarterkit/nextjs-saas-starter-kit&env=DATABASE_URL,AUTH_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,NEXT_PUBLIC_APP_URL&envDescription=Required%20environment%20variables%20for%20OpenStarterKit&envLink=https://github.com/openstarterkit/nextjs-saas-starter-kit/blob/main/.env.example&project-name=nextjs-saas-starter-kit&repository-name=nextjs-saas-starter-kit">
    <img alt="Deploy with Vercel" src="https://vercel.com/button" />
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-tech-stack">Tech stack</a> ·
  <a href="#-quick-start">Quick start</a> ·
  <a href="./docs/README.md">Docs</a> ·
  <a href="#-deploy">Deploy</a> ·
  <a href="#-project-structure">Structure</a> ·
  <a href="./ROADMAP.md">Roadmap</a>
</p>

---

## ✨ Why OpenStarterKit?

Most SaaS boilerplates either cost a few hundred dollars or ship as a barebones demo. **OpenStarterKit is different:**

- 💳 **Payments included in the free tier**: full Stripe Checkout, Customer Portal and webhooks, not paywalled behind a Pro plan.
- 🔓 **No vendor lock-in**: plain PostgreSQL, Prisma and Auth.js. Host it anywhere, own your data.
- 🧩 **A complete SaaS, not a starter demo**: auth, billing, an admin panel with real MRR metrics, transactional emails and a polished landing page.
- 📖 **MIT licensed**: use it for anything, commercial included. No license keys, no unlock fees.
- 🌍 **Ships in more than one language**: every user-facing string lives in a message file, with routing, fallback and a language switch already wired. No translation service and no account required, and it is in the free kit instead of a paid add-on.
- 🕹️ **A publishable demo, built in**: one env var turns a deployment into a safe public demo of *your* product, with one-click explore accounts and writes disabled. Normally that is something you build yourself.

---

## 🚀 Features

| | Feature | What you get |
|---|---|---|
| 🔐 | **Authentication** | Auth.js v5: Google + GitHub OAuth, magic link, email + password with reset, account linking |
| 💳 | **Payments** | Stripe Checkout, Customer Portal, signature-verified webhooks, subscriptions + one-time payments, multiple tiers, usage-based example |
| 🛠️ | **Admin panel** | User management, search + pagination, live MRR metrics, role toggling |
| 📊 | **User dashboard** | Plan status, billing history, profile & settings |
| 📁 | **Projects CRUD** | A ready example resource with ownership checks to build on |
| 📧 | **Transactional email** | Resend-powered welcome, subscription, magic link & password reset emails |
| 🎨 | **Design system** | Custom Tailwind v4 UI (Button, Card, Badge, Input, Table), brand-neutral by default with one-file or env rebranding |
| 🌗 | **Dark mode** | System-aware theme with no flash of unstyled content |
| 🧱 | **Landing page** | Hero, Features, Pricing and FAQ sections ready to edit |
| 🕹️ | **Demo mode** | Ship a public demo of your product: `DEMO_MODE="true"` gives one-click explore accounts, disabled writes and checkout, and a seeded dataset you can reset |
| ✍️ | **Blog & content** | File-based MDX blog with categories and an RSS feed: write a Markdown file, commit, publish |
| 🔎 | **SEO** | Sitemap, robots, dynamic Open Graph images and Article JSON-LD out of the box |
| 🌍 | **i18n** | next-intl with a prefix only for non-default locales, per-key fallback to English, `hreflang`, and bilingual Markdown docs with a staleness check |
| 📨 | **Waitlist & contact** | Double opt-in newsletter waitlist (admin export, Resend sync) and a spam-protected contact form |
| 🤖 | **AI-ready** | Ships agent instructions for Claude Code, Cursor and Copilot (`AGENTS.md`) so your assistant is productive on day one |
| ✅ | **CI + security** | GitHub Actions pipeline (lint, tests, build), security headers, per-endpoint rate limiting, Dependabot with grouped updates |

---

## 🧰 Tech stack

| Layer | Choice |
|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 + dark mode |
| **Auth** | Auth.js v5 (OAuth, magic link, email + password) |
| **Database** | Prisma 7 + PostgreSQL (Neon recommended) |
| **Payments** | Stripe (Checkout + Customer Portal + Webhooks) |
| **Emails** | Resend (welcome + subscription emails) |
| **UI** | Custom design system (Button, Card, Badge, Input, Table) |

### Routes

```
/                    → Landing page (Hero, Features, Pricing, FAQ)
/pricing             → Dedicated pricing page
/login               → Sign in (OAuth, magic link, email + password)
/signup              → Create an account
/forgot-password     → Password reset request (+ /reset-password)
/dashboard           → User overview + plan status
/dashboard/billing   → Subscription management + invoice history
/dashboard/settings  → Profile, sign-in methods & password
/admin               → Admin panel (ADMIN role required)
```

---

## ⚡ Quick start

> 📚 Prefer step-by-step guides? The full documentation lives in [docs/](./docs/README.md) and is rendered at [openstarterkit.dev/docs](https://openstarterkit.dev/docs): getting started, configuration, authentication, deployment.

### 1. Clone and install

```bash
git clone https://github.com/openstarterkit/nextjs-saas-starter-kit.git
cd nextjs-saas-starter-kit
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in all variables: see [.env.example](.env.example) for the full list with comments.

### 3. Database setup

Create a PostgreSQL database (Neon recommended, free tier available at [neon.tech](https://neon.tech)), then apply the committed migrations and seed the example data:

```bash
npx prisma migrate deploy   # applies the committed migrations
npx prisma generate         # generates the Prisma client
npx prisma db seed          # seeds two example plans (edit prisma/seed.ts for your own)
```

### 4. OAuth credentials

**Google:** [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

**GitHub:** [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 5. Stripe setup

1. Create an account at [stripe.com](https://stripe.com)
2. Copy your **Secret key** → `STRIPE_SECRET_KEY`
3. Create your product(s) in the Stripe dashboard. The seed ships two **example**
   recurring prices (monthly + yearly) just so the checkout flow works out of the
   box; replace them with your own product's plans.
4. Copy your **Price IDs** → set `STRIPE_PRO_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID`
   (or edit `prisma/seed.ts` directly), then run `npx prisma db seed`
5. For webhooks locally, install [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### 6. Resend (email, optional)

1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create API key → `RESEND_API_KEY`
4. Set `EMAIL_FROM` to `"OpenStarterKit <hello@yourdomain.com>"`

### 7. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). 🎉

### 8. Make it yours

Your brand lives in **two files**. Swap them and the whole app follows:

```
src/config/site.ts        # name, tagline, description, contact email, links
src/components/logo.tsx   # logo mark + wordmark
```

Then rewrite the landing copy and the `/privacy` + `/terms` placeholders, and it's your product. Details in [Make it yours](#-make-it-yours).

---

## ☁️ Deploy

Click the **Deploy with Vercel** button at the top, or:

```bash
npm i -g vercel
vercel
```

Set all environment variables in the Vercel dashboard. For Stripe webhooks in production, create a new endpoint in the Stripe dashboard pointing to `https://yourdomain.com/api/webhooks/stripe`.

### Make yourself Admin

After signing in for the first time, run:

```bash
npx prisma studio
```

Find your user in the `User` table and set `role` to `ADMIN`. You'll then see the Admin Panel shortcut in your dashboard.

---

## 🎨 Make it yours

The kit ships **brand-neutral**: a placeholder name and a black + grayscale theme, a blank canvas you make yours. Everything (metadata, navbar, footer, emails, legal pages, Open Graph images) reads from a single source, so you can rebrand two ways:

- **From config**: `src/config/site.ts` (name, tagline, description, links), `src/components/logo.tsx` (the logo mark), and the color tokens in `src/app/globals.css`.
- **From env**: set the `NEXT_PUBLIC_BRAND_*` variables (name, tagline, logo accent, colors) and the app rebrands with no code changes. The gradient, glow and Open Graph images follow your accent automatically. See [Configuration](./docs/configuration.md#branding--theming).

Change those, replace the landing copy, and the kit is fully yours. The only intentional exception is the optional ["Built with" badge](#%EF%B8%8F-attribution--the-badge), which credits the kit itself. The **code is MIT**: use it for anything, no strings attached.

---

## 🕹️ Demo mode

Want a public demo of your product (like [the kit's own demo](https://demo.openstarterkit.dev)) without collecting anyone's personal data? Deploy a second instance of this repo against an **isolated database** and set:

```bash
DEMO_MODE="true"          # on the demo deployment
NEXT_PUBLIC_DEMO_URL=""   # on the marketing deployment → points "Sign in"/"Demo" at the demo
```

With `DEMO_MODE` on, the OAuth buttons are disabled and the login page offers **one-click shared accounts** instead: *Explore as User* and *Explore as Admin* (so visitors can see the admin panel too). Fill the demo database with believable fake users, subscriptions and projects:

```bash
npm run db:seed:demo   # ⚠️ wipes users/projects and recreates fixtures; re-run to reset
```

No real emails, no real payments (use Stripe test keys), nothing to GDPR-worry about.

---

## 📁 Project structure

```
src/
├── app/
│   ├── (public)/          # Landing pages (no auth required)
│   ├── (auth)/            # Login, signup, magic link & password reset pages
│   ├── (dashboard)/       # Protected user area
│   ├── (admin)/           # Admin panel (ADMIN role)
│   └── api/               # API routes (auth, checkout, billing, webhooks)
├── components/
│   ├── ui/                # Design system (Button, Card, Badge, Input, Table)
│   ├── landing/           # Landing page sections
│   ├── billing/           # Stripe billing components
│   ├── dashboard/         # Dashboard-specific components
│   └── admin/             # Admin components
├── lib/
│   ├── prisma.ts          # Prisma client (Prisma 7 + adapter)
│   ├── stripe.ts          # Stripe client (lazy proxy)
│   ├── email.ts           # Resend email helpers
│   └── utils.ts           # cn() utility
├── app/actions/           # Server actions (profile, admin)
└── auth.ts                # Auth.js configuration
prisma/
├── schema.prisma          # User, Account, Session, Plan, Subscription
└── seed.ts                # Seeds example plans (replace with your own)
```

---

## 🧪 Tests

```bash
npm test              # run once
npm run test:watch    # re-run on change
npm run test:coverage # with a coverage report
```

Vitest, on the pure logic in `src/lib`: the rate limiter, the password policy, the Markdown parsers behind the blog, docs and changelog, and the environment schema. Plus the two routes worth guarding: the health endpoint, and the Stripe webhook, tested with **real signatures** generated by Stripe's own SDK, so a forged or replayed request is proven never to reach the database writes behind it.

### End-to-end

```bash
npx playwright install chromium   # once, about 115 MB
npm run test:e2e
```

Playwright on the two flows that cost money when they break: **signing up** (account created, session issued, dashboard reached, duplicate email refused) and **starting a checkout** (billing page reachable, anonymous requests bounced, handoff to Stripe returns a real Stripe URL).

Deliberately not part of `npm test` or CI: these need a database and a browser binary, and a clone should not have to install either to run the unit suite. Chromium only, because three engines mean three downloads and three times the flakes.

Nothing here sends email or takes a payment. The test server runs with the Resend key blanked, so registering signs the user straight in instead of mailing a magic link, and the checkout test stops at the handoff rather than driving Stripe's hosted page. Accounts created by the run are deleted afterwards.

Coverage of `src/lib`, excluding the thin wrappers around Prisma, Stripe and Resend:

| | |
|---|---|
| Lines | **63%** |
| Statements | **61%** |
| Functions | **70%** |
| Branches | **48%** |

Run `npm run test:coverage` to check those numbers yourself: they are printed by the command, not published to a badge service.

**Why no coverage badge?** Because it would travel with the kit and cost you something. A badge points at one specific repository, so every clone would show *our* coverage as if it were yours. Publishing it needs a third-party account, a token in your CI, and an uploader that runs where your secrets live. None of that belongs in a starter you are about to make your own: the command above reports the real figure for your code, and nothing leaves your machine.

**Want one anyway?** Perfectly reasonable, and common on open source projects. Point Codecov, Coveralls or whichever tool you prefer at *your* repository, then add its upload step to `.github/workflows/ci.yml` after `npm test`. Both services are free for public repositories. The workflow is yours to edit, and leaving it out of the kit is what makes adding it a decision rather than a leftover.

**Need coverage enforced rather than reported?** Thresholds that fail a build, history over time, and a report someone can hand to a compliance review are an organisation's problem, not a solo maker's. That is the kind of requirement the paid **Pro** tier is aimed at. Everything above stays in the free kit.

**What is fully covered:** the changelog parser, the environment schema, the password policy. **What is not:** the functions that read the database or the filesystem (`getEntitlement`, `getAllPosts`, `recordUsage`). Those need integration tests against a real client, and a unit test that mocks Prisma or Stripe only proves the mock works.

Your environment is validated at boot (`src/instrumentation.ts`): a configuration that is half done, such as a Stripe key with no webhook secret, stops the server with an explanatory message instead of failing at the first payment.

### Release smoke

```bash
npm run smoke -- https://your-app.com
npm run smoke -- https://your-app.com --expect-version 1.4.0
```

Checks a running deployment from the outside: `/api/health`, home, blog index, feed, a real post, the SEO surfaces, and two routing guards (an unknown path is a 404, `/dashboard` redirects to sign in). With `--expect-version` it also compares the version the site reports with the one you are releasing, which is how you catch a deploy that succeeded while still serving the previous build.

Every request is a GET, so it is safe to run against production. The flows that write something (contact form, waitlist) send real email and stay on the manual checklist. Demo deployments are detected from `/api/health` and checked the other way around: the smoke verifies they are *not* indexable.

### Dependency updates

Dependabot is configured in `.github/dependabot.yml` and runs **weekly**, on Monday.

Patch and minor bumps are **grouped by area** (Next, React, Prisma, UI, everything else) so they arrive as a handful of pull requests instead of a dozen. Major bumps come one at a time, because those are the ones worth reading. Majors of `next`, `react` and `react-dom` are excluded on purpose: those are release work, planned on the roadmap, not maintenance to merge on a Monday morning.

GitHub Actions versions are checked monthly.

CI runs lint, unit tests and the build on every push and pull request to `main`.

---

## 🧠 Tech decisions

**Why Prisma 7?** New WASM engine requires a driver adapter; we use `@prisma/adapter-pg`. See `src/lib/prisma.ts`.

**Why Stripe lazy proxy?** `new Stripe("")` throws at module load time. The proxy defers instantiation to first request. See `src/lib/stripe.ts`.

**Why Auth.js v5?** Stable API, first-class Next.js App Router support, PrismaAdapter included.

**Why Tailwind v4?** Native CSS variables, no config file needed, `@custom-variant` for dark mode.

---

## 🏷️ Attribution & the badge

OpenStarterKit ships with a small **"Built with OpenStarterKit"** badge in the app footer. It's on by default: it costs you nothing and helps other makers find the kit.

**Want to remove it?** You're completely free to. Just set:

```bash
NEXT_PUBLIC_REMOVE_BRANDING="true"
```

No license to buy, no fee, no unlock: the badge simply disappears.

If the kit saved you a weekend, the nicest way to say thanks is a coffee.
Totally optional: ☕ [buy us a coffee](https://buymeacoffee.com/openstarterkit).

---

## 🗺️ Roadmap & changelog

OpenStarterKit ships continuously and stays free: pull `main` for updates. A paid **Pro** tier (teams & scale) is coming later.

- 📍 [ROADMAP.md](./ROADMAP.md): what's next
- 📝 [CHANGELOG.md](./CHANGELOG.md): what shipped

## 🌍 Languages

**From v1.6 every user facing string lives in a message file, not inside a component**, with one exception on purpose: the placeholder privacy, terms and cookies pages, which you replace with text of your own before launch and which should not be assembled from a file that quietly falls back to another language. Everything else means filling one JSON file instead of hunting through a hundred components, and needing two languages at once means the routing, the fallback and the language switch are already there rather than a refactor you pay for later.

Built on [next-intl](https://next-intl.dev), with **no translation service and no account required**: the files are plain JSON in the standard layout, so running them through Crowdin or anything else is your call. Your Markdown docs translate too, one file at a time: see [docs/i18n.md](./docs/i18n.md).

**On openstarterkit.dev the language switch is real**: every page of the documentation is there in Italian, and each translation records a checksum of the English file it was written from, so `npm run check:translations` says which ones went stale instead of leaving you to compare by hand, in your repository exactly as in ours. The blog stays English on purpose. Anything without a translation, page or message key, falls back to English with a line saying so rather than a gap, which is the behaviour you inherit and can see working on us instead of reading a description of it.

## 🔒 Security

Found a vulnerability **in the kit**? Please don't open a public issue: report it privately through [our security policy](https://github.com/openstarterkit/nextjs-saas-starter-kit/security/policy).

Once this is your app, write your own policy: add a `SECURITY.md` to your repository, or one in a `.github` repository if you keep several projects under an organisation.

**On dependencies**, the kit is kept clear of every advisory that has a fix, and Dependabot opens the updates weekly. What can still show up in `npm audit` are advisories inside Next.js's own dependency tree: those clear when Next ships a release, not when you run `npm audit fix`, and the "fix" npm suggests for them is a downgrade to an ancient major that you do not want. Run `npm audit` and read what it points at before assuming your clone is exposed.

## 🎨 Content & assets

The demo blog posts, the docs and the placeholder marketing copy that ship with this kit were produced with the help of AI tools. They are placeholders: replace them with your own before you launch.

The blog covers in `content/blog/covers/` are hand written SVG. They carry two color placeholders that the kit fills in with your brand, so you can keep the artwork and change the palette without redrawing anything. See [docs/blog.md](./docs/blog.md) for how they work, and for one thing worth knowing before you swap them for generated images.

The logo mark is a [lucide](https://lucide.dev) icon (ISC licence) rendered as code next to your product name, so there is no image file to swap. Your app ships the `Hexagon` as a placeholder: change it in `src/components/logo.tsx`, and change `src/app/icon.tsx` in the same pass, because the favicon is generated as the miniature of that same mark.

## 📄 License

[MIT](./LICENSE), free for personal and commercial use.

---

<p align="center">
  Built with ❤️ by <a href="https://openstarterkit.dev">OpenStarterKit</a><br/>
  <sub>If this saved you time, a ⭐ on the repo means a lot.</sub>
</p>

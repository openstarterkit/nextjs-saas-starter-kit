# Configuration

Every variable lives in [.env.example](../.env.example) with inline comments. Copy it to `.env.local` and fill in what you need: each feature turns on when its variables are set, and stays quietly off when they are not.

## Database

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. With Neon, use the pooled connection string here. |
| `DIRECT_URL` | Not read by the kit. Prisma 7 takes the connection from `DATABASE_URL` in `prisma.config.ts`, for the app and for migrations alike: to migrate over the direct (non-pooled) connection, set `DATABASE_URL` to it for that command, as [Deployment](./deployment.md#database-migrations) shows. |

## Auth core

| Variable | Notes |
|---|---|
| `AUTH_SECRET` | Signs the session cookie and encrypts two-factor backup codes. Generate with `openssl rand -base64 32`. Changing it signs everyone out, and backup codes generated with the old value stop working. |
| `NEXT_PUBLIC_APP_URL` | Canonical URL of the app (`http://localhost:3000` in dev). Used in emails and reset links. |

## OAuth providers

Both providers are optional; configure the ones you want on the login page.

**Google** ([console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID)

- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (repeat with your production domain when you deploy)
- Copy the client ID and secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

**GitHub** ([github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App)

- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
- Copy the values into `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

## Email (Resend)

| Variable | Notes |
|---|---|
| `RESEND_API_KEY` | Enables all outgoing email: welcome, subscription, **magic link sign-in** and **password reset**. Without it, those two auth flows hide themselves in the UI. |
| `EMAIL_FROM` | Sender identity, e.g. `"YourApp <hello@yourdomain.com>"`. The domain must be verified in Resend. |

Setup: create an account at [resend.com](https://resend.com), verify your domain, create an API key.

Verifying the domain in Resend sets up SPF and DKIM, not a DMARC policy. Add a DMARC record at your DNS provider as well, a `TXT` record on `_dmarc.yourdomain.com` such as `v=DMARC1; p=quarantine; rua=mailto:you@yourdomain.com`: without one, some mailbox providers file transactional email as spam, and nothing tells receiving servers what to do with mail that fakes your domain.

**When an email does not arrive, look in the logs.** Resend can refuse a message the kit handed it: the sending domain is not verified yet, the plan's daily quota is spent, or the recipient is on Resend's suppression list. Every refusal is logged as `[email] <kind> rejected by Resend`, with Resend's reason and status, and never with the recipient's address. The contact form tells the visitor when their message did not go. The password reset, magic link, change of email and newsletter signup deliberately do not: they answer the same way whether or not an address is registered, so that nobody can use them to find out who has an account, and a visible error on failure would undo that. On an unverified domain every email is refused from the first one, which makes it the most likely cause on a new deployment.

*One case needs a person rather than a fix:* a contact who unsubscribes is removed from the Resend audience too, and if Resend refuses that removal the log line says so, because a broadcast sent from Resend would still reach them. Remove them by hand before the next one.

## Stripe

1. Create an account at [stripe.com](https://stripe.com) and copy the **Secret key** into `STRIPE_SECRET_KEY` (and the publishable key into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
2. Create your products and prices in the Stripe dashboard. The seed ships six example plans (Starter and Pro in monthly and yearly variants, a one-time Lifetime plan, and an inactive usage-based example) so checkout works out of the box; replace them with your own.
3. Copy the Price IDs into `STRIPE_STARTER_PRICE_ID` / `STRIPE_STARTER_YEARLY_PRICE_ID` / `STRIPE_PRO_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID` / `STRIPE_LIFETIME_PRICE_ID` (or edit `prisma/seed.ts`), then run `npx prisma db seed`. `STRIPE_METERED_PRICE_ID` is only needed if you enable the usage-based example (see [Billing](./billing.md)).
4. Webhooks locally, with the [Stripe CLI](https://stripe.com/docs/stripe-cli):

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`. Production webhooks are covered in [Deployment](./deployment.md); how the billing flows work (subscriptions, one-time, usage-based) is covered in [Billing](./billing.md).

Two optional switches, both off unless set to `"true"`:

| Variable | Notes |
|---|---|
| `STRIPE_ALLOW_PROMOTION_CODES` | Shows the promotion code field in Checkout. See [Billing](./billing.md#promotion-codes). |
| `STRIPE_AUTOMATIC_TAX` | Turns on Stripe Tax in Checkout. Activate Stripe Tax in the Stripe dashboard first: with Tax not active, checkout still works and charges no tax. See [Billing](./billing.md#stripe-tax). |

## Rate limiting

| Variable | Notes |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Optional. Unset, the limits live in each instance's memory, which on serverless means a request that lands elsewhere starts from zero. |
| `UPSTASH_REDIS_REST_TOKEN` | Optional. Set both and the same counters move to Upstash Redis, shared by every instance and region. |

Both are optional on purpose: a required variable would have made the release that added this a major one for everybody who had already cloned the kit. Nothing else changes when you set them, no client library is installed, and if the store is configured but unreachable the limiter falls back to the in-memory counter rather than failing in either direction.

Worth knowing which limit to move first, because they are not protecting the same thing. The limit on sign-in guards password attempts, and there bcrypt's cost carries most of the weight. The limits on magic link, signup and reset guard **outbound email**: each caps how many messages one address can trigger, and bcrypt has nothing to do with it. If what you are protecting is your Resend bill or your sending reputation, that is the one that gains most from a shared store. [Authentication](./authentication.md#rate-limiting-honestly) has the rest.

## Flags and extras

| Variable | Notes |
|---|---|
| `DEMO_MODE` | `"true"` turns the deployment into a public demo: one-click shared accounts, real OAuth disabled, email-based auth forms hidden. Use an isolated database. |
| `NEXT_PUBLIC_DEMO_URL` | On a marketing deployment, points the sign-in links at your demo instance. |
| `CRON_SECRET` | Demo deployments only. `vercel.json` schedules a daily reseed at 04:00 UTC so shared demo data does not drift; Vercel sends this value as a bearer token and the route refuses to run when it is unset, so an empty value just leaves the reset off. The route deletes every user, and `DEMO_MODE="true"` is the guard that keeps it away from a real database. |
| `KIT_SITE` | Leave it empty. Reserved for the deployment that sells the kit itself: `"true"` switches the landing copy, pricing (hand-written open source tiers plus a Pro waitlist instead of your `Plan` rows), FAQ, footer license links and the dashboard upsell to talk about the repository rather than about your product. See below. |
| `WAITLIST_ENABLED` | Only means anything with `KIT_SITE`. The Pro waitlist form on the open source pricing ships disabled until this is `"true"`, so a deployment cannot start collecting addresses before its real privacy policy is live. |
| `NEXT_PUBLIC_DISABLE_ANALYTICS` | `"true"` stops mounting Vercel Analytics. Left empty it stays on, which is the useful default on Vercel and the wrong one everywhere you would rather ship no analytics at all. |
| `NEXT_PUBLIC_REMOVE_BRANDING` | `"true"` removes the "Built with" footer badge. Free to use, no unlock. |
| `NEXT_PUBLIC_GITHUB_URL` | Repo link shown in the navbar/footer. |

### Two deployments from one codebase

`KIT_SITE` exists because openstarterkit.dev and the kit you cloned are one repository. The alternative was a second copy of the marketing site, and a copy drifts: the day we fixed something on the site it would stop being the code you clone.

**Turning it on in your app gives you our site, not a template of one.** Our headline, our open source tiers and Pro waitlist in place of your `Plan` rows, the license FAQ, the MIT links in the footer, and our name and contact address anywhere you have not set the branding vars. Off is the state you want, and off is the default.

**The mechanism under it is worth having, and that part is yours.** Sections whose wording differs between two deployments carry both variants under `$kit` and `$product` in the message files, and the build drops the one that cannot render, so neither deployment ships the other's copy. Rename the flag, put your own wording under the markers, and you have a marketing site and an app on two domains from one repo, diverging only where they have to. [Languages](./i18n.md) has the details.

**If what you want is a second deployment to show the product off, that is `DEMO_MODE`, not this**: shared one-click accounts, real OAuth off, a daily reseed, and your own app untouched on its own domain.

## Branding & theming

The kit ships **brand-neutral**: a placeholder name and a black + grayscale theme, so it reads as a blank canvas you make yours. There are two ways to rebrand.

**From config** (edit the code):

- `src/config/site.ts`: name, tagline, description, contact email, links
- `src/components/logo.tsx`: the logo mark (swap the icon); the wordmark follows `siteConfig.name`
- `src/app/icon.tsx`: the favicon, drawn with the same mark and generated at build time, so there is no `.ico` to redraw. It picks up your accent color on its own; swap the bolt here when you swap the logo mark.
- `src/app/globals.css`: the color tokens under `:root` and `.dark` (`--primary`, `--primary-2`, `--gradient-brand`)
- `src/app/globals.css`: the decorative hero backgrounds, `.bg-grid` (faint grid lines) and `.bg-glow` (accent halo). They are purely cosmetic, so emptying a rule removes it everywhere it is used: the landing hero, the auth pages and the 404.

**From env** (no code changes): every field falls back to a neutral default, so set only what you want to override.

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_BRAND_NAME` | App name, shown everywhere: wordmark, metadata, emails. |
| `NEXT_PUBLIC_BRAND_TAGLINE` | Headline / tagline. Shown on the page: hero, footer, social image, emails. |
| `NEXT_PUBLIC_BRAND_DESCRIPTION` | Meta description. |
| `NEXT_PUBLIC_SEO_TITLE` | Title for `<title>` and search results. Unset, the title is `name \| tagline`. Set it when the words people search for are not the claim you want on the page: the tagline stays where a reader sees it, this one works for the machine. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public contact address. |
| `NEXT_PUBLIC_MAINTAINER_NAME`, `NEXT_PUBLIC_MAINTAINER_URL` | Who builds the product, shown in a "Who builds it" section on the About page. The section hides entirely when the name is unset; the URL is optional and the name renders without a link. |
| `NEXT_PUBLIC_GITHUB_ORG_URL`, `NEXT_PUBLIC_X_URL` | Social links; footer icons hide when unset. |
| `NEXT_PUBLIC_BRAND_WORDMARK_ACCENT` | Substring of the name to gradient-highlight in the logo. |
| `NEXT_PUBLIC_BRAND_PRIMARY`, `NEXT_PUBLIC_BRAND_PRIMARY_2` | Accent colors (hex). The gradient, glow and Open Graph images follow them automatically. |
| `NEXT_PUBLIC_BRAND_GRADIENT` | Full CSS gradient, if you prefer to set it explicitly instead of deriving it. |

The code is MIT, so use it for anything. The "Built with" footer badge is optional (`NEXT_PUBLIC_REMOVE_BRANDING="true"`).

## SEO

Most of it is already wired, and follows your branding rather than asking to be repeated:

- **Titles and descriptions** per page, with `NEXT_PUBLIC_SEO_TITLE` above for the home page when the searchable title and the readable tagline differ
- **Canonical URLs** on the home page, `/pricing`, `/blog`, `/docs` and every post, built from `NEXT_PUBLIC_APP_URL`. **Set that variable in production**: unset, it falls back to `localhost` and every canonical points at a machine nobody can reach
- **Structured data**: `Organization` and `FAQPage` on the home page, `Article` on each post. The FAQ markup is generated from the same questions you edit in `src/components/landing/faq.tsx`, so answering them for your product updates both at once
- **`sitemap.xml` and `robots.txt`** generated from the code, with drafts excluded
- **`/llms.txt`** describing the site for the machines that summarise it, from its name, description and content. `NEXT_PUBLIC_LLMS_SUMMARY` adds one sentence of your own at the top: say what you do and who for, in the words someone would use asking for it

The FAQ section renders on more than one page, so the structured data is emitted only where `<FAQ withJsonLd />` is used, which is the home page by default. If you move it, move the flag with it and keep it on a single page: the same FAQ published under several URLs is worth less than under one.

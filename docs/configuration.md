# Configuration

Every variable lives in [.env.example](../.env.example) with inline comments. Copy it to `.env.local` and fill in what you need: each feature turns on when its variables are set, and stays quietly off when they are not.

## Database

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. With Neon, use the pooled connection string here. |
| `DIRECT_URL` | Direct (non-pooled) connection, used by Prisma migrations. Optional on providers without pooling. |

## Auth core

| Variable | Notes |
|---|---|
| `AUTH_SECRET` | Signs the session JWTs. Generate with `npx auth secret` (or `openssl rand -base64 32`). |
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

## Stripe

1. Create an account at [stripe.com](https://stripe.com) and copy the **Secret key** into `STRIPE_SECRET_KEY` (and the publishable key into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
2. Create your products and prices in the Stripe dashboard. The seed ships six example plans (Starter and Pro in monthly and yearly variants, a one-time Lifetime plan, and an inactive usage-based example) so checkout works out of the box; replace them with your own.
3. Copy the Price IDs into `STRIPE_STARTER_PRICE_ID` / `STRIPE_STARTER_YEARLY_PRICE_ID` / `STRIPE_PRO_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID` / `STRIPE_LIFETIME_PRICE_ID` (or edit `prisma/seed.ts`), then run `npx prisma db seed`. `STRIPE_METERED_PRICE_ID` is only needed if you enable the usage-based example (see [Billing](./billing.md)).
4. Webhooks locally, with the [Stripe CLI](https://stripe.com/docs/stripe-cli):

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`. Production webhooks are covered in [Deployment](./deployment.md); how the billing flows work (subscriptions, one-time, usage-based) is covered in [Billing](./billing.md).

## Flags and extras

| Variable | Notes |
|---|---|
| `DEMO_MODE` | `"true"` turns the deployment into a public demo: one-click shared accounts, real OAuth disabled, email-based auth forms hidden. Use an isolated database. |
| `NEXT_PUBLIC_DEMO_URL` | On a marketing deployment, points the sign-in links at your demo instance. |
| `KIT_SITE` | Leave it empty. Reserved for the deployment that sells the kit itself: `"true"` switches the landing copy, pricing (hand-written open source tiers plus a Pro waitlist instead of your `Plan` rows), FAQ, footer license links and the dashboard upsell to talk about the repository rather than about your product. |
| `NEXT_PUBLIC_REMOVE_BRANDING` | `"true"` removes the "Built with" footer badge. Free to use, no unlock. |
| `NEXT_PUBLIC_GITHUB_URL` | Repo link shown in the navbar/footer. |

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
| `NEXT_PUBLIC_BRAND_TAGLINE` | Headline / tagline. |
| `NEXT_PUBLIC_BRAND_DESCRIPTION` | Meta description. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public contact address. |
| `NEXT_PUBLIC_GITHUB_ORG_URL`, `NEXT_PUBLIC_X_URL` | Social links; footer icons hide when unset. |
| `NEXT_PUBLIC_BRAND_WORDMARK_ACCENT` | Substring of the name to gradient-highlight in the logo. |
| `NEXT_PUBLIC_BRAND_PRIMARY`, `NEXT_PUBLIC_BRAND_PRIMARY_2` | Accent colors (hex). The gradient, glow and Open Graph images follow them automatically. |
| `NEXT_PUBLIC_BRAND_GRADIENT` | Full CSS gradient, if you prefer to set it explicitly instead of deriving it. |

The code is MIT, so use it for anything. The "Built with" footer badge is optional (`NEXT_PUBLIC_REMOVE_BRANDING="true"`).

# Deployment

The kit deploys anywhere Next.js runs. This guide covers Vercel, the path the kit is tuned for.

## Deploy to Vercel

One-click: use the **Deploy with Vercel** button in the README. Or from the CLI:

```bash
npm i -g vercel
vercel          # first deploy, links the project
vercel --prod   # production deploy
```

## Production environment

Set the variables from [.env.example](../.env.example) in the Vercel dashboard (Project → Settings → Environment Variables). Minimum for production:

- `DATABASE_URL` (and `DIRECT_URL` if your provider distinguishes pooled/direct)
- `AUTH_SECRET` (generate a fresh one for production, do not reuse dev)
- `NEXT_PUBLIC_APP_URL` set to `https://yourdomain.com` (emails and reset links are built from it)
- OAuth credentials, with the **production callback URLs** added in each provider console:
  - `https://yourdomain.com/api/auth/callback/google`
  - `https://yourdomain.com/api/auth/callback/github`
- `RESEND_API_KEY` + `EMAIL_FROM` if you want magic link, password reset and transactional emails

## Database migrations

Builds do not run migrations. Apply them against the production database as a deliberate step:

```bash
npx prisma migrate deploy
```

Run it before (or right after) the first deploy and after every release that adds a migration. Then seed the plans once: `npx prisma db seed`.

## Stripe webhooks in production

Create an endpoint in the Stripe dashboard (Developers → Webhooks) pointing to:

```
https://yourdomain.com/api/webhooks/stripe
```

Subscribe it to the subscription lifecycle events, copy the signing secret into `STRIPE_WEBHOOK_SECRET` on Vercel, and redeploy. Use live keys (`sk_live_...`) on production only.

## Make yourself admin

After your first sign-in on production:

```bash
npx prisma studio
```

Find your user in the `User` table and set `role` to `ADMIN`. The Admin Panel shortcut appears in your dashboard sidebar.

## Optional: a public demo deployment

To offer a demo like [demo.openstarterkit.dev](https://demo.openstarterkit.dev) without collecting personal data, deploy a **second instance** of the repo against an **isolated database** and set `DEMO_MODE="true"` there (plus Stripe test keys). On your marketing deployment set `NEXT_PUBLIC_DEMO_URL` to the demo's URL so the sign-in links point at it. Fill the demo with believable fixtures:

```bash
npm run db:seed:demo   # wipes users/projects on that database and recreates fixtures
```

Details on what demo mode changes are in [Authentication](./authentication.md).

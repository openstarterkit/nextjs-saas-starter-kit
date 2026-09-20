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

- `DATABASE_URL` (the pooled string, if your provider has one: migrations take the direct one, see below)
- `AUTH_SECRET` (generate a fresh one for production, do not reuse dev)
- `NEXT_PUBLIC_APP_URL` set to `https://yourdomain.com` (emails and reset links are built from it)
- OAuth credentials, with the **production callback URLs** added in each provider console:
  - `https://yourdomain.com/api/auth/callback/google`
  - `https://yourdomain.com/api/auth/callback/github`
- `RESEND_API_KEY` + `EMAIL_FROM` if you want magic link, password reset and transactional emails

## Deploying somewhere other than Vercel

The kit is a standard Next.js app, so Docker, a VPS or any Node host works, and since 2.0 there is no extra variable to set for it.

The reason is `NEXT_PUBLIC_APP_URL`, which you already set: the kit passes it to Better Auth as the base URL, so the origin never has to be guessed from an incoming `Host` header. Set it to the address people actually visit, with no trailing slash, and OAuth callbacks and redirects land where you expect wherever the app runs.

If you serve the same deployment on more than one origin, add the extra ones to `trustedOrigins` in `src/auth.ts`.

*Upgrading from 1.x: `AUTH_TRUST_HOST` is no longer read and can be deleted from your environment.*

One more thing changes off Vercel. The public forms (contact, newsletter) are rate-limited by IP, and the IP is read from `x-forwarded-for`. Vercel always sets it; a bare Node host or a proxy that does not add it leaves the kit with no address to key on, and it falls back to a single shared bucket, which means those forms cap at five submissions every fifteen minutes **for everybody at once**. In the other direction, where the header arrives from a proxy you do not control, a client can write it itself and the per-IP limit stops meaning anything. Set the header in your proxy and make sure it is the proxy setting it, not the client.

## Database migrations

Builds do not run migrations. Apply them against the production database as a deliberate step, and check the database before and after:

```bash
npm run check:deploy        # which migrations this database is missing
npx prisma migrate deploy
npm run check:deploy        # should say Ready
```

Those three run against the database in your env files. To run them against production, **put the connection string on the same line as each command**, one at a time:

```bash
DATABASE_URL="postgresql://..." npm run check:deploy
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npm run check:deploy
```

```powershell
# PowerShell, where the variable would otherwise outlive the command
$env:DATABASE_URL="postgresql://..."; npx prisma migrate deploy; Remove-Item Env:DATABASE_URL
```

Repeating it is not pedantry. Setting it once and then running three commands works only while that shell keeps it, and a shell that has lost it does not fail: it falls back to your env files and migrates your development database instead, reporting success. Both commands print the database they connected to before doing anything, `check:deploy` on its first line and Prisma on its `Datasource` line. Read that line every time.

Use the direct connection string, which on Neon is the host without `-pooler`. The check only reads, and never applies anything.

**The host does not identify the database.** On Neon a single endpoint can serve several databases, so two connection strings can differ only in the name after the last `/` and reach completely different data. The check prints both on its first line, `Checking <host> / <database>`, and `prisma migrate deploy` prints them on its `Datasource` line. Read the whole line, not the host.

Run them before the first deploy, and before deploying every release that adds a migration unless its [upgrade notes](./upgrading.md) say otherwise. Then seed the plans once: `npx prisma db seed`.

After a deploy, `/api/health` reports `schema: { aligned, pending }`, and `npm run smoke -- https://yourdomain.com` fails when the database is behind the build.

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

Find your user in the `User` table and set `role` to `ADMIN`. Your session re-reads the role within a minute, so the Admin Panel shortcut appears in your dashboard sidebar without signing out. From there you can promote other people from the panel itself, and the same minute applies to them.

> Upgrading from a version before 1.6.4? The role used to be read only when a session was created, so this step appeared to do nothing until you signed out and back in. Nothing to migrate, the fix is in the code.

## Optional: a public demo deployment

To offer a demo like [demo.openstarterkit.dev](https://demo.openstarterkit.dev) without collecting personal data, deploy a **second instance** of the repo against an **isolated database** and set `DEMO_MODE="true"` there (plus Stripe test keys). On your marketing deployment set `NEXT_PUBLIC_DEMO_URL` to the demo's URL so the sign-in links point at it. Fill the demo with believable fixtures:

```bash
npm run db:seed:demo   # wipes users/projects on that database and recreates fixtures
```

Details on what demo mode changes are in [Authentication](./authentication.md).

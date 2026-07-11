# Getting started

From zero to a running app in about 10 minutes. You only need Node 20+ and a PostgreSQL database.

## 1. Clone and install

```bash
git clone https://github.com/openstarterkit/nextjs-saas-starter-kit.git
cd nextjs-saas-starter-kit
npm install
```

## 2. Environment variables

```bash
cp .env.example .env.local
```

For the first local run you only need two values:

```bash
DATABASE_URL="postgresql://..."   # your Postgres connection string
AUTH_SECRET="..."                 # generate one: npx auth secret
```

Everything else (OAuth, Stripe, email) can wait: the kit degrades gracefully and each feature turns on when its variables are set. The full reference is in [Configuration](./configuration.md).

## 3. Database

Create a PostgreSQL database (Neon has a free tier at [neon.tech](https://neon.tech)), then:

```bash
npx prisma migrate deploy   # applies the committed migrations
npx prisma generate         # generates the Prisma client
npx prisma db seed          # seeds two example plans (edit prisma/seed.ts later)
```

## 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Sign in**. In development the login page has a **Dev Login (Admin)** button: one click, no OAuth apps required, and you land in the dashboard as an admin.

## 5. Next steps

- Real sign-in methods (Google, GitHub, magic link, email + password): [Configuration](./configuration.md) and [Authentication](./authentication.md)
- Payments and webhooks: the Stripe section of [Configuration](./configuration.md)
- Make it yours: your brand lives in `src/config/site.ts` and `src/components/logo.tsx`; swap those two files and the whole app (metadata, navbar, footer, emails, legal pages) follows
- Ship it: [Deployment](./deployment.md)

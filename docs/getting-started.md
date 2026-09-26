# Getting started

From zero to a running app in about 10 minutes.

**You need:** Node 24 or newer, git, and a PostgreSQL database ([Neon](https://neon.tech) has a free tier).

## 1. Clone and install

```bash
git clone https://github.com/openstarterkit/nextjs-saas-starter-kit.git
cd nextjs-saas-starter-kit
npm install
```

## 2. Start it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). There is no database yet, so the page lists the steps left and marks the one you are on. It appears in development only, until the database is ready.

## 3. Create a database, then fill `.env.local`

Create a PostgreSQL database and copy the connection string it gives you. On Neon that is the pooled one, and it ends with `?sslmode=require`: change that to `?sslmode=verify-full`, the stricter mode, or Node prints an SSL warning at every start.

```bash
cp .env.example .env.local      # Command Prompt on Windows: copy .env.example .env.local
```

Two values are enough for the first run:

```bash title=".env.local"
DATABASE_URL="postgresql://..."   # the connection string from your database
AUTH_SECRET="..."                 # any random value; generate one with the command below
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Paste what it prints between the quotes of `AUTH_SECRET`.

Leave `DIRECT_URL` as it is: the kit does not read it, and it ships in the example only because some hosts set it for you.

Everything else (OAuth, Stripe, email) can wait: the kit degrades gracefully and each feature turns on when its variables are set. The full reference is in [Configuration](./configuration.md).

## 4. Create the tables

```bash
npx prisma migrate deploy   # applies the committed migrations
npx prisma db seed          # six example plans, one inactive (edit prisma/seed.ts later)
```

Both read `.env.local`, the same file the app reads.

## 5. Sign in

Restart `npm run dev` and open the site again. Click **Sign in**: in development the login page has a **Dev Login (Admin)** button, which needs no OAuth app and lands you in the dashboard as an admin.

## 6. Next steps

- Real sign-in methods (Google, GitHub, magic link, email + password): [Configuration](./configuration.md) and [Authentication](./authentication.md)
- Payments and webhooks: the Stripe section of [Configuration](./configuration.md)
- Make it yours: your brand lives in `src/config/site.ts` and `src/components/logo.tsx`; swap those two files and the whole app (metadata, navbar, footer, emails, legal pages) follows
- Ship it: [Deployment](./deployment.md)

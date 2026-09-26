# Upgrading

You cloned this kit and made it yours. This guide is about taking a newer version of it without losing that work, and about knowing in advance how much a given release will cost you.

## What a version number promises

Releases follow [SemVer](https://semver.org/), and here the question that decides the number is deliberately about you, not about how much work went in:

> What do you have to do to take this version?

| You have to | Number |
|---|---|
| `git pull`, at most `npm install` | **PATCH**: 1.6.**1** |
| `git pull`, `npm install`, at most a migration that runs itself or an **optional** env var | **MINOR**: 1.**7**.0 |
| Put your hands in: a required env var, a migration to think about against your data, a moved file, a raised runtime, a removed feature | **MAJOR**: **2**.0.0 |

A release can take two weeks of work and be a MINOR. Renaming one environment variable takes ten minutes and is a MAJOR. The number describes your side of the exchange.

## Taking a newer version

Add the kit as a second remote once:

```bash
git remote add upstream https://github.com/openstarterkit/nextjs-saas-starter-kit.git
git fetch upstream
```

Then, for each release you want:

```bash
git fetch upstream --tags
git merge v1.7.0        # or: git rebase v1.7.0
npm install
npm run check:deploy    # from 2.3.0: what your database is missing
npx prisma migrate deploy
```

Conflicts land where you edited the same lines the release did. That is the honest cost of owning the code, and it is smaller than it sounds if your own work lives where the kit expects it: your routes under `src/app`, your components in their own folders, your copy in `src/locales`. The files most likely to conflict are the ones everybody edits, starting with `src/config/site.ts`, the message files and `prisma/schema.prisma`.

Read the [CHANGELOG](https://github.com/openstarterkit/nextjs-saas-starter-kit/blob/main/CHANGELOG.md) before a MAJOR. It says what moved.

## 2.3.3: the Prisma commands read `.env.local`, like the app

A PATCH: `git pull`, `npm install`. Nothing to migrate, nothing to decide.

`npx prisma migrate deploy`, `npx prisma db seed` and `npx prisma studio` now read `.env.local` first and `.env` after it, the order Next.js already used. Until now they read only `.env`, so a clone that followed the guide and put `DATABASE_URL` in `.env.local` stopped at *"The datasource.url property is required in your Prisma config file"*.

**Read this if you keep two different databases in the two files.** The Prisma commands used to act on the one in `.env`; from 2.3.3 they act on the one in `.env.local`, the same one the app opens. A variable set in the shell still wins over both files, so `DATABASE_URL="...direct..." npx prisma migrate deploy` from [Deployment](./deployment.md) is unchanged.

A seed that fails now exits with an error instead of exit code 0, so a script that runs it stops instead of carrying on against an empty database.

## 2.3.2: refused emails are logged, and the contact form tells the truth

A PATCH: `git pull`, `npm install`. Nothing to migrate, nothing to decide.

A message Resend refuses (unverified sending domain, spent quota, suppressed recipient) now appears in your logs as `[email] <kind> rejected by Resend`. Until now it left no trace in production. The contact form tells the visitor; the sign-in and signup flows keep answering as they did, so that they reveal nothing about who has an account.

If you added your own sending code next to `src/lib/email.ts`, pass the Resend call through `deliver()` from `src/lib/email-delivery.ts` the same way, or it keeps the old silence. The kit's send functions now return `true` or `false` instead of Resend's response.

## 2.3.1: check:deploy runs to the end on a database from before 2.0

A PATCH: `git pull`, `npm install`. Nothing to migrate, nothing to decide.

Take it before the 2.0 migration if you are still on 1.x. On a database whose account table is still the Auth.js one, `npm run check:deploy` used to stop with `column "providerId" does not exist` and exit code 2, one line before the counts. It now says which shape it found and prints the user, account and session counts, which are the numbers to compare after the 2.0 migration has moved your passwords into the account table.

## 2.3.0: billing depth, and a check before every migration

A MINOR. It is also the release that adds `npm run check:deploy`, so from here on the order is merge, install, check, migrate:

```bash
git fetch upstream --tags
git merge v2.3.0
npm install
npm run check:deploy
npx prisma migrate deploy
npm run check:deploy
```

The first `check:deploy` names the migration this release adds, `20260915104106_trials`, and any older one your database is still missing. The second should say *Ready*. To check production, set its connection string in the shell for that one command: it wins over your env files, and the first line of the output says which database it is looking at. Use the direct connection, not the pooled one.

The migration adds `Plan.trialDays` and `Subscription.trialEndsAt`, both nullable, so it runs against a populated database without asking you anything. Existing plans offer no trial until you set the column, and existing subscriptions have no trial end. There is no new required environment variable.

### What changes without you doing anything

- The subscription confirmation email, when a subscription starts with a trial, says when the first charge happens instead of announcing an active subscription
- The invoice table shows totals in each invoice's currency, a link to the PDF, and statuses as labels
- Two light theme colours are darker, the destructive red and the muted text, and the success badge is a shade deeper, so all three clear AA contrast on tinted surfaces. If you set your own `--destructive` or `--muted-foreground` in `src/app/globals.css`, check them on tinted surfaces as well as on white
- `scripts/verify-auth-migration.mjs` is gone: `npm run check:deploy` runs its checks among the others
- The Stripe API version is `2026-08-26.dahlia`. If you pinned the previous one on purpose, `src/lib/stripe.ts` is the line

### What you can turn on

- **Free trials**: set `trialDays` on a plan. If you re-run the seed, the example Pro monthly plan gets 14 days
- **Promotion codes**: `STRIPE_ALLOW_PROMOTION_CODES="true"`
- **Stripe Tax**: `STRIPE_AUTOMATIC_TAX="true"`, after activating Stripe Tax in the Stripe dashboard. Read [Billing](./billing.md#stripe-tax) first: with Tax not active, checkout keeps working and charges no tax

### If you customised checkout or the Better Auth packages

The checkout route builds its Stripe parameters in one place, and trials, promotion codes and tax are three branches there: merge them into your own if you replaced it. And upgrade `better-auth` and `@better-auth/prisma-adapter` together: moved one at a time, npm can leave two copies of `@better-auth/core` in the tree with the build still green. `npm ls @better-auth/core` should print one version.

## 2.2.0: two-factor authentication, and nothing you have to decide

This one is a MINOR, and the number is the whole summary:

```bash
git fetch upstream --tags
git merge v2.2.0
npm install
npx prisma migrate deploy
```

The migration adds a `TwoFactor` table and a `User.twoFactorEnabled` column with a default. Both are additive, so it runs against a populated database without asking you anything, and there is no new required environment variable.

### Three behaviour changes worth reading before you merge

They affect accounts that turn the feature on, so nothing changes for anybody until somebody does. They are listed here because each one is a decision you may want to revisit in your own product rather than inherit silently.

**Accounts with 2FA no longer receive a magic link.** The link opens a session directly, so for an account with a second factor it would be a way around the very thing its owner turned on. The response is identical to the normal one, so the form cannot be used to ask whether an address has an account or whether that account has 2FA. Nobody is locked out: enabling 2FA requires a password.

**Automatic account linking is refused for accounts with 2FA.** A provider that verifies an email address normally attaches itself to the account that already has it. For an account protected by a password and a TOTP that would let whoever controls a Google account with the same address sign in with no password and no code. Connecting a provider yourself from Settings still works, because that request carries your session. The rule is four booleans in `src/lib/account-linking.ts` if you want to read it or change it.

**OAuth sign-ins are not asked for a code on top**, because a second factor on the provider's side is the provider's job. If your product needs it anyway, that is the decision to change, and [Authentication](./authentication.md#two-factor-authentication) has the table of which way in asks for what.

### One operational consequence

TOTP secrets and backup codes are stored encrypted with `AUTH_SECRET`. **Rotating that variable makes them unreadable**, which means every user who had the feature on has to set up their authenticator again. That was already true of other things it protects; with 2FA on it is the one worth knowing before you rotate.

If both the phone and the backup codes are gone there is no self-service way back in, by design. An administrator clears the second factor with two SQL statements, which are in [Authentication](./authentication.md).

### If you customised the sign-in flow

The kit signs in through a server action rather than the client SDK. With 2FA enabled, `signInEmail` does not create a session: it answers `twoFactorRedirect`, and a caller that ignores it lands the user on the dashboard with no session and no error. If you wrote your own sign-in action against `@/lib/auth`, that is the one line to add. `src/app/actions/auth.ts` shows it.

## 2.1.0: the account table realigns with Better Auth 1.7.3

**Read this if you are on 2.0.0 through 2.0.3.** If you are installing the kit
for the first time, your database is built from the current schema and there is
nothing here for you.

### What changed, and it was not us

Better Auth 1.7.0 added a required `issuer` column to the account table and
found accounts by the pair `(issuer, accountId)`. Version 2.0 of this kit was
built on that, and 2.0.2 repaired the values it wrote.

On 5 September 2026 Better Auth reverted it. Their reasoning, from the pull
request: a required column that a populated 1.6 database cannot take without a
backfill is too risky to ask of production services, so restoring the previous
schema is the less disruptive path. Accounts are identified by
`(providerId, accountId)` again, exactly as in 1.6, and they committed to
keeping the core schema unchanged for the rest of v1.

It shipped as `better-auth@1.7.3` on 6 September 2026. Their own guide for it is
[here](https://www.better-auth.com/docs/guides/1-7-upgrade-guide).

### What it breaks if you do nothing

Better Auth 1.7.3 never writes `issuer`. A `NOT NULL` column with no default
that nobody writes rejects every insert, so every sign up and every account link
fails. The library also checks the schema when it starts, including in
production, and refuses authentication requests rather than failing one insert
at a time.

Your lockfile pins 1.7.2, so nothing breaks until a dependency update moves you.
That is the actual risk here: the change arrives wearing a patch number.

### What to do

```bash
git fetch upstream --tags
git merge v2.1.0
npm install
```

Before migrating, ask your database whether it can:

```bash
npm run check:deploy
```

It is read only. It reports whether the `issuer` column is still required, and
whether any two accounts share a `(providerId, accountId)` pair, which is the
one thing that stops the migration. Then:

```bash
npx prisma migrate deploy
npm run check:deploy
```

The migration drops the unique index before the column, which is the order
Better Auth's guide insists on: MySQL rebuilds an index whose column disappears,
turning a compound unique index into a constraint on `accountId` alone, and that
rejects a user who holds the same account id at two providers. This kit is
Postgres, where that does not happen, but the order is free and SQL gets copied.

Nothing is lost. An issuer was a function of the provider, so nothing that only
lived in that column existed anywhere else.

### If the migration stops on duplicates

On 1.7.0 through 1.7.2 two provider configurations could share one issuer and
collapse into a single row. From 1.7.3 each provider id keeps its own row again,
so the restored unique index cannot be created while two rows share a
`(providerId, accountId)` pair. The migration checks first and stops with the
pairs named, rather than letting Postgres report a constraint violation at the
end.

Decide which row survives and delete the others, then run it again. Two rows for
the same provider and the same account id are two records of one identity, so
keeping both was never meaningful. The row to keep is usually the one whose
tokens came from a real sign in.

### If you would rather not drop the column yet

Relaxing the constraint is enough to unblock sign ups, and it is reversible:

```sql
ALTER TABLE "Account" ALTER COLUMN "issuer" DROP NOT NULL;
DROP INDEX "Account_issuer_accountId_key";
```

The kit drops the column because `prisma/schema.prisma` is the schema every
clone starts from, and a nullable column nothing writes would outlive the reason
it exists. Your copy is yours.

## 2.0.2: repairing the OAuth issuer

**Read this if you migrated to 2.0 and your users sign in with Google, Apple,
Facebook or LINE.** If you only use GitHub, a password or a magic link, nothing
here affects you and the migration in this release finds nothing to do.

### What was wrong

The 2.0 migration gave every OAuth account an issuer of `local:oauth:<provider>`.
That is the value Better Auth builds for a provider that declares no issuer of
its own. OpenID Connect providers do declare one, so the correct value for a
Google account is `https://accounts.google.com`. GitHub declares nothing, so
`local:oauth:github` was right all along.

Better Auth finds an account by the pair `(issuer, accountId)` and does not fall
back to `providerId`, so a Google row written by the 2.0 migration is never
found at sign in.

### Why that locks people out

The obvious guess is that the user gets a second account. That is not what
happens to most of them. Better Auth would link the unrecognised sign in to the
existing user by email, but that path is refused when the local user's
`emailVerified` is false, which is the default (`accountLinking.requireLocalEmailVerified`).
The 2.0 migration derives `emailVerified` from whether the Auth.js timestamp was
set, and Auth.js leaves it null for most accounts created through OAuth. Those
users get `account not linked` and cannot sign in at all.

### What to do

Take the release and run the migration. It is a new file rather than a fix to
the 2.0 one, because an applied migration is never run again: editing the 2.0
file would repair nobody who had already migrated, which is everybody this
affects.

```bash
git fetch upstream --tags
git merge v2.0.2
npm install
npx prisma migrate deploy
```

Then check the result against what the library would actually look up:

```bash
npm run check:deploy
```

The check is read only. In 2.0.2 it was a separate script, `scripts/verify-auth-migration.mjs`, that compared the issuer each configured provider declares
with what was stored, and listed every row that would not be found, rather than
comparing your database against a value typed into the script. That distinction
is the reason the original mistake survived our own checks: a check that compares
your data with your own assumption can only confirm the assumption.

**Since 2.1.0 it checks something else**, because Better Auth removed the column
and with it the two helpers the script read. If you are running 2.1.0 or later
you cannot verify a 2.0.2 repair with it any more, and you do not need to: the
2.1.0 migration removes the column those values lived in. Go to
[2.1.0](#210-the-account-table-realigns-with-better-auth-173) and take that
instead.

Your users' `emailVerified` stays as it is, and that is correct. Once the issuer
is right, the pair `(issuer, accountId)` finds the account directly and the
email linking path is never reached, so there is nothing to repair by hand. The
first successful sign in sets `emailVerified` back to true on its own, from what
the provider reports.

### If the migration stops with an error

Cognito, Microsoft Entra ID and Paybin also declare an issuer, but theirs is
built from your own configuration or from the token: the region and user pool,
the `iss` claim, the `issuer` option. No file shipped with the kit can know
which value is right for your installation, so the migration stops instead of
writing a plausible one.

Repair those rows by hand, inside a transaction, then run the migration again:

```sql
UPDATE "Account"
   SET "issuer" = 'https://the-issuer-your-provider-actually-uses'
 WHERE "providerId" = 'your-provider-id'
   AND "issuer" = 'local:oauth:your-provider-id';
```

The value to write is the one your provider puts in the `iss` claim of its ID
token. For Cognito it is `https://cognito-idp.<region>.amazonaws.com/<userPoolId>`.

If a user already signed in successfully after 2.0, they have two rows: the
migrated one and the one Better Auth created. Delete the migrated one rather
than updating it, or it collides with the unique index on `(issuer, accountId)`.
The migration does this for the providers it repairs.

### Providers added through generic-oauth

A provider you added yourself has an id the migration cannot classify, so it is
left untouched and named in a notice. Most such providers use the fallback and
are already correct.

**You will not see that notice.** We checked: with a GitHub account in the
database, the migration raises it and the Prisma CLI prints nothing at all. The
same is true of the plain OAuth providers the migration deliberately skips, so a
silent run is the normal outcome and not a sign that everything was classified.

Run `npm run check:deploy` after the migration. On 2.0.x the script it replaced read your
config and reported what the migration could not decide, and it was the only thing
that would tell you. From 2.1.0 the column is gone and the check answers a
different question, so on that version there is nothing here left to classify.

## 2.0: the authentication library changed

Version 2.0 replaces Auth.js with Better Auth. It is the only thing that release
contains: no new features, nothing else to review.

**The boundary held.** Everything that reads the signed-in user still goes
through one module, and it still returns the same five fields:

```ts
import { getCurrentUser, requireUser } from "@/lib/auth"

const user = await getCurrentUser()   // the user, or null
const user = await requireUser()      // the user, or a redirect to sign-in
```

Changing library touched seven files in the kit, and they are exactly the ones
1.7 named in advance: the two sign-in actions, the login page, the route
handler, the middleware, the config and the boundary itself. **If your own code
reads the session through the boundary, it needs no changes at all.** If it
imports `auth()` from `@/auth` directly, those are the places to rewrite.

### Everyone is signed out

Read this one first. Session tokens belong to the library that issued them, so
**every active session ends the moment you deploy**. Your users are not locked
out, they are logged out: they sign in again and everything is where they left
it. Pick your moment accordingly.

### The database migration

The release ships a migration. It moves data, it is not a rename, and one of the
moves fails silently if it does not happen: **passwords move out of
`User.passwordHash` and into a row of `Account`**. Miss it and the database
stays valid, nothing errors, and every user with a password simply cannot sign
in any more.

So count, before and after. Not as ceremony: as the only signal you get.

```sql
-- BEFORE the migration
SELECT count(*) FROM "User" WHERE "passwordHash" IS NOT NULL;

-- AFTER the migration
SELECT count(*) FROM "Account" WHERE "providerId" = 'credential';
```

**The two numbers must match.** If they do not, stop and restore: do not deploy
the application on top of a database that half moved.

The migration runs inside a transaction, so a failure leaves your database
exactly as it was. That is deliberate. Prisma does not wrap migration files in
one by default, and a half applied migration of this kind is worse than one that
fails cleanly, because no version of the app can talk to the result.

Rehearse it on a copy with real data in it first. A migration tried against a
freshly seeded database passes every time, because a clean seed never produces
the rows that break it: the user with no name, the account whose token expiry is
an integer, the magic link user with no account row at all.

### What else the migration does

| Change | What it means for your data |
|--------|------------------------------|
| `emailVerified` becomes a boolean | A user who had a verification date is now `true`. The date itself is gone. |
| `name` becomes required | Users without one get the local part of their email. Empty strings are treated as missing, since they satisfy the constraint while still showing a blank name. |
| `Account` is rebuilt | Renamed columns, plus a new unique key on `issuer` and `accountId`. |
| `Session` is rebuilt | The kit used JWT sessions, so this table was empty and there is nothing to carry over. Sessions are database rows now. |
| `VerificationToken` becomes `Verification` | Single primary key, `token` renamed to `value`. |
| `PasswordResetToken` is dropped | Reset tokens live in `Verification` now. Anyone holding an unused reset link needs a new one. |

**If you wrote your own migration instead**, two details are worth having,
because the Auth.js migration guide documents neither and both fail quietly:

1. **The `issuer` of an OAuth account is not the provider name, and it is not
   the same for every provider.** The guide shows `local:credential` for
   passwords and stops there. `local:oauth:<provider>` is what the library
   builds for a provider that declares no issuer of its own, so it is right for
   GitHub and wrong for Google, whose issuer is `https://accounts.google.com`.
   Get it wrong and existing accounts are not recognised at the next sign in.
   Read [2.0.2](#202-repairing-the-oauth-issuer) above: the kit shipped this
   mistake in 2.0 and repairs it there, and the same section explains how to
   check your own rows instead of trusting a value written by hand.
2. **`expires_at` is a conversion, not a rename.** It held unix seconds as an
   integer; `accessTokenExpiresAt` is a timestamp. Rename it and every OAuth
   token in your table reads as having expired in 1970.

### Things that no longer exist

If you used any of these directly, they are gone and this is what replaces them:

| Removed | Replacement |
|---------|-------------|
| `User.sessionVersion` | Sessions are rows. Revoking one is deleting it. |
| `src/lib/session.ts` | Same, plus `session.cookieCache` in `src/auth.ts`. |
| `PasswordResetToken` and its helpers | `auth.api.requestPasswordReset` and `auth.api.resetPassword`. |
| `SessionProvider` in the root layout | Not needed. The client reads the session without a provider. |
| `next-auth`, `@auth/prisma-adapter` | `better-auth`, `@better-auth/prisma-adapter`. |

### Environment variables: nothing to rename

`AUTH_SECRET` keeps its name, and `NEXT_PUBLIC_APP_URL` is reused as the base
URL. Better Auth would prefer `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`, but the
upgrade already signs everybody out, and adding a variable rename on top of that
buys nothing.

### Two behaviour changes worth knowing

**Signing up no longer sends a magic link.** It creates the account, signs the
person in, and sends a verification email separately. Same destination, one
fewer trick in the middle.

**Rate limiting is built in now.** `/sign-in/email` allows three attempts every
ten seconds out of the box, which is stricter than what the kit did by hand.

### If the build fails on a route you deleted

After the upgrade, `next build` can fail with a missing module pointing at
`src/app/api/auth/[...nextauth]/route.js`, a file that no longer exists. That is
a stale build cache remembering the old route name. Delete `.next` and build
again.

### Getting told when a release lands

Every release is tagged and published, so you do not have to watch this
repository for commits to know when something ships. On GitHub, open the
repository, use **Watch**, choose **Custom**, and tick **Releases** only. You
will be notified when a version is published and stay silent for everything
else.

## Before you upgrade anything

Commit or stash your work first, so the diff you review is the release and nothing else. Then, after the merge:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Four commands, in that order, because they fail from cheapest to most expensive. A type error found in two seconds is a type error you did not wait four minutes for a build to show you.

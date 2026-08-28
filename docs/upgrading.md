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
npx prisma migrate deploy
```

Conflicts land where you edited the same lines the release did. That is the honest cost of owning the code, and it is smaller than it sounds if your own work lives where the kit expects it: your routes under `src/app`, your components in their own folders, your copy in `src/locales`. The files most likely to conflict are the ones everybody edits, starting with `src/config/site.ts`, the message files and `prisma/schema.prisma`.

Read the [CHANGELOG](https://github.com/openstarterkit/nextjs-saas-starter-kit/blob/main/CHANGELOG.md) before a MAJOR. It says what moved.

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
because the official Better Auth guide documents neither and both fail quietly:

1. **The `issuer` of an OAuth account is not the provider name.** The guide shows
   `local:credential` for passwords and stops there. For social accounts the
   value is `local:oauth:google`, `local:oauth:github` and so on. Write the bare
   provider name and existing accounts are not recognised at the next sign in.
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

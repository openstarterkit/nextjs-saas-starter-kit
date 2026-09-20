# Changelog

All notable changes to OpenStarterKit are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/).

> 💡 **OpenStarterKit is free and open source (MIT).** It ships continuously: pull `main` to get every update and fix.

---

## [2.3.1] - 2026-09-20

🔧 **`npm run check:deploy` stopped with an error instead of an answer on a database that has not taken the 2.0 migration yet.** If you are still on 1.x, take this release before you migrate: the command now runs to the end on your database, and the numbers it prints at the end are the ones to write down before a migration that moves your passwords.

### Fixed

- **`npm run check:deploy` on a database from before 2.0.** The account table there is still the Auth.js one, with `provider` and `providerAccountId`, so the check for duplicate `(providerId, accountId)` pairs asked for a column that does not exist, and the run ended with `column "providerId" does not exist` and exit code 2, one line before the row counts. The command now reads the shape of the table first and names it: not created yet, the shape it had before 2.0, or current. It reaches the user, account and session counts in all three, and a column difference it has never seen no longer ends the run. On a current database the output is unchanged
- **Two documentation lines left over from before 2.0.** `AUTH_SECRET` was described as signing session JWTs, which it has not done since sessions became rows in the database, and both [Configuration](./docs/configuration.md) and [Getting started](./docs/getting-started.md) told you to generate it with `npx auth secret`, the CLI of the library the kit no longer depends on. The variable signs the session cookie and encrypts two-factor backup codes, so changing it signs everyone out and makes existing backup codes unreadable, and `openssl rand -base64 32` is the command shown now. `.env.example` also notes that `DIRECT_URL` is not read by the kit
- **Three environment variables shipped explained only in `.env.example`**, while the documentation index promises that every one of them is explained in [Configuration](./docs/configuration.md). `WAITLIST_ENABLED`, `NEXT_PUBLIC_DISABLE_ANALYTICS` and `NEXT_PUBLIC_LLMS_SUMMARY` are now in the guide, in both languages. The middle one is the one worth knowing: left empty, Vercel Analytics is mounted
- **[Deployment](./docs/deployment.md) says that the host does not identify the database.** On Neon one endpoint can serve several databases, so two connection strings can differ only in the name after the last `/` and reach entirely different data. Both `npm run check:deploy` and `prisma migrate deploy` print the database next to the host, and that is the line to read before you migrate anything
- The README said CI runs lint, tests and the build. It also runs `npm audit` as a gate, which is the step that stops a push when a runtime dependency has a high advisory

### Changed

- `resend` from 6.28.0 to 6.28.1

---

## [2.3.0] - 2026-09-19

💳 **Free trials, promotion codes, optional Stripe Tax and PDF invoices, and a command that tells you whether a database is ready for the code you are about to deploy.** This is a MINOR: `git pull`, `npm install`, `npm run check:deploy`, `npx prisma migrate deploy`. The migration adds two nullable columns, and the two new environment variables are optional and off by default.

**Run `npm run check:deploy` before you deploy, from now on.** Builds do not run migrations, so a deploy can put new code in front of a database that is still behind it, and nothing fails at that moment: public pages keep rendering, and the first sign-in or checkout that touches a missing column fails with a database error that does not say what happened. The command reads your database, names the migrations it is missing, and never writes anything. [Upgrading](./docs/upgrading.md) has the steps.

### Added

- **Free trials**, set per plan with `Plan.trialDays`, and offered **once per customer**: anyone who has had a subscription, a cancelled one included, checks out without a trial, which is what stops cancelling and resubscribing from restarting it. The card is collected up front, as Checkout does by default, so the first charge happens when the trial ends with no second step. The billing page shows the end date, and plan cards show a trial only to someone who would get it. The seeded Pro monthly plan has 14 days, to show the pattern
- **Promotion codes at checkout**, behind `STRIPE_ALLOW_PROMOTION_CODES="true"`. Off by default, because Checkout shows the code field whether or not any code exists. An active discount appears on the billing page with its amount, how long it lasts and the code that applied it, read from Stripe when the page loads
- **Stripe Tax at checkout**, behind `STRIPE_AUTOMATIC_TAX="true"`: automatic tax, a required billing address and tax ID collection. Stripe does not refuse a checkout when Stripe Tax is not active on the account: it creates the session and charges no tax. So at checkout the kit asks Stripe for the Tax settings and logs a warning naming what is missing until the setup is finished. It never blocks a payment
- **A link to the PDF** of every invoice, next to the hosted invoice page
- **`npm run check:deploy`**: connection, migrations missing or stuck half way, the account table of a database that came through 2.0.x, and row counts. It prints which database it is looking at before anything else, warns when the connection string is the pooled one, and exits 0 when ready, 1 with what to fix, 2 when it could not check. A `DATABASE_URL` set in the shell wins over the env files, so the same command checks production
- **[Deployment](./docs/deployment.md) shows how to point these at production**: the connection string goes on the same line as each command. Setting it once for a shell and then running three commands fails quietly when the shell no longer has it, because the fallback is your own env files and the migration reports success against your development database
- **`/api/health` reports whether the database has every migration the build ships**, as `schema: { aligned, pending }`: a boolean and a count, never the migration names, and `null` when the database cannot be asked. `npm run smoke` fails on a deployment whose database is behind

### Changed

- **Three light theme colours are darker**: the destructive red (`#ef4444` to `#c81e1e`), muted text (`#737373` to `#6b6b6b`) and the success badge text (green-600 to green-700). Each is the lightest value that clears WCAG AA on every surface it is drawn on, where the danger zone cards, error messages, the delete button, the getting-started checklist, the upsell card and the success badge were below 4.5:1. If you set your own `--destructive` or `--muted-foreground` in `src/app/globals.css`, check them on tinted surfaces as well as on white
- **The subscription confirmation email, when a subscription starts with a trial**, says the trial has started and when the first charge happens, instead of announcing an active subscription with an amount
- **`scripts/verify-auth-migration.mjs` is replaced by `npm run check:deploy`**, which runs the same two checks on the account table among the others
- **Stripe API version** moved from `2026-07-29.dahlia` to `2026-08-26.dahlia`, with `stripe` 22.6.2. Nothing in Stripe's changelog between the two is marked breaking. If you pinned the previous one deliberately, `src/lib/stripe.ts` is the line to change back
- `next` and `eslint-config-next` to 16.3.5, `react` and `react-dom` to 19.3.0, `better-auth` and `@better-auth/prisma-adapter` to 1.7.5 with no schema change. Upgrade the last two together: moved one at a time, npm can leave two copies of `@better-auth/core` in the tree while the build stays green, and `npm ls @better-auth/core` should print a single version
- The end-to-end config reads `.env.local` and `.env`, so the checkout test runs whenever a Stripe price is configured instead of skipping itself

### Fixed

- **The settings page no longer fails for anyone who signed in more than a day ago**, which is most people most of the time. The active sessions card listed devices through Better Auth's `listSessions`, and that endpoint requires a session created within `freshAge`, a day by default, refusing anything older with "Session is not fresh". The error took the whole page down, not just the card. Sessions have been rows in your own database since 2.0, so the list is read from them directly; ending a session is unchanged. **This affects 2.2.0 too**, where the card shipped: taking 2.3.0 fixes it
- **The accessibility audit judges the whole page.** axe decides colour contrast only inside the viewport and leaves the rest undecided, which the audit did not count, so anything below the first screen went unchecked. Each page is now measured at its full height, and sign-in is also audited with an error message on screen
- **Invoice amounts are shown in the invoice's own currency**, as the invoice total. They carried a dollar sign whatever the currency, and showed what had been paid so far, which on an open invoice read as zero
- **Subscription and invoice statuses show as labels** instead of Stripe's codes, on the billing page and on the dashboard home
- **`DIRECT_URL` is documented as what it is**: nothing reads it since Prisma 7 moved the connection to `prisma.config.ts`, and migrations run over whatever `DATABASE_URL` holds. [Deployment](./docs/deployment.md) shows how to point them at the direct connection

### Notes

- **A coupon that lasts a number of months counts from when it is applied**, a trial included: three months applied at the start of a 14-day trial cover about two and a half paid months
- **Stripe Tax is a paid Stripe feature**, charged per transaction on top of the usual fees, and it **calculates and collects while registering you nowhere.** It collects only where you have added a registration, and a price with no tax behaviour set is treated as tax exclusive. [Billing](./docs/billing.md) has the setup
- **Reminder emails before a trial ends are Stripe's**: turn them on in your Stripe Billing settings rather than in the kit
- **Two items announced for this release are not in it.** Plan changes with proration stay in the Stripe Customer Portal, which already prorates. Profile photo upload is not part of it either, so the kit still accepts no file from outside
- The source archive attached to the `v2.2.0` tag carries 16 September as the date of 2.2.0 in this file. The release date is 13 September: the file was corrected on `main` afterwards, and release tags are not moved

## [2.2.0] - 2026-09-13

🔐 **Two-factor authentication, active sessions, and an accessibility audit that runs with the tests.** This is a MINOR: `git pull`, `npm install`, `npx prisma migrate deploy`. The migration is additive, and there is no new required environment variable.

**Two behaviour changes to know about**, because they affect accounts that turn 2FA on. Better Auth asks for the second factor on email sign-in and nowhere else, so the kit closes the two paths that went around it. Accounts with 2FA **no longer receive a magic link**, since it opens a session directly; the response stays identical to the normal one, so the form cannot be used to ask whether an address has an account. And **automatic account linking is refused** for them, because otherwise whoever controlled a Google account with the same address could sign in with no password and no code. Connecting a provider yourself from Settings still works, since that request carries your session. Both are decisions rather than defaults, and [Upgrading](./docs/upgrading.md) says where to change them.

### Added

- **Two-factor authentication (TOTP, RFC 6238)**, self-hosted, from Dashboard → Settings. No vendor and no SMS bill. The QR code is rendered server side as SVG, so no QR library reaches your users' browsers, and the manual key is there for anyone who cannot scan. The name shown inside the authenticator app comes from your `siteConfig.name`
- **Enabling it takes two steps**: the first shows the QR code, the key and the backup codes, and only a correct code from the app switches it on. A setup abandoned halfway leaves the account exactly as it was
- **Ten backup codes**, each good for one sign-in and spent when used. Generated upper case and without `0`, `O`, `1` or `I`, because they get typed back in from paper, and stored encrypted with `AUTH_SECRET`
- **Active sessions in Settings**: every session with its device, browser and IP address, the current one marked, and a button to end any of the others. Sessions have been database rows since 2.0, so this is a view of what was already there
- **Change your email address**, in two confirmations: one to the new address to prove you hold it, one to the old address so a stolen session cannot move an account away quietly
- **Rate limiting on a shared store.** Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` and the counters move to Upstash Redis, shared by every instance and region. Both optional by design: a required variable would have made this release a major one. No client library is installed, and an unreachable store falls back to the in-memory counter
- **Syntax highlighting and a copy button** on every code block in the docs and the blog. It runs at build time and ships no JavaScript: both themes are written into the markup as CSS variables, so dark mode switches with no second render and no flash
- **A header naming the file a snippet comes from**, with an icon for the file type. Write `title="src/lib/auth.ts"` on the fence, or `filename=`
- **An accessibility audit that runs with the tests**: axe-core against WCAG 2.1 AA on eight pages, the signed-in ones included, failing the build on serious and critical findings

### Changed

- **A more distinctive brand mark by default**: an allen key head in place of the plain hexagon. It only shows if you ship without rebranding
- **Modal overlays blur what is behind them** (dialog, alert dialog and sheet), so the page underneath stops competing with the modal. More visible on the light theme than on the dark one
- `checkRateLimit` is now async and its callers await it. Internal: the surface the kit promises you does not move
- The active navigation item carries `aria-current`, so what was visible is now also announced

### Fixed

- **An OAuth failure no longer leaves your site.** `onAPIError.errorURL` was never configured, so every OAuth error landed on Better Auth's own error page. They now arrive at `/login` as a code in the query string, which that page already displays
- **The hero mockup is no longer read out as content.** It is a picture of the product drawn in markup, and a screen reader announced its contents in the middle of the home page. It is `aria-hidden`
- **The monthly/yearly toggle on pricing** pointed with `aria-controls` at elements that did not exist. It is two buttons in a group with `aria-pressed` now. Same classes, nothing moves
- **The cover image on a blog card** was a second link to the same article with no accessible name. It is out of the tab order, and the mouse behaves identically
- Contrast raised on two pieces of text that were below the ratio

### Security

- **sharp to 0.35.4** ([GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c), high), which carries two fixes from the upstream libheif dependency. It reaches the tree as an optional dependency of Next.js rather than as one of ours, so no `overrides` entry is involved
- **js-yaml in both places it appears** ([GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh), high): 3.15.2 under `gray-matter`, which is the copy in the production tree, and 4.3.2 under ESLint, which is development only
- **Neither is reachable from outside in the kit as it ships**, and the reason differs for each. `next.config` declares no `images` configuration and no route accepts an upload, so the optimiser only ever handles assets you shipped yourself and sharp is never handed a file chosen by a visitor. `gray-matter` parses the frontmatter of the Markdown in your own repository, at build time, so the YAML it reads is yours. They are updated to keep the tree clean. After pulling, `npm audit` reports zero

### Notes

- **Rotating `AUTH_SECRET` makes every stored TOTP secret and backup code unreadable**, so users with 2FA on would have to set up their authenticator again. Worth knowing before you rotate it
- **If both the phone and the backup codes are gone there is no self-service way back in**, by design. An administrator clears the second factor with two SQL statements, in [Authentication](./docs/authentication.md)
- **OAuth sign-ins are not asked for a code on top**, because a second factor on the provider's side is the provider's job. [Authentication](./docs/authentication.md) has the table of which way in asks for what
- **Profile photo uploads move to 2.3.** They would be the first endpoint in this kit that accepts bytes from outside, which means file type validation, a size ceiling, a filename the user does not choose and storage behind an optional variable. That is a release of its own
- **What the accessibility suite does not cover** is stated in the test file: axe finds the mechanical third of WCAG. Keyboard completion, focus order and whether a label says something useful stay manual. Minor and moderate findings are printed but do not fail the build

## [2.1.0] - 2026-09-06

🔄 **Better Auth removed the `issuer` column that 2.0 was built on, and this release follows them back.** If you are on 2.0.0 through 2.0.3, take it and run the migration. If you are installing the kit for the first time there is nothing to do: your database is built from the current schema.

Better Auth 1.7.0 added a required `issuer` column to the account table and found accounts by `(issuer, accountId)`. On 5 September they reverted it, and 1.7.3 shipped the next morning. Their reasoning, and it is a fair one: a required column that a populated 1.6 database cannot take without a backfill is too risky to ask of a production service, so restoring the previous schema is the less disruptive path. They have committed to leaving the core schema alone for the rest of v1.

The consequence for anyone on 2.0.x is not cosmetic. Better Auth 1.7.3 never writes `issuer`, and a `NOT NULL` column with no default that nobody writes rejects every insert, so every sign-up and every account link fails. The library now checks the schema when it starts, including in production, and refuses authentication rather than failing one insert at a time. Your lock file pins 1.7.2, so nothing breaks until a dependency update moves you, which is the actual risk: the change arrives wearing a patch number.

`docs/upgrading.md` has the steps, including what to do when two accounts share a `(providerId, accountId)` pair.

### Changed

- **`Account.issuer` is gone, and `@@unique([providerId, accountId])` is back**, which is the identity this kit used before 2.0 and the one Better Auth used in 1.6. The migration drops the unique index before the column, which is the order Better Auth's guide insists on: MySQL rebuilds an index whose column disappears and turns a compound unique index into a constraint on `accountId` alone, which rejects a user holding the same account id at two providers. This kit is Postgres, where that does not happen, but the order is free and SQL gets copied
- **The migration refuses to run on duplicate account keys** rather than letting Postgres report a constraint violation at the end. On 1.7.0 through 1.7.2 two provider configurations could share one issuer and collapse into a single row; from 1.7.3 each provider keeps its own row again, so a duplicate pair has to be resolved first. It names the pairs
- **`scripts/verify-auth-migration.mjs` checks something different now.** It used to ask the library what issuer each provider declares and compare that with your data. Both helpers it relied on were removed in 1.7.3, so it would not even import. It now reports whether the `issuer` column is still required and whether any two accounts share a `(providerId, accountId)` pair, and it is useful both before and after the migration
- `better-auth` and `@better-auth/prisma-adapter` to 1.7.3, and `zod` to `^4.5.4`, which 1.7.3 requires

### Fixed

- **Every page has an Open Graph image again.** The home page, pricing, docs, blog and the legal pages declared `twitter:card: summary_large_image` and no image at all, which asks a platform for the large card and hands it nothing. The generated image at `/opengraph-image` was working the whole time and simply never referenced: Next merges `openGraph` shallowly, so a page that declares the object replaces the parent's and loses the image the file convention put there. A colocated image survives, which is why blog posts were unaffected and nothing looked wrong from inside the site

### Notes

- **This is not the v2.1 the roadmap described.** Two-factor authentication, rate limiting on a shared store, the accessibility audit and profile photos move to v2.2, and `Billing depth` becomes v2.3. A schema that disagrees with the library underneath it comes before new features, and 2FA in particular touches the sign-in flow, which is where 2.0.2 went wrong. It gets a release of its own rather than a corner of this one
- We had opened a documentation pull request upstream about the issuer, because the Auth.js migration guide was the one guide of theirs that never mentioned it. It was [closed](https://github.com/better-auth/better-auth/pull/11079), absorbed into the larger revert rather than turned down. The guide no longer needs that paragraph, because the column no longer exists

## [2.0.3] - 2026-09-02

🔒 **Three high severity advisories reached the dependency tree in two days, and none of them is reachable from this kit.** They are fixed here anyway, because a lock file carrying open advisories is something every clone inherits, and because `npm audit` is a step in this project's CI. Nothing in this release changes how the kit behaves. After pulling, `npm audit` reports zero.

Where they come from is worth knowing, because it explains why one of them needed more than an update. `mysql2` arrives through the Prisma CLI, which pins it to an exact version, so no Prisma release in the 7 line moves it: it takes an `overrides` entry, and that entry can be deleted once Prisma 8 ships without it. The kit runs on PostgreSQL and rejects a `mysql://` connection string at startup, so the code path the advisory describes is never entered. `fast-uri` arrives through `ajv` under `@hookform/resolvers`, and the kit imports only the Zod resolver, so `ajv` never loads. `browserslist` sits in the ESLint chain and never reaches a running application.

### Security

- **`mysql2` pinned to `^3.24.3` through `overrides`**, closing [GHSA-3f6p-5ww8-9rcr](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr), an auth plugin downgrade to `mysql_clear_password` that leaks credentials, and [GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3), an unbounded zlib inflate in the compressed protocol. The first is fixed in 3.22.0 and the second in 3.23.1, so stopping at the version the first advisory names would have left the second one in place
- **`browserslist` to 4.28.8 and `fast-uri` to 3.1.7.** Both were already inside the ranges the kit declares, so these are a lock refresh and need no override

### Added

- **An `updated` date for posts.** Optional frontmatter that sets `dateModified` in the article schema, `modifiedTime` in Open Graph and `lastModified` in the sitemap, and prints an `Updated:` line beside the publication date. Without it, editing a published post stays invisible to a crawler until its next natural visit, and invisible to a reader deciding whether a two month old guide still applies. It holds one date, the most recent one: edit a post three times and you overwrite it three times
- **It deliberately does not change ordering.** The index stays sorted by `date`. Moving `date` forward is the shortcut it exists to replace, because that announces freshness by lying about publication and pushes an old post back to the top
- **The build refuses an `updated` earlier than `date`.** That pair ships a `dateModified` before `datePublished`, which is invalid structured data, together with a sitemap `lastmod` that moves backwards, and neither of those complains on its own
- **`docs/blog.md` says when to set it**, which matters more than the field: only when the substance changed, never for a typo or a fixed link. A modification date is a claim, and raising it on every small edit teaches search engines to stop trusting the dates on your site, sitemap `lastmod` included. The cost of overusing it is not a penalty, it is losing the signal

### Changed

- **The two dates on a post are now labelled** `Published:` and `Updated:`. Side by side and unlabelled they read as a date range. The cards on the index carry a single date and stay as they were, and the date format is unchanged everywhere
- `next-intl` to 4.14.2, `lucide-react` to 1.39.0, and `prisma`, `@prisma/client` and `@prisma/adapter-pg` to 7.10.0

## [2.0.2] - 2026-08-31

🔴 **The 2.0 migration wrote the wrong issuer for Google accounts, and it can lock those users out.** If you migrated to 2.0 and your users sign in with Google, Apple, Facebook or LINE, take this release. If you only use GitHub, a password or a magic link, nothing here affects you and the migration finds nothing to do.

The 2.0 migration gave every OAuth account an issuer of `local:oauth:<provider>`. That is what Better Auth builds for a provider that declares no issuer of its own, which is true of GitHub and not of Google, whose issuer is `https://accounts.google.com`. Account lookup at sign in is by `(issuer, accountId)` with no fallback on `providerId`, so those rows are never found.

The failure is worse than a duplicate account. Better Auth would link the unrecognised sign in to the existing user by email, but that path is refused when the local user's `emailVerified` is false, which is the default. The 2.0 migration derives `emailVerified` from whether the Auth.js timestamp was set, and Auth.js leaves it null for most accounts created through OAuth, so those users get `account not linked` and cannot sign in at all.

We found it while checking whether the issuer format was worth reporting upstream. It was not: the value is documented in Better Auth's own 1.7 upgrade guide, and in the Clerk, Auth0 and Supabase migration guides. The guide we read, the one for migrating from Auth.js, is the only one that omits it.

### Fixed

- **A new migration repairs the issuer** of Google, Apple, Facebook and LINE accounts. It is a new file rather than an edit of the 2.0 one, because an applied migration is never run again: editing the 2.0 file would repair nobody who had already migrated, which is everybody this affects. It converges from both directions: run it after 2.0, or straight after a fresh 2.0, and the result is the same
- A user who already signed in after 2.0 has two rows, the migrated one and the one Better Auth created. The migration removes the stale one rather than updating it, which would collide with the unique index on `(issuer, accountId)`
- **The migration stops instead of guessing** for Cognito, Microsoft Entra ID and Paybin, whose issuer is built from your own configuration or from the token. `docs/upgrading.md` has the queries to repair those by hand
- `docs/upgrading.md` said the issuer was `local:oauth:<provider>` for every social account. It now says what the value depends on
- **Nothing else needs repairing by hand.** `emailVerified` stays as it is: with the issuer corrected, the pair `(issuer, accountId)` finds the account directly and the email linking path is never reached. The first successful sign in sets `emailVerified` back to true on its own

### Added

- **`scripts/verify-auth-migration.mjs`**, read only. It asks the library what the issuer of each configured provider should be and compares that with what is stored, rather than comparing your database against a value written into the script. That distinction is not academic: our own release check for 2.0 confirmed the issuer matched the string we had typed, so it was green while the value was wrong. Run it after upgrading:

  ```bash
  node --env-file=.env scripts/verify-auth-migration.mjs
  ```

- The Better Auth badge in the README has its logo back

## [2.0.1] - 2026-08-28

📝 **The kit said Auth.js in the places people read first.** 2.0 changed the library and left its name behind on the README badge, the feature table, the landing page copy and the site description, so the shop window advertised the library the release had just removed. No code behaviour changes.

### Fixed
- **README, landing page and site description now say Better Auth**, including the badge, which also carried an Auth0 logo that was never right
- **`docs/authentication.md`**: the magic link is a plugin with `sendMagicLink`, not a Resend provider; adding a social provider goes under `socialProviders`; and linking an account that already has the same verified email is the default now, so the flag that used to be needed is gone
- **`docs/deployment.md`**: `AUTH_TRUST_HOST` no longer exists. Deploying outside Vercel needs no extra variable, because `NEXT_PUBLIC_APP_URL` is passed to Better Auth as the base URL and the origin is never guessed from a `Host` header. Extra origins go in `trustedOrigins`
- **`.env.example`**: the commented `AUTH_TRUST_HOST` block removed, so nobody copies a variable nothing reads
- Code comments that still described the old library
- **The outline on posts and docs pages scrolled badly when it was long.** Its scrollbar sat against the text with nothing between them, and the list never moved: reading to the bottom of a long article highlighted an entry that had scrolled out of sight. The list now scrolls on its own with the heading kept in place above it, the bar has room of its own reserved whether it is needed or not, and the highlighted entry is kept in view as you read. The scrolling is done by hand rather than with `scrollIntoView`, which cannot be told to leave the page alone and would move the article under the reader

## [2.0.0] - 2026-08-28

🔐 **Authentication moves from Auth.js to Better Auth.** That is the whole release: no new features, nothing else to review, so the upgrade is as easy to adopt as a library change can be. Auth.js is now part of Better Auth and its own README points new projects at it, and a starter kit is a new project every time someone clones it. Version 1.7 built the boundary that makes this cheap, and it held: changing library touched seven files, and they are exactly the seven that 1.7 named in advance.

### Breaking

- **Everyone is signed out when you deploy.** Session tokens belong to the library that issued them. Your users are not locked out, they are logged out
- **There is a database migration, and it moves data.** Password hashes leave `User.passwordHash` for a row in `Account`. If that move does not happen the database stays valid, nothing errors, and every user with a password silently cannot sign in. Count before and after, and stop if the numbers disagree: `docs/upgrading.md` has the two queries
- **`emailVerified` becomes a boolean** and `name` becomes required. Users without a name get the local part of their email, empty strings included, because an empty string satisfies the constraint while still showing a blank name
- **`PasswordResetToken`, `User.sessionVersion` and `src/lib/session.ts` are gone.** Reset tokens live in `Verification`, and sessions are rows that can be deleted, which is what `sessionVersion` was imitating
- **`SessionProvider` is gone from the root layout.** The client reads the session without one
- **`next-auth` and `@auth/prisma-adapter` are uninstalled.** Code written against the boundary needs no changes. Code that imported `auth()` from `@/auth` directly is what you have to rewrite

### Added

- **Sessions live in the database.** Revoking one is deleting a row, immediately and everywhere, instead of waiting out a token that cannot be recalled. `session.cookieCache` keeps the cost to one signed cookie read for most requests
- **Rate limiting out of the box**: three attempts every ten seconds on password sign-in, stricter than the hand rolled check it replaces
- **An end to end test for signing in.** The suite tested signing up, which issues its own session, so the credentials path was never actually walked. It is now, against a migrated database

### Changed

- **bcrypt hashes keep working.** Better Auth hashes with scrypt by default; the kit passes its own hash and verify functions, so existing passwords still verify and **nobody has to reset anything**
- **No environment variable is renamed.** `AUTH_SECRET` keeps its name and `NEXT_PUBLIC_APP_URL` is reused as the base URL, because the upgrade already signs everyone out and a rename on top of that buys nothing
- **Signing up sends a verification email** instead of a magic link that doubled as one. Same destination, one fewer trick in the middle
- **The route handler moved** from `src/app/api/auth/[...nextauth]` to `src/app/api/auth/[...all]`. If the build then fails on a module you deleted, remove `.next`: it is the old route name cached

### Fixed

- **`npx prisma db seed` did nothing.** Prisma 7 stopped reading the `prisma` key in `package.json` and wants `migrations.seed` in `prisma.config.ts`. It printed instructions and exited, so a fresh clone ended up with no plans, which means no pricing page and no checkout, with nothing that looked like an error
- **`npm run db:seed` and `db:seed:demo` failed to compile** under TypeScript 6, which reports the `moduleResolution` value the ts-node block was using as deprecated

## [1.7.0] - 2026-08-27

🎨 **UI kit expansion.** The form and overlay primitives the kit had left to plain HTML, and the features that put them to work instead of a gallery page nobody opens: the blog splits into real paginated routes, the admin panel gets a revenue chart, settings opens as a modal whose URL is still a page, and an account can finally be deleted. Plus a pass over every page on a phone, per-page social previews, and the boundary that makes the next major a one file change.

### Added
- **The form primitives the kit was missing**: select, checkbox, radio group and textarea, with [react-hook-form](https://react-hook-form.com) as the form layer. A form validates against the same Zod schema the server action already checks, so the rules exist once instead of as a browser copy that drifts out of step
- **Overlays and navigation**: popover, sheet, alert, alert dialog, breadcrumb, pagination and skeleton, each documenting when *not* to use it. A popover does not trap focus, so it is right for something optional beside its control and wrong for a decision that blocks; an alert is a message that stays, while what follows a click is a toast; a skeleton has to carry the shape of what it replaces, or the page jumps when the data lands and it is worse than the spinner it improved on
- **Blog pagination as real routes.** `/blog` and each category page split every twelve posts into prerendered routes rather than a query string, so every page has an address of its own that can be linked and returned in a result. Page one keeps the bare address, a number past the end is a 404 rather than an empty page that still looks valid to a crawler, and the RSS feed ignores paging and stays whole. `POSTS_PER_PAGE` lives in `src/lib/blog.ts`, and leaving it at zero lists every post on one page, the way the kit already treats a value you leave out
- **A recurring revenue chart on the admin panel**, drawn from the subscriptions already in your database
- **Deleting an account**, which the kit had never actually implemented: the only delete it shipped unlinked an OAuth provider. One `delete` carries away sessions, linked accounts, projects, tokens and the subscription row, because every relation to `User` already cascaded. The work is in the four refusals: demo mode, a confirmation that does not match (checked on the server too, because the browser is not to be trusted), the last remaining admin, and an active subscription, which is now cancelled on Stripe first rather than sending the user off to do it. If Stripe refuses, nothing is deleted: the unforgivable failure is the account disappearing here while the card keeps being charged
- **Settings opens as a modal, and its URL is still a page.** An intercepting route, because the account actions redirect back to `/dashboard/settings` and linking a provider leaves the application for the OAuth round trip: a client only modal no longer exists by the time the user comes back. One component renders both forms, so they cannot diverge
- **Projects**: a card grid, creation in a modal, and search
- **Breadcrumbs**, emitted on posts as `BreadcrumbList` structured data built from the same array the visible row renders, and in the dashboard without it, where there is nothing for a search engine to read
- **An outline and heading anchors on posts**, reusing the one the documentation already had
- **Per-page Open Graph**, so a link to your pricing page stops previewing like your home page
- **Your prices as structured data**, `SoftwareApplication` offers built from the same rows the pricing table renders, so an answer engine can state the figure instead of pointing at a page somebody has to open
- **An optional line in `/llms.txt`** for the sentence you want repeated about you. Shipped unset on purpose: a positioning line is the one piece of copy that cannot have a sensible default
- **`AGENTS.md`**, this project's rules for coding agents, nine of them and each with the reason it exists
- **[docs/upgrading.md](./docs/upgrading.md)**, written before it is needed rather than after: what a version number means here, and what a major asks of a clone
- **`@/lib/auth`, the boundary between this kit and whichever library handles authentication.** Everything outside the sign in flow reads the session through it, and it returns five fields and nothing a specific library adds on top. It is here now, working on the current library, so that v2.0 edits one file instead of twenty pages
- **The modules this release adds are covered before their figures are published**: the auth boundary, the builders behind structured data and page metadata, the project schema and the guards around usage reporting. The suite goes from 160 tests to 202, and all four coverage figures in the README move up rather than down

### Changed
- **Vercel Analytics can be declined**, with `NEXT_PUBLIC_DISABLE_ANALYTICS`. It shipped mounted unconditionally, which meant every deployment of the kit sent data from somebody else's product without its author being asked. Left unset it stays on, which is the useful default on Vercel
- **More room across the dashboard**: side margins doubled from `lg` up on every container, and the admin table takes back the width it was giving away
- **The roadmap is renumbered.** v2.0 is the authentication migration and nothing else, because a major that also adds things is a major people postpone. What was 1.9 becomes 2.1, what was 1.8 becomes 2.2, and Pro loses its version number, since it is not a release of the free kit
- **ESLint majors leave Dependabot**, alongside `next`, `react` and `react-dom` and for the same reason: `eslint.config.mjs` holds no rule of ours, so the ESLint version is governed by `eslint-config-next` rather than by us. Their peer range is a permission, not a statement that they tested the next major. The decision reopens on its own, the day a peer conflict shows up at install

### Fixed
- **Inline code wraps everywhere, from a single rule.** A forty character path with nowhere to break was running off the side of a phone, on the about page, the sign up and password recovery pages, and the empty state of the blog. `:not(pre) > code` in `globals.css` covers all of them instead of five patches. Fenced blocks stay excluded on purpose: those keep their lines whole and scroll in their own box, which is what you want when the line is a command to copy
- **Tables scroll in a box of their own**, in the documentation and in posts, rather than widening the page around them
- **Search and its button stack on a phone** instead of being squeezed side by side
- **Settings told a user who never used OAuth that their avatar came from their provider**, which was simply untrue. It also showed their email address twice on the same page, and selected their name when the modal opened. The email is now a read only field that says why it cannot be changed there

### Security
- **JSON-LD no longer closes the script element.** `JSON.stringify` does not escape `<`, so a string reaching the graph that contains `</script>` ends the element early and everything after it is parsed as markup. CodeQL reported it as stored XSS on the post page, but the sink was in four places, not one: posts, the break-even calculator, the home page and the FAQ block. A single `jsonLdScript()` in `src/lib/json-ld.ts` replaces `<` with `\u003c`, which also neutralises `<!--`, and the output stays valid JSON. Here the graph comes from post frontmatter and `siteConfig`, both written by whoever develops the site, but a blog fed by a contributor, a CMS or a generator is the normal case downstream, and that is where this bites
- **The CI workflow declares `contents: read`.** It declared no permissions at all, so `GITHUB_TOKEN` inherited the repository default. Nothing in it writes: it installs, lints, tests, builds and audits. A step added later now has to ask for more on purpose rather than finding it already in hand. It matters most on a public repository, where pull requests arrive from forks
- **`next` and `eslint-config-next` moved to 16.3.3**, a patch branch carrying backported fixes only, among them a catch-all route being served for every other slug

---

## [1.6.4] - 2026-08-21

🔐 **Role changes reach sessions that already exist.** Changing someone's role did nothing until they signed out, which by default is 30 days away. That included the documented way to create the first admin of a deployment, so the step in the deployment guide looked like it did nothing at all.

### Fixed
- **A role change now reaches a live session**, within about a minute. The role was stamped into the token at sign-in and never read again: the check that runs every minute selected `sessionVersion` alone. Promoting someone therefore had no visible effect until they signed out, and demoting someone left their privileges working for as long as the token lived. Both directions are covered now. **Present since v1.0.0**, so this is not a regression from the security patch in 1.6.3: if you followed *"Make yourself admin"* in the deployment guide and nothing happened, this is why. It is a re-read on a throttle, not instant revocation, and the doc says so
- **The admin panel promotes instead of toggling.** The action behind "Make Admin" read the current role and flipped it, so a page loaded before someone else promoted the same user would **demote** them on click, announcing *"User promoted to USER"* while doing it. The role to set now travels with the request, and the write is refused when the row no longer holds the role the admin was looking at
- **Canonical URLs on `/changelog`, `/privacy` and the blog category pages.** Each of those also exists under a locale prefix serving the same English text, which without a canonical is a duplicate with no declared original
- **Two internal links pointed at `/blog/`**, which answers 308 to `/blog`, so every post and every category page linked internally through a redirect
- The release links at the bottom of this file stopped at 1.6.2

### Added
- **A test that fails when the declared version disagrees with itself.** `package.json`, the app config and `package-lock.json` each carry the version, and npm does not update the lockfile copy when you edit `package.json`: it said 1.6.0 at the 1.6.2 release and 1.6.2 at the 1.6.3 one, in a file anyone who opens the repository can read
- The session rules moved into `src/lib/session.ts` with tests of their own, instead of sitting inline in the Auth.js callback

### Changed
- **`toggleUserRole` is now `setUserRole(userId, nextRole, seenRole)`.** If you called it from your own code, it takes the role to set and the role you last saw, and it no longer inverts whatever it finds
- **The tech stack section of the README is a list rather than a table**, where every service links to its own site and carries a line on why it is there instead of a vendor tagline. It also names two things the kit uses and never mentioned: **Radix UI** under the design system, and **Vercel Analytics**, which is mounted in the root layout and active on Vercel deployments, with a note on how to remove it
- **The documentation says what the rate limiter actually protects.** The limits on magic link, signup and reset guard **outbound email** rather than password attempts, where the argument about bcrypt does not apply. And the per-IP limit on public forms behaves differently away from Vercel: with no `x-forwarded-for` header everyone shares a single bucket
- **Dependencies**: next-intl 4.13.7, `@stripe/stripe-js` 9.14.0, Resend 6.21.0, Lucide 1.33.0, Vitest 4.1.11, `@types/pg` 8.23.1

---

## [1.6.3] - 2026-08-20

🛡️ **Security patch.** A high severity advisory landed in the dependency tree through Prisma, and no stable Prisma release closes it yet. This release pins the fixed version directly, so a fresh clone is clean.

### Security
- **`deepmerge-ts` forced to 8.0.1 with an npm override.** [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) is rated high and affects every version below 8.0.0. You do not depend on it directly: it arrives through `@prisma/config`, which both `prisma` and `@prisma/client` pull in, so moving packages between dependencies and devDependencies does not help. Note that `npm audit fix --force` "resolves" it by installing `prisma@6.12.0`, a major version backwards. The override is temporary and goes away when a stable Prisma release depends on version 8 on its own.

### Changed
- **Dependencies**: Next.js 16.3.1, Stripe 22.5.0, `@stripe/stripe-js` 9.13.0, Resend 6.20.0, Sonner 2.0.8.
- **README**: the "Why OpenStarterKit" section now leads with what the kit is, plain Next.js with no compiler, no config DSL and no proprietary CLI, instead of what it avoids. Same promise about owning your data, stated in a way you can verify by opening the repository.

---

## [1.6.2] - 2026-08-14

🔤 **Copy fixes.** Two FAQ answers were printing a template literal instead of the product name, and the test suite reported its failures in Italian.

### Fixed
- **Two FAQ answers rendered `${siteConfig.name}` literally**, one on the landing page and one in a clone, and both inside the home page `FAQPage` JSON-LD, so search engines were served the source code as well. The i18n work moved those strings from a component into a message file, where a template literal is text and nothing interpolates it. They now use the `{site}` placeholder, and the FAQ component substitutes it the way the transactional emails already did, because `t.raw` returns a message untouched: with `raw`, even the correct placeholder would have printed literally
- **Test failure messages were written in Italian**, nine of them across four files, along with two source comments. They ship with the kit, so the first time one of your keys goes missing you would have read the reason in a language you may not speak

### Added
- **A test that fails when a message file contains template literal syntax.** That syntax is never valid there, and no existing check could see it: the key exists, the type is right, the value is a valid string and the build stays green

---

## [1.6.1] - 2026-08-14

🔧 **The staleness check now works in your repository, not only in ours.** Same day as 1.6.0, because a check that passes only where it was written is worse than no check at all: it reports success to the one person who does not need it.

### Fixed
- **`npm run check:translations` failed on every clone of the kit**, all eleven files at once, with `"source_commit: 7fd7e49" is not a commit in this repository`. A git revision only resolves inside the history it was created in, and cloning starts a fresh one. The marker is now `source_checksum`, a short hash of the source file itself: it stays valid in any repository, needs no git, and works on a source archive downloaded from a release. Line endings are normalised before hashing, so one file gives one value on Windows and on Linux. **If you translated a doc under 1.6.0**, the check names the old field and prints the value that replaces it
- Two documentation paths still pointed at `src/app/(public)/blog/`, which 1.6.0 moved under `[locale]`
- The coverage figures in the README were measured two releases ago
- The release links at the bottom of this file stopped at 1.4.1

### Added
- **`AUTH_TRUST_HOST` in `.env.example`, and a deployment section for hosts other than Vercel.** Auth.js trusts the host it is served from when it detects Vercel and refuses it everywhere else, so a Docker or VPS deployment builds, starts, and then fails sign-in with *"There was a problem with the server configuration"* and nothing on the page to explain it. The kit says it runs anywhere Next.js runs, and did not say this

### Changed
- `lucide-react` 1.31.0 and `pg` 8.23.0

---

## [1.6.0] - 2026-08-14

🌍 **i18n & docs.** Every string a user can read now lives in a message file instead of inside a component. Shipping your product in a language that is not English becomes one JSON file to fill rather than a hundred components to hunt through, and the routing, the fallback and the language switch are already there rather than a refactor you pay for later. The documentation is bilingual, and the plumbing that makes it bilingual is yours.

### Added
- **i18n across the whole kit, built on [next-intl](https://next-intl.dev)**, with no translation service and no account required: plain JSON in the standard layout, so running it through Crowdin or anything else is your call and costs nothing today
- **A second locale that actually runs.** Italian ships alongside English because a scaffold that has never been executed with a second language is untested code, and the first person to add one would find the bugs. Removing it is three deletions, written down in `docs/i18n.md`
- **Routing with a prefix only for non-default languages**, so your English URLs stay exactly where they are. No automatic redirect from `Accept-Language`: a shared link resolves the same way for everyone
- **Fallback per key and per file.** A missing key renders the English text rather than a gap, and a documentation page with no translation is served in English with a note saying so, rather than a 404
- **A language switch in the documentation**, and Markdown docs that translate one file at a time: `getting-started.md` is translated by `getting-started.it.md`, with no index to update
- **`npm run check:translations`**: every translated doc records the revision of the English file it came from, and this fails when that file has moved on. A stale translation never breaks, it quietly becomes instructions for an older version of your product
- **`hreflang` and `x-default`, emitted only where a translation exists.** Declaring them on a page that falls back would tell a search engine that two URLs hold the same page in two languages when they hold it in one
- **A figure component for diagrams**: an image linked to itself opens in an overlay instead of a new tab, and your posts get it without changing a line of Markdown. The portable form still renders on GitHub and in a feed reader
- **A newsletter signup block usable inside a post**, so a reader who is already convinced does not have to navigate to a different page to act
- **`FAQPage` structured data from post frontmatter**: a post declares `faq: [{q,a}]` and the page emits it alongside `Article`. On `main` since 3 August and never part of a tagged release
- **`docs/i18n.md`**, a guide for the whole of the above: adding a language, translating the docs, and the checks that catch a stale one

### Changed
- **The documentation section keeps the site header** like every other page, the two side columns stay put while only the article scrolls, and on a phone the content comes before its navigation rather than after nine links
- The docs pages end with the site footer, which until now only the documentation index had
- Plan and marketing copy that differs between a showcase deployment and the product it ships as is now resolved at build time, so a clone no longer carries wording it can never render inside its own HTML. `docs/configuration.md` explains how to point the same mechanism at a marketing site and an app of your own, on two domains from one repo

### Fixed
*These were all in `v1.5.0`, so a clone from that tag has them.*
- **Dates and currency were formatted with `en-US` written by hand** in five and two places. A date is interface: a language that writes the day first was showing the wrong one
- **Two plurals were English ternaries**, which hold only for languages with two forms. Both are ICU messages now, and one of them had its zero case as a separate `if` that is part of the message
- **The documentation index in `docs/README.md` was two guides behind the folder**, and nothing said so. A test now fails when it drifts again

### Security
- **`next` and `eslint-config-next` moved to 16.3.0**, and `npm audit fix` for the rest: production advisories go from five high to zero. The CI threshold moves from `critical` to `--omit=dev --audit-level=high`, because with the old one those five passed green

---

## [1.5.0] - 2026-08-08

🔎 **SEO foundations & runtime.** The pages that matter most were the least looked after: the home page and `/pricing` had no canonical, `/pricing` had no heading at all, and structured data existed only inside blog posts. This release fixes the foundations every page stands on, moves the supported runtime to Node 24, and clears two broken-link bugs.

### Added
- **Canonical URLs** on the home page, `/pricing`, `/blog` and `/docs`. Until now only blog posts had one, and it is the protection that matters most when a demo deployment mirrors the site it showcases. All of them are built from `NEXT_PUBLIC_APP_URL`
- **Structured data for the site**, not only for articles: `Organization`, and `FAQPage` on the home page generated from the same questions you edit in `src/components/landing/faq.tsx`, so answering them for your product updates both at once
- **An H1 on `/pricing`**, which had two H2s and no heading of its own: an error for search engines, and a page with no title for anyone using a screen reader. The pricing section takes the heading role on its own page and stays an H2 on the landing, with no visual change
- **A description of its own for `/pricing`**, which until now inherited the site-wide one and repeated the home page in search results
- `NEXT_PUBLIC_SEO_TITLE`: the title used in `<title>` and in search results. Unset, it stays `name | tagline`. Set it when the words people search for are not the claim you want readers to see, and the tagline keeps its job on the page
- `NEXT_PUBLIC_MAINTAINER_NAME` and `NEXT_PUBLIC_MAINTAINER_URL`: who builds the product, shown on the About page. The section hides when the name is unset, and the URL is optional
- **`npm audit` in CI**, set at `critical`. It runs last on purpose: a new advisory is not a defect of the commit being tested, so it must never hide the result of lint, tests and build
- A **SEO section** in `docs/configuration.md`, covering what the kit already does on its own and the one variable you have to set in production

### Changed
- **Node 24 is the supported runtime**, now declared in `engines`, which the kit never did before. Node 20 reached end of life in April 2026. The code still runs on it, so nothing breaks today: what changed is the version we support and test against
- **TypeScript 6.** Not 7, which Next.js does not yet support without an experimental flag that would end up in your project too
- GitHub Actions updated from v4 to v7, and `@types/node`, `@types/react`, `@types/react-dom` and `@types/pg` moved up

### Fixed
*Both of these have been on `main` since 3 August and are already live on the showcase, but they were never part of a tagged release. If you cloned at `v1.4.1` you do not have them, so they are listed here.*

- **Relative links on the changelog page returned 404.** The docs pages already translated links written for the repository, the changelog page did not, so `./docs/blog.md` and `./README.md` were dead ends. That logic now lives in `src/lib/markdown-links.ts` and both pages use it, taking the file's own directory into account: the same href means different things from `docs/` and from the root
- **Anchor links landed on the right page and the wrong section.** A heading like "Branding & theming" becomes `branding--theming` on GitHub and `branding-theming` here. Anchors are now translated for links that stay on the site, and left alone for links that point at GitHub

### Notes
- No database migration. Every new variable is optional, and with none of them set the kit behaves exactly as before
- **Set `NEXT_PUBLIC_APP_URL` in production.** Canonical URLs are built from it, and unset it falls back to `localhost`, which is worse than having no canonical at all

## [1.4.1] - 2026-08-03

🔒 **Security patch.** Auth.js moves up to clear a critical advisory, together with the first weekly batch of dependency updates.

### Security
- **Critical advisory in `@auth/core`** (up to and including 0.41.2): a malformed `Authorization: Bearer` header makes `getToken()` throw an uncaught exception. Cleared by moving to `next-auth@5.0.0-beta.32` and `@auth/prisma-adapter@2.11.3`, which pin `@auth/core@0.41.3` between them, so a single copy is installed instead of two. **If you cloned before this release, pull and run `npm install`**
- `npm audit` is now clear of every advisory that has a real fix. What remains lives inside Next.js's own dependency tree (`postcss`, `sharp`) and clears when Next ships an update, not when you run `npm audit fix`: see [Security](./README.md#-security)

### Changed
- Dependencies updated: Next 16.2.12, React 19.2.8, Prisma 7.9.1, Stripe 22.4.0, Resend 6.18.1, Radix UI and lucide
- **Stripe API version** moved from `2026-05-27.dahlia` to `2026-07-29.dahlia` to match the SDK. If you pinned the previous one deliberately, `src/lib/stripe.ts` is the line to change back
- The README no longer advertises "0 High/Critical audit". A count like that is a snapshot that goes stale on its own, so it now describes the practice instead of a number

### Notes
- No database migration, no new environment variables
- The dependency updates arrived as five grouped Dependabot pull requests. Two failed CI, and both were real: the Auth.js split above, and the Stripe API version. This is what the test suite added in 1.4.0 is for

## [1.4.0] - 2026-08-03

🧪 **Testing & Trust.** The kit now proves itself: unit, integration and end-to-end tests, environment validation that stops a half-configured deployment at boot instead of at the first payment, a health endpoint with a release smoke that catches a deploy serving the previous build, and grouped dependency updates. Public demos reset themselves on a schedule, and the kit ships looking more like an example to rewrite and less like our product.

### Added
- **Test suite**: Vitest over the logic in `src/lib` (rate limiter, password policy, the blog, docs and changelog parsers, the environment schema, the pure parts of billing) plus the two routes worth guarding. The Stripe webhook is exercised with **real signatures** generated by Stripe's own SDK, so a forged, tampered or replayed request is proven never to reach the database writes behind it. 82 tests, `npm test`. See [Tests](./README.md#-tests)
- **End-to-end tests**: Playwright on the two flows that cost money when they break, signing up and starting a checkout. Chromium only, and deliberately outside `npm test` and CI, because they need a database and a 115 MB browser binary that a clone should not have to install to run the unit suite. `npm run test:e2e`
- **Environment validation**: a Zod schema checked once at boot from `src/instrumentation.ts`, reporting every problem at once. It does not make variables mandatory (a fresh clone still starts with nothing but a database): it stops the configurations that are **half done**, such as a Stripe key with no webhook secret, a Resend key with no sender, half an OAuth pair, or a missing `AUTH_SECRET` in production. Bypass with `SKIP_ENV_VALIDATION="true"`
- **Health endpoint**: `GET /api/health` reports the running version, the deployed commit, the environment and whether the deployment is a demo. Uncached by design
- **Release smoke**: `npm run smoke -- <url> [--expect-version 1.4.0]`, ten read-only checks against a live deployment, including the version comparison that catches a deploy which reported success while still serving the previous build. Every request is a GET, so it is safe against production
- **Coverage**: `npm run test:coverage`, with the current figures and the reasoning about coverage badges documented in the README
- **Dependabot**: weekly npm updates grouped by area (Next, React, Prisma, UI, everything else) so they arrive as a handful of pull requests instead of a dozen, majors one at a time, GitHub Actions monthly. Cadence documented in the README
- **Demo auto-reset**: a daily Vercel cron at 04:00 UTC reseeds a public demo so shared accounts stop drifting, behind two independent guards (`DEMO_MODE` must be `"true"`, `CRON_SECRET` must match, and an unset secret refuses rather than defaults to open)
- **`.vercelignore`**: keeps `.env*` and the dependency tree out of CLI deploys. Note that when this file exists Vercel uses it *instead of* `.gitignore`, not in addition to it

### Changed
- CI now runs the test suite alongside lint and build, on every push and pull request to `main`
- **The logo mark ships as a plain hexagon**, and the favicon is generated as its miniature so the two always match. The bolt was our symbol, and a clone should not ship wearing it
- **The example landing is smaller on purpose**: 6 feature cards instead of 9, 4 FAQ entries instead of 6, each covering a different area. They read better as something to rewrite than as a finished feature list to inherit
- The dashboard and admin shells now use the same maximum width as the public pages, so cards stop stretching to the full width of a large screen
- The waitlist copy no longer promises a weekly email, in the app and in the roadmap alike. A cadence written in a welcome email is one the subscriber keeps in their inbox: promise news, then send news
- `SECURITY.md` and `.github/FUNDING.yml` are no longer part of the kit. They pointed at our security contact and our tip jar, which is wrong the moment the repository is yours. Reports about the kit itself go through [our security policy](https://github.com/openstarterkit/nextjs-saas-starter-kit/security/policy); for your app, write your own

### Fixed
- **Unknown URLs rendered the sign-in redirect instead of a 404.** The proxy went from an allowlist of public routes to a denylist of private ones, so a typo like `/doc` reaches the router and your 404 page. Nothing is opened up: every private area already gates itself server-side
- **The docs index turned `## DATABASE_URL` into "DATABASEURL"**, on documentation that explains 34 environment variables. Underscores are now stripped only where CommonMark treats them as emphasis. Verified across all 58 real headings: no published anchor changes
- **The admin waitlist table overflowed on mobile**, dragging every card off screen with it. It now falls back to cards below `md`, and the two shell layouts get `min-w-0` so a wide child scrolls inside its own container instead of stretching the whole column
- **Demo deployments are no longer indexable**: `noindex` on the demo, an empty sitemap and no `Sitemap:` line in `robots.txt`, so a demo cannot compete with the site it showcases
- The kit's own site listed `/terms` and `/cookies` in its sitemap while its footer deliberately hid both, submitting placeholder pages for indexing. Your app still ships all three pages

### Notes
- No database migration in this release
- Env: new optional `CRON_SECRET`, only meaningful on a demo deployment
- New dev dependencies: `vitest`, `@vitest/coverage-v8`, `@playwright/test`

## [1.3.0] - 2026-07-24

📝 **Content & SEO.** A file-based blog, technical SEO, a pre-launch waitlist and a spam-safe contact form. The kit now ships agent instructions so your AI assistant is productive on day one, and goes fully brand-neutral so rebranding is one config or env away.

### Added
- **Theming and instant rebrand**: the kit now ships brand-neutral, with a placeholder name and a clean black + grayscale theme. Make it yours from `src/config/site.ts` and the color tokens in `globals.css`, or set the new `NEXT_PUBLIC_BRAND_*` env vars to change name, logo accent and colors with no code changes. The gradient, glow, Open Graph images and emails all follow your accent automatically. See [Configuration](./docs/configuration.md#branding--theming)
- **Blog**: file-based MDX blog at `/blog` with categories, per-category pages, an RSS feed at `/blog/rss.xml`, reading time, optional cover images and draft support. Writing a post is a Markdown file and a commit, no database. Six example posts included. See the [blog guide](./docs/blog.md)
- **Newsletter waitlist**: double opt-in signup (Zod + honeypot + per-IP and per-email rate limit), branded confirmation and welcome emails, one-click unsubscribe, optional Resend Audience sync for sending Broadcasts, and an admin view with counts and a CSV export that doubles as the consent record. Powers the Pro pre-launch waitlist on the pricing page. See the [newsletter guide](./docs/newsletter.md)
- **Contact form**: `/contact` with Zod validation, a honeypot, per-IP rate limiting and a privacy notice, delivered to the owner via Resend with the sender set as reply-to
- **Technical SEO**: `sitemap.xml` and `robots.txt` generated from the real routes and blog content, dynamic Open Graph images for pages and posts (`next/og`), and Article JSON-LD on posts
- **Marketing pages**: an `/about` scaffold and the `/contact` page, linked from the navbar and footer
- **AI-ready**: ships agent instructions for Claude Code, Cursor and Copilot, with `AGENTS.md` as the single source and `.cursor/rules/` and `.github/copilot-instructions.md` pointing to it
- **Shared rate limiter**: `checkRateLimit` gains a per-IP key helper and now guards the newsletter, contact and signup endpoints

### Changed
- The Pro pricing card now opens the waitlist signup instead of a mailto contact link
- Blog and Contact added to the navbar and footer navigation

### Notes
- One additive migration: `add_newsletter_subscriber`; run `npx prisma migrate deploy`
- Env: new optional `RESEND_AUDIENCE_ID` for the newsletter Audience sync (the database list works without it)
- New dependencies: `next-mdx-remote` and `gray-matter` for the blog

## [1.2.0] - 2026-07-16

💳 **Payments & polish.** The billing pillar is complete: one-time payments, multiple tiers, usage-based example. Plus onboarding and a public changelog.

### Added
- **One-time payments**: Stripe Checkout in `payment` mode with a new `Purchase` model, idempotent webhook handling (replay-safe on the PaymentIntent), refund handling via `charge.refunded`, purchase confirmation email, and invoices enabled on one-time checkouts
- **Multiple pricing tiers**: plan cards are driven by the `Plan` table; monthly and yearly variants of a tier pair up into one card (by slug convention) and the Monthly/Yearly toggle swaps only the price, animated and always shown as its monthly equivalent with a "billed yearly" note; the seed now ships 6 example plans (Starter and Pro in monthly and yearly variants, Lifetime, and an inactive metered example)
- **Usage-based billing example**: `recordUsage()` helper on Stripe Billing Meters, plus a new [billing guide](./docs/billing.md) covering subscriptions, one-time payments, usage-based metering and local testing
- **Onboarding**: a dismissable "Get started" checklist on the dashboard (items derived live from your data) and toasts on return from Stripe Checkout (success and canceled)
- **Public `/changelog` page**: this file rendered on the site with a version badge per release, linked in the navbar (after Docs) and in the footer
- **Demo pricing triad**: in demo mode the homepage, `/pricing` and the in-app billing grid all show the same Starter / Pro / Enterprise triad driven by the `Plan` table, closed by an example Enterprise "Contact us" card that opens the contact dialog with a pre-filled subject (`PlanCards` gains a `ctaHref` mode for public pages and an optional `contactCard` slot for a sales-led tier)
- **Session revocation**: a password reset now invalidates other active sessions within about a minute (`sessionVersion` claim with a throttled DB check)
- **Entitlement helper**: `getEntitlement()` in `src/lib/billing.ts` resolves lifetime vs subscription vs free, the pattern to copy for gating your own features

### Changed
- Checkout API hardened: valid requests require an active `Plan` price, and users with an active subscription or lifetime purchase get a clear error pointing to the Customer Portal instead of a second checkout
- The demo banner now stays pinned above the navbar while scrolling, so the "jump into the app" call to action is always visible on the demo
- Upgrade button requires an explicit price and surfaces errors as toasts
- Copy polish across the landing, dashboard, auth and legal pages

### Fixed
- Mobile menu: hash links now scroll to the section instead of bouncing
- CSS `mask` uses the standard property alongside the `-webkit-` prefix

### Notes
- Two new migrations (both additive): `add_one_time_payments` and `add_session_version_and_onboarding`; run `npx prisma migrate deploy`
- Env: new `STRIPE_STARTER_PRICE_ID`, `STRIPE_LIFETIME_PRICE_ID`, `STRIPE_METERED_PRICE_ID`; removed `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` (price IDs never needed to be public)
- Sessions issued before this release stay valid: the new session claim is backfilled without logging anyone out

## [1.1.0] - 2026-07-10

🔐 **Auth expansion & docs.** Four ways to sign in, one account. Plus a real documentation set.

### Added
- **Magic link sign-in**: passwordless one-time links by email (Resend), branded with the same template as the transactional emails, valid 15 minutes
- **Email + password**: production-grade credentials with signup, email verification via magic link, bcrypt hashing (cost 12), generic errors (no user enumeration), rate limiting
- **Password reset**: full forgot/reset flow with single-use SHA-256-hashed tokens, 30-minute expiry
- **Account linking**: automatic linking across Google/GitHub/email (verified-email providers), plus a "Sign-in methods" card in Settings to connect/disconnect providers and set or change the password, with a lock-out guard
- **Auth pages**: new `/signup`, `/verify-request`, `/forgot-password`, `/reset-password`
- **Documentation**: new `docs/` folder (getting started, configuration, authentication, deployment), rendered on the site at `/docs` with sidebar navigation; the Markdown files are the single source of truth

### Changed
- Login page now offers email + password and magic link alongside OAuth (hidden in demo mode)
- Settings page shows the real linked providers instead of a hardcoded label

### Notes
- New dependency: `bcryptjs` (pure JS, no native build steps)
- New migration: `add_password_auth` (User.passwordHash + PasswordResetToken); run `npx prisma migrate deploy`
- JWT sessions are unchanged; sessions issued before a password reset stay valid until expiry (documented in `docs/authentication.md`)

## [1.0.0] - 2026-06-25

🚀 **First public release.** The complete, production-ready SaaS core, free & open source.

### Added
- **Framework**: Next.js 16.2 (App Router, Turbopack) + TypeScript strict
- **Styling**: Tailwind CSS v4 with native CSS variables + dark mode (system detection + persist)
- **Auth**: Auth.js v5 with Google & GitHub OAuth, route protection, session management
- **Database**: Prisma 7 + PostgreSQL schema (User, Account, Session, Plan, Subscription, Project) with driver adapter
- **Payments**: Stripe Checkout, Customer Portal, and webhooks (Stripe API 2026-05-27)
- **User dashboard**: overview, billing with Stripe invoice history, profile settings (Zod-validated server actions)
- **Projects**: example single-tenant CRUD resource (schema, server actions with ownership checks, list/detail/forms)
- **Admin panel**: user list with search & pagination, MRR/users/subscriptions metrics, role management
- **Emails**: Resend transactional emails (welcome, subscription confirmation, cancellation)
- **Design system**: Radix-based components (Button, Card, Badge, Input, Table, dialog, dropdown, tabs, tooltip…) + `cn` utility
- **Landing page**: Hero, tech stack strip, Features, Pricing, FAQ, Footer
- **Security**: security headers, `SECURITY.md`, and a CI workflow (lint + build)
- **Attribution**: optional "Built with OpenStarterKit" badge, removable via env flag
- **DX**: 1-click Vercel deploy button, complete README, `.env.example`, dev-only credentials login
- **License**: MIT (use in unlimited projects, commercial included)

### Notes
- Production build: 0 TypeScript errors, 0 ESLint errors, 14 routes
- Stack chosen best-of-breed with **no vendor lock-in**: every component is swappable

[2.3.1]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v2.3.1
[2.3.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v2.3.0
[2.2.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v2.2.0
[2.1.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v2.1.0
[2.0.3]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v2.0.3
[2.0.2]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v2.0.2
[2.0.1]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v2.0.1
[2.0.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v2.0.0
[1.7.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.7.0
[1.6.4]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.6.4
[1.6.3]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.6.3
[1.6.2]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.6.2
[1.6.1]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.6.1
[1.6.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.6.0
[1.5.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.5.0
[1.4.1]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.4.1
[1.4.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.4.0
[1.3.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.3.0
[1.2.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.2.0
[1.1.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.1.0
[1.0.0]: https://github.com/openstarterkit/nextjs-saas-starter-kit/releases/tag/v1.0.0

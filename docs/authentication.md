# Authentication

The kit ships four ways to sign in, all wired to the same `User` row so any combination works on one account. Better Auth with database sessions and the Prisma adapter (`src/auth.ts`). Sessions are rows, so revoking one is deleting it.

| Method | Requires | Notes |
|---|---|---|
| Google / GitHub OAuth | OAuth app credentials | See [Configuration](./configuration.md) |
| Magic link (passwordless) | `RESEND_API_KEY` | One-time link by email, valid 15 minutes |
| Email + password | nothing | bcrypt-hashed, with a full reset flow |
| Dev login | `NODE_ENV=development` | One-click admin, never active in production |

On top of any of these, an account with a password can require a **second factor**. See [Two-factor authentication](#two-factor-authentication), which also says which of the four ways in ask for it and which do not.

A public demo deployment (`DEMO_MODE="true"`) replaces all of the above with one-click shared accounts. The signup and password reset pages stay visible as a showcase, but their forms are disabled (with a notice explaining why) and the server actions reject demo submissions too, so visitors cannot trigger emails or create accounts from your demo.

## Magic link

The login page sends a one-time sign-in link ("Email me a sign-in link"). Under the hood it is the Better Auth magic link plugin with a custom `sendMagicLink`, so the email uses the same branded template as the transactional ones (`src/lib/email.ts`). Links are valid for 15 minutes and are single use.

If `RESEND_API_KEY` is not set, the button hides itself and the provider is not registered.

## Email + password

- **Sign up** (`/signup`): validated with Zod (`src/lib/password.ts`, 8 to 72 characters), hashed with bcrypt (cost 12, via pure-JS `bcryptjs`: no native build steps). When Resend is configured, signup sends a magic link that verifies the email and completes the first sign-in in one step; without Resend it signs you straight in.
- **Sign in**: every failure mode (unknown email, OAuth-only account, wrong password) returns the same generic message, so the form cannot be used to probe which emails have accounts.
- **Reset** (`/forgot-password` → emailed link → `/reset-password`): tokens are random 32-byte values; the database stores only their SHA-256 hash. They expire after 30 minutes and are single-use (burned in the same transaction that swaps the password hash).

### Rate limiting, honestly

Sign-in, signup, magic link and reset requests go through a small fixed-window limiter (`src/lib/rate-limit.ts`). By default the counters live in each instance's memory, which on serverless means a request that lands on another instance starts from zero: treat that as a speed bump, not a wall, with bcrypt's cost as the real brute-force brake.

Since v2.2 the wall is two environment variables away. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` and the same counters move to Upstash Redis, shared by every instance and region. Both are optional by design, because a required variable would have made this release a major one for everybody who already cloned the kit, and nothing else changes: no client library is installed, it is two commands in one pipelined `fetch`.

If the shared store is configured but unreachable, the limiter falls back to the in-memory counter rather than failing in either direction. Refusing everybody would take the site down with the Redis; letting everybody through would drop the protection exactly when something is already wrong.

It is worth knowing which limit does what, because the argument above only covers one of them. The limit on sign-in guards password attempts, and there bcrypt carries most of the weight. The limits on magic link, signup and reset guard **outbound email**: each caps how many messages one address can trigger, and bcrypt has nothing to do with it. If what you are protecting is your Resend bill or your sending reputation, that is the one to move to a shared store first.

Public forms (contact, newsletter) are limited by IP rather than by address. How that behaves away from Vercel is in [Deployment](./deployment.md#deploying-somewhere-other-than-vercel).

### A note on sessions

Sessions are **rows in the database**, one per sign-in, carrying the IP address and user agent they were created with. Revoking one is deleting it, which takes effect immediately and everywhere. Until v2.0 they were stateless JWTs with a `sessionVersion` counter faking that ability; the column is gone and so is the need for it.

One deliberate trade remains. `session.cookieCache` (60 seconds, in `src/auth.ts`) keeps the session in a signed cookie for a minute so that reading it does not hit the database on every request. A session revoked elsewhere can therefore stay alive on another device for up to that minute. Same window the old counter had, one config line instead of three files. Resetting a password still ends every other session at once (`revokeSessionsOnPasswordReset`), and the role is read from the row, so promoting or demoting somebody reaches a live session inside the same minute without signing them out.

### Active sessions, in Settings

Dashboard → Settings lists every session on the account with the device, browser and IP address it was created with, the current one marked, and a button to end any of the others. This is a view of rows that were already there since 2.0, not something new to keep.

The list is read from your own `Session` rows with Prisma, not through Better Auth's `listSessions`. That endpoint requires a session created within `freshAge` (a day by default) and answers "Session is not fresh" to anything older, which is the ordinary state of somebody who signed in yesterday. A card that exists for the moment you suspect a device is not yours cannot be the one that stops working after a day. Ending a session still goes through the library, which reads the session from the database rather than from the cookie cache.

Two more details are worth knowing. What the browser sends is `revokeSession`'s **session id**, never the token: the token is the credential, and a page that prints it hands a working session to anything that can read the DOM or a screenshot. And the device line is a reading of the user agent (`src/lib/user-agent.ts`), which is a string a client chooses freely: it is there to help somebody recognise their own laptop, not to prove anything.

You cannot end your own current session from the list, because the button for that is called "Sign out" and already exists.

## Changing your email address

Dashboard → Settings → Sign-in methods. The address does not change when the form is submitted: it changes when the link sent to the **new** address is clicked, which is the only way to know that the person asking can read mail there.

A second message goes to the **old** address, telling it what was requested. It is not a veto, it is a warning: somebody who gets hold of a live session should not be able to move an account away quietly. If that message arrives and you did not ask for it, the password reset is the thing to do next.

The response is the same whether or not the new address already belongs to another account, for the same reason the sign-in form gives one message for every failure: a form that answers differently is a way of asking the site who is registered.

## Two-factor authentication

Any account with a password can turn on a second factor from Dashboard → Settings: a six digit code from an authenticator app (TOTP, RFC 6238). Self-hosted, so no vendor and no SMS bill. The name your users will read inside their app comes from `siteConfig.name`, which is why it is worth setting before anyone enables this.

**Turning it on is two steps on purpose.** The first stores an unverified secret and shows the QR code, the manual key and ten backup codes; only a correct code from the app switches it on. A setup abandoned halfway therefore leaves the account exactly as it was, which is the difference between a feature and a lock-out.

**What asks for the code, and what does not:**

| Way in | Second factor |
|---|---|
| Email + password | **Asked.** The password alone opens no session |
| Magic link | **Not sent at all** to accounts that have 2FA on |
| Google / GitHub | **Not asked**: the provider already does that better |
| Dev / demo sign-in | Not asked, and the demo account cannot enable 2FA |

Three of those rows are decisions rather than defaults, and each is worth a sentence.

**The magic link is withheld** because it opens a session directly: for an account with 2FA it would be a way around the very thing its owner turned on. Nobody is locked out by this, since enabling 2FA requires a password in the first place. The response is identical to the normal one (same redirect, no message), so it cannot be used to ask whether an address has an account or whether that account has 2FA; what replaces the explanation is a line on the sign-in page, addressed to everyone.

**Password reset is not the same hole**, and it is worth knowing why: after a reset you still sign in through email and password, which still asks for the code.

**OAuth is not asked for a TOTP on top**, because a second factor on Google's side is Google's job and it does it better. But the automatic half of account linking is refused for these accounts. See below.

**Dev and demo sign-ins** open a session without verifying anything, so a check there would be guarding a door with no lock. What keeps them safe is what always did: dev is refused outside development, demo only exists when `DEMO_MODE` is on. On top of that the demo account cannot turn 2FA on at all, because the nightly reset would strand the next visitor with a factor nobody holds.

### Backup codes

Ten of them, each good for exactly one sign-in and spent when used. They are shown **once**, at setup, and cannot be retrieved afterwards: regenerating replaces the whole set and the old ones stop working immediately.

They are generated upper case and without `0`, `O`, `1` or `I` (`src/lib/backup-codes.ts`), because they get written on paper and typed back in on the day the phone is gone; what a user types is forgiven for lower case, spaces and a missing dash, never for a wrong code. They are stored **encrypted** with `AUTH_SECRET`, like the TOTP secret itself, which is the one operational consequence worth knowing before rotating that variable: rotating it makes every stored secret and every backup code unreadable.

### If both the phone and the codes are gone

There is no self-service way back in, and the sign-in screen says so rather than letting somebody try combinations at midnight. An administrator clears the second factor for that user:

```sql
DELETE FROM "TwoFactor" WHERE "userId" = '...';
UPDATE "User" SET "twoFactorEnabled" = false WHERE id = '...';
```

Verify who is asking before you run it. That query is the whole recovery path, which is exactly why it should not be reachable from a form.

## Account linking

One user, several ways in:

- **Automatic**: a provider that has verified the email address attaches itself to the account that already has it. Sign in with Google, later with GitHub on the same email, and both land on the same account. The magic link and the password flow match by email the same way.
- **Except for accounts with two-factor authentication**, where the automatic half is refused. Better Auth asks for the second factor on email sign-in and nowhere else, so without this an account protected by a password and a TOTP could be entered by whoever controls a Google account with the same address: press "Continue with Google", get attached, and be signed in with no password and no code, even having never connected Google. Only the automatic half is refused: connecting the provider **yourself from Settings** still works, because that request carries your session and you are already past the second factor when you make it. The rule is four booleans in `src/lib/account-linking.ts`.
- **Manual**: Dashboard → Settings → **Sign-in methods** shows the connected providers with Connect / Disconnect buttons, plus a set-or-change password form. Connecting starts a normal OAuth flow while signed in, which makes the adapter attach the new account instead of creating one.
- **Lock-out guard**: you cannot disconnect your only remaining way in. The server checks that at least one method survives (another provider, a password, or the magic link when Resend is configured).

## Adding another OAuth provider

1. Add the provider under `socialProviders` in `src/auth.ts`. Linking to an account that already has the same verified email is the default behaviour, so there is no flag to set: `account.accountLinking` is where you change it if you want the opposite.
2. Add its credentials to `.env.example` and your env files.
3. Add a button on `src/app/(auth)/login/page.tsx` (copy one of the existing OAuth forms).
4. Optionally list it in `PROVIDER_LABELS` in `src/app/(dashboard)/dashboard/settings/page.tsx` so it appears under Sign-in methods.

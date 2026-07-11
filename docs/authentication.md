# Authentication

The kit ships four ways to sign in, all wired to the same `User` row so any combination works on one account. Auth.js v5 with JWT sessions and the Prisma adapter (`src/auth.ts`).

| Method | Requires | Notes |
|---|---|---|
| Google / GitHub OAuth | OAuth app credentials | See [Configuration](./configuration.md) |
| Magic link (passwordless) | `RESEND_API_KEY` | One-time link by email, valid 15 minutes |
| Email + password | nothing | bcrypt-hashed, with a full reset flow |
| Dev login | `NODE_ENV=development` | One-click admin, never active in production |

A public demo deployment (`DEMO_MODE="true"`) replaces all of the above with one-click shared accounts. The signup and password reset pages stay visible as a showcase, but their forms are disabled (with a notice explaining why) and the server actions reject demo submissions too, so visitors cannot trigger emails or create accounts from your demo.

## Magic link

The login page sends a one-time sign-in link ("Email me a sign-in link"). Under the hood it is the Auth.js Resend provider with a custom `sendVerificationRequest`, so the email uses the same branded template as the transactional ones (`src/lib/email.ts`). Links are valid for 15 minutes and burn on first use. Clicking the link also sets `emailVerified` on the user.

If `RESEND_API_KEY` is not set, the button hides itself and the provider is not registered.

## Email + password

- **Sign up** (`/signup`): validated with Zod (`src/lib/password.ts`, 8 to 72 characters), hashed with bcrypt (cost 12, via pure-JS `bcryptjs`: no native build steps). When Resend is configured, signup sends a magic link that verifies the email and completes the first sign-in in one step; without Resend it signs you straight in.
- **Sign in**: every failure mode (unknown email, OAuth-only account, wrong password) returns the same generic message, so the form cannot be used to probe which emails have accounts.
- **Reset** (`/forgot-password` → emailed link → `/reset-password`): tokens are random 32-byte values; the database stores only their SHA-256 hash. They expire after 30 minutes and are single-use (burned in the same transaction that swaps the password hash).

### Rate limiting, honestly

Sign-in, signup, magic link and reset requests go through a small fixed-window in-memory limiter (`src/lib/rate-limit.ts`). On serverless platforms each instance has its own memory, so treat it as a speed bump, not a wall: bcrypt's cost is the real brute-force brake. If you need hard guarantees at scale, swap in a shared store (for example Upstash Redis) behind the same function signature.

### A note on JWT sessions

Sessions are stateless JWTs, so they cannot be revoked server-side: after a password reset, sessions that are already issued stay valid until they expire. If your threat model needs instant revocation, switch to database sessions or add a session-version claim.

## Account linking

One user, several ways in:

- **Automatic**: Google and GitHub are configured with `allowDangerousEmailAccountLinking`. Despite the scary name this is safe here, because both providers verify email ownership; the flag exists to protect against providers that do not. Sign in with Google, later with GitHub on the same email, and both land on the same account. The magic link and the password flow match by email the same way.
- **Manual**: Dashboard → Settings → **Sign-in methods** shows the connected providers with Connect / Disconnect buttons, plus a set-or-change password form. Connecting starts a normal OAuth flow while signed in, which makes the adapter attach the new account instead of creating one.
- **Lock-out guard**: you cannot disconnect your only remaining way in. The server checks that at least one method survives (another provider, a password, or the magic link when Resend is configured).

## Adding another OAuth provider

1. Add the provider in `src/auth.ts` (Auth.js ships dozens: `next-auth/providers/*`). If the provider verifies emails, you can add `allowDangerousEmailAccountLinking: true` for the same linking behavior.
2. Add its credentials to `.env.example` and your env files.
3. Add a button on `src/app/(auth)/login/page.tsx` (copy one of the existing OAuth forms).
4. Optionally list it in `PROVIDER_LABELS` in `src/app/(dashboard)/dashboard/settings/page.tsx` so it appears under Sign-in methods.

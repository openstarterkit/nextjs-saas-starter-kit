import { betterAuth } from "better-auth"
import { prismaAdapter } from "@better-auth/prisma-adapter"
import { createAuthEndpoint, APIError } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { magicLink, twoFactor } from "better-auth/plugins"
import { z } from "zod"
import { nextCookies } from "better-auth/next-js"
import type { BetterAuthPlugin } from "better-auth"
import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/password"
import { generateBackupCodes } from "@/lib/backup-codes"
import { refusesAutomaticLink } from "@/lib/account-linking"
import { siteConfig } from "@/config/site"

// ─────────────────────────────────────────────────────────────────────────────
// Fixture sign-ins: dev and demo.
//
// Both open a session WITHOUT verifying any credential. Auth.js allowed that
// from a Credentials provider's `authorize`; Better Auth has no provider that
// bends the same way, so each becomes a small plugin with an endpoint of its
// own. The endpoint does what `authorize` used to do, then creates the session
// itself instead of returning a user and letting the library do it.
//
// They are separate rather than sharing a factory on purpose: deleting one is
// deleting one block.
//
// NEITHER ASKS FOR A SECOND FACTOR, and that is a decision rather than an
// oversight. Both open a session without verifying anything, so a 2FA check
// bolted on here would be guarding a door that has no lock: whoever can reach
// the endpoint has already passed. What keeps them safe is what always kept
// them safe — dev is refused outside development, demo only exists when
// DEMO_MODE is on — and on top of that the demo account is not allowed to turn
// 2FA on at all (src/app/actions/two-factor.ts), because the nightly reset
// would strand the next visitor with a factor nobody holds.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dev-only one-click sign-in. Never active in production: the check is on the
 * environment, not on the plugin being registered, so an accidental import
 * cannot enable it.
 */
const devLogin = () =>
  ({
    id: "dev-login",
    endpoints: {
      devSignIn: createAuthEndpoint(
        "/dev-login/sign-in",
        { method: "POST", body: z.object({ password: z.string() }) },
        async (ctx) => {
          if (process.env.NODE_ENV !== "development") {
            throw new APIError("NOT_FOUND")
          }
          if (ctx.body.password !== "dev") throw new APIError("UNAUTHORIZED")

          const user = await prisma.user.upsert({
            where: { email: "admin@dev.local" },
            update: {},
            create: {
              email: "admin@dev.local",
              name: "Dev Admin",
              emailVerified: true,
              role: "ADMIN",
            },
          })

          const session = await ctx.context.internalAdapter.createSession(user.id)
          await setSessionCookie(ctx, { session, user })
          return ctx.json({ ok: true })
        }
      ),
    },
  }) satisfies BetterAuthPlugin

/**
 * Demo sign-in: one click into a shared fixture account, for a public demo
 * deployment (isolated database, fake seeded data). Only active when
 * DEMO_MODE="true"; never enable it on a deployment with real users.
 *
 * Note for the 2.0: sessions now live in the database, so every demo visitor
 * leaves a row in Session. The nightly reset must clear those too.
 */
const demoLogin = () =>
  ({
    id: "demo-login",
    endpoints: {
      demoSignIn: createAuthEndpoint(
        "/demo-login/sign-in",
        { method: "POST", body: z.object({ role: z.string().optional() }) },
        async (ctx) => {
          if (process.env.DEMO_MODE !== "true") {
            throw new APIError("NOT_FOUND")
          }
          const asAdmin = ctx.body.role === "admin"
          const email = asAdmin ? "demo-admin@example.com" : "demo-user@example.com"

          const user = await prisma.user.upsert({
            where: { email },
            // Re-assert the role on every sign-in: a previous visitor may have
            // promoted the shared user account from the admin panel. Reset the
            // checklist dismissal too, so every demo visitor sees "Get started".
            update: { role: asAdmin ? "ADMIN" : "USER", onboardingDismissedAt: null },
            create: {
              email,
              name: asAdmin ? "Demo Admin" : "Demo User",
              emailVerified: true,
              role: asAdmin ? "ADMIN" : "USER",
            },
          })

          const session = await ctx.context.internalAdapter.createSession(user.id)
          await setSessionCookie(ctx, { session, user })
          return ctx.json({ ok: true })
        }
      ),
    },
  }) satisfies BetterAuthPlugin

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // Keeping the Auth.js variable name is deliberate: the upgrade to 2.0 already
  // drops every active session, and asking everyone to rename an environment
  // variable on top of that buys nothing.
  secret: process.env.AUTH_SECRET,

  // Without this the origin is taken from the incoming request, which makes
  // OAuth callbacks and redirects depend on whatever host answered. The kit
  // already ships this variable, so no new one appears in .env.example.
  baseURL: process.env.NEXT_PUBLIC_APP_URL,


  user: {
    /**
     * Changing the address the account is identified by.
     *
     * Better Auth walks this in two hops, and both are worth knowing because
     * together they cover the two ways it goes wrong:
     *
     *   1. a confirmation to the address the account has NOW. Somebody who
     *      stole a session cannot move the account without also reading the old
     *      mailbox, and the rightful owner is warned where the thief cannot
     *      intercept it;
     *   2. only after that, a verification to the NEW address. A typo cannot
     *      strand the account somewhere nobody reads, because the move lands
     *      only when that second one is clicked.
     *
     * The email changes at the end of the chain, never before. Both hops need
     * `emailVerification.sendVerificationEmail`, configured further down.
     *
     * One behaviour worth knowing next to the UI: when the new address already
     * belongs to another account, the library answers exactly as it does on
     * success and sends nothing. That is deliberate — otherwise the form
     * becomes a way to ask which addresses are registered — and it is why the
     * page promises no email, only that we have taken the request.
     */
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        const { sendChangeEmailConfirmation } = await import("@/lib/email")
        await sendChangeEmailConfirmation(user.email, newEmail, url)
      },
    },

    /**
     * The door that automatic account linking would otherwise leave open.
     *
     * Better Auth asks for the second factor on `/sign-in/email` and nowhere
     * else. Linking is automatic for a provider that verified the address. Put
     * together, somebody who controls a Google account with your address can
     * press "Continue with Google", be attached to your existing account, and be
     * signed in WITHOUT the authenticator — even if you never connected Google
     * and sign in only with a password.
     *
     * The comparison that shows it is a hole rather than a trade-off: an attacker
     * holding your mailbox who tries a password reset is still stopped, because
     * signing in afterwards goes through `/sign-in/email` and asks for the code.
     * The social door does not ask.
     *
     * So the automatic half is refused for accounts that turned 2FA on, and only
     * the automatic half:
     *
     *   - connecting Google yourself from Settings still works. That request
     *     carries your session, which is what the cookie check below looks for,
     *     and you are already past the second factor when you make it;
     *   - signing in with a provider you connected on purpose still works,
     *     because the account is linked already and this never runs (T1: we do
     *     not ask for a TOTP on top of Google, which does that better);
     *   - a brand new account created through Google is untouched: it has no
     *     second factor to go around.
     */
    validateUserInfo: async ({ user, source }, ctx) => {
      // The rule itself is in src/lib/account-linking.ts; this gathers the two
      // facts it needs and does as it is told.
      if (source.method !== "oauth" || source.action !== "link-account") return
      if (!user.email) return

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, twoFactorEnabled: true },
      })
      if (!existing) return

      // A session belonging to this same user means the request came from
      // inside the app — the "Connect" button in Settings — rather than from
      // the sign-in page. Whoever presses "Continue with Google" on the way in
      // has no such cookie, and that is the whole distinction.
      let hasOwnSession = false
      const token = await ctx.getSignedCookie(
        ctx.context.authCookies.sessionToken.name,
        ctx.context.secret
      )
      if (token) {
        const active = await ctx.context.internalAdapter.findSession(token)
        hasOwnSession = active?.session?.userId === existing.id
      }

      const refuse = refusesAutomaticLink({
        method: source.method,
        action: source.action,
        twoFactorEnabled: existing.twoFactorEnabled,
        hasOwnSession,
      })
      if (!refuse) return

      return {
        error: "two_factor_linking",
        errorDescription:
          "This account uses two-factor authentication. Sign in with your password and a code, then connect this provider from Settings.",
      }
    },

    additionalFields: {
      // Server-owned: `input: false` means neither the API nor an OAuth profile
      // can set it, so no one signs up as an admin. The values stay uppercase to
      // match the Prisma enum, which is what the admin panel and its tests read.
      role: {
        type: ["USER", "ADMIN"],
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },

  session: {
    // Sessions live in the database now, so `auth.api.getSession` would hit it
    // on nearly every request. This cache is the same trade the 1.6.4 fix made
    // by hand with a 60 second throttle: a session revoked elsewhere can stay
    // alive on another device until the cookie expires. Same window, same
    // reasoning, one config line instead of three files.
    cookieCache: { enabled: true, maxAge: 60 },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // bcrypt only considers the first 72 bytes; reject longer input instead of
    // silently truncating it.
    maxPasswordLength: 72,
    // Replaces the sessionVersion column: resetting a password ends every other
    // session, which is what that column existed to fake.
    revokeSessionsOnPasswordReset: true,
    // Better Auth hashes with scrypt by default. We keep bcrypt so the hashes
    // already in the database still verify: without this, upgrading would lock
    // out every existing password user, and no data migration could fix it.
    password: {
      hash: hashPassword,
      verify: ({ password, hash }) => verifyPassword(password, hash),
    },
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import("@/lib/email")
      await sendPasswordResetEmail(user.email, url)
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  account: {
    // What Auth.js needed `allowDangerousEmailAccountLinking` for. Here it is
    // the default: a provider that verified the email links to the account that
    // already has it. Written out because it is a security-relevant behaviour,
    // and a reader should not have to know a default to know what happens.
    //
    // With two-factor authentication on the account, that convenience becomes a
    // way around it. See `validateUserInfo` below.
    accountLinking: { enabled: true },
  },


  emailVerification: {
    // The 1.x sign-up flow sent a magic link and let the click double as
    // verification. Here the library sends its own verification email, which
    // is the same idea without the trick. Only when email is configured: with
    // no key there is nothing to send and sign-up still completes.
    sendOnSignUp: !!process.env.RESEND_API_KEY,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { sendMagicLinkEmail } = await import("@/lib/email")
      await sendMagicLinkEmail(user.email, url)
    },
  },

  // Where a failed OAuth round trip lands. The default is Better Auth's own
  // error page at /api/auth/error, which is outside the kit's design and says
  // nothing a visitor can act on. Sending it to the sign-in page means the
  // error code arrives as ?error=..., which that page already knows how to
  // render — including the refusal above, and every other OAuth failure that
  // until now ended on a stranger's page.
  onAPIError: { errorURL: "/login" },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.email && process.env.RESEND_API_KEY) {
            const { sendWelcomeEmail } = await import("@/lib/email")
            // Awaited for the same reason as the webhook emails: nothing
            // guarantees a promise left running after the response finishes.
            await sendWelcomeEmail(user.email, user.name ?? "").catch(console.error)
          }
        },
      },
    },
  },

  plugins: [
    // Magic link needs Resend configured; without a key the form is hidden in
    // the UI and the plugin is not registered. The client plugin is registered
    // unconditionally: it only adds methods, and its types come from the type
    // of the plugin rather than from this array.
    ...(process.env.RESEND_API_KEY
      ? [
          magicLink({
            expiresIn: 15 * 60, // link valid for 15 minutes
            sendMagicLink: async ({ email, url }) => {
              const { sendMagicLinkEmail } = await import("@/lib/email")
              await sendMagicLinkEmail(email, url)
            },
          }),
        ]
      : []),
    // Two-factor authentication (2.2). Registered unconditionally: nobody is
    // asked for a second factor until they turn one on themselves, and the
    // table is empty until then.
    twoFactor({
      // The name the user will read INSIDE their authenticator app, forever.
      // It has to come from config: a clone that renames itself would otherwise
      // ship its users a code labelled with somebody else's product.
      issuer: siteConfig.name,
      totpOptions: { digits: 6 },
      // Default, written out because it is the line that prevents lock-outs:
      // enabling stores an unverified secret, and only a correct code flips it
      // on. Set it to true and an interrupted setup leaves the account asking
      // for codes from an authenticator that was never actually paired.
      skipVerificationOnEnable: false,
      backupCodeOptions: {
        // Default is "plain". These codes each open the account on their own,
        // so they are stored encrypted with AUTH_SECRET instead.
        storeBackupCodes: "encrypted",
        // The library's own generator mixes upper case, lower case and digits,
        // which is unreadable on the piece of paper we ask people to keep. See
        // src/lib/backup-codes.ts.
        customBackupCodesGenerate: generateBackupCodes,
      },
    }),
    ...(process.env.NODE_ENV === "development" ? [devLogin()] : []),
    ...(process.env.DEMO_MODE === "true" ? [demoLogin()] : []),
    // MUST stay last. Server actions cannot set cookies the way a route
    // handler does, so without this a sign-in from an action succeeds, returns
    // a session, and sets nothing: the user lands on the dashboard signed out.
    // It is the quietest failure in this whole migration.
    nextCookies(),
  ],
})

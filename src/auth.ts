import { betterAuth } from "better-auth"
import { prismaAdapter } from "@better-auth/prisma-adapter"
import { createAuthEndpoint, APIError } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { magicLink } from "better-auth/plugins"
import { z } from "zod"
import { nextCookies } from "better-auth/next-js"
import type { BetterAuthPlugin } from "better-auth"
import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/password"

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

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.email && process.env.RESEND_API_KEY) {
            const { sendWelcomeEmail } = await import("@/lib/email")
            sendWelcomeEmail(user.email, user.name ?? "").catch(console.error)
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
    ...(process.env.NODE_ENV === "development" ? [devLogin()] : []),
    ...(process.env.DEMO_MODE === "true" ? [demoLogin()] : []),
    // MUST stay last. Server actions cannot set cookies the way a route
    // handler does, so without this a sign-in from an action succeeds, returns
    // a session, and sets nothing: the user lands on the dashboard signed out.
    // It is the quietest failure in this whole migration.
    nextCookies(),
  ],
})

import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import Resend from "next-auth/providers/resend"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"
import { checkRateLimit } from "@/lib/rate-limit"
import { isSessionCheckDue, verifySession } from "@/lib/session"
import type { Role } from "@prisma/client"

// Magic link sign-in. Auth.js stores the verification token via the Prisma
// adapter; we only override the email itself so it ships with the same
// branded template as the transactional emails (see src/lib/email.ts).
const magicLinkProvider = Resend({
  from: process.env.EMAIL_FROM,
  maxAge: 15 * 60, // link valid for 15 minutes
  async sendVerificationRequest({ identifier, url }) {
    const { sendMagicLinkEmail } = await import("@/lib/email")
    await sendMagicLinkEmail(identifier, url)
  },
})

// Production email+password sign-in. Separate from the dev/demo providers
// below: always on, verifies against the bcrypt hash in User.passwordHash,
// and answers with the same `null` for every failure mode (unknown email,
// OAuth-only account, wrong password) so callers can't enumerate users.
const credentialsProvider = Credentials({
  id: "credentials",
  name: "Email & Password",
  credentials: {
    email: { type: "email" },
    password: { type: "password" },
  },
  async authorize(credentials) {
    const email =
      typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : ""
    const password = typeof credentials?.password === "string" ? credentials.password : ""
    if (!email || !password) return null
    if (!checkRateLimit(`login:${email}`)) return null
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user?.passwordHash) return null
    if (!(await verifyPassword(password, user.passwordHash))) return null
    return { id: user.id, email: user.email, name: user.name, role: user.role }
  },
})

// Dev-only credentials provider — never active in production
const devProvider = Credentials({
  id: "dev",
  name: "Dev Login",
  credentials: { password: { type: "password" } },
  async authorize(credentials) {
    if (process.env.NODE_ENV !== "development") return null
    if (credentials?.password !== "dev") return null
    const user = await prisma.user.upsert({
      where: { email: "admin@dev.local" },
      update: {},
      create: { email: "admin@dev.local", name: "Dev Admin", role: "ADMIN" },
    })
    return { id: user.id, email: user.email, name: user.name, role: user.role }
  },
})

// Demo provider — one-click sign-in to shared fixture accounts, meant for a
// public demo deployment (isolated database, fake seeded data). Only active
// when DEMO_MODE="true"; never enable it on a deployment with real users.
const demoProvider = Credentials({
  id: "demo",
  name: "Demo Login",
  credentials: { role: { type: "text" } },
  async authorize(credentials) {
    if (process.env.DEMO_MODE !== "true") return null
    const asAdmin = credentials?.role === "admin"
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
        role: asAdmin ? "ADMIN" : "USER",
      },
    })
    return { id: user.id, email: user.email, name: user.name, role: user.role }
  },
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT strategy is required for the Credentials providers to work.
  // OAuth and magic-link still persist users/accounts to the DB via the adapter.
  session: { strategy: "jwt" },
  providers: [
    // allowDangerousEmailAccountLinking: Google and GitHub both verify email
    // ownership, so linking accounts that share an email is safe here. The
    // scary name guards against providers that DON'T verify emails.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    // Magic link needs Resend configured; without a key the form is hidden
    // in the UI and the provider is not registered.
    ...(process.env.RESEND_API_KEY ? [magicLinkProvider] : []),
    credentialsProvider,
    ...(process.env.NODE_ENV === "development" ? [devProvider] : []),
    ...(process.env.DEMO_MODE === "true" ? [demoProvider] : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, `user` is populated. For OAuth the adapter user lacks `role`
      // in the token, so we fetch it from the DB the first time.
      if (user) {
        token.role = (user as { role?: Role }).role ?? undefined
      }

      const now = Date.now()

      // First time we see this token: at sign-in, or a legacy token issued
      // before sessionVersion existed. Stamp role and version from the DB
      // WITHOUT invalidating, so deploying this doesn't log everyone out.
      if (token.sub && (!token.role || token.sv === undefined)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, sessionVersion: true },
        })
        token.role = token.role ?? dbUser?.role ?? "USER"
        token.sv = dbUser?.sessionVersion ?? 1
        token.svAt = now
        return token
      }

      // Re-read role and session version at most once a minute. Resetting the
      // password bumps User.sessionVersion, so tokens issued before it die
      // here (within ~60s), and a role changed in the database reaches the
      // token in the same window instead of waiting for the next sign-in.
      // The throttle matters because proxy.ts runs auth() on nearly every
      // request; the check fails OPEN on DB errors, since for this threat
      // model availability beats strictness.
      if (token.sub && isSessionCheckDue(token, now)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true, sessionVersion: true },
          })
          const verdict = verifySession(token, dbUser, now)
          // Also kills sessions of deleted users. Returning null makes
          // Auth.js clear the session cookie.
          if (!verdict.keep) return null
          token.role = verdict.role
          token.svAt = verdict.checkedAt
        } catch (error) {
          console.error("session check failed, keeping session:", error)
        }
      }

      return token
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      session.user.role = ((token as { role?: string }).role ?? "USER") as Role
      return session
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email && process.env.RESEND_API_KEY) {
        const { sendWelcomeEmail } = await import("@/lib/email")
        sendWelcomeEmail(user.email, user.name ?? "").catch(console.error)
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-request",
  },
})

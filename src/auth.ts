import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import type { Role } from "@prisma/client"

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
      // demoted the shared account from the admin panel.
      update: { role: asAdmin ? "ADMIN" : "USER" },
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
  // JWT strategy is required for the Credentials (dev) provider to work.
  // OAuth still persists users/accounts to the DB via the adapter.
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
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
      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        })
        token.role = dbUser?.role ?? "USER"
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
  },
})

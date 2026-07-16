import type { Role } from "@prisma/client"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
  }
}

// next-auth/jwt just re-exports @auth/core/jwt, so the augmentation must
// target the module that actually declares the JWT interface.
declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role
    /** User.sessionVersion at issue time; a mismatch with the DB kills the session. */
    sv?: number
    /** Timestamp of the last sessionVersion check, to throttle the DB lookup. */
    svAt?: number
  }
}

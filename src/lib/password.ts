import bcrypt from "bcryptjs"
import { z } from "zod"

/**
 * Password hashing and policy, in one place. bcryptjs is pure JS: no native
 * bindings to compile, so it works on any host (Vercel, Docker, bare Node)
 * without build surprises.
 */

// Cost 12: ~100ms per hash. A sane brute-force brake without hurting UX.
const BCRYPT_COST = 12

/**
 * The two strings below stay in English on purpose, and it is worth knowing
 * why before "fixing" them: no user ever sees them. Every caller reacts to
 * `success: false` by redirecting with an error code (`?error=policy`), and
 * the page turns that code into a translated sentence from the `auth`
 * namespace. These messages exist for whoever reads a failed parse in a log.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  // bcrypt only considers the first 72 bytes; reject longer input instead of
  // silently truncating it.
  .max(72, "Password must be at most 72 characters")

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

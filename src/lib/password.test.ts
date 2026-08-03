import { describe, it, expect } from "vitest"
import { passwordSchema, hashPassword, verifyPassword } from "@/lib/password"

describe("passwordSchema", () => {
  it("requires at least 8 characters", () => {
    expect(passwordSchema.safeParse("short12").success).toBe(false)
    expect(passwordSchema.safeParse("longenough").success).toBe(true)
  })

  // bcrypt silently ignores everything past 72 bytes. Without this cap two
  // different long passwords that share a 72-byte prefix would hash to the
  // same value and unlock the same account, so the limit is a security rule
  // and not a formality.
  it("rejects passwords longer than bcrypt's 72-byte limit", () => {
    expect(passwordSchema.safeParse("a".repeat(72)).success).toBe(true)
    expect(passwordSchema.safeParse("a".repeat(73)).success).toBe(false)
  })

  it("explains the limit rather than failing silently", () => {
    const result = passwordSchema.safeParse("a".repeat(100))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toMatch(/72 characters/)
  })
})

describe("hashPassword / verifyPassword", () => {
  it("accepts the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery")
    await expect(verifyPassword("correct horse battery", hash)).resolves.toBe(true)
    await expect(verifyPassword("wrong horse battery", hash)).resolves.toBe(false)
  })

  it("never stores the password in the hash", async () => {
    const hash = await hashPassword("plaintext-secret")
    expect(hash).not.toContain("plaintext-secret")
  })

  // A per-password salt is what stops a stolen table from being reversed with
  // a single rainbow lookup: the same password must not produce the same hash.
  it("salts every hash, so identical passwords hash differently", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password"), hashPassword("same-password")])
    expect(a).not.toBe(b)
    await expect(verifyPassword("same-password", a)).resolves.toBe(true)
    await expect(verifyPassword("same-password", b)).resolves.toBe(true)
  })

  it("uses cost 12, the value the module documents", async () => {
    // bcrypt encodes the cost in the hash prefix: $2a$12$...
    expect(await hashPassword("check-the-cost")).toMatch(/^\$2[aby]\$12\$/)
  })
})

import { describe, expect, it } from "vitest"
import {
  BACKUP_CODE_ALPHABET,
  BACKUP_CODE_COUNT,
  generateBackupCodes,
  normalizeBackupCode,
} from "./backup-codes"

/**
 * The alphabet is the whole point of this module, so it is what gets asserted.
 * A generator that quietly starts emitting `0` and `O` again would still pass
 * every other test in the suite: the codes would work, and only the person
 * copying them off paper at midnight would find out.
 */

describe("the alphabet", () => {
  it("leaves out the four characters that impersonate each other", () => {
    for (const character of ["0", "O", "1", "I"]) {
      expect(BACKUP_CODE_ALPHABET).not.toContain(character)
    }
  })

  it("is upper case only, so a typed code can be safely upper-cased", () => {
    expect(BACKUP_CODE_ALPHABET).toBe(BACKUP_CODE_ALPHABET.toUpperCase())
  })

  it("still leaves enough characters to be worth generating from", () => {
    // 31 characters over ten of them is ~49 bits per code.
    expect(BACKUP_CODE_ALPHABET.length).toBeGreaterThanOrEqual(30)
  })
})

describe("generateBackupCodes", () => {
  const codes = generateBackupCodes()

  it("hands out a full set", () => {
    expect(codes).toHaveLength(BACKUP_CODE_COUNT)
  })

  it("uses only the readable alphabet, and the dash", () => {
    for (const code of codes) {
      expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/)
    }
  })

  it("does not repeat itself", () => {
    expect(new Set(codes).size).toBe(codes.length)
    expect(new Set(generateBackupCodes().concat(codes)).size).toBe(codes.length * 2)
  })
})

describe("normalizeBackupCode", () => {
  const stored = "ABCDE-FGHJK"

  it("accepts the code exactly as it was shown", () => {
    expect(normalizeBackupCode(stored)).toBe(stored)
  })

  it("forgives lower case, which is how most people retype from paper", () => {
    expect(normalizeBackupCode("abcde-fghjk")).toBe(stored)
  })

  it("forgives a missing dash", () => {
    expect(normalizeBackupCode("ABCDEFGHJK")).toBe(stored)
  })

  it("forgives spaces, including the ones a phone keyboard adds", () => {
    expect(normalizeBackupCode("  ABCDE FGHJK ")).toBe(stored)
  })

  /**
   * The forgiveness has a floor: it tidies up how a code was typed, never what
   * was typed. A wrong code has to stay wrong.
   */
  it("does not turn a wrong code into a right one", () => {
    expect(normalizeBackupCode("ABCDE-FGHJX")).not.toBe(stored)
    expect(normalizeBackupCode("ABCDE")).not.toBe(stored)
  })
})

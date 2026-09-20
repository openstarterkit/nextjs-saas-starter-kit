import { describe, it, expect } from "vitest"
import { accountTableShape } from "./account-shape.mjs"

/**
 * The columns are the ones the migrations actually create: the Auth.js table
 * from the first migration, and the same table after the 2.0 one has run.
 */
const BEFORE_2_0 = ["id", "userId", "type", "provider", "providerAccountId", "refresh_token", "access_token"]
const CURRENT = ["id", "userId", "issuer", "accountId", "providerId", "password", "createdAt", "updatedAt"]

describe("the shape of the Account table", () => {
  it("is absent when the database reports no columns for it", () => {
    expect(accountTableShape([])).toBe("absent")
  })

  it("is the shape before 2.0 when providerId is missing", () => {
    expect(accountTableShape(BEFORE_2_0)).toBe("before-2.0")
  })

  it("is current once providerId is there", () => {
    expect(accountTableShape(CURRENT)).toBe("current")
  })

  // Halfway is the state the 2.0 migration was wrapped in a transaction to
  // prevent, and it did happen once on a rehearsal database. Reporting it as
  // current is the right answer here: the checks that follow are about
  // providerId, and they can run.
  it("is current on a table that carries both sets of columns", () => {
    expect(accountTableShape([...BEFORE_2_0, ...CURRENT])).toBe("current")
  })
})

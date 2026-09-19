import { describe, it, expect, vi } from "vitest"
import { createSchemaStatus, isUndefinedTable, missingMigrations } from "@/lib/schema-status"

const EXPECTED = ["20260101000000_init", "20260201000000_second", "20260301000000_third"] as const

describe("missingMigrations", () => {
  it("returns what the database lacks, in the order the migrations were written", () => {
    expect(missingMigrations(EXPECTED, ["20260201000000_second"])).toEqual([EXPECTED[0], EXPECTED[2]])
  })

  it("ignores migrations the database has and this build does not", () => {
    expect(missingMigrations(EXPECTED, [...EXPECTED, "20260401000000_from_another_branch"])).toEqual([])
  })
})

describe("createSchemaStatus", () => {
  it("is aligned when every migration is applied", async () => {
    const status = createSchemaStatus(EXPECTED, async () => [...EXPECTED])
    expect(await status()).toEqual({ aligned: true, pending: 0 })
  })

  it("counts what is missing", async () => {
    const status = createSchemaStatus(EXPECTED, async () => [EXPECTED[0]])
    expect(await status()).toEqual({ aligned: false, pending: 2 })
  })

  it("treats a database with no migrations table as missing all of them", async () => {
    const status = createSchemaStatus(EXPECTED, async () => null)
    expect(await status()).toEqual({ aligned: false, pending: 3 })
  })

  it("says unknown, not behind, when the database cannot be asked", async () => {
    const status = createSchemaStatus(EXPECTED, async () => {
      throw new Error("connect ECONNREFUSED")
    })
    expect(await status()).toEqual({ aligned: null, pending: null })
  })

  // A health endpoint that waits on a database that never answers is a health
  // endpoint that never answers.
  it("says unknown when the database does not answer in time", async () => {
    const status = createSchemaStatus(EXPECTED, () => new Promise(() => {}), 20)
    expect(await status()).toEqual({ aligned: null, pending: null })
  })

  /**
   * Aligned is remembered, behind is not. What happens after a failed check is
   * somebody applying the migration and checking again: an instance that kept
   * its old answer would fail a database that is now fine, and the release
   * would stop on a problem that no longer exists.
   */
  it("remembers aligned, and asks again after behind", async () => {
    const read = vi
      .fn<() => Promise<string[] | null>>()
      .mockResolvedValueOnce([EXPECTED[0]])
      .mockResolvedValue([...EXPECTED])
    const status = createSchemaStatus(EXPECTED, read)

    expect((await status()).aligned).toBe(false)
    expect((await status()).aligned).toBe(true)
    expect((await status()).aligned).toBe(true)
    expect(read).toHaveBeenCalledTimes(2)
  })
})

describe("isUndefinedTable", () => {
  it("recognises a missing migrations table however the driver reports it", () => {
    expect(isUndefinedTable(new Error('Raw query failed. Code: `42P01`. Message: `relation "_prisma_migrations" does not exist`'))).toBe(true)
    expect(isUndefinedTable({ code: "P2010", meta: { code: "42P01" } })).toBe(true)
    expect(isUndefinedTable({ name: "DriverAdapterError", cause: { kind: "TableDoesNotExist", originalCode: "42P01" } })).toBe(true)
  })

  // The shape the 2.2.0 incident actually produced was a missing column, and it
  // must not read as "no migrations table": that would report every migration
  // as missing instead of the one that is.
  it("does not mistake another failure for it", () => {
    expect(isUndefinedTable(new Error("connect ECONNREFUSED"))).toBe(false)
    expect(isUndefinedTable({ name: "DriverAdapterError", cause: { kind: "ColumnNotFound" } })).toBe(false)
  })
})

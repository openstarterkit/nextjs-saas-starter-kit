import { describe, it, expect } from "vitest"
import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import { MIGRATIONS } from "@/generated/migrations"

/**
 * The manifest compiled into the build must list exactly the migrations in
 * prisma/migrations.
 *
 * The failure this prevents is quiet and points the wrong way. Add a migration,
 * forget to regenerate, and /api/health compares the database against the older
 * list: it reports "aligned" on a database that is missing the newest
 * migration, which is the one answer a check like this must never give.
 */
describe("the migration manifest", () => {
  it("lists every migration folder, in order, and nothing else", () => {
    const dir = path.join(process.cwd(), "prisma", "migrations")
    const onDisk = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, "migration.sql")))
      .map((entry) => entry.name)
      .sort()

    expect(
      [...MIGRATIONS],
      "src/generated/migrations.ts is out of date: run node scripts/generate-migration-manifest.mjs",
    ).toEqual(onDisk)
  })
})

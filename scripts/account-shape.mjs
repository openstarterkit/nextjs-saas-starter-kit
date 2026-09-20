/**
 * Which shape the Account table is in, decided from the columns the database
 * reports for it.
 *
 * Three answers, because there are three databases in the world and the checks
 * that make sense on one are nonsense on another:
 *
 *   "absent"      nothing has been applied here yet. A new database.
 *   "before-2.0"  still Auth.js's table: provider / providerAccountId, and no
 *                 providerId. The 2.0 migration converts it.
 *   "current"     Better Auth's table, from 2.0 onwards.
 *
 * This exists as its own function for one reason: getting it wrong is how
 * check:deploy stopped with "column providerId does not exist" on exactly the
 * databases it was written for, the ones still on 1.x. A question asked of a
 * table that does not have the column is not a failed check, it is the wrong
 * question, and the difference is worth a test that needs no database.
 */
export function accountTableShape(columns) {
  const names = new Set(columns)
  if (names.size === 0) return "absent"
  return names.has("providerId") ? "current" : "before-2.0"
}

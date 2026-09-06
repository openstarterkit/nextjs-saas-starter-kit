-- Realign the account table to Better Auth 1.7.3 (v2.1.0).
--
-- READ THIS IF YOU ARE ON 2.0.0 THROUGH 2.0.3. If you are installing this kit
-- for the first time there is nothing to think about: your database is built
-- from the current schema and this migration finds nothing to change.
--
-- WHAT CHANGED, AND IT IS NOT US
--
-- Better Auth 1.7.0 added a required `issuer` column to the account table and
-- keyed sign-in by the pair (issuer, accountId). This kit's 2.0 was built on
-- that, and 2.0.2 repaired the values it wrote.
--
-- On 5 September 2026 Better Auth reverted it. Their reasoning, from the pull
-- request: a required column that a populated 1.6 database cannot take without
-- a backfill is too risky to ask of production services, so restoring the old
-- schema is the less disruptive path. Accounts are identified by
-- (providerId, accountId) again, exactly as in 1.6, and they committed to
-- keeping the core schema unchanged for the rest of v1.
--
--   Their pull request:  better-auth/better-auth#11153
--   Released in:         better-auth@1.7.3, 6 September 2026
--   Their guide:         https://www.better-auth.com/docs/guides/1-7-upgrade-guide
--
-- WHY IT CANNOT BE LEFT ALONE
--
-- Better Auth 1.7.3 never writes `issuer`. A NOT NULL column with no default
-- that nobody writes rejects every sign-up and every account link. The library
-- checks the schema when it starts, including in production, and refuses
-- authentication requests rather than failing one insert at a time.
--
-- WHAT THIS MIGRATION DOES
--
-- Drops the unique index first and the column second, which is the order their
-- guide insists on: MySQL rebuilds an index whose column disappears, turning a
-- compound unique index into a unique constraint on accountId alone, which
-- would reject a user holding the same account id at two providers. This kit
-- is Postgres, where that does not happen, but the order is free and the SQL
-- gets copied.
--
-- The issuer values are not backed up because they are derivable: an issuer
-- was a function of the provider. Nothing that only lived in that column is
-- lost.

BEGIN;

-- 1. Refuse to continue if the restored key would not be unique.
--
-- On 1.7.0 through 1.7.2 two provider configurations could share one issuer
-- and collapse into a single row; from 1.7.3 each provider id keeps its own
-- row again. If your data already holds two accounts with the same
-- (providerId, accountId), the unique index in step 3 cannot be created.
--
-- Postgres would say so on its own, in the language of constraint violations.
-- This says it in the language of the problem, because whoever reads it is
-- probably reading it at a bad moment.
DO $$
DECLARE
  dupes INTEGER;
  sample TEXT;
BEGIN
  SELECT count(*), string_agg(pair, ', ')
    INTO dupes, sample
    FROM (
      SELECT "providerId" || '/' || "accountId" AS pair
        FROM "Account"
       GROUP BY "providerId", "accountId"
      HAVING count(*) > 1
       LIMIT 10
    ) d;

  IF COALESCE(dupes, 0) > 0 THEN
    RAISE EXCEPTION
      'Cannot restore the (providerId, accountId) key: % duplicate pair(s) in "Account" (%). Decide which row survives, delete the others, then run this migration again. Two rows for the same provider and account id are two records of one identity, so keeping both was never meaningful.',
      dupes, sample;
  END IF;
END $$;

-- 2. Drop the 1.7.0-1.7.2 index. Before the column, not after.
DROP INDEX IF EXISTS "Account_issuer_accountId_key";

-- 3. Restore the identity this kit used before 2.0, and that 1.6 used.
--
-- Better Auth enforces the pair in its lookup rather than in the schema, so
-- this index is not required by the library. It is here because the constraint
-- is real: a second row for the same provider and account id makes sign-in
-- ambiguous, and the database is the right place to make that impossible.
CREATE UNIQUE INDEX IF NOT EXISTS "Account_providerId_accountId_key"
    ON "Account"("providerId", "accountId");

-- 4. Drop the column.
--
-- If you would rather keep it for now, their guide says relaxing the
-- constraint is enough and is reversible:
--
--   ALTER TABLE "Account" ALTER COLUMN "issuer" DROP NOT NULL;
--
-- This kit drops it, because prisma/schema.prisma is the schema every clone
-- starts from and a nullable column nothing writes would outlive the reason it
-- exists.
ALTER TABLE "Account" DROP COLUMN IF EXISTS "issuer";

COMMIT;

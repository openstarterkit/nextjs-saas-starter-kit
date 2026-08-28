-- Migration to Better Auth (v2.0.0)
--
-- READ THIS BEFORE RUNNING IT ON A DATABASE THAT HAS USERS.
--
-- This moves data, not only columns, and three of the moves are one-way:
--   * emailVerified stops being a timestamp and becomes true/false. The moment
--     of verification is gone afterwards.
--   * every password hash moves from User.passwordHash into a row of Account.
--     If that INSERT does not happen, the database stays perfectly valid, no
--     error appears, and every user with a password silently stops being able
--     to sign in. Count before and after; the two numbers must match.
--   * pending password resets are dropped with the table that held them, so
--     anyone mid-reset has to ask for a new link.
--
-- Every active session ends: Better Auth's session tokens are its own.
--
-- Verify with, before and after:
--   SELECT count(*) FROM "User" WHERE "passwordHash" IS NOT NULL;      -- before
--   SELECT count(*) FROM "Account" WHERE "providerId" = 'credential';  -- after

-- BEGIN/COMMIT are here on purpose and they are not decoration. Prisma does NOT
-- wrap this file in a transaction: the first run of this migration failed
-- halfway and left the database half converted, with emailVerified already a
-- boolean and Account carrying both the old columns and the new ones. On a
-- rehearsal database that is an inconvenience. On someone's production it is
-- the worst possible state, because there is no version of the application
-- that can talk to it. Wrapped like this, a failure leaves everything as it
-- was and the only cost is running it again.
BEGIN;

-- ─── User ────────────────────────────────────────────────────────────────────

-- emailVerified: DateTime? -> Boolean. "has a date" becomes true.
ALTER TABLE "User" ADD COLUMN "emailVerified_new" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "emailVerified_new" = ("emailVerified" IS NOT NULL);
ALTER TABLE "User" DROP COLUMN "emailVerified";
ALTER TABLE "User" RENAME COLUMN "emailVerified_new" TO "emailVerified";

-- name becomes required. Empty strings are backfilled as well as nulls: an
-- empty string already satisfies NOT NULL, so a migration that only looks for
-- nulls leaves users with a blank display name and no error to notice.
UPDATE "User" SET "name" = split_part("email", '@', 1) WHERE "name" IS NULL OR "name" = '';
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

-- ─── Account: new columns first, data second, old columns last ───────────────

ALTER TABLE "Account"
  ADD COLUMN "issuer"                TEXT,
  ADD COLUMN "accountId"             TEXT,
  ADD COLUMN "providerId"            TEXT,
  ADD COLUMN "accessToken"           TEXT,
  ADD COLUMN "refreshToken"          TEXT,
  ADD COLUMN "accessTokenExpiresAt"  TIMESTAMP(3),
  ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "idToken"               TEXT,
  ADD COLUMN "password"              TEXT,
  ADD COLUMN "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- The issuer format is NOT documented in the migration guide, which only shows
-- the credential case. Better Auth builds it from the provider id as
-- `local:oauth:<id>` (createOAuthAccountIssuer), so "google" becomes
-- "local:oauth:google". Writing the bare provider name here would leave every
-- existing OAuth account unmatched at sign-in.
--
-- expires_at is an INTEGER of unix seconds and accessTokenExpiresAt is a
-- timestamp: this is a conversion, not a rename. Renaming it would date every
-- OAuth token to 1970.
UPDATE "Account" SET
  "issuer"               = 'local:oauth:' || "provider",
  "accountId"            = "providerAccountId",
  "providerId"           = "provider",
  "accessToken"          = "access_token",
  "refreshToken"         = "refresh_token",
  "idToken"              = "id_token",
  "accessTokenExpiresAt" = CASE
                             WHEN "expires_at" IS NULL THEN NULL
                             ELSE (to_timestamp("expires_at") AT TIME ZONE 'UTC')
                           END;

ALTER TABLE "Account"
  DROP COLUMN "type",
  DROP COLUMN "provider",
  DROP COLUMN "providerAccountId",
  DROP COLUMN "refresh_token",
  DROP COLUMN "access_token",
  DROP COLUMN "expires_at",
  DROP COLUMN "token_type",
  DROP COLUMN "session_state",
  DROP COLUMN "id_token";

-- The move that matters, and it comes AFTER the old columns are gone: `type`
-- was NOT NULL and this INSERT does not fill it, so putting this first fails.
-- One row per user that HAS a password: users without one (OAuth only, magic
-- link only) must NOT get a credential row, or they end up with an account
-- whose password is null.
INSERT INTO "Account" ("id", "userId", "issuer", "accountId", "providerId", "password", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  "id",
  'local:credential',
  "id",
  'credential',
  "passwordHash",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
WHERE "passwordHash" IS NOT NULL;

ALTER TABLE "Account"
  ALTER COLUMN "issuer" SET NOT NULL,
  ALTER COLUMN "accountId" SET NOT NULL,
  ALTER COLUMN "providerId" SET NOT NULL,
  ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX "Account_issuer_accountId_key" ON "Account"("issuer", "accountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- Only now, with the hashes safely copied.
ALTER TABLE "User" DROP COLUMN "passwordHash";
-- Replaced by real session rows: revoking is deleting one.
ALTER TABLE "User" DROP COLUMN "sessionVersion";

-- ─── Session ─────────────────────────────────────────────────────────────────

-- The kit shipped session: { strategy: "jwt" }, so this table has never had a
-- row written to it and there is nothing to carry over. If yours does have
-- rows, they still cannot survive: the tokens belong to the old library.
DELETE FROM "Session";

ALTER TABLE "Session" RENAME COLUMN "sessionToken" TO "token";
ALTER TABLE "Session" RENAME COLUMN "expires" TO "expiresAt";
ALTER INDEX "Session_sessionToken_key" RENAME TO "Session_token_key";

ALTER TABLE "Session"
  ADD COLUMN "ipAddress" TEXT,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Session" ALTER COLUMN "updatedAt" DROP DEFAULT;
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- ─── VerificationToken -> Verification ───────────────────────────────────────

ALTER TABLE "VerificationToken" RENAME TO "Verification";
ALTER TABLE "Verification" RENAME COLUMN "token" TO "value";
ALTER TABLE "Verification" RENAME COLUMN "expires" TO "expiresAt";

-- Composite identity becomes a single id.
DROP INDEX IF EXISTS "VerificationToken_identifier_token_key";
DROP INDEX IF EXISTS "VerificationToken_token_key";

ALTER TABLE "Verification" ADD COLUMN "id" TEXT;
UPDATE "Verification" SET "id" = gen_random_uuid()::text;
ALTER TABLE "Verification" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_pkey" PRIMARY KEY ("id");

ALTER TABLE "Verification"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Verification" ALTER COLUMN "updatedAt" DROP DEFAULT;
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- ─── PasswordResetToken ──────────────────────────────────────────────────────

-- Better Auth issues its own reset tokens into Verification, so the hand-rolled
-- table goes. Anyone holding an unused reset link has to request a new one.
DROP TABLE "PasswordResetToken";

COMMIT;

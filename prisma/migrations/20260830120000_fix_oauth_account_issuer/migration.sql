-- Repair the OAuth account issuer written by the 2.0 migration (v2.0.2).
--
-- READ THIS IF YOU MIGRATED TO 2.0 AND SIGN IN WITH GOOGLE, APPLE, FACEBOOK
-- OR LINE. If you only use GitHub, a password, or a magic link, this migration
-- finds nothing to do and is a no-op.
--
-- WHAT WENT WRONG
--
-- The 2.0 migration wrote `local:oauth:<provider>` as the issuer of every
-- OAuth account. That value comes from `createOAuthAccountIssuer`, which is
-- the FALLBACK Better Auth uses for providers that do not declare an issuer
-- of their own. OpenID Connect providers do declare one:
--
--   @better-auth/core/dist/social-providers/google.mjs
--     accountIssuer: "https://accounts.google.com"
--
-- So `local:oauth:github` is right, because GitHub declares nothing, and
-- `local:oauth:google` is wrong. Account lookup at sign-in is by the pair
-- (issuer, accountId) with no fallback on providerId, so a Google row written
-- by the 2.0 migration is never found.
--
-- WHY THAT LOCKS PEOPLE OUT INSTEAD OF CREATING A SECOND ACCOUNT
--
-- Better Auth would normally link the unrecognised sign-in to the existing
-- user by email. That path is refused when the local user's `emailVerified`
-- is false (`accountLinking.requireLocalEmailVerified`, true by default), and
-- the 2.0 migration derives `emailVerified` from `IS NOT NULL` on the Auth.js
-- timestamp, which is null for most accounts created through OAuth. Users in
-- that state get `account not linked` and cannot sign in at all.
--
-- WHY THIS IS A NEW FILE AND NOT AN EDIT OF THE 2.0 MIGRATION
--
-- Because an applied migration is never run again. Editing the 2.0 file would
-- repair nobody who had already migrated, which is everybody this affects: it
-- is recorded as applied, and Prisma will not touch it a second time. The edit
-- would help only people who had not upgraded yet, and would leave every
-- affected installation broken and quiet. A new migration converges from both
-- directions instead: if you have already migrated it repairs your rows, and if
-- you have not it runs right after the 2.0 one and lands in the same place.
--
-- Prisma does record a checksum of every applied migration, and it is worth
-- knowing what that does and does not do. On Prisma 7, `migrate deploy` applies
-- pending migrations without complaining about a modified file that has already
-- run: we checked, rather than assuming. So the checksum is not the reason. The
-- reason is the paragraph above.

BEGIN;

-- Providers whose issuer is a fixed string, so it can be repaired here.
-- Anything not listed is left alone: GitHub, Discord, Slack and the other
-- plain-OAuth providers use the fallback, so the value the 2.0 migration
-- wrote for them is already correct.

-- 1. Stop rather than guess.
--
-- Cognito, Microsoft Entra ID and Paybin also declare an issuer, but theirs is
-- computed at runtime from your configuration or from the token — the region
-- and user pool for Cognito, the `iss` claim for Entra ID. There is no value
-- this file could write that would be right for every installation, and
-- writing a plausible wrong one is what produced this migration in the first
-- place. If you use one of them, map it by hand: `docs/upgrading.md`.
DO $$
DECLARE affected TEXT;
BEGIN
  SELECT string_agg(DISTINCT "providerId", ', ')
    INTO affected
    FROM "Account"
   WHERE "providerId" IN ('cognito', 'microsoft', 'paybin')
     AND "issuer" = 'local:oauth:' || "providerId";

  IF affected IS NOT NULL THEN
    RAISE EXCEPTION
      'This database has accounts from a provider whose issuer depends on your own configuration (%). Map them by hand before applying this migration: see docs/upgrading.md, section "Repairing the OAuth issuer".', affected;
  END IF;
END $$;

-- 2. Say what could not be classified.
--
-- A provider added through generic-oauth, or a self-hosted GitLab, has an id
-- this file cannot know. Most such providers use the fallback and are already
-- correct, so this is a notice and not a stop. The check that can actually
-- decide is `scripts/verify-auth-migration.mjs`, which reads your auth config:
-- run it after this migration.
--
-- Be aware that you will not see the notice below. The Prisma CLI does not
-- surface PostgreSQL notices: verified against a database holding a GitHub
-- account, where this block fires and the CLI prints nothing. The notice is
-- kept because a psql user does see it, but the script is what you should
-- rely on.
DO $$
DECLARE unknown TEXT;
BEGIN
  SELECT string_agg(DISTINCT "providerId", ', ')
    INTO unknown
    FROM "Account"
   WHERE "providerId" <> 'credential'
     AND "providerId" NOT IN ('google', 'apple', 'facebook', 'line')
     AND "issuer" = 'local:oauth:' || "providerId";

  IF unknown IS NOT NULL THEN
    RAISE NOTICE 'Left untouched, verify these against your auth config with scripts/verify-auth-migration.mjs: %', unknown;
  END IF;
END $$;

-- 3. Remove the orphan where the correct row already exists.
--
-- Someone who signed in with Google after the 2.0 and got past the email
-- check now has TWO rows: the migrated one with the wrong issuer, and the one
-- Better Auth created with the right one. Updating the first would collide
-- with the second on the unique (issuer, accountId) index, so the stale row
-- goes. The surviving row is the better of the two anyway: its tokens came
-- from a real sign-in, the migrated ones are from before the upgrade.
DELETE FROM "Account" stale
USING (VALUES
        ('google',   'https://accounts.google.com'),
        ('apple',    'https://appleid.apple.com'),
        ('facebook', 'https://www.facebook.com'),
        ('line',     'https://access.line.me')
      ) AS fix("providerId", "issuer"),
      "Account" good
WHERE stale."providerId" = fix."providerId"
  AND stale."issuer"     = 'local:oauth:' || stale."providerId"
  AND good."issuer"      = fix."issuer"
  AND good."accountId"   = stale."accountId"
  AND good."id"         <> stale."id";

-- 4. Repair the rest.
UPDATE "Account" a
   SET "issuer"    = fix."issuer",
       "updatedAt" = CURRENT_TIMESTAMP
  FROM (VALUES
         ('google',   'https://accounts.google.com'),
         ('apple',    'https://appleid.apple.com'),
         ('facebook', 'https://www.facebook.com'),
         ('line',     'https://access.line.me')
       ) AS fix("providerId", "issuer")
 WHERE a."providerId" = fix."providerId"
   AND a."issuer"     = 'local:oauth:' || a."providerId";

COMMIT;

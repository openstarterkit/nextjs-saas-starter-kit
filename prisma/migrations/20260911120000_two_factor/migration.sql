-- Two-factor authentication (v2.2).
--
-- Additive, and it runs by itself: one new table, one new column with a
-- default. Nothing existing is read, rewritten or constrained, so there is no
-- backfill to plan and no row that can fail it. Take it with the release and
-- carry on.
--
-- The shape is Better Auth's, not ours. The plugin declares these columns and
-- looks them up by these names, which is why `TwoFactor` carries fields the kit
-- itself never reads: `verified` is false between "enable" and the first
-- correct code, and `failedVerificationCount` with `lockedUntil` are the
-- plugin's own lockout after ten consecutive wrong codes.
--
-- `secret` and `backupCodes` hold credentials. They are written encrypted
-- (storeBackupCodes: "encrypted" in src/auth.ts, keyed by AUTH_SECRET) and the
-- plugin never returns either one to the client. Rotating AUTH_SECRET makes
-- every stored secret unreadable, which is the one operational consequence
-- worth knowing before you rotate it.

-- CreateTable
CREATE TABLE "TwoFactor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TwoFactor_userId_idx" ON "TwoFactor"("userId");

-- CreateIndex
CREATE INDEX "TwoFactor_secret_idx" ON "TwoFactor"("secret");

-- AddForeignKey
ALTER TABLE "TwoFactor" ADD CONSTRAINT "TwoFactor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

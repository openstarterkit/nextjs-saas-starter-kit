-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingDismissedAt" TIMESTAMP(3),
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 1;

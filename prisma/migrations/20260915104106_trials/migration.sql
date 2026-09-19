-- Free trials (v2.3).
--
-- Additive, and it runs by itself: two nullable columns, nothing backfilled,
-- nothing constrained. Existing plans offer no trial until you set trialDays on
-- them, and existing subscriptions simply have no trial end.
--
-- "Plan"."trialDays" is read at checkout, and only for a customer who has never
-- had a subscription, a cancelled one included (trialDaysFor in
-- src/lib/billing.ts). "Subscription"."trialEndsAt" is written by the webhook
-- from Stripe and stays set after the trial is over, so the status is what says
-- whether a trial is running.

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "trialDays" INTEGER;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { PlanPricing } from "@/components/landing/plan-pricing"
import { FAQ } from "@/components/landing/faq"
import { isKitSite } from "@/config/kit"

export default function LandingPage() {
  // Pricing comes from your Plan rows. The kit's own site (KIT_SITE="true")
  // swaps in the hand-written open source tiers instead: a free one plus a
  // waitlist for a paid one.
  return (
    <>
      <Hero />
      <Features />
      {isKitSite ? <Pricing /> : <PlanPricing />}
      <FAQ />
    </>
  )
}

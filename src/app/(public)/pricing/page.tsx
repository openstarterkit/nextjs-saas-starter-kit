import { Pricing } from "@/components/landing/pricing"
import { PlanPricing } from "@/components/landing/plan-pricing"
import { FAQ } from "@/components/landing/faq"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

export const metadata = {
  title: `Pricing | ${siteConfig.name}`,
}

export default function PricingPage() {
  // Same swap as the landing page: plans from the database, unless this
  // deployment is the kit's own site (KIT_SITE="true").
  return (
    <>
      {isKitSite ? <Pricing /> : <PlanPricing />}
      <FAQ />
    </>
  )
}

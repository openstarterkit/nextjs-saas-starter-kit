import { Pricing } from "@/components/landing/pricing"
import { DemoPricing } from "@/components/landing/demo-pricing"
import { FAQ } from "@/components/landing/faq"
import { siteConfig } from "@/config/site"

export const metadata = {
  title: `Pricing | ${siteConfig.name}`,
}

export default function PricingPage() {
  // Same swap as the landing page: the demo shows the DB-driven plan cards.
  const isDemo = process.env.DEMO_MODE === "true"
  return (
    <>
      {isDemo ? <DemoPricing /> : <Pricing />}
      <FAQ />
    </>
  )
}

import { Pricing } from "@/components/landing/pricing"
import { PlanPricing } from "@/components/landing/plan-pricing"
import { FAQ } from "@/components/landing/faq"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

export const metadata = {
  title: `Pricing | ${siteConfig.name}`,
  // Without one of its own, this page inherited the site-wide description,
  // which says nothing about pricing and repeats the home page in results.
  description: `Plans and pricing for ${siteConfig.name}: what each tier includes, and what it costs.`,
  alternates: { canonical: `${siteConfig.url}/pricing` },
}

export default function PricingPage() {
  // Same swap as the landing page: plans from the database, unless this
  // deployment is the kit's own site (KIT_SITE="true"). Here the pricing
  // section is the page's own heading, so it renders as the h1 this page was
  // missing. The FAQ keeps its h2 and leaves the structured data to the home
  // page, where the same questions already carry it.
  return (
    <>
      {isKitSite ? <Pricing heading="h1" /> : <PlanPricing heading="h1" />}
      <FAQ />
    </>
  )
}

import { Pricing } from "@/components/landing/pricing"
import { PlanPricing } from "@/components/landing/plan-pricing"
import { FAQ } from "@/components/landing/faq"
import { siteConfig } from "@/config/site"
import { pageMetadata } from "@/lib/metadata"
import { isKitSite } from "@/config/kit"
import { pendingSetup } from "@/lib/setup-status"
import { SetupGuide } from "@/components/setup-guide"

export const metadata = pageMetadata({
  title: `Pricing | ${siteConfig.name}`,
  // Without one of its own, this page inherited the site-wide description,
  // which says nothing about pricing and repeats the home page in results.
  description: `Plans and pricing for ${siteConfig.name}: what each tier includes, and what it costs.`,
  path: "/pricing",
})

export default async function PricingPage() {
  // The plans on this page come from the database, so before one is ready it
  // says what to do instead of failing. Development only, and not on the kit's
  // own site, where the tiers are hand-written and need no database.
  const setup = isKitSite ? null : await pendingSetup()
  if (setup) return <SetupGuide step={setup} />

  // Same swap as the landing page: plans from the database, unless this
  // deployment is the kit's own site (KIT_SITE="true"). Here the pricing
  // section is the page's own heading, so it renders as the h1 this page was
  // missing. The FAQ keeps its h2 and leaves the structured data to the home
  // page, where the same questions already carry it. The offers, on the other
  // hand, belong here: this is the page a price should be read from.
  return (
    <>
      {isKitSite ? (
        <Pricing heading="h1" withJsonLd />
      ) : (
        <PlanPricing heading="h1" withJsonLd />
      )}
      <FAQ />
    </>
  )
}

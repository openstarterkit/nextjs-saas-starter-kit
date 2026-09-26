import type { Metadata } from "next"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { PlanPricing } from "@/components/landing/plan-pricing"
import { FAQ } from "@/components/landing/faq"
import { siteConfig } from "@/config/site"
import { pageMetadata } from "@/lib/metadata"
import { isKitSite } from "@/config/kit"
import { jsonLdScript } from "@/lib/json-ld"
import { pendingSetup } from "@/lib/setup-status"
import { SetupGuide } from "@/components/setup-guide"

export const metadata: Metadata = pageMetadata({
  title: siteConfig.seoTitle ?? `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: "/",
})

/**
 * Identifies the site itself to search engines: the name to show, the logo to
 * pick, and the profiles that are the same entity. Built from `siteConfig`,
 * so rebranding the kit rebrands this too.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  logo: `${siteConfig.url}/icon`,
  sameAs: [siteConfig.links.githubOrg, siteConfig.links.x].filter(Boolean),
}

export default async function LandingPage() {
  // A fresh clone has no database yet, and the plans below come from one: this
  // page used to open on a stack trace. Development only, and not on the kit's
  // own site, whose tiers are hand-written and need no database.
  const setup = isKitSite ? null : await pendingSetup()
  if (setup) return <SetupGuide step={setup} />

  // Pricing comes from your Plan rows. The kit's own site (KIT_SITE="true")
  // swaps in the hand-written open source tiers instead: a free one plus a
  // waitlist for a paid one.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd) }}
      />
      <Hero />
      <Features />
      {isKitSite ? <Pricing /> : <PlanPricing />}
      <FAQ withJsonLd />
    </>
  )
}

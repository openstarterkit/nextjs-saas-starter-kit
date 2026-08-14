import type { Metadata } from "next"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { PlanPricing } from "@/components/landing/plan-pricing"
import { FAQ } from "@/components/landing/faq"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

export const metadata: Metadata = {
  alternates: { canonical: siteConfig.url },
}

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

export default function LandingPage() {
  // Pricing comes from your Plan rows. The kit's own site (KIT_SITE="true")
  // swaps in the hand-written open source tiers instead: a free one plus a
  // waitlist for a paid one.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Hero />
      <Features />
      {isKitSite ? <Pricing /> : <PlanPricing />}
      <FAQ withJsonLd />
    </>
  )
}

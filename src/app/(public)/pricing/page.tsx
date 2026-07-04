import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { siteConfig } from "@/config/site"

export const metadata = {
  title: `Pricing — ${siteConfig.name}`,
}

export default function PricingPage() {
  return (
    <>
      <Pricing />
      <FAQ />
    </>
  )
}

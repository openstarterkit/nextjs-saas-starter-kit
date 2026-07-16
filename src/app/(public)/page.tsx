import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"
import { DemoPricing } from "@/components/landing/demo-pricing"
import { FAQ } from "@/components/landing/faq"

export default function LandingPage() {
  // On the public demo the pricing section showcases the DB-driven plan cards
  // instead of the kit's own marketing tiers.
  const isDemo = process.env.DEMO_MODE === "true"
  return (
    <>
      <Hero />
      <Features />
      {isDemo ? <DemoPricing /> : <Pricing />}
      <FAQ />
    </>
  )
}

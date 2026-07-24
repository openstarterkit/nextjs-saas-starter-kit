import type { ContactCardData } from "@/components/billing/plan-cards"
import { siteConfig } from "@/config/site"

// Example sales-led tier shown next to the seeded plans in demo mode (landing
// and billing page). Not a Plan row: it has no self-serve price. Replace the
// copy with your own enterprise offer, or drop the card entirely.
//
// The `yearly` block is what the price shows once the interval toggle flips.
// Quoting a real figure instead of "Custom"? Put the annual one there, e.g.
// priceLabel: "$500", note: "per month" + yearly: { priceLabel: "$5,000",
// note: "per year" }. Leave `yearly` out and the card reads the same on both
// sides of the toggle.
export const exampleEnterpriseCard: ContactCardData = {
  name: "Enterprise",
  description: "For large teams and organizations",
  priceLabel: "Custom",
  note: "billed your way",
  yearly: { note: "on an annual contract" },
  features: [
    "Everything in Pro",
    "Unlimited team members",
    "SSO and audit logs",
    "Dedicated support",
    "Custom invoicing and SLA",
  ],
  ctaLabel: "Contact us",
  ctaSubject: `${siteConfig.name} Enterprise: let's talk`,
  ctaBody: "Team size:\n\nWhat we need:\n\n",
}

import type { ContactCardData } from "@/components/billing/plan-cards"
import { siteConfig } from "@/config/site"

// Example sales-led tier shown next to the seeded plans in demo mode (landing
// and billing page). Not a Plan row: it has no self-serve price. Replace the
// copy with your own enterprise offer, or drop the card entirely.
export const exampleEnterpriseCard: ContactCardData = {
  name: "Enterprise",
  description: "For large teams and organizations",
  priceLabel: "Custom",
  note: "billed your way",
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

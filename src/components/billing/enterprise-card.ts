import { getTranslations } from "next-intl/server"
import type { ContactCardData } from "@/components/billing/plan-cards"
import { siteConfig } from "@/config/site"

// Example sales-led tier shown next to the seeded plans in demo mode (landing
// and billing page). Not a Plan row: it has no self-serve price. Replace the
// copy in the `enterprise` block of your message files with your own offer, or
// drop the card entirely.
//
// The `yearly` block is what the price shows once the interval toggle flips.
// Quoting a real figure instead of "Custom"? Put the annual one there, e.g.
// priceLabel: "$500", note: "per month" + yearly: { priceLabel: "$5,000",
// note: "per year" }. Leave `yearly` out and the card reads the same on both
// sides of the toggle.
//
// A function rather than a constant, because the copy now comes from the
// message files and those are resolved per request.
export async function exampleEnterpriseCard(): Promise<ContactCardData> {
  const t = await getTranslations("enterprise")
  return {
    name: t("name"),
    description: t("description"),
    priceLabel: t("priceLabel"),
    note: t("note"),
    yearly: { note: t("yearlyNote") },
    features: t.raw("features") as string[],
    ctaLabel: t("ctaLabel"),
    ctaSubject: t("ctaSubject", { site: siteConfig.name }),
    ctaBody: t("ctaBody"),
  }
}

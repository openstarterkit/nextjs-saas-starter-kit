import { siteConfig } from "@/config/site"

/**
 * The product and what it costs, as structured data.
 *
 * Search engines and answer engines read this to state a price without having
 * to parse a pricing table, and it is what lets a result carry the figure
 * instead of a link someone has to open. A pricing page whose numbers exist
 * only in the layout can be read by a person and by nobody else, which is the
 * shape most competitors ship.
 *
 * Prices arrive in the smallest currency unit, the way Stripe stores them, and
 * are converted here at the one edge where they become text. The currency is a
 * parameter rather than a config field: this kit never stores one, because the
 * amount and its currency both come from Stripe per plan.
 */
export type SchemaOffer = {
  name: string
  /** In the smallest currency unit. Zero is a price, not a missing value. */
  price: number
  /** Omitted for a one-off price. */
  interval?: "MONTH" | "YEAR" | "ONE_TIME" | string
  url?: string
}

const PERIOD: Record<string, string> = { MONTH: "P1M", YEAR: "P1Y" }

export function softwareApplicationJsonLd(
  offers: SchemaOffer[],
  { path = "/pricing", currency = "USD" }: { path?: string; currency?: string } = {}
) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: "BusinessApplication",
    // Declared because a web application has no download and no install step,
    // and leaving it out invites the guess that one exists.
    operatingSystem: "Web",
    offers: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      price: (offer.price / 100).toFixed(2),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      url: offer.url ?? `${siteConfig.url}${path}`,
      ...(offer.interval && PERIOD[offer.interval]
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: (offer.price / 100).toFixed(2),
              priceCurrency: currency,
              billingDuration: PERIOD[offer.interval],
            },
          }
        : {}),
    })),
  }
}

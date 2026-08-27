import { describe, it, expect } from "vitest"

import { siteConfig } from "@/config/site"
import { softwareApplicationJsonLd, type SchemaOffer } from "./pricing-jsonld"

const monthly: SchemaOffer = { name: "Pro", price: 1900, interval: "MONTH" }

const offersOf = (offers: SchemaOffer[], options?: Parameters<typeof softwareApplicationJsonLd>[1]) =>
  softwareApplicationJsonLd(offers, options).offers

describe("softwareApplicationJsonLd", () => {
  it("declares a SoftwareApplication built from the site config", () => {
    const out = softwareApplicationJsonLd([monthly])

    expect(out["@context"]).toBe("https://schema.org")
    expect(out["@type"]).toBe("SoftwareApplication")
    expect(out.name).toBe(siteConfig.name)
    expect(out.description).toBe(siteConfig.description)
    expect(out.url).toBe(siteConfig.url)
    expect(out.applicationCategory).toBe("BusinessApplication")
  })

  // A web application has no download and no install step. Leaving this out
  // invites the guess that one exists.
  it("says the operating system is the web", () => {
    expect(softwareApplicationJsonLd([monthly]).operatingSystem).toBe("Web")
  })

  // Prices arrive the way Stripe stores them, in the smallest currency unit.
  // Emitting them unconverted advertises a plan at a hundred times its price.
  it("converts the smallest currency unit into a decimal amount", () => {
    expect(offersOf([monthly])[0].price).toBe("19.00")
    expect(offersOf([{ name: "Odd", price: 999 }])[0].price).toBe("9.99")
  })

  // Zero is a price, not a missing value: a free plan has to be stated, or the
  // result shows a paid tier as the cheapest thing on offer.
  it("emits a free plan as a price of zero", () => {
    expect(offersOf([{ name: "Free", price: 0 }])[0].price).toBe("0.00")
  })

  it("marks every offer as available", () => {
    expect(offersOf([monthly])[0].availability).toBe("https://schema.org/InStock")
  })

  it("translates a billing interval into its ISO 8601 period", () => {
    expect(offersOf([monthly])[0].priceSpecification).toMatchObject({
      "@type": "UnitPriceSpecification",
      price: "19.00",
      billingDuration: "P1M",
    })
    expect(
      offersOf([{ name: "Yearly", price: 19000, interval: "YEAR" }])[0].priceSpecification
    ).toMatchObject({ billingDuration: "P1Y" })
  })

  // A one-off payment recurs over no period at all, so declaring one would
  // describe a subscription nobody is selling. Same for an interval this
  // module has no period for: silence beats a guess.
  it("omits the recurrence for a one-off price and for an unknown interval", () => {
    expect(offersOf([{ name: "Lifetime", price: 9900 }])[0]).not.toHaveProperty("priceSpecification")
    expect(
      offersOf([{ name: "Lifetime", price: 9900, interval: "ONE_TIME" }])[0]
    ).not.toHaveProperty("priceSpecification")
    expect(offersOf([{ name: "Weekly", price: 500, interval: "WEEK" }])[0]).not.toHaveProperty(
      "priceSpecification"
    )
  })

  // The currency is a parameter because this kit never stores one: the amount
  // and its currency both come from Stripe, per plan.
  it("defaults to USD and takes the currency it is given", () => {
    expect(offersOf([monthly])[0].priceCurrency).toBe("USD")

    const eur = offersOf([monthly], { currency: "EUR" })[0]
    expect(eur.priceCurrency).toBe("EUR")
    expect(eur.priceSpecification).toMatchObject({ priceCurrency: "EUR" })
  })

  it("links an offer to the pricing page unless it carries a URL of its own", () => {
    expect(offersOf([monthly])[0].url).toBe(`${siteConfig.url}/pricing`)
    expect(offersOf([monthly], { path: "/plans" })[0].url).toBe(`${siteConfig.url}/plans`)
    expect(offersOf([{ ...monthly, url: "https://example.com/pro" }])[0].url).toBe(
      "https://example.com/pro"
    )
  })

  it("keeps one offer per plan, in order", () => {
    const out = offersOf([monthly, { name: "Free", price: 0 }])

    expect(out).toHaveLength(2)
    expect(out.map((offer) => offer.name)).toEqual(["Pro", "Free"])
  })
})

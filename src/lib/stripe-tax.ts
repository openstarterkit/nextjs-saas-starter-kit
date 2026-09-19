import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"

/**
 * Stripe Tax at checkout, switched on by STRIPE_AUTOMATIC_TAX.
 *
 * The four parameters go together. The kit always hands Checkout an existing
 * customer, and for one Stripe refuses automatic tax unless the address typed
 * in Checkout can be saved back (`customer_update.address: "auto"`), and
 * refuses tax ID collection unless the business name can be too
 * (`customer_update.name: "auto"`). Both refusals were seen in test mode.
 */
export const AUTOMATIC_TAX_PARAMS: Pick<
  Stripe.Checkout.SessionCreateParams,
  "automatic_tax" | "tax_id_collection" | "billing_address_collection" | "customer_update"
> = {
  automatic_tax: { enabled: true },
  tax_id_collection: { enabled: true },
  billing_address_collection: "required",
  customer_update: { address: "auto", name: "auto" },
}

type TaxSettings = Pick<Stripe.Tax.Settings, "status" | "status_details">

/**
 * What to tell whoever turned STRIPE_AUTOMATIC_TAX on, or null when there is
 * nothing to say.
 *
 * Stripe does not refuse a checkout with automatic tax when Stripe Tax is not
 * active on the account. It creates the session, collects the address and the
 * tax ID, and charges no tax: the invoice records the reason as
 * "not_collecting", and nothing fails anywhere. Seen in test mode with the
 * head office address missing. Asking for the settings is the only way to
 * find out before the invoices are wrong.
 */
export function stripeTaxWarning(settings: TaxSettings): string | null {
  if (settings.status === "active") return null
  const missing = settings.status_details?.pending?.missing_fields ?? []
  const why = missing.length > 0 ? ` (missing: ${missing.join(", ")})` : ""
  return (
    `STRIPE_AUTOMATIC_TAX is on, but Stripe Tax is not active on this Stripe account${why}. ` +
    "Checkout keeps working and collects addresses, but no tax is charged. " +
    "Finish the setup on the Tax page of the Stripe dashboard."
  )
}

/**
 * Asks Stripe for the Tax settings. Once the answer is "active" it is
 * remembered for the life of the instance; until then every checkout asks
 * again, so the warning keeps appearing in the logs until the setup is done.
 * Never throws: a check that cannot reach Stripe must not stop a customer
 * from paying.
 */
export function createStripeTaxCheck(
  retrieve: () => Promise<TaxSettings>,
  warn: (message: string) => void = console.warn
): () => Promise<void> {
  let active = false
  return async () => {
    if (active) return
    try {
      const warning = stripeTaxWarning(await retrieve())
      if (warning) warn(warning)
      else active = true
    } catch {
      // Unknown is not inactive: say nothing, and ask again next time.
    }
  }
}

export const checkStripeTax = createStripeTaxCheck(() => stripe.tax.settings.retrieve())

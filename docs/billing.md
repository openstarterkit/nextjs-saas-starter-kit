# Billing & payments

The kit ships a complete Stripe integration: recurring subscriptions, one-time payments (lifetime deals), and a usage-based example. Everything runs on your own Stripe account and your own prices; the seeded plans are placeholders to replace with your product's pricing.

## The data model

Three Prisma models drive billing (see `prisma/schema.prisma`):

| Model | What it stores |
|---|---|
| `Plan` | The single source of truth for every sellable tier: name, price, `interval` (`MONTH`, `YEAR` or `ONE_TIME`), the Stripe Price ID, features shown on the plan cards, and `isActive`. |
| `Subscription` | One row per subscribed user, kept in sync by the webhook: status, current period, cancel flag. |
| `Purchase` | One row per one-time payment, created by the webhook. The Stripe PaymentIntent ID is unique, which makes webhook retries harmless. |

To know what a user has, call `getEntitlement(userId)` from `src/lib/billing.ts`. It returns `lifetime`, `subscription` or `free` (lifetime wins when both exist) and is the pattern to copy when gating your own features:

```ts
import { getEntitlement } from "@/lib/billing"

const entitlement = await getEntitlement(session.user.id)
if (entitlement.kind === "free") {
  // show upgrade prompt
}
```

## Subscriptions

The flow: the user picks a plan on `/dashboard/billing`, `POST /api/checkout` validates the price against the `Plan` table and opens Stripe Checkout in `subscription` mode, and the webhook (`/api/webhooks/stripe`) upserts the `Subscription` row when `checkout.session.completed` arrives. Plan changes, cancellations and payment methods are handled by the Stripe Customer Portal (`POST /api/billing/portal`): the kit deliberately ships no in-app proration logic.

A user with a live subscription cannot start a second checkout; the API returns 400 and points them at the portal.

## One-time payments

A plan with `interval: "ONE_TIME"` (the seeded "Lifetime" plan) checks out in `payment` mode instead:

1. `POST /api/checkout` creates the session with `invoice_creation` enabled, so the payment shows up in the invoice history and in the portal like any subscription invoice.
2. On `checkout.session.completed` the webhook creates a `Purchase` row. Replayed events find the existing row and no-op.
3. A confirmation email goes out through Resend (when configured).

Refunds: on `charge.refunded` the webhook marks the purchase `REFUNDED`, which removes the entitlement. Partial refunds keep the purchase intact; only a full refund revokes it.

If a lifetime buyer also has an old subscription, the billing page surfaces it with a hint to cancel it in the portal. The kit does not cancel it automatically; that is a product decision left to you.

## Multiple tiers

The plan cards on `/dashboard/billing` render every active `Plan` row, with a monthly/yearly toggle when both intervals exist and a "Pay once" badge on one-time plans. To change your pricing you edit data, not components: update `prisma/seed.ts` (or the rows directly) and the UI follows.

Next to them sits an optional sales-led card, `src/components/billing/enterprise-card.ts`, which is not a `Plan` row and starts no checkout. It follows the toggle too: set its `yearly` block to show a different figure on the annual side, for instance `$500` "per month" against `$5,000` "per year". Leave `yearly` out and the card reads the same on both sides.

## Usage-based billing

The kit includes a minimal metered example: a `recordUsage()` helper, an inactive "Pay as you go" plan in the seed, and this guide. To turn it on:

1. **Create a Billing Meter** in the Stripe dashboard (Billing → Meters → Create meter). Set the event name to `api_request` (or your own) and the aggregation to Sum.
2. **Create a metered price**: on your product, add a recurring price, choose "Usage-based", and select the meter. Copy the Price ID into `STRIPE_METERED_PRICE_ID`.
3. **Reseed and activate**: run `npm run db:seed`, then set `isActive: true` on the `metered-example` plan (edit the seed or update the row). The plan's `meterEventName` must match the meter's event name.
4. **Report usage** from your server code wherever the billable thing happens:

   ```ts
   import { recordUsage } from "@/lib/usage"

   // e.g. inside a server action or API route
   await recordUsage(session.user.id, "api_request")
   ```

   Pass a unique `identifier` when the caller might retry; Stripe uses it to dedupe meter events. The helper no-ops with a console warning when Stripe is not configured or the user has no Stripe customer yet, so instrumented code is safe everywhere.

Checkout handles metered prices automatically (they are sent without a quantity). Stripe invoices the accumulated usage at the end of each billing period.

## Webhook events

The handler at `/api/webhooks/stripe` processes these events; select them when you create the production endpoint (see [Deployment](./deployment.md)):

- `checkout.session.completed` (subscriptions and one-time payments)
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `charge.refunded`

## Testing locally

With test keys in `.env.local` and the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use card `4242 4242 4242 4242` in checkout. Useful checks: buy the Lifetime plan and confirm the `Purchase` row and the invoice in the billing page; resend the event (`stripe events resend <event_id>`) and confirm nothing duplicates; refund the payment in the dashboard and confirm the plan reverts to Free.

## Without Stripe

Everything degrades gracefully when `STRIPE_SECRET_KEY` is unset: the billing page renders with checkout buttons disabled, the invoice list explains itself, `recordUsage()` no-ops, and `/api/checkout` returns a clear 503. Demo mode (`DEMO_MODE="true"`) disables checkout too, so the public demo can show the billing UI on seeded data without a Stripe account.

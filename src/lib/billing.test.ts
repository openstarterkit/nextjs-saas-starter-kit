import { describe, it, expect, vi } from "vitest"
import type Stripe from "stripe"

// getEntitlement queries the database; importing the module must not construct
// a real client just to read the constant below.
vi.mock("@/lib/prisma", () => ({ prisma: {} }))

const { CHECKOUT_BLOCKING_STATUSES, trialDaysFor, subscriptionDates, describeDiscount } = await import(
  "@/lib/billing"
)

describe("CHECKOUT_BLOCKING_STATUSES", () => {
  it("lists the statuses Stripe still manages", () => {
    expect([...CHECKOUT_BLOCKING_STATUSES]).toEqual(["ACTIVE", "TRIALING", "PAST_DUE", "UNPAID"])
  })

  // These two carry real money consequences, which is why they get their own
  // assertion rather than relying on the list above.
  //
  // CANCELED in the list would leave a user who cancelled unable to subscribe
  // again, since checkout refuses to create a second subscription.
  it("does not block checkout for a cancelled subscription", () => {
    expect(CHECKOUT_BLOCKING_STATUSES).not.toContain("CANCELED")
  })

  // INCOMPLETE means the first payment never went through: the user has to be
  // able to try again, and getEntitlement must not treat that row as paid access.
  it("does not block checkout when the initial payment never completed", () => {
    expect(CHECKOUT_BLOCKING_STATUSES).not.toContain("INCOMPLETE")
  })
})

describe("trialDaysFor", () => {
  const withTrial = { interval: "MONTH" as const, trialDays: 14 }

  it("offers the plan's trial to a customer who has never subscribed", () => {
    expect(trialDaysFor(withTrial, false)).toBe(14)
  })

  // The rule that stops a trial from being free forever: cancel, check out
  // again, get another one. A cancelled row still counts as having subscribed.
  it("offers no trial to a customer who has had a subscription before", () => {
    expect(trialDaysFor(withTrial, true)).toBeNull()
  })

  it("offers no trial on a plan that has none", () => {
    expect(trialDaysFor({ interval: "MONTH", trialDays: null }, false)).toBeNull()
    expect(trialDaysFor({ interval: "YEAR", trialDays: 0 }, false)).toBeNull()
  })

  // A one-time payment has nothing to start later: subscription_data only
  // exists in subscription mode, and Stripe refuses it anywhere else.
  it("never offers a trial on a one-time purchase", () => {
    expect(trialDaysFor({ interval: "ONE_TIME", trialDays: 14 }, false)).toBeNull()
  })
})

describe("subscriptionDates", () => {
  const START = 1_789_000_000
  const END = 1_791_592_000
  const subscription = (trialEnd: number | null) =>
    ({
      trial_end: trialEnd,
      items: { data: [{ current_period_start: START, current_period_end: END }] },
    }) as unknown as Stripe.Subscription

  it("reads the period from the subscription item, in milliseconds", () => {
    const dates = subscriptionDates(subscription(null))
    expect(dates.currentPeriodStart.getTime()).toBe(START * 1000)
    expect(dates.currentPeriodEnd.getTime()).toBe(END * 1000)
  })

  it("has no trial end on a subscription that started without a trial", () => {
    expect(subscriptionDates(subscription(null)).trialEndsAt).toBeNull()
  })

  it("reads the trial end when there is one", () => {
    expect(subscriptionDates(subscription(END)).trialEndsAt?.getTime()).toBe(END * 1000)
  })
})

describe("describeDiscount", () => {
  const END = 1_797_000_000
  const coupon = (fields: Record<string, unknown>) => ({
    object: "coupon",
    percent_off: null,
    amount_off: null,
    currency: null,
    duration: "forever",
    ...fields,
  })
  const discount = (couponOrId: unknown, extra: Record<string, unknown> = {}) =>
    ({
      id: "di_1",
      object: "discount",
      end: null,
      promotion_code: null,
      source: { type: "coupon", coupon: couponOrId },
      ...extra,
    }) as unknown as Stripe.Discount

  it("describes a percentage off, its end, and the code that applied it", () => {
    const summary = describeDiscount(
      discount(coupon({ percent_off: 20, duration: "repeating" }), {
        end: END,
        promotion_code: { object: "promotion_code", code: "LAUNCH20" },
      })
    )
    expect(summary).toEqual({
      percentOff: 20,
      amountOff: null,
      currency: null,
      duration: "repeating",
      endsAt: new Date(END * 1000),
      code: "LAUNCH20",
    })
  })

  it("describes a fixed amount off, with its currency", () => {
    const summary = describeDiscount(discount(coupon({ amount_off: 500, currency: "eur", duration: "once" })))
    expect(summary).toMatchObject({ percentOff: null, amountOff: 500, currency: "eur", duration: "once", code: null })
  })

  // Only what Stripe expanded can be described. Without the expand the page
  // would receive ids, and must show nothing rather than something invented.
  it("leaves out a discount or a coupon that was not expanded", () => {
    expect(describeDiscount("di_1")).toBeNull()
    expect(describeDiscount(discount("co_1"))).toBeNull()
  })

  it("leaves out a coupon it cannot put into words", () => {
    expect(describeDiscount(discount(coupon({})))).toBeNull()
    expect(describeDiscount(discount(coupon({ percent_off: 10, duration: "someday" })))).toBeNull()
  })
})

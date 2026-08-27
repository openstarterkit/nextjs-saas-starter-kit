/**
 * Business metrics derived from subscription rows.
 *
 * These are pure functions over plain shapes rather than Prisma queries: the
 * rules stay testable, and a deployment whose billing model differs can reuse
 * them by mapping its own rows onto the types below.
 */

export type MrrPlan = { price: number; interval: string }

export type MrrSubscription = {
  createdAt: Date
  updatedAt: Date
  status: string
  plan: MrrPlan
}

export type MrrPoint = { date: string; mrr: number }

const DAY = 24 * 60 * 60 * 1000

/**
 * Monthly-equivalent price, in the smallest currency unit. One-time plans are
 * not recurring revenue and count as zero, which is what the MRR figure on the
 * admin page already assumes.
 */
export function monthlyEquivalent(plan: MrrPlan): number {
  if (plan.interval === "MONTH") return plan.price
  if (plan.interval === "YEAR") return Math.round(plan.price / 12)
  return 0
}

/**
 * MRR sampled weekly, oldest point first.
 *
 * A subscription counts at a given moment when it existed by then and had not
 * ended yet. "Had not ended" is the part the schema cannot answer exactly:
 * there is no canceledAt column, so a row that is not ACTIVE today is treated
 * as having ended at updatedAt, which is when its status was last written.
 * That is an approximation and it is worth knowing about: a product that needs
 * exact churn history should record the cancellation date explicitly.
 *
 * The rule is chosen so the last point equals the MRR figure shown next to the
 * chart. At the present moment updatedAt is never in the future, so only ACTIVE
 * rows survive it, which is exactly what that figure counts.
 */
export function mrrHistory(
  subscriptions: MrrSubscription[],
  { weeks = 12, now = new Date() }: { weeks?: number; now?: Date } = {}
): MrrPoint[] {
  const points: MrrPoint[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const at = new Date(now.getTime() - i * 7 * DAY)

    const mrr = subscriptions.reduce((sum, sub) => {
      if (sub.createdAt > at) return sum
      const stillRunning = sub.status === "ACTIVE" || sub.updatedAt > at
      return stillRunning ? sum + monthlyEquivalent(sub.plan) : sum
    }, 0)

    points.push({ date: at.toISOString().slice(0, 10), mrr })
  }

  return points
}

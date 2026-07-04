import Stripe from "stripe"

let _instance: Stripe | null = null

function getInstance(): Stripe {
  if (!_instance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
    _instance = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    })
  }
  return _instance
}

// Lazy proxy — Stripe is only instantiated on first method call (request time, not build time)
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop: PropertyKey) {
    const instance = getInstance()
    const value = instance[prop as keyof Stripe]
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value
  },
})

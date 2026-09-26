import { z } from "zod"

/**
 * Environment validation, checked once when the server boots (see
 * `src/instrumentation.ts`).
 *
 * The point is not to make every variable mandatory: a fresh clone has to run
 * with nothing but a database. The point is to catch the configurations that
 * are **half done**, because those fail silently and late. A Stripe key with
 * no webhook secret takes payments and never records them; a Resend key with
 * no sender address throws on the first email, in production, at the worst
 * possible moment.
 *
 * Set SKIP_ENV_VALIDATION="true" to bypass this (useful in CI steps that only
 * build or lint and have no secrets).
 */

/**
 * `.env.example` ships every unused variable as `VAR=""`, so an empty string
 * has to mean "not configured" and not "configured to nothing". Getting this
 * wrong would break the boot for anyone who copies that file, which is step
 * one of the setup guide.
 */
const blankAsUnset = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema)

const optional = blankAsUnset(z.string().min(1).optional())

/** "true"/"false" flags, unset meaning false. */
const flag = blankAsUnset(z.enum(["true", "false"]).optional())

const prefixed = (prefix: string, label: string) =>
  blankAsUnset(
    z
      .string()
      .min(1)
      .refine((v) => v.startsWith(prefix), { message: `${label} should start with "${prefix}"` })
      .optional(),
  )

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),

    // The only hard requirement: without it nothing can start.
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine((v) => /^postgres(ql)?:\/\//.test(v), {
        message: 'DATABASE_URL should be a postgres connection string (postgresql://...)',
      }),
    DIRECT_URL: optional,

    // Better Auth generates a development secret on the fly, but refuses to run
    // without one in production.
    AUTH_SECRET: optional,

    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    GITHUB_CLIENT_ID: optional,
    GITHUB_CLIENT_SECRET: optional,

    STRIPE_SECRET_KEY: prefixed("sk_", "STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: prefixed("whsec_", "STRIPE_WEBHOOK_SECRET"),
    STRIPE_PRO_PRICE_ID: prefixed("price_", "STRIPE_PRO_PRICE_ID"),
    STRIPE_PRO_YEARLY_PRICE_ID: prefixed("price_", "STRIPE_PRO_YEARLY_PRICE_ID"),
    STRIPE_STARTER_PRICE_ID: prefixed("price_", "STRIPE_STARTER_PRICE_ID"),
    STRIPE_STARTER_YEARLY_PRICE_ID: prefixed("price_", "STRIPE_STARTER_YEARLY_PRICE_ID"),
    STRIPE_METERED_PRICE_ID: prefixed("price_", "STRIPE_METERED_PRICE_ID"),
    STRIPE_LIFETIME_PRICE_ID: prefixed("price_", "STRIPE_LIFETIME_PRICE_ID"),
    // Named after the Checkout parameter it turns on. Off unless "true".
    STRIPE_ALLOW_PROMOTION_CODES: flag,
    // Stripe Tax at checkout (src/lib/stripe-tax.ts). Off unless "true".
    STRIPE_AUTOMATIC_TAX: flag,

    RESEND_API_KEY: prefixed("re_", "RESEND_API_KEY"),
    RESEND_AUDIENCE_ID: optional,
    EMAIL_FROM: optional,

    KIT_SITE: flag,
    DEMO_MODE: flag,
    WAITLIST_ENABLED: flag,

    // Read by the demo reset cron, which refuses to run without it. Not paired
    // with DEMO_MODE on purpose: a demo with no scheduled reset is a working
    // demo, so this is not a half-done configuration worth stopping a boot for.
    CRON_SECRET: optional,

    NEXT_PUBLIC_APP_URL: optional,
    NEXT_PUBLIC_DEMO_URL: optional,
    NEXT_PUBLIC_CONTACT_EMAIL: optional,
  })
  // Pairs that are useless alone. Each of these has a failure mode that only
  // shows up in production, which is why they are worth failing the boot for.
  .superRefine((env, ctx) => {
    const requireTogether = (a: keyof typeof env, b: keyof typeof env, why: string) => {
      if (env[a] && !env[b]) {
        ctx.addIssue({ code: "custom", path: [b], message: `${b} is required when ${a} is set: ${why}` })
      }
    }

    requireTogether(
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "checkout would succeed but no payment would ever be recorded",
    )
    requireTogether("RESEND_API_KEY", "EMAIL_FROM", "every email would fail without a sender address")
    requireTogether("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "the Google sign-in button would break")
    requireTogether("GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_ID", "the Google sign-in button would break")
    requireTogether("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "the GitHub sign-in button would break")
    requireTogether("GITHUB_CLIENT_SECRET", "GITHUB_CLIENT_ID", "the GitHub sign-in button would break")

    if (env.NODE_ENV === "production" && !env.AUTH_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "AUTH_SECRET is required in production: Better Auth refuses to sign sessions without it",
      })
    }
  })

export type Env = z.infer<typeof envSchema>

/** Just what these functions need, so callers and tests can pass a plain object. */
type EnvSource = Record<string, string | undefined>

/**
 * Validates the given environment and returns it typed. Throws with every
 * problem listed at once, rather than one per restart.
 */
export function parseEnv(source: EnvSource = process.env): Env {
  const result = envSchema.safeParse(source)
  if (result.success) return result.data

  const lines = result.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
  throw new Error(`Invalid environment configuration:\n${lines.join("\n")}`)
}

/**
 * Called at boot. A no-op when SKIP_ENV_VALIDATION is set.
 *
 * A clone that has just been installed has no `DATABASE_URL` yet, and in
 * development that is exactly the state the page at `/` exists to explain.
 * Stopping the boot would replace that page with a stack trace at the second
 * command of the guide, so the missing database is reported and the server
 * starts.
 *
 * Everything else still stops the boot: a half-configured Stripe or Resend is
 * the failure this check is for. And in production a missing database stops
 * the boot as it always did.
 */
export function validateEnv(source: EnvSource = process.env): void {
  if (source.SKIP_ENV_VALIDATION === "true") return

  if (source.NODE_ENV !== "production" && !source.DATABASE_URL) {
    // Checked with a placeholder in its place, so every other rule still runs.
    parseEnv({ ...source, DATABASE_URL: "postgresql://unset" })
    console.warn(
      "[env] DATABASE_URL is not set. Starting anyway: open the app and the page lists the steps left (docs/getting-started.md).",
    )
    return
  }

  parseEnv(source)
}

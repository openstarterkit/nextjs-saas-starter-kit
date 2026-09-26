import { describe, it, expect, vi } from "vitest"
import { parseEnv, validateEnv } from "@/lib/env"

const DB = "postgresql://user:pass@localhost:5432/db"
const base = (extra: Record<string, string> = {}) =>
  ({ DATABASE_URL: DB, ...extra })

describe("parseEnv", () => {
  it("accepts the minimum a fresh clone needs: a database and nothing else", () => {
    expect(() => parseEnv(base())).not.toThrow()
  })

  it("rejects a missing or non-postgres DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/)
    expect(() => parseEnv({ DATABASE_URL: "mysql://localhost/db" })).toThrow(
      /postgres/,
    )
  })

  // .env.example ships 31 variables as VAR="". Treating a blank as a value
  // would break the boot for everyone who copies that file to start.
  it('treats VAR="" as not configured, the way .env.example writes it', () => {
    expect(() =>
      parseEnv(
        base({
          GOOGLE_CLIENT_ID: "",
          GOOGLE_CLIENT_SECRET: "",
          STRIPE_SECRET_KEY: "",
          STRIPE_PRO_PRICE_ID: "",
          RESEND_API_KEY: "",
          EMAIL_FROM: "",
          DEMO_MODE: "",
          KIT_SITE: "",
        }),
      ),
    ).not.toThrow()
  })

  it("does not let a blank satisfy a pairing rule", () => {
    // A real key with a blank webhook secret is still half-configured.
    expect(() =>
      parseEnv(base({ STRIPE_SECRET_KEY: "sk_test_1", STRIPE_WEBHOOK_SECRET: "" })),
    ).toThrow(/STRIPE_WEBHOOK_SECRET is required/)
  })

  // A switch that reads "yes" as off would leave someone wondering why the
  // promotion code field never shows up, so anything but true/false stops the boot.
  it("reads STRIPE_ALLOW_PROMOTION_CODES as a true/false switch", () => {
    expect(() => parseEnv(base({ STRIPE_ALLOW_PROMOTION_CODES: "true" }))).not.toThrow()
    expect(() => parseEnv(base({ STRIPE_ALLOW_PROMOTION_CODES: "" }))).not.toThrow()
    expect(() => parseEnv(base({ STRIPE_ALLOW_PROMOTION_CODES: "yes" }))).toThrow(/STRIPE_ALLOW_PROMOTION_CODES/)
  })

  it("reads STRIPE_AUTOMATIC_TAX as a true/false switch", () => {
    expect(() => parseEnv(base({ STRIPE_AUTOMATIC_TAX: "true" }))).not.toThrow()
    expect(() => parseEnv(base({ STRIPE_AUTOMATIC_TAX: "" }))).not.toThrow()
    expect(() => parseEnv(base({ STRIPE_AUTOMATIC_TAX: "on" }))).toThrow(/STRIPE_AUTOMATIC_TAX/)
  })

  it("reports every problem at once, not one per restart", () => {
    let message = ""
    try {
      parseEnv({ DATABASE_URL: "nope", STRIPE_SECRET_KEY: "wrong-prefix" })
    } catch (e) {
      message = (e as Error).message
    }
    expect(message).toMatch(/DATABASE_URL/)
    expect(message).toMatch(/STRIPE_SECRET_KEY/)
  })
})

describe("key formats", () => {
  it("catches a Stripe key pasted from the wrong field", () => {
    expect(() => parseEnv(base({ STRIPE_SECRET_KEY: "pk_test_123" }))).toThrow(/sk_/)
  })

  it("catches a webhook secret that is not one", () => {
    expect(() =>
      parseEnv(base({ STRIPE_SECRET_KEY: "sk_test_1", STRIPE_WEBHOOK_SECRET: "sk_test_2" })),
    ).toThrow(/whsec_/)
  })

  it("catches a price id that is a product id", () => {
    expect(() => parseEnv(base({ STRIPE_PRO_PRICE_ID: "prod_123" }))).toThrow(/price_/)
  })

  it("accepts correctly prefixed keys", () => {
    expect(() =>
      parseEnv(
        base({
          STRIPE_SECRET_KEY: "sk_test_1",
          STRIPE_WEBHOOK_SECRET: "whsec_1",
          STRIPE_PRO_PRICE_ID: "price_1",
          RESEND_API_KEY: "re_1",
          EMAIL_FROM: "hello@example.com",
        }),
      ),
    ).not.toThrow()
  })
})

// These are the configurations that look fine and break in production.
describe("half-configured integrations", () => {
  it("refuses a Stripe key without a webhook secret", () => {
    expect(() => parseEnv(base({ STRIPE_SECRET_KEY: "sk_test_1" }))).toThrow(
      /STRIPE_WEBHOOK_SECRET is required/,
    )
  })

  it("explains why, so the message is actionable", () => {
    expect(() => parseEnv(base({ STRIPE_SECRET_KEY: "sk_test_1" }))).toThrow(
      /no payment would ever be recorded/,
    )
  })

  it("refuses a Resend key without a sender address", () => {
    expect(() => parseEnv(base({ RESEND_API_KEY: "re_1" }))).toThrow(/EMAIL_FROM is required/)
  })

  it("refuses half an OAuth pair, in either direction", () => {
    expect(() => parseEnv(base({ GOOGLE_CLIENT_ID: "id" }))).toThrow(/GOOGLE_CLIENT_SECRET/)
    expect(() => parseEnv(base({ GOOGLE_CLIENT_SECRET: "secret" }))).toThrow(/GOOGLE_CLIENT_ID/)
    expect(() => parseEnv(base({ GITHUB_CLIENT_ID: "id" }))).toThrow(/GITHUB_CLIENT_SECRET/)
  })

  it("accepts a complete OAuth pair", () => {
    expect(() =>
      parseEnv(base({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" })),
    ).not.toThrow()
  })
})

describe("production-only rules", () => {
  it("requires AUTH_SECRET in production", () => {
    expect(() => parseEnv(base({ NODE_ENV: "production" }))).toThrow(/AUTH_SECRET is required/)
  })

  it("does not require it in development, where Better Auth generates one", () => {
    expect(() => parseEnv(base({ NODE_ENV: "development" }))).not.toThrow()
  })
})

describe("flags", () => {
  it('accepts only "true" and "false"', () => {
    expect(() => parseEnv(base({ DEMO_MODE: "true" }))).not.toThrow()
    expect(() => parseEnv(base({ DEMO_MODE: "false" }))).not.toThrow()
    expect(() => parseEnv(base({ DEMO_MODE: "1" }))).toThrow(/DEMO_MODE/)
    expect(() => parseEnv(base({ KIT_SITE: "yes" }))).toThrow(/KIT_SITE/)
  })
})

describe("validateEnv", () => {
  it("throws on an invalid environment", () => {
    expect(() => validateEnv(base({ STRIPE_SECRET_KEY: "sk_test_x" }))).toThrow()
  })

  it("is a no-op when SKIP_ENV_VALIDATION is set, for CI steps with no secrets", () => {
    expect(() => validateEnv({ SKIP_ENV_VALIDATION: "true" })).not.toThrow()
  })

  /**
   * The second command of the guide is `npm run dev`, before there is any
   * database: the page that lists the steps left cannot appear if the boot
   * stops first. It is the one exception, and only outside production.
   */
  it("starts in development without a database, and says which step is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(() => validateEnv({ NODE_ENV: "development" })).not.toThrow()
    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.calls[0][0])).toContain("DATABASE_URL")
    warn.mockRestore()
  })

  it("still stops the boot in production without a database", () => {
    expect(() => validateEnv({ NODE_ENV: "production" })).toThrow(/DATABASE_URL/)
  })

  it("still stops the boot for a half-configured service, database or not", () => {
    expect(() =>
      validateEnv({ NODE_ENV: "development", STRIPE_SECRET_KEY: "sk_test_x" }),
    ).toThrow(/STRIPE_WEBHOOK_SECRET/)
  })
})

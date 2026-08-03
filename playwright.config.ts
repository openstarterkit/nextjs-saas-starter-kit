import { defineConfig, devices } from "@playwright/test"

/**
 * End-to-end tests for the two flows that cost money when they break: signing
 * up and starting a checkout.
 *
 * These are not part of `npm test`, and not part of CI. They need a real
 * database and a browser binary, which a clone should not be forced to install
 * to run the unit suite. Run them yourself with:
 *
 *   npx playwright install chromium   # once, ~115 MB
 *   npm run test:e2e
 *
 * Chromium only, on purpose: three engines mean three downloads and three
 * times the flakes, for a kit whose UI is plain HTML and Tailwind.
 *
 * Nothing here sends email or takes a payment. The server is started with the
 * Resend key blanked and stops at the handoff to Stripe, so the suite is safe
 * to run as often as you like.
 */
export default defineConfig({
  testDir: "./e2e",
  // Signing up is the flow under test, so each run creates real accounts.
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "line" : "list",
  timeout: 30_000,

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 3100",
        url: "http://localhost:3100",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          // A demo deployment rejects sign-ups by design, so with this on the
          // tests would assert nothing.
          DEMO_MODE: "false",
          // Deliberately blank. With a Resend key present, registering sends a
          // magic link and stops at "check your inbox" instead of signing in,
          // so the suite would both fail and mail a real address on every run.
          // Blank makes the kit sign the user straight in, which is the path
          // these tests are about.
          RESEND_API_KEY: "",
        },
      },
})

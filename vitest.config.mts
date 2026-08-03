import { defineConfig } from "vitest/config"
import path from "node:path"

/**
 * Unit tests for the pure logic in src/lib: the rate limiter, the Markdown
 * parsers behind the blog, docs and changelog, and the small helpers.
 *
 * Deliberately out of scope: anything that talks to an external service
 * (prisma.ts, stripe.ts, email.ts). Those need integration tests with a real
 * client, not unit tests against a mock that only proves the mock works.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html"],
      // Coverage is reported over src/lib, the layer these tests are about.
      // Measuring it over all of src/ would mix in React components and route
      // handlers that unit tests were never meant to cover, and produce a
      // number that says nothing about either.
      include: ["src/lib/**/*.ts"],
      // Thin wrappers around external services: covering them means asserting
      // against a mock of Prisma, Stripe or Resend, which proves the mock works.
      exclude: ["src/lib/prisma.ts", "src/lib/stripe.ts", "src/lib/email.ts"],
    },
  },
  resolve: {
    // import.meta.dirname, not __dirname: this config is ESM and Vite's native
    // loader (the coming default) rejects the CommonJS global.
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
})

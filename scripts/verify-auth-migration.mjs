#!/usr/bin/env node
/**
 * Checks that every account row can actually be found at sign-in.
 *
 *   node --env-file=.env scripts/verify-auth-migration.mjs
 *
 * Run it after migrating to 2.0, and again after the 2.0.2 repair migration.
 * Read-only: it never writes to your database.
 *
 * WHY THIS EXISTS
 *
 * Better Auth finds an account by the pair (issuer, accountId), with no
 * fallback on providerId. A row whose issuer is wrong is not an error, is not
 * a warning, and does not fail a schema check: it is simply never found. The
 * user is told their account is not linked, or gets a second account, and the
 * database looks perfectly healthy from the outside.
 *
 * So this script does not compare your data against a value written here. It
 * asks the library what the issuer should be — `provider.accountIssuer` for a
 * provider that declares one, `createOAuthAccountIssuer()` for one that does
 * not — and compares that with what is stored. A check that compares your
 * database against a string typed by hand can only confirm the assumption
 * that produced the string.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { socialProviders } from "better-auth/social-providers"
import { createOAuthAccountIssuer, createLocalAccountIssuer } from "better-auth/db"

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run with: node --env-file=.env scripts/verify-auth-migration.mjs")
  process.exit(2)
}

// Same driver adapter as src/lib/prisma.ts: Prisma 7 has no built-in engine.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

/**
 * Options with values nothing would ever use, to find out whether a provider's
 * issuer is a fixed property of the provider or something you configure.
 */
const PROBE = {
  clientId: "-",
  clientSecret: "-",
  issuer: "https://probe.invalid",
  domain: "probe.invalid",
  region: "probe-1",
  userPoolId: "probe",
  tenantId: "probe",
}

/**
 * What the library would store for this provider.
 *
 * The issuer is decided by the provider definition and not by the account, so
 * placeholder credentials are enough to read it — but only if the value does
 * not move when the options move. It does for some providers: Paybin defaults
 * to `https://idp.paybin.io` and takes an `issuer` option that replaces it, so
 * reading the default and calling it "expected" would produce exactly the kind
 * of confident wrong answer this script exists to catch. So the provider is
 * built twice, and a value that changes between the two is reported as one
 * this check cannot decide rather than guessed at.
 */
function expectedIssuer(providerId) {
  const factory = socialProviders[providerId]
  if (!factory) {
    return { kind: "unknown", reason: "not a built-in provider (generic-oauth, or an id of your own)" }
  }

  const build = (options) => {
    try {
      return { ok: true, issuer: factory(options).accountIssuer }
    } catch {
      // Cognito refuses to be built without a region and a user pool, and
      // those are exactly what its issuer is made of.
      return { ok: false }
    }
  }

  const plain = build({ clientId: "-", clientSecret: "-" })
  const probed = build(PROBE)

  if (!plain.ok || !probed.ok) {
    return { kind: "dynamic", reason: "issuer depends on options this check cannot supply" }
  }
  // Order matters: two builds return two different function objects, so the
  // comparison below would report a function as "configurable" and say the
  // less useful of the two true things.
  if (typeof plain.issuer === "function") {
    return { kind: "dynamic", reason: "issuer is computed at runtime from the token" }
  }
  if (plain.issuer !== probed.issuer) {
    return { kind: "dynamic", reason: "issuer is configurable, so the default is not authoritative" }
  }
  if (typeof plain.issuer === "string") return { kind: "exact", issuer: plain.issuer }

  // Declares nothing: the library falls back to the synthetic namespace.
  return { kind: "exact", issuer: createOAuthAccountIssuer(providerId) }
}

const rows = await prisma.account.groupBy({
  by: ["providerId", "issuer"],
  _count: { _all: true },
  orderBy: [{ providerId: "asc" }, { issuer: "asc" }],
})

if (rows.length === 0) {
  console.log("\nNo account rows. Nothing to verify.\n")
  await prisma.$disconnect()
  process.exit(0)
}

const credentialIssuer = createLocalAccountIssuer("credential")
const findings = []

console.log("\nAccount identities\n")
for (const { providerId, issuer, _count } of rows) {
  const count = _count._all
  let verdict

  if (providerId === "credential") {
    const ok = issuer === credentialIssuer
    verdict = ok ? "OK" : "WRONG"
    if (!ok) {
      findings.push(
        `credential accounts have issuer "${issuer}", expected "${credentialIssuer}". Password sign-in will fail`,
      )
    }
  } else {
    const expected = expectedIssuer(providerId)
    if (expected.kind === "exact") {
      const ok = issuer === expected.issuer
      verdict = ok ? "OK" : `WRONG, expected "${expected.issuer}"`
      if (!ok) {
        findings.push(
          `${count} ${providerId} account(s) have issuer "${issuer}", expected "${expected.issuer}". These sign-ins will not be recognised`,
        )
      }
    } else {
      verdict = `CHECK BY HAND (${expected.reason})`
      findings.push(
        `${count} ${providerId} account(s) could not be checked: ${expected.reason}. Compare "${issuer}" with what your provider issues.`,
      )
    }
  }

  console.log(`  ${String(count).padStart(5)}  ${providerId.padEnd(14)} ${issuer.padEnd(34)} ${verdict}`)
}

// A credential row is only usable when accountId is the user's own id: the
// three fields go together, and a row missing one of them is present and
// useless.
const brokenCredentials = await prisma.$queryRaw`
  SELECT count(*)::int AS n FROM "Account"
  WHERE "providerId" = 'credential' AND "accountId" <> "userId"
`
if (brokenCredentials[0].n > 0) {
  findings.push(
    `${brokenCredentials[0].n} credential account(s) have an accountId that is not the user id. Password sign-in will fail for them`,
  )
}

await prisma.$disconnect()

if (findings.length === 0) {
  console.log("\nEvery account identity matches what the library would look up.\n")
  process.exit(0)
}

console.log("\nFindings\n")
for (const f of findings) console.log(`  - ${f}`)
console.log("\nSee docs/upgrading.md, section \"Repairing the OAuth issuer\".\n")
process.exit(1)

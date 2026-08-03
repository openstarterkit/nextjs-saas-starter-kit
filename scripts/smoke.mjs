#!/usr/bin/env node
/**
 * Release smoke test: checks a running deployment from the outside.
 *
 *   node scripts/smoke.mjs https://your-app.com
 *   node scripts/smoke.mjs https://your-app.com --expect-version 1.4.0
 *   node scripts/smoke.mjs http://localhost:3000 --skip-seo
 *
 * Read-only by design. Every request here is a GET that a crawler could make
 * anyway, so it is safe to run against production as often as you like. The
 * flows that write something (contact form, waitlist signup) send real email
 * and are therefore left to the manual checklist: a smoke test that mails
 * someone on every run is a smoke test nobody runs.
 *
 * Exits non-zero on the first failed expectation, so CI or a release script
 * can gate on it.
 */

const args = process.argv.slice(2)
const baseUrl = (args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "")
const expectVersion = args.includes("--expect-version")
  ? args[args.indexOf("--expect-version") + 1]
  : null
const skipSeo = args.includes("--skip-seo")

const results = []
let failed = 0

async function check(name, fn) {
  try {
    const detail = await fn()
    results.push({ ok: true, name, detail })
  } catch (error) {
    failed++
    results.push({ ok: false, name, detail: error.message })
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

async function get(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options })
  return response
}

// --- identity -------------------------------------------------------------

let health = null

await check("/api/health responds with the running version", async () => {
  const response = await get("/api/health")
  expect(response.status === 200, `expected 200, got ${response.status}`)
  health = await response.json()
  expect(health.status === "ok", `status is "${health.status}"`)
  expect(Boolean(health.version), "no version reported")
  return `v${health.version}${health.commit ? ` @ ${health.commit}` : ""} (${health.environment})`
})

// The check that would have caught the deploy that silently kept serving the
// previous build: the site answered fine, it was just the wrong build.
if (expectVersion) {
  await check(`serves the version being released (${expectVersion})`, () => {
    expect(health, "health endpoint did not answer, cannot compare versions")
    expect(
      health.version === expectVersion,
      `deployment serves ${health.version}, expected ${expectVersion}`,
    )
    return "match"
  })
}

// --- public pages ---------------------------------------------------------

await check("home page renders", async () => {
  const response = await get("/")
  expect(response.status === 200, `expected 200, got ${response.status}`)
  return "200"
})

await check("blog index renders", async () => {
  const response = await get("/blog")
  expect(response.status === 200, `expected 200, got ${response.status}`)
  return "200"
})

await check("blog feed is valid XML with at least one item", async () => {
  const response = await get("/blog/rss.xml")
  expect(response.status === 200, `expected 200, got ${response.status}`)
  const body = await response.text()
  expect(body.includes("<rss"), "body is not an RSS document")
  expect(body.includes("<item>"), "feed has no items")
  return `${body.split("<item>").length - 1} item(s)`
})

// Reads the first post out of the feed instead of hardcoding a slug, so the
// check survives the example posts being replaced.
await check("a single blog post renders", async () => {
  const feed = await (await get("/blog/rss.xml")).text()
  const link = /<link>([^<]*\/blog\/[^<]+)<\/link>/.exec(feed)?.[1]
  expect(link, "could not find a post link in the feed")
  const path = new URL(link).pathname
  const response = await get(path)
  expect(response.status === 200, `${path} returned ${response.status}`)
  return path
})

// --- SEO surfaces ---------------------------------------------------------

// A demo deployment is deliberately not indexed: empty sitemap, no Sitemap:
// line, noindex on the pages. Rather than skipping these checks there, we
// assert the opposite, so a demo that starts advertising itself to search
// engines fails the smoke just like a production site that stops.
const isDemo = health?.demo === true

if (!skipSeo && !isDemo) {
  await check("robots.txt is plain text and points at the sitemap", async () => {
    const response = await get("/robots.txt")
    expect(response.status === 200, `expected 200, got ${response.status}`)
    expect(
      response.headers.get("content-type")?.includes("text/plain"),
      `content-type is ${response.headers.get("content-type")}`,
    )
    const body = await response.text()
    expect(/^Sitemap:\s*https?:\/\/\S+/m.test(body), "no Sitemap: line")
    return "200 text/plain, sitemap declared"
  })

  await check("sitemap.xml lists at least one url", async () => {
    const response = await get("/sitemap.xml")
    expect(response.status === 200, `expected 200, got ${response.status}`)
    const body = await response.text()
    expect(body.includes("<urlset"), "body is not a sitemap")
    expect(body.includes("<loc>"), "sitemap has no urls")
    return `${body.split("<loc>").length - 1} url(s)`
  })
} else if (isDemo) {
  await check("demo stays out of search results", async () => {
    const home = await (await get("/")).text()
    expect(/<meta[^>]+name="robots"[^>]+noindex/i.test(home), "home page has no noindex")

    const sitemap = await (await get("/sitemap.xml")).text()
    expect(!sitemap.includes("<loc>"), "sitemap is not empty")

    const robots = await (await get("/robots.txt")).text()
    expect(!/^Sitemap:/m.test(robots), "robots.txt still declares a sitemap")
    return "noindex, empty sitemap, no Sitemap: line"
  })
}

if (!skipSeo) {
  await check("llms.txt is plain text with a heading", async () => {
    const response = await get("/llms.txt")
    expect(response.status === 200, `expected 200, got ${response.status}`)
    expect(
      response.headers.get("content-type")?.includes("text/plain"),
      `content-type is ${response.headers.get("content-type")}`,
    )
    const body = await response.text()
    expect(/^#\s+\S/m.test(body), "no H1 heading")
    return "200 text/plain"
  })
}

// --- routing guards -------------------------------------------------------

// Regression guard: the proxy used an allowlist, so any unknown path was
// treated as private and redirected instead of returning a 404.
await check("an unknown route is a 404, not a redirect", async () => {
  const response = await get(`/this-route-does-not-exist-${Date.now()}`)
  expect(response.status === 404, `expected 404, got ${response.status}`)
  return "404"
})

// Regression guard: the dashboard must stay behind auth.
await check("/dashboard redirects an anonymous visitor to sign in", async () => {
  const response = await get("/dashboard")
  expect(
    response.status === 307 || response.status === 302,
    `expected a redirect, got ${response.status}`,
  )
  const location = response.headers.get("location") ?? ""
  expect(location.includes("/login"), `redirects to "${location}" instead of /login`)
  return `${response.status} → /login`
})

// --- report ---------------------------------------------------------------

console.log(`\nSmoke test: ${baseUrl}\n`)
for (const { ok, name, detail } of results) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `: ${detail}` : ""}`)
}

const passed = results.length - failed
console.log(`\n${passed}/${results.length} checks passed\n`)

if (failed > 0) process.exit(1)

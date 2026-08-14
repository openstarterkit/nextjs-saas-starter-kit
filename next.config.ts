import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points next-intl at the request config that loads the message files.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Security headers applied to every route. These are safe, high-value defaults
// for an auth + payments app. A full Content-Security-Policy is intentionally
// NOT set here: a strict CSP must be tuned per deployment (Stripe, OAuth
// redirects, the inline dark-mode script) and a wrong one silently breaks the
// app — so we leave it for you to add deliberately rather than ship a broken one.
const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains. Browsers ignore this over
  // plain HTTP, so it's harmless in local dev.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Don't let the browser MIME-sniff responses away from their declared type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Anti-clickjacking: this app should never be framed by another site.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Send only the origin on cross-origin navigations (no full path/query leak).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Drop browser features we don't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The /docs pages render the repo's docs/*.md at request time (the navbar
  // session check makes them dynamic), so the files must ship with the
  // serverless bundle.
  // NOTE: these keys are route paths, so they carry the `[locale]` segment
  // since the public pages moved under it. Getting them wrong does not fail
  // the build: the readers treat a missing folder as "no content", so the docs
  // and the blog would come back *empty* in production instead of erroring.
  outputFileTracingIncludes: {
    "/[locale]/docs/[slug]": ["./docs/**"],
    // Same story for the blog: posts and cover art are read from content/ at
    // request time. Without this they never reach the serverless bundle.
    "/[locale]/blog": ["./content/blog/**"],
    "/[locale]/blog/**": ["./content/blog/**"],
    // Not localized: these two live outside `[locale]`.
    "/sitemap.xml": ["./content/blog/**"],
    "/llms.txt": ["./content/blog/**"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);

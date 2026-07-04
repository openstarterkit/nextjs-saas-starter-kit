import type { NextConfig } from "next";

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

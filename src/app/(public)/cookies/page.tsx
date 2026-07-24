import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

export const metadata = {
  title: `Cookie Policy | ${siteConfig.name}`,
}

// ⚠️ Placeholder page: this is a structural template, NOT legal advice.
// It reflects what the kit does out of the box (technical cookies only) —
// update it if you add analytics or any third-party tracking, and have it
// reviewed for your jurisdiction before going to production.
export default function CookiesPage() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Cookie Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
            <p className="font-medium text-foreground">This is a placeholder.</p>
            <p className="mt-1">
              It describes what this {isKitSite ? "starter kit" : "app"} stores out of the box. If
              you add analytics or any third-party tracking, update this page accordingly.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">1. What we store</h2>
            <p>
              We only use <strong className="text-foreground">technical cookies</strong>, strictly
              necessary to operate the service: a session cookie that keeps you signed in. It is
              set only when you sign in and removed when you sign out.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">2. Local storage</h2>
            <p>
              Your theme preference (light/dark mode) is saved in your browser&apos;s local
              storage. It never leaves your device and contains no personal data.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">3. No tracking</h2>
            <p>
              We do not use advertising, profiling, or third-party tracking cookies. Because we
              only use cookies that are strictly necessary, no consent banner is required.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">4. Questions</h2>
            <p>
              Anything unclear? Write to{" "}
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-foreground underline underline-offset-4">
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

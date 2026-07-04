import { siteConfig } from "@/config/site"

export const metadata = {
  title: `Privacy Policy — ${siteConfig.name}`,
}

// ⚠️ Placeholder page: this is a structural template, NOT legal advice.
// Before going to production, replace it with a policy that reflects what
// your app actually collects and have it reviewed for your jurisdiction.
export default function PrivacyPage() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
            <p className="font-medium text-foreground">This is a placeholder.</p>
            <p className="mt-1">
              It outlines the sections a SaaS privacy policy typically needs, based on what this
              starter kit does out of the box. Adapt it to your product and your jurisdiction
              before launch.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">1. Data we collect</h2>
            <p>
              When you sign in with Google or GitHub, we receive your name, email address, and
              profile picture. When you subscribe, payments are processed by Stripe — we never
              see or store your card details. We also store the content you create in the app
              (e.g. projects).
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">2. How we use it</h2>
            <p>
              To operate your account, process subscriptions, and send transactional emails
              (welcome, billing confirmations). We do not sell your data or use it for
              advertising.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">3. Third parties</h2>
            <p>
              Data is processed by our infrastructure providers: hosting, database, Stripe
              (payments), and Resend (emails). Each processes data under their own privacy
              terms.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">4. Your rights</h2>
            <p>
              You can request access to, correction of, or deletion of your personal data at any
              time by contacting us at{" "}
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

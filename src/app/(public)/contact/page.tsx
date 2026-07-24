import type { Metadata } from "next"
import { ContactForm } from "@/components/landing/contact-form"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

export const metadata: Metadata = {
  title: `Contact | ${siteConfig.name}`,
  description: `Questions, feedback or ideas? Get in touch with the ${siteConfig.name} team.`,
}

export default function ContactPage() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Get in touch</h1>
        <p className="mt-4 text-muted-foreground">
          Questions, feedback, ideas: we read everything and reply fast. Prefer email? Write to{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-primary hover:underline">
            {siteConfig.contactEmail}
          </a>
          .
        </p>

        {/* On the kit's own site the page stays reachable (old links, the
            sitemap of a past crawl) but carries no form: email is the only
            channel, so no personal data ever flows through the site and the
            privacy policy can stay waitlist-only. */}
        {!isKitSite && (
          <div className="mt-10">
            <ContactForm disabled={process.env.DEMO_MODE === "true"} />
            {process.env.DEMO_MODE === "true" && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Forms are disabled in the live demo.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

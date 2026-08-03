import type { Metadata } from "next"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

export const metadata: Metadata = {
  title: `About | ${siteConfig.name}`,
  description: `What ${siteConfig.name} is, who it is for, and the principles behind it.`,
}

/**
 * On the kit's own site this is the real page. In your clone it is a
 * structural scaffold: the copy below is a draft that reads as finished, so
 * the layout holds while you write your own. Replace the text, drop the
 * dashed note, and nothing else needs touching.
 */
const copy = isKitSite
  ? {
      note: null,
      what: "A complete starting point for a SaaS, not a demo of one. Authentication with OAuth, magic links and passwords. Stripe subscriptions, one-time payments and webhooks whose signature is verified before anything reaches the database. An admin panel with real revenue figures, transactional email, a file-based blog and the marketing site around it. It is the plumbing every product needs and nobody enjoys writing twice, in a codebase small enough to read in an afternoon and yours to change.",
      who: "People shipping on their own or in a small team, who would rather spend the weekend on the part that makes their product different than on wiring a checkout for the tenth time. It assumes you know Next.js, and that you would rather own the code than rent a platform.",
      principles: [
        "Own your stack: no vendor lock-in, your data in your database.",
        "Payments belong in the free tier, not behind a paywall.",
        "Honest by default: real features, no smoke and mirrors.",
        "Nothing is held back to sell later: what the kit does, it does for free.",
      ],
      maintainer: {
        name: "Michele Canini",
        url: "https://michelecanini.dev",
      },
    }
  : {
      note: {
        title: "This is a placeholder.",
        body: "Tell your story here: what you are building, who it is for, and why it exists.",
      },
      what: "One place for the work your team does every day: projects, the people involved, and the billing that keeps it running. No tab juggling, no spreadsheet of record.",
      who: "Small teams who would rather spend the afternoon on the work itself than on the tools around it.",
      principles: [
        "Your data is yours: take it with you whenever you want.",
        "Clear pricing, no surprises on the invoice.",
        "Honest by default: real features, no smoke and mirrors.",
      ],
      maintainer: null,
    }

export default function AboutPage() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          About {siteConfig.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{siteConfig.description}</p>

        <div className="mt-12 space-y-8 leading-7 text-muted-foreground">
          {copy.note && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm">
              <p className="font-medium text-foreground">{copy.note.title}</p>
              <p className="mt-1">
                {copy.note.body} Edit this page in{" "}
                <code>src/app/(public)/about/page.tsx</code>.
              </p>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">What it is</h2>
            <p>{copy.what}</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Who it is for</h2>
            <p>{copy.who}</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Principles</h2>
            <ul className="list-disc space-y-1 pl-5">
              {copy.principles.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          {copy.maintainer && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">Who builds it</h2>
              <p>
                {siteConfig.name} is created and maintained by{" "}
                <a
                  href={copy.maintainer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                >
                  {copy.maintainer.name}
                </a>
                . One person, working in the open: the roadmap says what is coming, the changelog
                says what already shipped, and every release is a tag you can read. Issues and
                questions are answered by the person who wrote the code.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

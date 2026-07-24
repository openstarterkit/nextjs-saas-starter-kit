import type { Metadata } from "next"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

export const metadata: Metadata = {
  title: `About | ${siteConfig.name}`,
  description: `What ${siteConfig.name} is, who it is for, and the principles behind it.`,
}

/**
 * Placeholder marketing page: a structural scaffold you fill with your story.
 * Both branches below are drafts, so the section reads as finished while the
 * real copy is still being written. Replace the text, drop the dashed note,
 * and the layout stays as it is.
 */
const copy = isKitSite
  ? {
      note: {
        title: "Work in progress.",
        body: "The long version of how this kit came together is still being written. Here is the short one.",
      },
      what: "A production-ready SaaS foundation: authentication, payments, an admin panel, transactional emails and a polished marketing site, ready to make your own.",
      who: "Founders and developers who want to ship a real product this weekend instead of wiring the same plumbing for the tenth time.",
      principles: [
        "Own your stack: no vendor lock-in, your data in your database.",
        "Payments belong in the free tier, not behind a paywall.",
        "Honest by default: real features, no smoke and mirrors.",
      ],
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
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm">
            <p className="font-medium text-foreground">{copy.note.title}</p>
            <p className="mt-1">
              {copy.note.body}
              {!isKitSite && (
                <>
                  {" "}
                  Edit this page in <code>src/app/(public)/about/page.tsx</code>.
                </>
              )}
            </p>
          </div>

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
        </div>
      </div>
    </section>
  )
}

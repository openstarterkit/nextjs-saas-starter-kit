import Link from "next/link"
import type { Metadata } from "next"
import { DOCS } from "@/lib/docs"
import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"

export const metadata: Metadata = {
  title: `Documentation | ${siteConfig.name}`,
  description: `Guides for ${siteConfig.name}: getting started, configuration, authentication and deployment.`,
}

export default function DocsIndexPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Documentation</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {isKitSite ? (
          <>
            Everything you need to go from{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm">git clone</code> to production.
            The same guides live in the repo&apos;s{" "}
            {siteConfig.links.github ? (
              <a
                href={`${siteConfig.links.github}/tree/main/docs`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                docs/ folder
              </a>
            ) : (
              <span className="font-medium text-foreground">docs/ folder</span>
            )}
            , so they version with the code.
          </>
        ) : (
          <>
            Guides for getting the most out of {siteConfig.name}. Each one is a Markdown file in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm">content/docs/</code>, so your
            documentation ships and versions with your app.
          </>
        )}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {DOCS.map((d) => (
          <Link
            key={d.slug}
            href={`/docs/${d.slug}`}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
          >
            <h2 className="font-semibold text-foreground transition-colors group-hover:text-primary">
              {d.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

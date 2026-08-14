import { getLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { getDocs } from "@/lib/docs"
import { Link } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import { localeAlternates } from "@/i18n/alternates"
import { siteConfig } from "@/config/site"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "docs" })
  return {
    title: `${t("title")} | ${siteConfig.name}`,
    description: t("metaDescription", { site: siteConfig.name }),
    // This page's own copy lives in the message files, so it is translated
    // wherever a message file exists: the index is the one docs page that is
    // never a fallback.
    alternates: localeAlternates("/docs", locale, routing.locales),
  }
}

export default async function DocsIndexPage() {
  const [t, locale] = await Promise.all([getTranslations("docs"), getLocale()])
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
      {/* One key, two variants, resolved at build by `collapseMessages`. The
          branch used to be a ternary over two sibling keys, which meant a
          clone shipped the kit's own wording inside its HTML for a paragraph
          it can never render. */}
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t.rich("intro", {
          site: () => siteConfig.name,
          code: (c) => <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{c}</code>,
          repo: (c) =>
            siteConfig.links.github ? (
              <a
                href={`${siteConfig.links.github}/tree/main/docs`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {c}
              </a>
            ) : (
              <span className="font-medium text-foreground">{c}</span>
            ),
        })}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {getDocs(locale).map((d) => (
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

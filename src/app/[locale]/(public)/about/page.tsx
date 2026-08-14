import type { Metadata } from "next"
import { siteConfig } from "@/config/site"
import { useTranslations } from "next-intl"
import { isKitSite } from "@/config/kit"

export const metadata: Metadata = {
  title: `About | ${siteConfig.name}`,
  description: `What ${siteConfig.name} is, who it is for, and the principles behind it.`,
}

/**
 * On the kit's own site this is the real page. In your clone it is a
 * structural scaffold: the copy under `about.product` in the message files is
 * a draft that reads as finished, so the layout holds while you write your
 * own. Replace the text there, and the dashed note disappears on its own once
 * KIT_SITE is set.
 */
export default function AboutPage() {
  const t = useTranslations("about")
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title", { site: siteConfig.name })}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{siteConfig.description}</p>

        <div className="mt-12 space-y-8 leading-7 text-muted-foreground">
          {!isKitSite && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm">
              <p className="font-medium text-foreground">{t("noteTitle")}</p>
              <p className="mt-1">
                {t.rich("noteBody", { path: (c) => <code>{c}</code> })}
              </p>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">{t("whatTitle")}</h2>
            <p>{t("what")}</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">{t("whoTitle")}</h2>
            <p>{t("who")}</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">{t("principlesTitle")}</h2>
            <ul className="list-disc space-y-1 pl-5">
              {t.raw("principles").map((p: string) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          {siteConfig.maintainer.name && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">{t("maintainerTitle")}</h2>
              <p>
                {t("maintainerIntro", { site: siteConfig.name })}{" "}
                {siteConfig.maintainer.url ? (
                  <a
                    href={siteConfig.maintainer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                  >
                    {siteConfig.maintainer.name}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{siteConfig.maintainer.name}</span>
                )}
                {t("maintainerBody")}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

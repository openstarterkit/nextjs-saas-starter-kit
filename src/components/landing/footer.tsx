import Link from "next/link"
import { GithubIcon } from "@/components/icons/github"
import { PoweredBy } from "@/components/powered-by"
import { ContactDialog } from "@/components/landing/contact-dialog"
import { Logo } from "@/components/logo"
import { LogoLink } from "@/components/landing/logo-link"
import { siteConfig } from "@/config/site"
import { useTranslations } from "next-intl"
import { isKitSite } from "@/config/kit"

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

export function Footer() {
  const t = useTranslations("footer")
  const orgUrl = siteConfig.links.githubOrg ?? siteConfig.links.github
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between md:gap-8">
          <div>
            <LogoLink className="flex items-center gap-2">
              <Logo wordmarkClassName="text-base font-bold" />
            </LogoLink>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {isKitSite ? t("blurb", { tagline: siteConfig.tagline }) : siteConfig.description}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {orgUrl && (
                <a
                  href={orgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("github")}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <GithubIcon />
                </a>
              )}
              {siteConfig.links.x && (
                <a
                  href={siteConfig.links.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X / Twitter"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <XIcon />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">{t("product")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {/* `/#` instead of bare `#`: the footer renders on every public
                  page, but the sections only exist on the home page. */}
              <li><Link href="/#features" className="transition-colors hover:text-foreground">{t("features")}</Link></li>
              <li><Link href="/#pricing" className="transition-colors hover:text-foreground">{t("pricing")}</Link></li>
              <li><Link href="/docs" className="transition-colors hover:text-foreground">{t("docs")}</Link></li>
              <li><Link href="/blog" className="transition-colors hover:text-foreground">{t("blog")}</Link></li>
              <li><Link href="/changelog" className="transition-colors hover:text-foreground">{t("changelog")}</Link></li>
              <li>
                <Link href={siteConfig.links.demo ?? "/login"} className="transition-colors hover:text-foreground">
                  Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">{t("about")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="transition-colors hover:text-foreground">{t("aboutLink")}</Link></li>
              <li><Link href="/#faq" className="transition-colors hover:text-foreground">{t("faq")}</Link></li>
              <li>
                {/* The kit's own site collects nothing through the site: its
                    contact is the copyable-email dialog, as it was before the
                    contact form existed, so the waitlist stays the only data
                    the privacy policy has to cover. Your app links the form. */}
                {isKitSite ? (
                  <ContactDialog
                    trigger={
                      <button type="button" className="transition-colors hover:text-foreground">
                        {t("contact")}
                      </button>
                    }
                  />
                ) : (
                  <Link href="/contact" className="transition-colors hover:text-foreground">{t("contact")}</Link>
                )}
              </li>
              {isKitSite && orgUrl && (
                <li>
                  <a
                    href={orgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground"
                  >
                    {t("openSource")}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">{t("legal")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="transition-colors hover:text-foreground">{t("privacy")}</Link></li>
              {/* The kit's own site sells nothing and has no accounts, so no
                  terms; its cookie disclosure is a section of the (real)
                  privacy policy. Your app keeps the dedicated pages. */}
              {!isKitSite && (
                <li><Link href="/terms" className="transition-colors hover:text-foreground">{t("terms")}</Link></li>
              )}
              <li>
                <Link
                  href={isKitSite ? "/privacy#cookies" : "/cookies"}
                  className="transition-colors hover:text-foreground"
                >
                  {t("cookies")}
                </Link>
              </li>
              {isKitSite && (
                <li>
                  <a
                    href={
                      siteConfig.links.github
                        ? `${siteConfig.links.github}/blob/main/LICENSE`
                        : "https://opensource.org/license/mit"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground"
                  >
                    License
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>{t("copyright", { year: new Date().getFullYear(), site: siteConfig.name })}</p>
          <p>
            <Link href="/changelog" className="transition-colors hover:text-foreground">
              v{siteConfig.version}
            </Link>
            {isKitSite && ` · ${t("license")}`}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <PoweredBy />
        </div>
      </div>
    </footer>
  )
}

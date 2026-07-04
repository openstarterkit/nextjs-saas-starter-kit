import Link from "next/link"
import { PoweredBy } from "@/components/powered-by"
import { Logo } from "@/components/logo"
import { LogoLink } from "@/components/landing/logo-link"
import { ContactDialog } from "@/components/landing/contact-dialog"
import { siteConfig } from "@/config/site"

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between md:gap-8">
          <div>
            <LogoLink className="flex items-center gap-2">
              <Logo wordmarkClassName="text-base font-bold" />
            </LogoLink>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {siteConfig.tagline}. Production-ready boilerplate with no vendor lock-in.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {(siteConfig.links.github ?? siteConfig.links.githubOrg) && (
                <a
                  href={siteConfig.links.github ?? siteConfig.links.githubOrg}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
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
            <h4 className="mb-4 text-sm font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {/* `/#` instead of bare `#`: the footer renders on every public
                  page, but the sections only exist on the home page. */}
              <li><Link href="/#features" className="transition-colors hover:text-foreground">Features</Link></li>
              <li><Link href="/#pricing" className="transition-colors hover:text-foreground">Pricing</Link></li>
              <li>
                <Link href={siteConfig.links.demo ?? "/login"} className="transition-colors hover:text-foreground">
                  Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">About</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#faq" className="transition-colors hover:text-foreground">FAQ</Link></li>
              <li>
                <ContactDialog
                  trigger={
                    <button type="button" className="transition-colors hover:text-foreground">
                      Contact
                    </button>
                  }
                />
              </li>
              <li>
                <a
                  href={siteConfig.links.github ?? siteConfig.links.githubOrg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Open Source
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/cookies" className="transition-colors hover:text-foreground">Cookie Policy</Link></li>
              {siteConfig.links.github && (
                <li>
                  <a
                    href={`${siteConfig.links.github}/blob/main/LICENSE`}
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
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>MIT License · Built with Next.js</p>
        </div>

        <div className="mt-8 flex justify-center">
          <PoweredBy />
        </div>
      </div>
    </footer>
  )
}

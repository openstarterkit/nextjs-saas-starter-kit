"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  consentEnabled,
  readConsent,
  subscribeConsent,
  subscribeConsentOpen,
  writeConsent,
  type Consent,
} from "@/lib/consent"

// The server cannot see the visitor's cookie, so it renders nothing and the
// browser decides right after: no banner flashing for people who already chose.
const PENDING = "pending" as const

function useStoredConsent() {
  return useSyncExternalStore<Consent | null | typeof PENDING>(subscribeConsent, readConsent, () => PENDING)
}

/**
 * The consent banner, rendered only with NEXT_PUBLIC_COOKIE_CONSENT="true".
 *
 * Built to the Italian Garante's 2021 guidelines, which are stricter than most:
 * - Accept and Reject look the same, so neither is the easy way out;
 * - closing it with the X counts as a rejection, and scrolling is not consent;
 * - it does not cover the page or block it: the site works either way;
 * - the choice holds for six months, and "Cookie settings" in the footer opens
 *   it again whenever the visitor wants to change it.
 */
export function CookieBanner({ policyHref }: { policyHref: string }) {
  const stored = useStoredConsent()
  const [reopened, setReopened] = useState(false)
  const t = useTranslations("consent")

  useEffect(() => subscribeConsentOpen(() => setReopened(true)), [])

  if (!consentEnabled || stored === PENDING) return null
  if (stored !== null && !reopened) return null

  const choose = (value: Consent) => {
    const withdrawing = stored === "accepted" && value === "rejected"
    writeConsent(value)
    setReopened(false)
    // A script that already ran cannot be unloaded: a fresh page is the only
    // way to make "no" mean no for the rest of the visit.
    if (withdrawing) window.location.reload()
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-text"
      className="fixed inset-x-4 bottom-4 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-md"
    >
      <div className="relative rounded-2xl border border-border bg-card/95 p-5 text-card-foreground shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => choose("rejected")}
          aria-label={t("close")}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 id="cookie-banner-title" className="text-base font-semibold text-foreground">
              {t("title")}
            </h2>
            <p id="cookie-banner-text" className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("body")}{" "}
              <Link href={policyHref} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                {t("policy")}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => choose("rejected")}>
            {t("reject")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => choose("accepted")}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  )
}

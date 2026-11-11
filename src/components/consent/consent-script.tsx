"use client"

import { useSyncExternalStore } from "react"
import Script, { type ScriptProps } from "next/script"
import { consentEnabled, mayLoad, readConsent, subscribeConsent } from "@/lib/consent"

/**
 * next/script that waits for consent. Use it for anything that sets cookies
 * or tracks visitors: analytics with cookies, ad pixels, chat widgets.
 *
 *   <ConsentScript src="https://www.googletagmanager.com/gtag/js?id=G-XXXX" strategy="afterInteractive" />
 *
 * With NEXT_PUBLIC_COOKIE_CONSENT off it is plain next/script, so wrapping a
 * script now costs nothing. With it on, the script loads only after the
 * visitor accepts, and never on the server's first render.
 */
export function ConsentScript(props: ScriptProps) {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => null)
  // Off: render as usual. On: the server snapshot is null, so nothing loads
  // before the browser has read the visitor's choice.
  if (!mayLoad(consentEnabled, consent)) return null
  return <Script {...props} />
}

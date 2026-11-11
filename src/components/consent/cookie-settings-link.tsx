"use client"

import { consentEnabled, openConsentSettings } from "@/lib/consent"

/** "Cookie settings" in the footer: reopens the banner. Hidden while consent is off. */
export function CookieSettingsLink({ label }: { label: string }) {
  if (!consentEnabled) return null
  return (
    <li>
      <button type="button" onClick={openConsentSettings} className="transition-colors hover:text-foreground">
        {label}
      </button>
    </li>
  )
}

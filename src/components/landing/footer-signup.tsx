"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * The mailing list in one line, under the logo in the footer: the only signup
 * point that sits on every public page, the end of each guide and post
 * included. Same endpoint and honeypot as WaitlistForm, with its own source so
 * the admin export shows how many come from here.
 *
 * Small on purpose. It is not there to convince anyone: the reader who wants
 * your updates is looking for a field to type into, and a pitch in the footer
 * only pushes it further down. Change the line above the field in
 * `footer.signup` and leave the rest alone.
 */
export function FooterSignup({ disabled = false }: { disabled?: boolean }) {
  const t = useTranslations("footer.signup")
  const tw = useTranslations("waitlist")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("") // honeypot: humans never see it
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (state !== "idle" || disabled) return
    setState("sending")
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer", website }),
      })
    } catch {
      // Same neutral outcome: the confirmation email is the real feedback.
    }
    setState("sent")
  }

  return (
    <div className="mt-6 max-w-xs">
      <p className="text-sm font-medium text-foreground">{t("title")}</p>
      {state === "sent" ? (
        <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">{t("sent")}</p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <Input
            type="email"
            required
            placeholder={tw("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled || state === "sending"}
            aria-label={tw("emailLabel")}
            className="h-9 min-w-0 flex-1 text-sm"
          />
          <Button type="submit" size="sm" disabled={disabled || state === "sending"} className="h-9 shrink-0">
            {state === "sending" ? tw("sending") : t("cta")}
          </Button>
        </form>
      )}
      <p className="mt-2 text-[11px] leading-tight text-muted-foreground">
        {disabled
          ? t("disabledNote")
          : tw.rich("consent", {
              privacy: (chunks) => (
                <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                  {chunks}
                </Link>
              ),
            })}
      </p>
    </div>
  )
}

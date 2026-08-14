"use client"

import { useTranslations } from "next-intl"

import { useActionState } from "react"
import Link from "next/link"
import { sendContactRequest, type ContactState } from "@/app/actions/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const initialState: ContactState = { status: "idle" }

/**
 * Contact form: name (optional), email and message, posted to the
 * sendContactRequest server action (Zod + honeypot + rate limit).
 *
 * On a demo deployment `disabled` switches every field and the button off:
 * the form is fully visible, so visitors see what it looks like, but nothing
 * can be typed or sent and no personal data is ever collected. The server
 * action short-circuits in demo mode too, so it holds even if the attribute
 * is stripped in the browser.
 */
export function ContactForm({ disabled = false }: { disabled?: boolean }) {
  const t = useTranslations("contactForm")
  const [state, formAction, pending] = useActionState(sendContactRequest, initialState)

  if (state.status === "sent") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <p className="font-medium text-foreground">{t("sentTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("sentBody")}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="text"
        name="website"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-foreground">
            {t.rich("name", { opt: (c) => <span className="text-muted-foreground">{c}</span> })}
          </label>
          <Input id="contact-name" name="name" placeholder={t("namePlaceholder")} disabled={disabled || pending} />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-foreground">
            {t("email")}
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            disabled={disabled || pending}
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("message")}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          rows={5}
          placeholder={t("messagePlaceholder")}
          disabled={disabled || pending}
          className="flex w-full rounded-[var(--radius)] border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {state.status === "error" && state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          By sending this you agree to our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <Button type="submit" variant="gradient" disabled={disabled || pending}>
          {pending ? t("sending") : t("submit")}
        </Button>
      </div>
    </form>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Inline waitlist signup (double opt-in, step 1). Posts to /api/newsletter,
 * which always answers a neutral 200: the UI says "check your inbox" without
 * revealing whether the address was already on the list. In demo mode the
 * form stays visible but disabled, like checkout.
 */
export function WaitlistForm({
  source = "pricing-card",
  disabled = false,
  cta = "Join the waitlist",
  note = "One short email when there is something worth telling you. Unsubscribe anytime, one click.",
  disabledNote = "Forms are disabled in the live demo.",
}: {
  source?: string
  disabled?: boolean
  /** Submit label. Name what they are joining. */
  cta?: string
  /** Small print under the button: what you will send and how to stop it. */
  note?: string
  /** Small print when the form is disabled: say why, honestly. */
  disabledNote?: string
}) {
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
        body: JSON.stringify({ email, source, website }),
      })
    } catch {
      // Same neutral outcome: the confirmation email is the real feedback.
    }
    setState("sent")
  }

  if (state === "sent") {
    return (
      <p className="w-full rounded-lg bg-primary/10 px-4 py-3 text-center text-sm font-medium text-primary">
        Almost there: check your inbox to confirm your spot.
      </p>
    )
  }

  return (
    <div className="w-full space-y-2">
      <form onSubmit={submit} className="space-y-2">
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
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={disabled || state === "sending"}
          aria-label="Email address"
        />
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={disabled || state === "sending"}
        >
          {state === "sending" ? "Joining…" : cta}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        {disabled ? disabledNote : note}
      </p>
      {/* Informed consent at the point of collection: a dedicated single-purpose
          form needs no checkbox (the button is the affirmative act), but it must
          link the privacy policy. */}
      <p className="text-center text-[11px] leading-tight text-muted-foreground">
        By joining you agree to our{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}

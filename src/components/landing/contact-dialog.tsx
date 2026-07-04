"use client"

import * as React from "react"
import { Check, Copy, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { siteConfig } from "@/config/site"

/**
 * Contact modal: shows the contact address in the open (copyable in one
 * click) with the mail-app handoff as a secondary action — no contact form,
 * so no personal data ever flows through the site.
 */
export function ContactDialog({
  trigger,
  subject,
  body,
}: {
  trigger: React.ReactNode
  subject?: string
  body?: string
}) {
  const [copied, setCopied] = React.useState(false)

  const params = new URLSearchParams()
  if (subject) params.set("subject", subject)
  if (body) params.set("body", body)
  const query = params.toString().replace(/\+/g, "%20")
  const mailto = `mailto:${siteConfig.contactEmail}${query ? `?${query}` : ""}`

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(siteConfig.contactEmail)
      setCopied(true)
      toast.success("Email address copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — the address is shown above")
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </span>
          </div>
          <DialogTitle>Get in touch</DialogTitle>
          <DialogDescription>
            Questions, feedback, ideas — we read everything and reply fast.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={copyEmail}
          className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="font-mono text-sm font-medium text-foreground">
            {siteConfig.contactEmail}
          </span>
          {copied ? (
            <Check className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Copy className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          )}
        </button>

        <div className="flex flex-col gap-2 sm:flex-row">
          {/* flex-1 only in the row layout: in the mobile column it would
              zero the flex-basis and squash the buttons' height. */}
          <Button onClick={copyEmail} className="sm:flex-1">
            {copied ? "Copied!" : "Copy email"}
          </Button>
          <Button asChild variant="outline" className="sm:flex-1">
            <a href={mailto}>Open mail app</a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

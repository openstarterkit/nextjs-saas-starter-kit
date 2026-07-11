"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, HelpCircle } from "lucide-react"
import { siteConfig } from "@/config/site"

export default function NotFound() {
  const router = useRouter()
  const [secondsLeft, setSecondsLeft] = useState(30)

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.push("/")
      return
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [secondsLeft, router])

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background px-6 py-24 sm:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid opacity-35" />
      <div className="absolute inset-0 bg-glow pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 mx-auto max-w-md text-center">
        {/* Decorative 404 tag */}
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
          404 Error
        </span>

        {/* Title */}
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Page not found
        </h1>

        {/* Description */}
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          Sorry, we couldn’t find the page you’re looking for. Perhaps you’ve mistyped the URL or the page has been moved.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:bg-primary/95 transition-all hover:-translate-y-0.5"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/docs"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-soft hover:bg-accent hover:text-foreground transition-all hover:-translate-y-0.5"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Check Documentation
          </Link>
        </div>

        {/* Countdown */}
        <p className="mt-8 text-xs text-muted-foreground/80">
          Redirecting to homepage in <span className="font-semibold text-foreground">{secondsLeft}s</span>...
        </p>

        {/* Branding Footer */}
        <div className="mt-16 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function UpgradeButton({ priceId, className }: { priceId?: string; className?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: priceId ?? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} loading={loading} className={className}>
      Upgrade to Pro
    </Button>
  )
}

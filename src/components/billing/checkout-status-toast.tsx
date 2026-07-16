"use client"

import { Suspense, useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

function CheckoutStatusToastInner() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const fired = useRef(false)

  const success = searchParams.get("success") === "true"
  const canceled = searchParams.get("canceled") === "true"

  useEffect(() => {
    if (fired.current || (!success && !canceled)) return
    fired.current = true

    if (success) {
      toast.success("Payment successful. Your plan updates in a few seconds.")
      // The redirect from Stripe races the webhook that records the grant:
      // refresh once shortly after landing so the new plan shows up without
      // a manual reload.
      setTimeout(() => router.refresh(), 2500)
    } else {
      toast("Checkout canceled. You have not been charged.")
    }

    // Strip the params so a refresh or back-navigation doesn't re-toast.
    router.replace(pathname, { scroll: false })
  }, [success, canceled, pathname, router])

  return null
}

// useSearchParams requires a Suspense boundary; the wrapper keeps that detail
// away from the pages that mount this.
export function CheckoutStatusToast() {
  return (
    <Suspense fallback={null}>
      <CheckoutStatusToastInner />
    </Suspense>
  )
}

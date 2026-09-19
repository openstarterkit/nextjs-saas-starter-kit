import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"

const STATUS_VARIANTS: Record<string, "success" | "default" | "destructive" | "secondary"> = {
  ACTIVE: "success",
  TRIALING: "default",
  PAST_DUE: "destructive",
  CANCELED: "secondary",
  UNPAID: "destructive",
  INCOMPLETE: "secondary",
}

// Subscription statuses come from Stripe as stable codes; their labels live
// in the message files under `dashboard.billing.status`. Every page that shows
// a status renders this one, so the label and the colour of a status are the
// same wherever it appears. An unknown code is shown as it came.
export async function SubscriptionStatusBadge({ status }: { status: string }) {
  const t = await getTranslations("dashboard.billing")
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
      {status in STATUS_VARIANTS ? t(`status.${status}`) : status}
    </Badge>
  )
}

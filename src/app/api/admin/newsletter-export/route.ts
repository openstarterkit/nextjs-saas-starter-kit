import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { csvCell } from "@/lib/csv"

/**
 * CSV export of the newsletter list, admin-only. Includes every state
 * (pending, confirmed, unsubscribed) with its timestamps, so the file is
 * also the consent record: requested_at + confirmed_at document the double
 * opt-in for each address.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 })
  }

  const subs = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "asc" } })

  const lines = ["email,source,requested_at,confirmed_at,unsubscribed_at"]
  for (const s of subs) {
    lines.push(
      [
        csvCell(s.email),
        csvCell(s.source),
        s.createdAt.toISOString(),
        s.confirmedAt?.toISOString() ?? "",
        s.unsubscribedAt?.toISOString() ?? "",
      ].join(",")
    )
  }

  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="newsletter-subscribers.csv"',
    },
  })
}

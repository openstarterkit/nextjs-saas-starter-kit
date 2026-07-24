import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * CSV export of the newsletter list, admin-only. Includes every state
 * (pending, confirmed, unsubscribed) with its timestamps, so the file is
 * also the consent record: requested_at + confirmed_at document the double
 * opt-in for each address.
 */
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 })
  }

  const subs = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "asc" } })

  const esc = (value: string) => `"${value.replace(/"/g, '""')}"`
  const lines = ["email,source,requested_at,confirmed_at,unsubscribed_at"]
  for (const s of subs) {
    lines.push(
      [
        esc(s.email),
        esc(s.source),
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

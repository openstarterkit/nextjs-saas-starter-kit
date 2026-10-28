import { getCurrentUser } from "@/lib/auth"
import { getFormatter, getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatJoined } from "@/components/admin/user-parts"
import { Pagination } from "@/components/ui/pagination"

// As on the users page: a short page to scan.
const ITEMS_PER_PAGE = 10

/**
 * Everyone who signed up to the newsletter, newest first, with the export.
 *
 * Until 2.5.0 the admin overview showed the eight latest signups and nothing
 * past them: with a real list the rest could only be read from the CSV. The
 * overview keeps the count, in the cards at the top, and links here.
 */
export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const t = await getTranslations("admin")
  const format = await getFormatter()
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const params = await searchParams
  // Same guard as the users page: a non-numeric ?page falls back to page 1.
  const parsedPage = Number.parseInt(params.page ?? "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  const [total, waitlistConfirmed, waitlistPending, subscribers] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } }),
    prisma.newsletterSubscriber.count({ where: { confirmedAt: null, unsubscribedAt: null } }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
  ])
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("waitlistTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("waitlistSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* The page already says Waitlist: the card says how many. */}
              <CardDescription>
                {t("waitlistCounts", { confirmed: waitlistConfirmed, pending: waitlistPending })}
              </CardDescription>
            </div>
            {/* A file download from a route handler, not a page. `next/link`
                would prefetch it, turning a CSV export into a background
                request; the rule cannot tell a route handler from a page. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/admin/newsletter-export"
              className="inline-flex h-9 items-center rounded-[var(--radius)] border border-border px-4 text-sm hover:bg-muted"
            >
              {t("exportCsv")}
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {/* As on the users page: stack into cards below `md`. */}
          <div className="space-y-3 md:hidden">
            {subscribers.map((sub) => (
              <div key={sub.id} className="rounded-xl border border-border p-4">
                <p className="truncate text-sm font-medium text-foreground">{sub.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {sub.unsubscribedAt ? (
                    <Badge variant="outline">{t("unsubscribed")}</Badge>
                  ) : sub.confirmedAt ? (
                    <Badge variant="success">{t("confirmed")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("pending")}</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">{sub.source}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatJoined(format, sub.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {subscribers.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                {t("noSubscribers")}
              </p>
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">{t("colEmail")}</TableHead>
                  <TableHead>{t("colSource")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("colRequested")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">{sub.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{sub.source}</span>
                    </TableCell>
                    <TableCell>
                      {sub.unsubscribedAt ? (
                        <Badge variant="outline">{t("unsubscribed")}</Badge>
                      ) : sub.confirmedAt ? (
                        <Badge variant="success">{t("confirmed")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("pending")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatJoined(format, sub.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {subscribers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      {t("noSubscribers")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            className="mt-6"
            page={page}
            totalPages={totalPages}
            href={(n) => (n === 1 ? "/admin/waitlist" : `/admin/waitlist?page=${n}`)}
            labels={{
              previous: t("previous"),
              next: t("next"),
              navigation: t("waitlistPagination"),
              page: t("pageNumber"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

import { getCurrentUser } from "@/lib/auth"
import { getFormatter, getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PromoteUserButton } from "@/components/admin/promote-user-button"
import { UserAvatar, formatJoined } from "@/components/admin/user-parts"
import { Pagination } from "@/components/ui/pagination"

// Ten: a short page to scan. People are found by searching, not by paging.
const ITEMS_PER_PAGE = 10

function pageHref(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set("search", search)
  return `/admin/users?${params}`
}

/**
 * Every user, searchable and paginated, on a page of its own.
 *
 * Until 2.5.0 this table sat on the admin overview, under the metrics and the
 * revenue chart: each page of results reloaded the overview and dropped you
 * back at its top, above the table you were paging through. Here the table is
 * the page, so Next and Previous land where the list starts.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const t = await getTranslations("admin")
  const format = await getFormatter()
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const params = await searchParams
  // Guard against non-numeric ?page (e.g. ?page=abc → NaN), which would flow into
  // Prisma's `skip` and throw a 500. Fall back to page 1 for anything invalid.
  const parsedPage = Number.parseInt(params.page ?? "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const search = params.search ?? ""

  const where = search ? { email: { contains: search, mode: "insensitive" as const } } : {}
  // The matches are counted, not taken from the page of results: that holds
  // one page of rows at most, so a search with more matches had a single page.
  const [totalUsers, totalFiltered, users] = await Promise.all([
    prisma.user.count(),
    search ? prisma.user.count({ where }) : null,
    prisma.user.findMany({
      where,
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
  ])
  const totalPages = Math.ceil((totalFiltered ?? totalUsers) / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("usersTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("usersSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* The page already says Users: the card says how many. */}
              <CardDescription>
                {search ? t("usersFound", { count: totalFiltered ?? 0 }) : t("usersCount", { count: totalUsers })}
              </CardDescription>
            </div>
            <form action="/admin/users" className="flex gap-2">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder={t("searchPlaceholder")}
                className="h-9 w-full rounded-[var(--radius)] border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
              />
              <button
                type="submit"
                className="h-9 rounded-[var(--radius)] bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t("search")}
              </button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {/* Below `md` a 6-column table is unreadable: stack each user as a card. */}
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar image={user.image} name={user.name} email={user.email} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{user.name ?? "-"}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {user.subscription ? (
                    <Badge variant={user.subscription.status === "ACTIVE" ? "success" : "secondary"}>
                      {user.subscription.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t("free")}</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {user.subscription?.plan.name ?? t("free")}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t("joined", { date: formatJoined(format, user.createdAt) })}
                  </span>
                </div>
                {user.role !== "ADMIN" && (
                  <div className="mt-3">
                    <PromoteUserButton userId={user.id} currentRole={user.role} />
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">{t("noUsers")}</p>
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">{t("colUser")}</TableHead>
                  <TableHead>{t("colPlan")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colRole")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("colJoined")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar image={user.image} name={user.name} email={user.email} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.subscription?.plan.name ?? t("free")}</span>
                    </TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <Badge
                          variant={user.subscription.status === "ACTIVE" ? "success" : "secondary"}
                        >
                          {user.subscription.status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("free")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatJoined(format, user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PromoteUserButton userId={user.id} currentRole={user.role} />
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t("noUsers")}
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
            href={(n) => pageHref(n, search)}
            labels={{
              previous: t("previous"),
              next: t("next"),
              navigation: t("pagination"),
              page: t("pageNumber"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

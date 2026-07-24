import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PromoteUserButton } from "@/components/admin/promote-user-button"

const ITEMS_PER_PAGE = 20

function formatJoined(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function UserAvatar({
  image,
  name,
  email,
}: {
  image: string | null
  name: string | null
  email: string
}) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" className="h-8 w-8 shrink-0 rounded-full" />
  ) : (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
      {name?.[0] ?? email[0].toUpperCase()}
    </div>
  )
}

async function getAdminData(page: number, search: string) {
  const where = search
    ? { email: { contains: search, mode: "insensitive" as const } }
    : {}

  const [totalUsers, activeSubscriptions, users, waitlistConfirmed, waitlistPending, waitlistRecent] =
    await Promise.all([
      prisma.user.count(),
      prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
      }),
      prisma.user.findMany({
        where,
        include: { subscription: { include: { plan: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.newsletterSubscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } }),
      prisma.newsletterSubscriber.count({ where: { confirmedAt: null, unsubscribedAt: null } }),
      prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ])

  const totalFiltered = search ? users.length : totalUsers

  const mrr = activeSubscriptions.reduce((sum, sub) => {
    if (sub.plan.interval === "MONTH") return sum + sub.plan.price
    if (sub.plan.interval === "YEAR") return sum + Math.round(sub.plan.price / 12)
    return sum
  }, 0)

  return {
    totalUsers,
    activeUsers: activeSubscriptions.length,
    mrr,
    users,
    totalPages: Math.ceil(totalFiltered / ITEMS_PER_PAGE),
    waitlistConfirmed,
    waitlistPending,
    waitlistRecent,
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

  const params = await searchParams
  // Guard against non-numeric ?page (e.g. ?page=abc → NaN), which would flow into
  // Prisma's `skip` and throw a 500. Fall back to page 1 for anything invalid.
  const parsedPage = Number.parseInt(params.page ?? "1", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const search = params.search ?? ""

  const { totalUsers, activeUsers, mrr, users, totalPages, waitlistConfirmed, waitlistPending, waitlistRecent } =
    await getAdminData(page, search)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="mt-1 text-muted-foreground">Manage users and monitor business metrics.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>MRR (estimated)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">${(mrr / 100).toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>{totalUsers} total users</CardDescription>
            </div>
            <form className="flex gap-2">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by email..."
                className="h-9 w-full rounded-[var(--radius)] border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
              />
              <button
                type="submit"
                className="h-9 rounded-[var(--radius)] bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Search
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
                    <Badge variant="secondary">Free</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {user.subscription?.plan.name ?? "Free"}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    Joined {formatJoined(user.createdAt)}
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
              <p className="py-8 text-center text-muted-foreground">No users found.</p>
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
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
                      <span className="text-sm">{user.subscription?.plan.name ?? "Free"}</span>
                    </TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <Badge
                          variant={user.subscription.status === "ACTIVE" ? "success" : "secondary"}
                        >
                          {user.subscription.status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatJoined(user.createdAt)}
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
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`/admin?page=${page - 1}${search ? `&search=${search}` : ""}`}
                    className="inline-flex h-9 items-center rounded-[var(--radius)] border border-border px-4 text-sm hover:bg-muted"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`/admin?page=${page + 1}${search ? `&search=${search}` : ""}`}
                    className="inline-flex h-9 items-center rounded-[var(--radius)] border border-border px-4 text-sm hover:bg-muted"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Newsletter / waitlist */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Waitlist</CardTitle>
              <CardDescription>
                {waitlistConfirmed} confirmed · {waitlistPending} pending confirmation
              </CardDescription>
            </div>
            <a
              href="/api/admin/newsletter-export"
              className="inline-flex h-9 items-center rounded-[var(--radius)] border border-border px-4 text-sm hover:bg-muted"
            >
              Export CSV
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitlistRecent.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">{sub.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{sub.source}</span>
                  </TableCell>
                  <TableCell>
                    {sub.unsubscribedAt ? (
                      <Badge variant="outline">Unsubscribed</Badge>
                    ) : sub.confirmedAt ? (
                      <Badge variant="success">Confirmed</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatJoined(sub.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {waitlistRecent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No subscribers yet. The signup form lives on the pricing page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

import { requireUser } from "@/lib/auth"
import { getFormatter, getTranslations } from "next-intl/server"
import Link from "next/link"
import { FolderKanban, SearchX } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog"
import { ProjectSearch } from "@/components/dashboard/project-search"
import { Button } from "@/components/ui/button"

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? "").trim()
  const t = await getTranslations("dashboard.projects")
  const format = await getFormatter()
  const user = await requireUser()

  // Filtering in the query rather than over the fetched array: the version
  // that still works once someone has more projects than fit on a screen.
  const projects = await prisma.project.findMany({
    where: {
      userId: user.id,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { description: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      {/* The action sits at the top right of its own section rather than in a
          card taking up half the page: on a list, creating is one thing you do
          occasionally and reading is what you came for. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        {/* Stacked below sm and side by side above it. Sharing one row on a
            phone left the search field with whatever the button did not take,
            which was not enough to read its own placeholder. */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <ProjectSearch query={query} />
          <NewProjectDialog />
        </div>
      </div>

      {projects.length === 0 ? (
        /* Two different nothings: an account with no projects yet, and a search
           that matched none. Telling someone "no projects yet" when they have
           twenty and mistyped one word is the kind of small lie that makes an
           interface feel careless. */
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {query ? <SearchX className="h-6 w-6" /> : <FolderKanban className="h-6 w-6" />}
          </span>
          <p className="mt-4 font-medium text-foreground">
            {query ? t("noResultsTitle") : t("emptyTitle")}
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {query ? t("noResultsBody", { query }) : t("emptyBody")}
          </p>
          {query && (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/dashboard/projects">{t("clearSearch")}</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group block focus-visible:outline-none"
            >
              <Card className="h-full transition-colors group-hover:border-primary/40 group-focus-visible:border-primary group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardContent className="flex h-full flex-col gap-2 py-5">
                  <p className="font-medium text-foreground">{project.name}</p>
                  {project.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60">{t("noDescription")}</p>
                  )}
                  <p className="mt-auto pt-2 text-xs text-muted-foreground">
                    {t("updated", {
                      date: format.relativeTime(new Date(project.updatedAt)),
                    })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

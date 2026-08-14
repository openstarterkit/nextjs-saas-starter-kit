import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getFormatter, getTranslations } from "next-intl/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProjectEditForm } from "@/components/dashboard/project-edit-form"
import { deleteProject } from "@/app/actions/projects"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations("dashboard.projectDetail")
  const format = await getFormatter()
  const session = await auth()
  if (!session) redirect("/login")

  const { id } = await params

  const project = await prisma.project.findUnique({ where: { id } })

  // Ownership check — a project not owned by the current user is "not found".
  if (!project || project.userId !== session.user.id) notFound()

  const dateFmt = (d: Date) =>
    format.dateTime(new Date(d), { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
          <CardDescription>{t("detailsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectEditForm id={project.id} name={project.name} description={project.description} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("metadataTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground">{t("created")}</span>
            <span className="font-medium">{dateFmt(project.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("updated")}</span>
            <span className="font-medium">{dateFmt(project.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive">{t("dangerTitle")}</CardTitle>
          <CardDescription>{t("dangerDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteProject}>
            <input type="hidden" name="id" value={project.id} />
            <Button type="submit" variant="destructive" size="sm">
              {t("delete")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

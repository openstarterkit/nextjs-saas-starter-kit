import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FolderKanban, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateProjectForm } from "@/components/dashboard/create-project-form"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="mt-1 text-muted-foreground">
          The things you&apos;re working on. This is the example resource - copy the pattern to build your own.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Create */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">New project</CardTitle>
            <CardDescription>Create a project you own.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateProjectForm />
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-3">
          {projects.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FolderKanban className="h-6 w-6" />
              </span>
              <p className="mt-4 font-medium text-foreground">No projects yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Create your first project with the form on the left to get started.
              </p>
            </Card>
          ) : (
            projects.map((project) => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block">
                <Card className="group transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{project.name}</p>
                      {project.description ? (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-sm text-muted-foreground/60">No description</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

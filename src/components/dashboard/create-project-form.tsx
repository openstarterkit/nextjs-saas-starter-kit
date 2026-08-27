"use client"

import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { createProject } from "@/app/actions/projects"
import {
  projectSchema,
  PROJECT_DESCRIPTION_MAX,
  PROJECT_NAME_MAX,
  type ProjectInput,
} from "@/lib/schemas/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/sonner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

/**
 * Create project, validated in the browser against the same schema the server
 * action re-checks before writing (src/lib/schemas/project.ts).
 *
 * The action stays the authority: nothing arriving from a browser is trusted,
 * and it parses the payload again. What the client-side pass buys is the round
 * trip a user does not have to wait for to be told the name is missing, and an
 * error that lands under the field it belongs to instead of in a toast.
 */
export function CreateProjectForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const t = useTranslations("dashboard.createProject")
  const tError = useTranslations("errors")

  const form = useForm<ProjectInput>({
    resolver: zodResolver(
      projectSchema({
        nameRequired: tError("nameRequired"),
        nameTooLong: tError("nameTooLong"),
        descriptionTooLong: tError("descriptionTooLong"),
      })
    ),
    defaultValues: { name: "", description: "" },
  })

  async function onSubmit(values: ProjectInput) {
    const payload = new FormData()
    payload.set("name", values.name)
    if (values.description) payload.set("description", values.description)

    const state = await createProject({}, payload)

    if (state.success) {
      toast.success(t("created"))
      form.reset()
      onSuccess?.()
    } else if (state.error) {
      toast.error(state.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input placeholder="My new project" maxLength={PROJECT_NAME_MAX} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  maxLength={PROJECT_DESCRIPTION_MAX}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("descriptionHint", { max: PROJECT_DESCRIPTION_MAX })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="w-full sm:w-auto"
        >
          {t("submit")}
        </Button>
      </form>
    </Form>
  )
}

import { z } from "zod"

/**
 * The project shape, in one place for both sides of the wire.
 *
 * The server action that writes to the database is the authority and validates
 * on its own; this module exists so the form in the browser can check the same
 * rules before the round trip, without a second copy of them drifting out of
 * step. It lives outside the action file on purpose: a module marked
 * "use server" may only export async functions, so a schema declared there can
 * never be imported by a client component.
 *
 * Messages are passed in rather than resolved here. They are shown to the
 * user, so they have to come from the translation layer, and that layer is
 * reached differently on the server (getTranslations) and in the browser
 * (useTranslations).
 */
export type ProjectMessages = {
  nameRequired: string
  nameTooLong: string
  descriptionTooLong: string
}

export const PROJECT_NAME_MAX = 60
export const PROJECT_DESCRIPTION_MAX = 280

export function projectSchema(m: ProjectMessages) {
  return z.object({
    name: z.string().min(1, m.nameRequired).max(PROJECT_NAME_MAX, m.nameTooLong),
    description: z
      .string()
      .max(PROJECT_DESCRIPTION_MAX, m.descriptionTooLong)
      .optional(),
  })
}

export type ProjectInput = z.infer<ReturnType<typeof projectSchema>>

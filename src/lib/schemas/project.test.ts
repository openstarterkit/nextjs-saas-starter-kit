import { describe, it, expect } from "vitest"

import {
  projectSchema,
  PROJECT_NAME_MAX,
  PROJECT_DESCRIPTION_MAX,
  type ProjectMessages,
} from "./project"

const messages: ProjectMessages = {
  nameRequired: "name-required",
  nameTooLong: "name-too-long",
  descriptionTooLong: "description-too-long",
}

const schema = projectSchema(messages)

const errorsFor = (input: unknown) => {
  const result = schema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("projectSchema", () => {
  it("accepts a name on its own", () => {
    expect(schema.safeParse({ name: "Apollo" }).success).toBe(true)
  })

  it("accepts a name and a description", () => {
    expect(schema.safeParse({ name: "Apollo", description: "The moon one" }).success).toBe(true)
  })

  it("rejects an empty name", () => {
    expect(errorsFor({ name: "" })).toContain(messages.nameRequired)
  })

  // The boundary rather than a round number: an off-by-one here means the form
  // and the server action disagree about the last character, and the user gets
  // a browser that accepts what the write then refuses.
  it("accepts a name of exactly the maximum length and rejects one character more", () => {
    expect(errorsFor({ name: "a".repeat(PROJECT_NAME_MAX) })).toEqual([])
    expect(errorsFor({ name: "a".repeat(PROJECT_NAME_MAX + 1) })).toContain(messages.nameTooLong)
  })

  it("accepts a description of exactly the maximum length and rejects one character more", () => {
    const name = "Apollo"
    expect(errorsFor({ name, description: "a".repeat(PROJECT_DESCRIPTION_MAX) })).toEqual([])
    expect(errorsFor({ name, description: "a".repeat(PROJECT_DESCRIPTION_MAX + 1) })).toContain(
      messages.descriptionTooLong
    )
  })

  // Messages are a parameter because they are shown to the user and therefore
  // have to come from the translation layer. A schema that hardcoded English
  // would look correct in every test and be wrong in every other locale.
  it("reports the messages it was given rather than any of its own", () => {
    const other = projectSchema({
      nameRequired: "serve un nome",
      nameTooLong: "troppo lungo",
      descriptionTooLong: "descrizione troppo lunga",
    })

    const result = other.safeParse({ name: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain("serve un nome")
    }
  })
})

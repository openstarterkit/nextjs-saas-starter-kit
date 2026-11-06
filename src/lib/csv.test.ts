import { describe, expect, it } from "vitest"
import { csvCell } from "./csv"

describe("csvCell", () => {
  it("quotes a plain value and doubles its quotes", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
  })

  it.each(["=HYPERLINK(\"https://example.com\")", "+1", "-1", "@SUM(A1)", "\tx", "\rx"])(
    "turns %j into text a spreadsheet will not evaluate",
    (value) => {
      expect(csvCell(value).startsWith("\"'")).toBe(true)
    }
  )

  it("leaves an ordinary address and source as they are", () => {
    expect(csvCell("someone@example.com")).toBe('"someone@example.com"')
    expect(csvCell("post:my-first-post")).toBe('"post:my-first-post"')
  })
})

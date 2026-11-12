import { describe, expect, it } from "vitest"
import { newTab } from "./new-tab"

describe("newTab", () => {
  it("opens a link to another site in a new tab, without handing it the opener", () => {
    expect(newTab("https://demo.example.com")).toEqual({ target: "_blank", rel: "noopener noreferrer" })
    expect(newTab("http://demo.example.com/login")).toEqual({ target: "_blank", rel: "noopener noreferrer" })
  })

  it("keeps a page of this site in the same tab", () => {
    expect(newTab("/login")).toEqual({})
    expect(newTab("#pricing")).toEqual({})
  })

  it("treats a missing address as local", () => {
    expect(newTab(null)).toEqual({})
    expect(newTab(undefined)).toEqual({})
    expect(newTab("")).toEqual({})
  })
})

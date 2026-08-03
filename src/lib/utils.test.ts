import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("rounded", "border")).toBe("rounded border")
  })

  it("drops falsy values, so conditional classes stay readable at the call site", () => {
    expect(cn("base", false && "hidden", undefined, null, "end")).toBe("base end")
  })

  // This is the reason cn exists rather than a plain join: the last class of a
  // conflicting pair has to win, so a component prop can override a default.
  it("lets a later Tailwind class beat an earlier one it conflicts with", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-sm text-muted-foreground", "text-foreground")).toBe("text-sm text-foreground")
  })

  it("keeps classes that only look similar", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4")
  })

  it("accepts arrays and objects, as the variant helpers pass them through", () => {
    expect(cn(["flex", "gap-2"], { hidden: false, "items-center": true })).toBe(
      "flex gap-2 items-center",
    )
  })
})

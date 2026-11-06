import { describe, expect, it } from "vitest"
import { cleanDisplayName, hasWebAddress } from "./display-name"

describe("hasWebAddress", () => {
  it.each(["Verify at https://example.com", "http://example.com", "see www.example.com", "HTTPS://EXAMPLE.COM"])(
    "finds a web address in %j",
    (name) => {
      expect(hasWebAddress(name)).toBe(true)
    }
  )

  it.each(["Ada Lovelace", "Jean-Luc O'Brien", "李雷", "Mario Rossi Jr.", "dr.who", "Anna www"])(
    "leaves a real name alone: %j",
    (name) => {
      expect(hasWebAddress(name)).toBe(false)
    }
  )
})

describe("cleanDisplayName", () => {
  it("drops a name that carries a web address", () => {
    expect(cleanDisplayName("Confirm here: https://example.com")).toBe("")
  })

  it("caps a long name at 100 characters", () => {
    expect(cleanDisplayName("A".repeat(240))).toHaveLength(100)
  })

  it("keeps an ordinary name as it is", () => {
    expect(cleanDisplayName("Ada Lovelace")).toBe("Ada Lovelace")
  })
})

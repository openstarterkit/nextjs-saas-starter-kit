import { describe, it, expect } from "vitest"
import { jsonLdScript } from "./json-ld"

describe("jsonLdScript", () => {
  it("round-trips to the same data", () => {
    const data = { "@type": "Article", headline: "Hello", keywords: ["a", "b"] }
    expect(JSON.parse(jsonLdScript(data))).toEqual(data)
  })

  // The case the escape exists for. Without it the browser ends the script
  // element at the closing tag inside the string and parses what follows as
  // markup, which is how structured data turns into stored XSS.
  it("escapes the sequence that would close the script element", () => {
    const headline = "</script><img src=x onerror=alert(1)>"
    const out = jsonLdScript({ headline })

    expect(out).not.toContain("</script>")
    expect(out).toContain("\\u003c")
    expect(JSON.parse(out).headline).toBe(headline)
  })

  // `<!--` opens an HTML comment inside a script element and swallows the rest
  // of the graph, so it needs the same treatment.
  it("escapes the opener of an HTML comment", () => {
    const out = jsonLdScript({ headline: "<!-- hidden" })

    expect(out).not.toContain("<!--")
    expect(JSON.parse(out).headline).toBe("<!-- hidden")
  })

  it("leaves anything without a left angle bracket untouched", () => {
    const data = { headline: "Ampersands & quotes \" and > are fine" }
    expect(jsonLdScript(data)).toBe(JSON.stringify(data))
  })
})

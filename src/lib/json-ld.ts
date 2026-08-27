/**
 * Serializes structured data for a `<script type="application/ld+json">` tag.
 *
 * `JSON.stringify` does not escape `<`, so any string that reaches the graph
 * and happens to contain `</script>` closes the element early: everything
 * after it is parsed as HTML instead of data. Here the graph is built from
 * post frontmatter and site config, which you write yourself, but a blog fed
 * by a contributor, a CMS or a generator is the ordinary case downstream, and
 * the escape costs nothing.
 *
 * Escaping `<` alone is enough. It also neutralises `<!--`, which opens an
 * HTML comment inside a script element, and the result is still valid JSON:
 * `<` parses back to the same character.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

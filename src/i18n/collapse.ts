export type Messages = { [key: string]: unknown }

/**
 * Reduces a message tree to the copy one deployment actually renders.
 *
 * Sections that differ between the kit's own site and the product it ships as
 * carry both variants under `$kit` and `$product`. Only one can ever render,
 * and `isKitSite` is fixed at build time, so keeping both costs twice: every
 * page serialises copy it cannot use, and a clone would carry the kit's own
 * marketing wording inside its HTML, where anyone can read it.
 *
 * The markers are `$`-prefixed on purpose. Plain `kit` and `product` collide
 * with real message keys: the footer has a column headed "Product", and a
 * naive rule mistook it for a branch.
 *
 * Exported and shared with the test rather than restated there. The two were
 * separate copies for one commit, they drifted immediately, and the runtime
 * one turned every array into an object with numeric keys because arrays are
 * objects in JavaScript. One implementation cannot disagree with itself.
 */
export function collapseMessages(messages: Messages, isKit: boolean): Messages {
  const out: Messages = {}
  for (const [key, value] of Object.entries(messages)) {
    // An array is a single message read whole with `t.raw()`, not a branch and
    // not a subtree: recursing into it would rebuild it as an object.
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      out[key] = value
      continue
    }

    const node = value as Messages
    if (!("$kit" in node) && !("$product" in node)) {
      out[key] = collapseMessages(node, isKit)
      continue
    }

    // Siblings of the branches are shared and stay: `hero` holds `$kit`,
    // `$product` and a `mock` block that both deployments render.
    const siblings: Messages = {}
    for (const [k, v] of Object.entries(node)) {
      if (k !== "$kit" && k !== "$product") siblings[k] = v
    }

    // An absent branch is not an empty string: the key does not exist for this
    // deployment, and whatever reads it is guarded by `isKitSite`. Dropping it
    // is what keeps one deployment's copy out of the other's HTML.
    const chosen = node[isKit ? "$kit" : "$product"]
    if (chosen === undefined) {
      if (Object.keys(siblings).length > 0) out[key] = collapseMessages(siblings, isKit)
      continue
    }
    out[key] =
      chosen && typeof chosen === "object" && !Array.isArray(chosen)
        ? collapseMessages({ ...siblings, ...(chosen as Messages) }, isKit)
        : chosen
  }
  return out
}

/**
 * True only on the deployment that sells the kit itself, false in every
 * clone. Set `KIT_SITE="true"` there; leave it unset everywhere else.
 *
 * It gates the parts of the site that talk about the kit as the product
 * rather than about *your* product: the open source pricing tiers, the Pro
 * waitlist, the license links in the footer, the developer-facing headline,
 * features and FAQ. The kit ships with it off, so a fresh clone reads as your
 * SaaS from the first render, with neutral placeholder copy to replace.
 *
 * Wherever this flag picks between two blocks of copy, the neutral one comes
 * first in the file: that is the one you edit.
 */
export const isKitSite = process.env.KIT_SITE === "true"

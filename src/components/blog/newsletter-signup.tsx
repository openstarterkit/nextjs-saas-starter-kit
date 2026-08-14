import { getTranslations } from "next-intl/server"
import { WaitlistForm } from "@/components/landing/waitlist-form"

/**
 * Signup block for use inside a post, written as `<NewsletterSignup />` in the
 * MDX.
 *
 * It exists because the alternative is worse: a post that ends with a link to
 * the pricing page asks a reader who is already convinced to navigate, land on
 * a page about something else, and find the form themselves. Most do not.
 *
 * **Put it in a post whose reader is the person you are asking**, not in every
 * post. A piece that argues for a paid capability earns the ask; a piece that
 * teaches something and points at the free code does not, and pasting the same
 * block under both is how a blog starts reading like a funnel.
 *
 * `source` reaches the subscriber row, so the admin export shows which post
 * brought someone in. Pass the slug.
 */
export async function NewsletterSignup({ source }: { source?: string }) {
  const t = await getTranslations("blog.signup")

  return (
    <aside className="not-prose my-12 rounded-2xl border border-primary/25 bg-primary/[0.04] p-6 text-center sm:p-8">
      <p className="text-lg font-semibold tracking-tight text-foreground">{t("title")}</p>
      {/* Narrower than the card: centred text only reads well on short lines,
          and at full width these two broke in the wrong places. */}
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("body")}</p>
      <div className="mx-auto mt-5 max-w-md">
        <WaitlistForm
          source={source ? `post:${source}` : "post"}
          cta={t("cta")}
          note={t("note")}
          disabled={process.env.DEMO_MODE === "true"}
          disabledNote={t("disabledNote")}
        />
      </div>
    </aside>
  )
}

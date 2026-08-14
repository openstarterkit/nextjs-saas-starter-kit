import { getTranslations } from "next-intl/server"
import { Star } from "lucide-react"
import { GithubIcon } from "@/components/icons/github"
import { siteConfig } from "@/config/site"

/**
 * The one thing an open source project can ask a reader for, at the end of the
 * page where the reader has just been helped.
 *
 * **At the bottom, not in the sidebar.** It lived in the left column first,
 * where it had to be a full width block in 208 pixels and shouted louder than
 * the navigation around it; on a phone that column stacks, so it arrived
 * before the documentation instead of after. Down here it has room to sit on
 * one line, and it is read at the moment the ask makes sense.
 *
 * **It points at your repository, not at ours.** The URL comes from
 * `siteConfig.links.github`, so a clone with `NEXT_PUBLIC_GITHUB_URL` set gets
 * the same block for its own project, and a clone without a public repository
 * renders nothing rather than a button that credits someone else.
 *
 * No star count on purpose. A number is social proof once it is flattering and
 * an argument against you before then, and a control that has to be removed
 * later is worse than one that never claimed anything. Add it when it helps.
 *
 * **The button keeps its English label in every language, and the missing key
 * in the other locale files is the decision rather than an oversight.**
 * "Star on GitHub" is the name of an action on GitHub, the way `git clone` is
 * a command: a reader who translates it has to work out what it maps to. The
 * sentence under it is translated, because that one is ours.
 *
 * The label lives in `common` and not here, because the navbar shows the same
 * one: two keys with the same words drift the day somebody edits one of them.
 */
export async function StarOnGitHub() {
  const repo = siteConfig.links.github
  if (!repo) return null

  const [t, tCommon] = await Promise.all([
    getTranslations("docs"),
    getTranslations("common"),
  ])

  return (
    <div className="mt-24 flex flex-col items-center gap-3 border-t border-border/60 pt-12 text-center">
      <a
        href={repo}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow [background-image:var(--gradient-brand)]"
      >
        <GithubIcon className="h-4 w-4 shrink-0" />
        {tCommon("starOnGitHub")}
      </a>
      {/* The star sits in the sentence rather than beside it: the message file
          decides where, so a translation can move it to where its own wording
          needs it. */}
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">
        {t.rich("starNote", {
          star: () => (
            <Star className="-mt-0.5 inline h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          ),
        })}
      </p>
    </div>
  )
}

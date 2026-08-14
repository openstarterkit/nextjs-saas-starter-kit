import { siteConfig } from "@/config/site"
import { isKitSite } from "@/config/kit"
import { getDocs } from "@/lib/docs"
import { getAllPosts, getCategories } from "@/lib/blog"

/**
 * llms.txt: a Markdown map of the site for large language models, following
 * the llmstxt.org convention (H1, a one-line summary, then curated link
 * lists). Built from the same siteConfig, docs manifest and blog content as
 * the sitemap, so the two never drift and it works on any deployment domain.
 * Served at /llms.txt.
 */
export function GET(): Response {
  const base = siteConfig.url
  const repo = siteConfig.links.github

  const docs = getDocs().map(
    (d) => `- [${d.title}](${base}/docs/${d.slug}): ${d.description}`,
  ).join("\n")

  const categories = getCategories()
    .map((c) => `- [${c.name}](${base}/blog/category/${c.slug}): ${c.count} post${c.count === 1 ? "" : "s"}.`)
    .join("\n")

  const posts = getAllPosts()
    .map((p) => `- [${p.title}](${base}/blog/${p.slug}): ${p.description}`)
    .join("\n")

  const body = `# ${siteConfig.name}

> ${siteConfig.description} ${siteConfig.tagline}.

${
    isKitSite
      ? `${siteConfig.name} is an open-source, production-ready SaaS starter kit. It ships with authentication, Stripe billing, a Postgres database via Prisma, a file-based blog and docs, transactional email and a full dashboard, so you can launch a real product without wiring the plumbing yourself.`
      : `${siteConfig.name} is a SaaS product. Visitors can read about it here, sign up for an account, choose a plan and manage their subscription. Replace this paragraph with a short description of what you do and who you do it for.`
  }

## Documentation
${docs}

## Product
- [Home](${base}/): What ${siteConfig.name} is and who it is for.
- [Pricing](${base}/pricing): Plans and what each tier includes.
- [Changelog](${base}/changelog): Notable changes across releases (current version ${siteConfig.version}).
- [About](${base}/about): What ${siteConfig.name} is for and the thinking behind it.
- [Contact](${base}/contact): How to reach the team.${repo ? `\n- [Source code](${repo}): The public source repository.` : ""}

## Blog
- [Blog](${base}/blog): Articles and product updates.
${categories}

## Optional
${posts}
- [Privacy policy](${base}/privacy): How user data is handled.
- [Terms of service](${base}/terms): Terms that govern use of the site.
- [Cookie policy](${base}/cookies): Cookies used by the site.
`

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}

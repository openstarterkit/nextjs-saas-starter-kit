# Blog & content

The kit ships a file-based blog: every post is an `.mdx` (or `.md`) file in `content/blog/`, and publishing is a git commit. No database, no CMS, no external service.

## Writing a post

Create a file in `content/blog/`. The filename becomes the URL slug (`content/blog/my-post.mdx` serves at `/blog/my-post`). Frontmatter carries the metadata:

```mdx
---
title: "My first post"
description: "Shows up in the index, in search results and in the RSS feed."
date: "2026-08-01"
category: "Product"
---

Your content here. Markdown and GFM tables work, and because these are MDX
files you can import and render React components too.
```

Required frontmatter fields are `title`, `description`, `date` and `category`. `cover` and `updated` are optional. A missing required field throws a build-time error rather than shipping a broken card. Reading time is computed for you, and posts are sorted newest first.

## Cover images

Add an optional `cover`:

```mdx
cover: "/blog/covers/my-post.svg"
```

It shows as a thumbnail on the blog index and as a banner at the top of the post. Posts without a `cover` render fine as text-only.

The example posts ship vector covers that pick up your accent color. The sources live in `content/blog/covers/*.svg`, drawn in neutral grays with two placeholders, `__ACCENT_1__` and `__ACCENT_2__`, and a route fills those in from your brand before serving them under `/blog/covers/`. So the kit ships grayscale, and setting `NEXT_PUBLIC_BRAND_PRIMARY` (plus `_2`) repaints all of them at once, with no file to redraw. They are a few hundred bytes each, stay sharp on any screen and carry no license.

Prefer your own artwork? Drop a file in `public/blog/covers/` and point `cover` at it: a static file wins over the route, so photos and exported PNGs work exactly as before.

### Before you swap them for generated images

The covers that ship here are abstract vector shapes: no people, no places, nothing photorealistic. That is worth a thought before you replace them with output from an image model.

From 2 August 2026 the EU AI Act asks whoever publishes AI generated or manipulated content of a certain kind to disclose it. The rule targets content that resembles real people, objects or places and would pass as authentic, so abstract geometry sits outside it and these covers raise no question at all. A photorealistic generated image can sit inside it, and what counts is when the image was generated, so anything you produce from here on is worth a second look.

This is not a reason to avoid generated art and it is not legal advice. It is a heads up that the choice carries a question the shipped covers do not, and that the question becomes yours the moment you deploy. If you would rather not have it, keep the covers as vectors or use your own photographs.

Note this is separate from the social preview: every post also gets a dynamically generated Open Graph image for link unfurls, whether or not it has a cover.

## Categories

`category` is a free-form string. The kit builds a page for each category automatically at `/blog/category/[slug]` and links to it from every post. Keep the set small: two or three categories cover most products.

## Drafts

Add `draft: true` to the frontmatter to keep a post out of the index, the category pages, the RSS feed and the sitemap. It still renders at its direct URL in development so you can preview it.

## RSS

The feed is generated from the same frontmatter and served at `/blog/rss.xml`. It is declared in the blog index metadata, so feed readers discover it automatically.

## SEO

Each post sets its own metadata, a canonical URL, Open Graph tags and an Article JSON-LD block, and gets a dynamically rendered Open Graph image (see `src/app/[locale]/(public)/blog/[slug]/opengraph-image.tsx`). Posts are added to `sitemap.xml` automatically.

### Saying that a post was revised

When you edit a published post, add an `updated` date:

```yaml
date: "2026-08-10"
updated: "2026-08-31"
```

It sets `dateModified` in the article schema and `lastModified` in the sitemap, and shows an "Updated" line next to the publication date. Without it an edit is invisible to a crawler until the next natural visit, and invisible to a reader who is deciding whether a two-month-old guide still applies.

It holds one date, the most recent one. Edit a post three times and you overwrite `updated` each time: there is no history, and the earlier revisions leave no trace.

It deliberately does not change ordering: the blog stays sorted by `date`. Moving `date` forward instead is the shortcut to avoid, because it announces freshness by lying about publication and pushes an old post back to the top of the index.

Set it only when the substance changed, not for a typo or a fixed link. A modification date is a claim, and a site that raises it on every small edit teaches search engines to stop trusting its dates, sitemap `lastmod` included. The cost of overusing it is not a penalty, it is losing the signal.

An `updated` earlier than `date` fails the build. That pair would ship a `dateModified` before `datePublished`, which is invalid structured data, and a sitemap `lastmod` that moves backwards, and neither of those complains on its own.

## Code blocks

Fences are syntax highlighted at **build time** and ship no JavaScript for it: what reaches the browser is already coloured. Both themes are written into the markup as CSS variables, so dark mode switches with the rest of the page, with no second render and no flash.

Name the file a snippet comes from and the block gets a header, with an icon for the file type and the copy button beside it:

````
```ts title="src/lib/auth.ts"
export const auth = betterAuth({ ... })
```
````

`filename="..."` works the same way. Without either, the block looks as it always did, with the copy button in the corner. The copy button is always visible rather than appearing on hover, because a control that only exists under a pointer does not exist at all on a phone.

The same applies to the guides in `docs/`, which run through the same highlighter. One thing to weigh there: GitHub renders those files too and ignores the title, so a fence whose first line is a `// path/to/file` comment keeps that comment rather than moving it into the header, and the name survives in both places.

The languages are the ones imported in `src/lib/shiki.ts`. A fence in any other renders as plain text instead of failing, and adding one is adding its import to that list.

## Where the code lives

| File | Role |
|---|---|
| `src/lib/blog.ts` | Reads and parses the files, exposes `getAllPosts`, `getPost`, `getCategories` |
| `src/app/[locale]/(public)/blog/` | Index, post page, category page and the RSS route |
| `content/blog/` | Your posts |

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

Required frontmatter fields are `title`, `description`, `date` and `category`. `cover` is optional. A missing required field throws a build-time error rather than shipping a broken card. Reading time is computed for you, and posts are sorted newest first.

## Cover images

Add an optional `cover`:

```mdx
cover: "/blog/covers/my-post.svg"
```

It shows as a thumbnail on the blog index and as a banner at the top of the post. Posts without a `cover` render fine as text-only.

The example posts ship vector covers that pick up your accent color. The sources live in `content/blog/covers/*.svg`, drawn in neutral grays with two placeholders, `__ACCENT_1__` and `__ACCENT_2__`, and a route fills those in from your brand before serving them under `/blog/covers/`. So the kit ships grayscale, and setting `NEXT_PUBLIC_BRAND_PRIMARY` (plus `_2`) repaints all of them at once, with no file to redraw. They are a few hundred bytes each, stay sharp on any screen and carry no license.

Prefer your own artwork? Drop a file in `public/blog/covers/` and point `cover` at it: a static file wins over the route, so photos and exported PNGs work exactly as before.

Note this is separate from the social preview: every post also gets a dynamically generated Open Graph image for link unfurls, whether or not it has a cover.

## Categories

`category` is a free-form string. The kit builds a page for each category automatically at `/blog/category/[slug]` and links to it from every post. Keep the set small: two or three categories cover most products.

## Drafts

Add `draft: true` to the frontmatter to keep a post out of the index, the category pages, the RSS feed and the sitemap. It still renders at its direct URL in development so you can preview it.

## RSS

The feed is generated from the same frontmatter and served at `/blog/rss.xml`. It is declared in the blog index metadata, so feed readers discover it automatically.

## SEO

Each post sets its own metadata, a canonical URL, Open Graph tags and an Article JSON-LD block, and gets a dynamically rendered Open Graph image (see `src/app/(public)/blog/[slug]/opengraph-image.tsx`). Posts are added to `sitemap.xml` automatically.

## Where the code lives

| File | Role |
|---|---|
| `src/lib/blog.ts` | Reads and parses the files, exposes `getAllPosts`, `getPost`, `getCategories` |
| `src/app/(public)/blog/` | Index, post page, category page and the RSS route |
| `content/blog/` | Your posts |

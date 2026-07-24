import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { categorySlug, formatPostDate, type Post } from "@/lib/blog"

/**
 * Vertical blog card: cover on top (full width), metadata and title below.
 * Used in the blog index and category grids.
 */
export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group flex flex-col">
      <Link
        href={`/blog/${post.slug}/`}
        className="block overflow-hidden rounded-xl border border-border transition-colors group-hover:border-primary/40"
      >
        {post.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt=""
            loading="lazy"
            className="aspect-[1200/630] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="aspect-[1200/630] w-full bg-muted" />
        )}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        <Link href={`/blog/category/${categorySlug(post.category)}/`}>
          <Badge variant="secondary">{post.category}</Badge>
        </Link>
        <span>{post.readingMinutes} min read</span>
      </div>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
        <Link href={`/blog/${post.slug}/`} className="group-hover:text-primary">
          {post.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
    </article>
  )
}

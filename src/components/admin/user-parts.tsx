import type { getFormatter } from "next-intl/server"

/** Shared by the admin overview (the waitlist) and the users page. */

// Takes the formatter instead of hardcoding "en-US": this runs at module
// scope, so it cannot reach the request locale on its own.
type Formatter = Awaited<ReturnType<typeof getFormatter>>

export function formatJoined(format: Formatter, date: Date) {
  return format.dateTime(new Date(date), {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function UserAvatar({
  image,
  name,
  email,
}: {
  image: string | null
  name: string | null
  email: string
}) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" className="h-8 w-8 shrink-0 rounded-full" />
  ) : (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
      {name?.[0] ?? email[0].toUpperCase()}
    </div>
  )
}

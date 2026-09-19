import { headers } from "next/headers"
import { getFormatter, getTranslations } from "next-intl/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revokeSession, revokeOtherSessions } from "@/app/actions/sessions"
import { Badge } from "@/components/ui/badge"
import { PendingButton } from "@/components/auth/pending-button"
import { formatDevice, formatIpAddress } from "@/lib/user-agent"

/**
 * Every device currently signed in to this account.
 *
 * Since 2.0 a session is a row carrying the IP address and user agent it was
 * created with, so this page needed no new storage: it is the first thing that
 * schema change bought, made visible.
 *
 * Note what is NOT rendered, and now not even loaded: the session token. The
 * list sends ids to the server actions, which look the token up themselves
 * (src/app/actions/sessions.ts).
 *
 * The rows are read here with Prisma rather than through the library's
 * `listSessions`, which requires a session created less than `freshAge` ago
 * (a day by default) and answers "Session is not fresh" otherwise. That is the
 * right rule for ending a session, and the wrong one for looking at the list:
 * this card exists for the moment somebody suspects a device is not theirs,
 * which is never within a day of signing in. Reading our own rows, scoped to
 * the caller, is the same answer without that condition. Ending a session still
 * goes through the library, which does not ask for a fresh session.
 */
export async function ActiveSessions() {
  const t = await getTranslations("dashboard.settings.sessions")
  const format = await getFormatter()
  const requestHeaders = await headers()

  const current = await auth.api.getSession({ headers: requestHeaders })
  if (!current) return null

  // Expired rows are still rows until something deletes them, and a device that
  // cannot sign in is not an active session.
  const sessions = await prisma.session.findMany({
    where: { userId: current.user.id, expiresAt: { gt: new Date() } },
    select: { id: true, createdAt: true, ipAddress: true, userAgent: true },
    orderBy: { createdAt: "desc" },
  })

  // Newest first, and the one you are reading this on pinned to the top: it is
  // the row people look for to orient themselves before judging the others.
  const currentId = current.session.id
  const ordered = [...sessions].sort((a, b) => {
    if (a.id === currentId) return -1
    if (b.id === currentId) return 1
    return 0
  })

  const others = ordered.filter((s) => s.id !== currentId).length

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">{t("blurb")}</p>

      <ul className="divide-y divide-border">
        {ordered.map((session) => {
          const isCurrent = session.id === currentId
          const device = formatDevice(session.userAgent)
          const ip = formatIpAddress(session.ipAddress)

          return (
            <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{device ?? t("unknownDevice")}</span>
                  {isCurrent && <Badge variant="secondary">{t("thisDevice")}</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format.dateTime(new Date(session.createdAt), {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {ip && ` · ${ip}`}
                </p>
              </div>

              {!isCurrent && (
                <form action={revokeSession}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <PendingButton className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    {t("revoke")}
                  </PendingButton>
                </form>
              )}
            </li>
          )
        })}
      </ul>

      {others > 0 && (
        <form action={revokeOtherSessions}>
          <PendingButton className="rounded-full border border-destructive/30 px-4 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/5">
            {t("revokeOthers", { count: others })}
          </PendingButton>
        </form>
      )}

      {/* The honest caveat, in the same spirit as the rate limiting note in the
          docs: `cookieCache` means a revoked session can survive on another
          device for up to a minute. Saying so is better than someone testing it
          and concluding the button does not work. */}
      <p className="text-xs text-muted-foreground">{t("caveat")}</p>
    </div>
  )
}

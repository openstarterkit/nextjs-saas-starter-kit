import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getFormatter, getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { PendingButton } from "@/components/auth/pending-button"
import { linkProvider, unlinkProvider, updatePassword } from "@/app/actions/account"

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
}

// Feedback codes set by the account actions (src/app/actions/account.ts).
// The code decides the styling, the copy comes from the message file.
const MESSAGE_IS_ERROR: Record<string, boolean> = {
  unlinked: false,
  password: false,
  "last-method": true,
  unlink: true,
  policy: true,
  current: true,
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const t = await getTranslations("dashboard.settings")
  const format = await getFormatter()
  const { ok, error } = await searchParams
  // The code arrives in the query string, so an unknown one shows nothing
  // rather than throwing on a missing key.
  const code = error ?? ok ?? ""
  const message = code in MESSAGE_IS_ERROR ? { text: t(`messages.${code}`), error: MESSAGE_IS_ERROR[code] } : null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      passwordHash: true,
      accounts: { select: { id: true, provider: true } },
    },
  })

  if (!user) redirect("/login")

  const hasPassword = !!user.passwordHash
  const linked = new Map(user.accounts.map((a) => [a.provider, a.id]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {message && (
        <p
          className={`rounded-lg border px-4 py-2.5 text-sm ${
            message.error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          {message.text}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("profileTitle")}</CardTitle>
          <CardDescription>{t("profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} email={user.email} image={user.image} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("methodsTitle")}</CardTitle>
          <CardDescription>
            {t("methodsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {Object.entries(PROVIDER_LABELS).map(([provider, label]) => {
            const accountId = linked.get(provider)
            return (
              <div key={provider} className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label}</span>
                  {accountId && <Badge variant="secondary">{t("connected")}</Badge>}
                </div>
                {accountId ? (
                  <form action={unlinkProvider}>
                    <input type="hidden" name="accountId" value={accountId} />
                    <PendingButton className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      {t("disconnect")}
                    </PendingButton>
                  </form>
                ) : (
                  <form action={linkProvider}>
                    <input type="hidden" name="provider" value={provider} />
                    <PendingButton className="rounded-full border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5">
                      {t("connect")}
                    </PendingButton>
                  </form>
                )}
              </div>
            )
          })}

          <div className="pt-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-medium">{t("password")}</span>
              {hasPassword ? (
                <Badge variant="secondary">{t("passwordSet")}</Badge>
              ) : (
                <Badge variant="outline">{t("passwordNotSet")}</Badge>
              )}
            </div>
            <form action={updatePassword} className="flex flex-col gap-2 sm:max-w-sm">
              {hasPassword && (
                <Input
                  name="currentPassword"
                  type="password"
                  placeholder={t("currentPasswordPlaceholder")}
                  autoComplete="current-password"
                  required
                />
              )}
              <Input
                name="password"
                type="password"
                placeholder={hasPassword ? t("newPasswordPlaceholder") : t("setPasswordPlaceholder")}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
              />
              <PendingButton className="self-start rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:shadow-soft disabled:pointer-events-none disabled:opacity-80">
                {hasPassword ? t("changePassword") : t("setPassword")}
              </PendingButton>
            </form>
            {!hasPassword && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("passwordHint")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("accountTitle")}</CardTitle>
          <CardDescription>{t("accountDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground">{t("email")}</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("memberSince")}</span>
            <span className="font-medium">
              {format.dateTime(new Date(user.createdAt), {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

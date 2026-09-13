import { requireUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getFormatter, getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { DeleteAccount } from "@/components/dashboard/delete-account"
import { TwoFactorCard } from "@/components/settings/two-factor-card"
import { ActiveSessions } from "@/components/settings/active-sessions"
import { PendingButton } from "@/components/auth/pending-button"
import { changeEmail, linkProvider, unlinkProvider, updatePassword } from "@/app/actions/account"

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
}

// Feedback codes set by the account actions (src/app/actions/account.ts).
// The code decides the styling, the copy comes from the message file.
const MESSAGE_IS_ERROR: Record<string, boolean> = {
  unlinked: false,
  password: false,
  "2fa-enabled": false,
  "2fa-disabled": false,
  "2fa-password": true,
  "email-sent": false,
  "email-invalid": true,
  "email-same": true,
  "email-change": true,
  rate: true,
  "session-revoked": false,
  "sessions-revoked": false,
  session: true,
  // Not an error: a sign-in that spent a backup code and says so.
  "backup-used": false,
  "last-method": true,
  demo: true,
  confirm: true,
  subscription: true,
  "last-admin": true,
  unlink: true,
  policy: true,
  current: true,
}

/**
 * The settings surface itself, without a container.
 *
 * It renders in two places: the page at /dashboard/settings, and the modal that
 * intercepts that same URL when it is opened from inside the app. Keeping it
 * here means the two can never drift, and it is why the page still exists at
 * all: eight account actions redirect back to that URL with a result code, and
 * linking a provider leaves the app entirely for the OAuth round trip. A modal
 * is gone by the time either of those comes back.
 */
export async function SettingsView({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const currentUser = await requireUser()

  const t = await getTranslations("dashboard.settings")
  const format = await getFormatter()
  const { ok, error } = await searchParams
  // The code arrives in the query string, so an unknown one shows nothing
  // rather than throwing on a missing key.
  const code = error ?? ok ?? ""
  const message = code in MESSAGE_IS_ERROR ? { text: t(`messages.${code}`), error: MESSAGE_IS_ERROR[code] } : null

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      twoFactorEnabled: true,
      accounts: { select: { id: true, providerId: true } },
    },
  })

  if (!user) redirect("/login")

  // Since 2.0 the password is a row in Account, not a column on User, so
  // "has a password" and "which providers are linked" are both read from the
  // same list instead of from two different places.
  const hasPassword = user.accounts.some((a) => a.providerId === "credential")
  const linked = new Map(user.accounts.map((a) => [a.providerId, a.id]))
  // The photo, when there is one, came from the provider the account was
  // created with. First linked one is the best guess the schema allows: the
  // adapter does not record which account supplied the image.
  // Skipping the credential row matters here: since 2.0 the password is an
  // Account too, and it would otherwise be picked as the source of a photo it
  // cannot have supplied.
  const firstOAuth = user.accounts.find((a) => a.providerId !== "credential")
  const avatarProvider = firstOAuth ? PROVIDER_LABELS[firstOAuth.providerId] : undefined

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
          <ProfileForm
            name={user.name}
            email={user.email}
            image={user.image}
            avatarProvider={avatarProvider}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("methodsTitle")}</CardTitle>
          <CardDescription>{t("methodsDescription")}</CardDescription>
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

          {/* The address lives with the other ways in, not with the display
              name: it is a credential, and changing it is a two-step round trip
              rather than a field you save. Its own form, because the profile
              form cannot contain another one. */}
          <div className="border-b border-border pb-4">
            <Label htmlFor="new-email" className="font-medium">{t("email.label")}</Label>
            <p className="mt-1 max-w-prose text-xs text-muted-foreground">{t("email.hint")}</p>
            <form action={changeEmail} className="mt-2 flex flex-wrap items-center gap-2">
              <Input
                id="new-email"
                name="email"
                type="email"
                placeholder={t("email.placeholder")}
                className="h-9 w-full sm:w-64"
                required
              />
              <PendingButton className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                {t("email.submit")}
              </PendingButton>
            </form>
          </div>

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

      {/* Between the sign-in methods and the account facts, because that is
          where someone looking for it looks: it belongs to how you get in. */}
      <Card>
        <CardHeader>
          <CardTitle>{t("twoFactor.title")}</CardTitle>
          <CardDescription>{t("twoFactor.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorCard
            enabled={user.twoFactorEnabled}
            hasPassword={hasPassword}
            isDemo={process.env.DEMO_MODE === "true"}
          />
        </CardContent>
      </Card>

      {/* After the second factor, because both answer the same question — who
          can get in — and this one is the evidence for it. */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sessions.title")}</CardTitle>
          <CardDescription>{t("sessions.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ActiveSessions />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("accountTitle")}</CardTitle>
          <CardDescription>{t("accountDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
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

      {/* Same shape as the danger zone on a project: its own card with a
          destructive title, rather than a box nested inside another section. */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive">{t("dangerZone.title")}</CardTitle>
          <CardDescription>{t("dangerZone.blurb")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-prose">
            <p className="text-sm font-medium text-foreground">{t("deleteAccount.heading")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("deleteAccount.blurb")}</p>
          </div>
          <DeleteAccount email={user.email} />
        </CardContent>
      </Card>
    </div>
  )
}

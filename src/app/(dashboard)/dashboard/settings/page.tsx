import { auth } from "@/auth"
import { redirect } from "next/navigation"
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
const MESSAGES: Record<string, { text: string; error: boolean }> = {
  unlinked: { text: "Account disconnected.", error: false },
  password: { text: "Password updated.", error: false },
  "last-method": {
    text: "You can't disconnect your only sign-in method. Set a password first.",
    error: true,
  },
  unlink: { text: "That account could not be disconnected.", error: true },
  policy: { text: "Passwords must be 8 to 72 characters.", error: true },
  current: { text: "The current password you entered is wrong.", error: true },
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { ok, error } = await searchParams
  const message = MESSAGES[error ?? ok ?? ""] ?? null

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
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account preferences.</p>
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
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and view account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} email={user.email} image={user.image} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign-in methods</CardTitle>
          <CardDescription>
            Connect multiple ways to sign in to the same account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {Object.entries(PROVIDER_LABELS).map(([provider, label]) => {
            const accountId = linked.get(provider)
            return (
              <div key={provider} className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label}</span>
                  {accountId && <Badge variant="secondary">Connected</Badge>}
                </div>
                {accountId ? (
                  <form action={unlinkProvider}>
                    <input type="hidden" name="accountId" value={accountId} />
                    <PendingButton className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      Disconnect
                    </PendingButton>
                  </form>
                ) : (
                  <form action={linkProvider}>
                    <input type="hidden" name="provider" value={provider} />
                    <PendingButton className="rounded-full border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5">
                      Connect
                    </PendingButton>
                  </form>
                )}
              </div>
            )
          })}

          <div className="pt-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-medium">Password</span>
              {hasPassword ? (
                <Badge variant="secondary">Set</Badge>
              ) : (
                <Badge variant="outline">Not set</Badge>
              )}
            </div>
            <form action={updatePassword} className="flex flex-col gap-2 sm:max-w-sm">
              {hasPassword && (
                <Input
                  name="currentPassword"
                  type="password"
                  placeholder="Current password"
                  autoComplete="current-password"
                  required
                />
              )}
              <Input
                name="password"
                type="password"
                placeholder={hasPassword ? "New password (min 8 characters)" : "Set a password (min 8 characters)"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
              />
              <PendingButton className="self-start rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:shadow-soft disabled:pointer-events-none disabled:opacity-80">
                {hasPassword ? "Change password" : "Set password"}
              </PendingButton>
            </form>
            {!hasPassword && (
              <p className="mt-2 text-xs text-muted-foreground">
                With a password set you can sign in even without your OAuth providers.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Account information and metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
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

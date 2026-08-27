"use client"

import { useTranslations } from "next-intl"

import { useActionState, useEffect } from "react"
import { updateProfile, type ProfileState } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/components/ui/sonner"

interface ProfileFormProps {
  name: string | null
  email: string
  image: string | null
  /**
   * Label of the provider the photo came from, when the account was created
   * through one. Nothing in the kit writes `image` afterwards: not the profile
   * action, which only updates the name, and not linking a provider later. So
   * this line describes where the photo came from and promises nothing else.
   */
  avatarProvider?: string
}

export function ProfileForm({ name, email, image, avatarProvider }: ProfileFormProps) {
  const t = useTranslations("dashboard.profile")
  const [state, action, isPending] = useActionState<ProfileState, FormData>(updateProfile, {})

  useEffect(() => {
    if (state.success) toast.success(t("updated"))
    else if (state.error) toast.error(state.error)
  }, [state, t])

  return (
    <form action={action} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {image ? <AvatarImage src={image} alt={name ?? t("avatarAlt")} /> : null}
          <AvatarFallback className="text-xl">{name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">
          {image
            ? avatarProvider
              ? t("avatarFrom", { provider: avatarProvider })
              : t("avatarCurrent")
            : t("avatarNone")}
        </p>
      </div>

      {/* Read-only on purpose: the address identifies the account and is one of
          the ways to sign in, so changing it needs a verified round trip to the
          new inbox rather than a text field. Shown as a disabled control rather
          than plain text, so it is clear that this is the value and that it is
          not editable here. */}
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">{t("displayName")}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name ?? ""}
          placeholder={t("namePlaceholder")}
          error={state.error}
          maxLength={50}
        />
      </div>

      <Button type="submit" loading={isPending} className="w-full sm:w-auto">
        {t("save")}
      </Button>
    </form>
  )
}

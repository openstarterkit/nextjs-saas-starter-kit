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
}

export function ProfileForm({ name, email, image }: ProfileFormProps) {
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
        <div>
          <p className="text-sm font-medium text-foreground">{email}</p>
          <p className="text-xs text-muted-foreground">Connected via OAuth - avatar managed by provider</p>
        </div>
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
        Save changes
      </Button>
    </form>
  )
}

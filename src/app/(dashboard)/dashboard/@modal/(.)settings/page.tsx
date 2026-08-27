import { getTranslations } from "next-intl/server"

import { RouteModal } from "@/components/settings/route-modal"
import { SettingsView } from "@/components/settings/settings-view"

/**
 * Settings, opened as a modal when the link is followed from inside the app.
 *
 * The page at the same URL stays exactly where it was and is what a direct
 * visit, a refresh, and every redirect from the account actions render. That
 * matters most for linking a provider, which leaves the application for the
 * OAuth round trip: a modal is long gone by the time the browser comes back.
 */
export default async function SettingsModal({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const t = await getTranslations("dashboard.settings")

  return (
    <RouteModal title={t("title")}>
      <SettingsView searchParams={searchParams} />
    </RouteModal>
  )
}

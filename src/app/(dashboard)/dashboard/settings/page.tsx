import { SettingsView } from "@/components/settings/settings-view"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <SettingsView searchParams={searchParams} />
    </div>
  )
}

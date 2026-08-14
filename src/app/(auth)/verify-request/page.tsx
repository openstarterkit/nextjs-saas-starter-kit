import Link from "next/link"
import { useTranslations } from "next-intl"
import { LogoMark } from "@/components/logo"

// Landing page after a magic link (or signup verification) email is sent.
// Configured as pages.verifyRequest in src/auth.ts.
export default function VerifyRequestPage() {
  const t = useTranslations("auth.verifyRequest")
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-border bg-card/80 p-8 text-center shadow-[var(--shadow-soft-lg)] backdrop-blur-xl">
        <div className="mb-4 flex justify-center">
          <LogoMark className="h-12 w-12 rounded-2xl ring-1 ring-primary/15" iconClassName="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("body")}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          {/* The link is part of the sentence, so it stays inside the message.
              Handing a translator three fragments to reassemble is how word
              order breaks in languages that do not follow English. */}
          {t.rich("spam", {
            retry: (chunks) => (
              <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  )
}

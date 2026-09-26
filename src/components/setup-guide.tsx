import { getTranslations } from "next-intl/server"
import { CodeBlock } from "@/components/blog/code-block"
import type { SetupStep } from "@/lib/setup-status"

/**
 * The first page of a fresh clone, until the database is ready: three steps,
 * with the one you are on marked. It replaces the landing rather than sitting
 * on it, because at this point the landing has nothing to show: its plans come
 * from the database.
 *
 * It does not repeat the guide. It says where you are and links to
 * `/docs/getting-started`, which every clone serves from its own `docs/`
 * folder, so this works offline and there is one text to keep right.
 *
 * Rendered only in development: see `pendingSetup()`.
 */
export async function SetupGuide({ step }: { step: SetupStep }) {
  const t = await getTranslations("setup")
  const current = step === "migrations" ? 2 : 1
  // An address that was refused is a mistake to correct, not the next thing to
  // do: in the same colours as the other steps it reads as "carry on".
  const failed = step === "database-unreachable"
  const currentStepClass = failed
    ? "rounded-lg border-2 border-destructive bg-destructive/10 p-5"
    : "rounded-lg border border-primary/40 bg-primary/5 p-5"

  const steps = [
    {
      title: t("step1Title"),
      body: step === "database-unreachable" ? t("step1Unreachable") : t("step1Body"),
      // Said here because this is the step where the file gets edited, and a
      // page that does not change after an edit reads as a broken page.
      note: t("step1Note"),
      // The one command of this step, and only while it is the missing piece:
      // with an address already set and refused, generating a secret is noise.
      command:
        step === "database-unreachable"
          ? null
          : 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64url\'))"',
    },
    {
      title: t("step2Title"),
      body: t("step2Body"),
      // The warning Node prints on the connection string Neon hands out, said
      // where it gets read: in the dev overlay it looks like a failure, and
      // it is not one.
      note: t("step2Note"),
      command: "npx prisma migrate deploy\nnpx prisma db seed",
    },
    { title: t("step3Title"), body: t("step3Body"), command: "npm run dev" },
  ]

  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>

      <ol className="mt-10 space-y-6">
        {steps.map((s, i) => {
          const n = i + 1
          const state = n < current ? "done" : n === current ? "current" : "next"
          return (
            <li
              key={s.title}
              className={
                state === "current" ? currentStepClass : "rounded-lg border border-border p-5 opacity-70"
              }
            >
              <div className="flex items-center gap-3">
                <span
                  className={
                    state === "done"
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                      : state === "current" && failed
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-destructive/20 text-xs font-semibold text-destructive"
                        : "flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                  }
                >
                  {state === "done" ? "✓" : n}
                </span>
                <h2 className="font-semibold">{s.title}</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              {"note" in s && s.note && (
                <p className="mt-2 text-xs text-muted-foreground">{s.note}</p>
              )}
              {state === "current" && s.command && (
                // The same block the docs use, so the command can be copied
                // instead of retyped. With a label it grows a header bar, and
                // the copy button sits there instead of over the command.
                <div className="mt-3">
                  <CodeBlock data-filename="terminal" className="overflow-x-auto bg-muted p-3 text-xs">
                    <code>{s.command}</code>
                  </CodeBlock>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <p className="mt-8 text-sm">
        {/* The published guide, in a new tab: it is the canonical one, and a
            release publishes it together with the code, so it says what this
            version says. The same text also ships in the clone, at
            docs/getting-started.md. */}
        <a
          href="https://openstarterkit.dev/docs/getting-started"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          {t("guideCta")}
        </a>
      </p>
      <p className="mt-6 text-xs text-muted-foreground">{t("devOnly")}</p>
    </section>
  )
}

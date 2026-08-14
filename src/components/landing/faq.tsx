import { useTranslations } from "next-intl"
import { siteConfig } from "@/config/site"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Reveal } from "@/components/landing/reveal"

type Faq = { question: string; answer: string }

/**
 * Placeholder FAQ: four questions a visitor actually asks before signing up
 * for a SaaS, one per area (getting started, paying, privacy, support).
 * Answer them for your product, in your words, and add your own. Every answer
 * below is true of the kit as it ships, so nothing here oversells until you
 * change it.
 */


/**
 * `withJsonLd` emits the FAQPage structured data that can earn an expandable
 * result in search. Pass it on **one** page only — the questions are the same
 * everywhere this section appears, and repeating the markup across pages
 * gives search engines the same FAQ under several URLs.
 */
export function FAQ({ withJsonLd = false }: { withJsonLd?: boolean }) {
  const t = useTranslations("faq")
  // The list itself differs per deployment, so it comes from the messages
  // rather than a constant sized to whichever branch happens to be longer.
  //
  // `t.raw` returns the message untouched, so `{site}` is substituted here the
  // way the transactional emails do it. Reading each answer with `t()` instead
  // would interpolate on its own, but it would turn one list into a numbered
  // family of keys and lose the count that drives this section.
  const items = (t.raw("items") as Faq[]).map((faq) => ({
    question: faq.question.replaceAll("{site}", siteConfig.name),
    answer: faq.answer.replaceAll("{site}", siteConfig.name),
  }))
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }

  return (
    <section id="faq" className="py-24">
      {withJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
        </Reveal>

        <Reveal>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {items.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-border bg-card px-5 shadow-soft transition-shadow data-[state=open]:shadow-[var(--shadow-soft-lg)]"
              >
                <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}

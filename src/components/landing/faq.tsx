import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Reveal } from "@/components/landing/reveal"
import { siteConfig } from "@/config/site"

const faqs = [
  {
    question: "What exactly do I get?",
    answer:
      "You get a production-ready Next.js 16 codebase with Auth.js, Stripe, Prisma, and Tailwind pre-configured. Clone the repo, set your env variables, and deploy. Everything works out of the box.",
  },
  {
    question: "Why not ShipFast or Makerkit?",
    answer:
      `${siteConfig.name} uses a best-of-breed stack where every component is independent. No Supabase lock-in, no proprietary auth layer. If a dependency releases a breaking change, you update one package — not the entire stack.`,
  },
  {
    question: "Which database providers are supported?",
    answer:
      "Any PostgreSQL provider: Neon (recommended — cheapest), Supabase, Railway, PlanetScale (via Postgres mode), or self-hosted. Just set your DATABASE_URL and run the migration.",
  },
  {
    question: "Do I need a Stripe account?",
    answer:
      "Yes. Stripe is used for subscription payments. You'll need to create products and prices in your Stripe dashboard and add the price IDs to your env vars. The setup guide covers this step by step.",
  },
  {
    question: "Can I use this for client projects?",
    answer:
      "Yes — MIT license. Use it for as many projects as you want, including client work. No per-project fees.",
  },
  {
    question: "What if I need help or find a bug?",
    answer:
      "Open an issue on GitHub. It's open source, so you get every update and bug fix by pulling the latest main. For direct support, reach out via email.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-border bg-background px-5 shadow-soft transition-shadow data-[state=open]:shadow-[var(--shadow-soft-lg)]"
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

import {
  Lock,
  CreditCard,
  Database,
  Moon,
  ShieldCheck,
  Crown,
  Rocket,
  Unlock,
  Mail,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Reveal } from "@/components/landing/reveal"
import { TechStack } from "@/components/landing/tech-stack"

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Lock,
    title: "Auth out of the box",
    description:
      "Google and GitHub OAuth with Auth.js v5. Sessions stored in your own database. No third-party auth service required.",
  },
  {
    icon: CreditCard,
    title: "Stripe payments",
    description:
      "Subscription checkout, webhooks, and Customer Portal. Handles upgrades, downgrades, and cancellations automatically.",
  },
  {
    icon: Database,
    title: "Prisma + PostgreSQL",
    description:
      "Type-safe database layer with Prisma 7. Works with Neon, Supabase, Railway, or any PostgreSQL provider.",
  },
  {
    icon: Moon,
    title: "Dark mode",
    description:
      "System-aware dark mode with a toggle. Tailwind 4 CSS variables let you customize your brand colors in one file.",
  },
  {
    icon: ShieldCheck,
    title: "Route protection",
    description:
      "Middleware-based auth guards. Public, auth, dashboard, and admin route groups with zero boilerplate per page.",
  },
  {
    icon: Crown,
    title: "Admin panel",
    description:
      "User management with role-based access. View all users, their plans, and subscription status in one place.",
  },
  {
    icon: Rocket,
    title: "1-click Vercel deploy",
    description:
      "Deploy button in the README. From clone to production in under an hour, plus a built-in demo mode to showcase your product, like this site's live demo.",
  },
  {
    icon: Unlock,
    title: "No vendor lock-in",
    description:
      "Every component is independent. Swap auth, database, or email provider without touching the rest of the codebase.",
  },
  {
    icon: Mail,
    title: "Transactional emails",
    description:
      "Welcome, receipt, and password reset emails via Resend. React Email templates included, branded and responsive.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to ship
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Stop reinventing auth and payments. Start building your product.
          </p>
        </Reveal>

        <TechStack className="mb-14" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <Reveal key={feature.title} delay={(i % 3) * 80}>
                <Card className="group h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-glow)]">
                  <CardHeader>
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary-2/10 text-primary ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

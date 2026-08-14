import {
  Lock,
  CreditCard,
  Database,
  Moon,
  ShieldCheck,
  Crown,
  Rocket,
  FileCode,
  Mail,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Reveal } from "@/components/landing/reveal"
import { TechStack } from "@/components/landing/tech-stack"
import { useTranslations } from "next-intl"
import { isKitSite } from "@/config/kit"

type Feature = { icon: LucideIcon; key: string }

/**
 * Placeholder feature grid, written from your customer's point of view.
 * Every card here describes something the kit actually does, so the copy is
 * honest before you touch it: rewrite each one in terms of your product.
 *
 * Six of them, two full rows: enough to show the pattern without pretending
 * to be your feature list. Add a third row if your product needs one.
 */
const productFeatures: Feature[] = [
  { icon: Lock, key: "c1" },
  { icon: CreditCard, key: "c2" },
  { icon: Database, key: "c3" },
  { icon: Moon, key: "c4" },
  { icon: ShieldCheck, key: "c5" },
  { icon: Crown, key: "c6" },
]

/** The kit's own site (KIT_SITE="true"): what a developer gets by cloning. */
const kitFeatures: Feature[] = [
  { icon: Lock, key: "c1" },
  { icon: CreditCard, key: "c2" },
  { icon: Database, key: "c3" },
  { icon: Moon, key: "c4" },
  { icon: ShieldCheck, key: "c5" },
  { icon: Crown, key: "c6" },
  { icon: Rocket, key: "c7" },
  { icon: FileCode, key: "c8" },
  { icon: Mail, key: "c9" },
]

const features = isKitSite ? kitFeatures : productFeatures


export function Features() {
  const t = useTranslations("features")
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className={isKitSite ? "mb-10 text-center" : "mb-14 text-center"}>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </Reveal>

        {/* The "built with" logo strip belongs to the kit's own site, where the
            stack is the product. In your app it would advertise our
            dependencies instead of what you do, so it stays off. */}
        {isKitSite && <TechStack className="mb-14" />}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <Reveal key={feature.key} delay={(i % 3) * 80}>
                <Card className="group h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-glow)]">
                  <CardHeader>
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary-2/10 text-primary ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{t(`${feature.key}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {t(`${feature.key}.description`)}
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

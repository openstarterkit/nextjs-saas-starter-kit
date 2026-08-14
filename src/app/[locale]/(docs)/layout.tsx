import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { BackToTop } from "@/components/landing/back-to-top"
import { DemoBanner } from "@/components/landing/demo-banner"
import { StickyHeader } from "@/components/landing/sticky-header"

/**
 * Shell for the guide pages.
 *
 * Identical to the `(public)` one, footer included: the docs index sits in
 * that group and so had the site footer, while every guide ended on a bare
 * page. The two groups exist to give the index the marketing footer and the
 * guides a wider column, not to give them different endings.
 */
export default function DocsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <StickyHeader>
        <DemoBanner />
        <Navbar />
      </StickyHeader>
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  )
}

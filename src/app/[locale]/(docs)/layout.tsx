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
 *
 * The 12% zoom from 2xl up is the same too. Without it, opening a guide from
 * the index shrank the whole page, menu included, as if the browser had zoomed
 * out.
 */
export default function DocsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col 2xl:min-h-[calc(100vh/1.12)] 2xl:[zoom:1.12]">
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

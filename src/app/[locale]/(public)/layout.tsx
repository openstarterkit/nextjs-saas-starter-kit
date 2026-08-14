import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { BackToTop } from "@/components/landing/back-to-top"
import { DemoBanner } from "@/components/landing/demo-banner"
import { StickyHeader } from "@/components/landing/sticky-header"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
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

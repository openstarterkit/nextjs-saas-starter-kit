import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { BackToTop } from "@/components/landing/back-to-top"
import { DemoBanner } from "@/components/landing/demo-banner"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-50">
        <DemoBanner />
        <Navbar />
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  )
}

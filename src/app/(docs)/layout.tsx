import { Navbar } from "@/components/landing/navbar"
import { BackToTop } from "@/components/landing/back-to-top"
import { DemoBanner } from "@/components/landing/demo-banner"

export default function DocsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <BackToTop />
    </div>
  )
}

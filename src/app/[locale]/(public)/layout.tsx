import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { BackToTop } from "@/components/landing/back-to-top"
import { DemoBanner } from "@/components/landing/demo-banner"
import { StickyHeader } from "@/components/landing/sticky-header"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    // From 2xl (1536px) up the public pages grow as a whole, 12%, so on a
    // 1920 monitor the content spans about 1230px instead of 1096 and every
    // alignment between menu, hero, sections and footer stays as it is.
    // `zoom` scales vh too, hence the divided minimum height.
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

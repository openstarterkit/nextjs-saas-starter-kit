import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SessionProvider } from "@/components/auth/session-provider"
import { Toaster } from "@/components/ui/sonner"
import { siteConfig } from "@/config/site"
import { brandOverrideCss } from "@/config/brand"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: siteConfig.description,
}

// Applies the stored/system theme before first paint — inline and blocking
// on purpose, so a dark-mode visitor never sees a light flash.
const themeInit =
  "(function(){var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()"

// Same trick for the dashboard sidebar: restore the collapsed state before
// first paint (toggled by SidebarCollapseToggle, styled via the
// `sidebar-collapsed:` variant).
const sidebarInit =
  "try{if(localStorage.getItem('sidebar-collapsed')==='1')document.documentElement.classList.add('sidebar-collapsed')}catch(e){}"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandCss = brandOverrideCss()
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: `${themeInit};${sidebarInit}` }} />
        {brandCss && <style dangerouslySetInnerHTML={{ __html: brandCss }} />}
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

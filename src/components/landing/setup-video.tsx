"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Reveal } from "@/components/landing/reveal"

/**
 * The kit's own site only (KIT_SITE="true"): a recording of a fresh clone
 * going from `git clone` to the dashboard, looping across the full width of
 * the feature grid above it.
 *
 * The video file is not in this repository. It lives on the kit's site
 * deployment alone, so a clone does not download a few megabytes of our
 * marketing, and this section never renders there anyway.
 *
 * MP4 (H.264) only, on purpose: a VP9 WebM of the same clip failed in Chrome
 * on Windows with PIPELINE_ERROR_DECODE, and after a decode error the browser
 * does not fall back to the next <source>. It stayed on the first frame.
 *
 * The video loads only when the section is about to scroll into view, so it
 * does not compete with the hero for bandwidth, and it does not start on its
 * own for people who asked their system for reduced motion: they get the
 * poster and the guide.
 */

const VIDEO = {
  mp4: "/videos/quick-setup.mp4",
  poster: "/videos/quick-setup-poster.webp",
}

export function SetupVideo() {
  const t = useTranslations("setupVideo")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [load, setLoad] = useState(false)

  // Attach the source only when the section is close to the viewport.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: "300px 0px" }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  // Once the source is in, play and keep looping.
  useEffect(() => {
    const video = videoRef.current
    if (!load || !video) return
    video.load()
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    video.play().catch(() => {
      // Autoplay refused (data saver, battery saver): the poster stays.
    })
  }, [load])

  return (
    <section id="setup" className="py-24">
      {/* The same container as the feature grid above, so the video lines up
          with the cards. */}
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <Reveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("title")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
        </Reveal>

        <Reveal delay={100}>
          <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-glow)]">
            <video
              ref={videoRef}
              className="block aspect-[8/5] w-full bg-secondary"
              poster={VIDEO.poster}
              muted
              loop
              playsInline
              preload="none"
              aria-label={t("videoLabel")}
            >
              {load && <source src={VIDEO.mp4} type="video/mp4" />}
            </video>
          </div>
        </Reveal>

        <Reveal className="mt-8 text-center">
          <Link
            href="/docs/getting-started"
            className="group inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("guide")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

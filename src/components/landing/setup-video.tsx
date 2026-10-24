"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ArrowRight, Pause, Play } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Reveal } from "@/components/landing/reveal"
import { cn } from "@/lib/utils"

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
 * does not compete with the hero for bandwidth, and then plays on its own, for
 * everyone. A click anywhere on it pauses it and a second click resumes it, as
 * on a video site, and a play button shows while it is paused: that is what
 * lets anyone stop moving content (WCAG 2.2.2). Reduced motion does not hold
 * it back any more: it is common on low-end PCs, where Windows animations are
 * off for speed, and there the video simply never started. Battery or data
 * saver can still refuse autoplay, and then the play button is the way in.
 */

const VIDEO = {
  mp4: "/videos/quick-setup.mp4",
  poster: "/videos/quick-setup-poster.webp",
}

export function SetupVideo() {
  const t = useTranslations("setupVideo")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [load, setLoad] = useState(false)
  const [playing, setPlaying] = useState(false)

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

  function toggle() {
    const video = videoRef.current
    if (!video) return
    if (!load) setLoad(true)
    if (video.paused) void video.play().catch(() => {})
    else video.pause()
  }

  // Once the source is in, play and keep looping.
  useEffect(() => {
    const video = videoRef.current
    if (!load || !video) return
    video.load()
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
          <div className="relative overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-glow)]">
            <video
              ref={videoRef}
              className="block aspect-[8/5] w-full bg-secondary"
              poster={VIDEO.poster}
              muted
              loop
              playsInline
              preload="none"
              aria-label={t("videoLabel")}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            >
              {load && <source src={VIDEO.mp4} type="video/mp4" />}
            </video>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? t("pause") : t("play")}
              className={cn(
                "group absolute inset-0 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                playing ? "bg-transparent" : "bg-black/10 hover:bg-black/20"
              )}
            >
              {/* Play while paused; pause only under the pointer or the keyboard
                  focus while it plays, so the moving video stays clean. */}
              <span
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-white backdrop-blur-sm transition-opacity duration-200 sm:h-20 sm:w-20",
                  playing && "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                )}
              >
                {playing ? (
                  <Pause className="h-7 w-7 fill-current sm:h-8 sm:w-8" />
                ) : (
                  <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
                )}
              </span>
            </button>
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

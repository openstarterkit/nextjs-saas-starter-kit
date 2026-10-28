"use client"

import { Suspense, useEffect, useState, useSyncExternalStore } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { BrandLoader } from "@/components/ui/spinner"

/**
 * One loading state for every page change in the app: the page dims like it
 * does behind a dialog, and the brand loader sits in the middle.
 *
 * Two things start it:
 *
 *   - a `loading.tsx` boundary, which renders <RouteLoading />. This is the
 *     one that shows on the very first load too, before any script runs;
 *   - a click on a link into the app (/dashboard, /admin), or back and
 *     forward, for the pages with no boundary of their own, where the old
 *     page used to sit there with no sign that anything was happening.
 *
 * Both draw the same overlay, and never two at once: while a boundary is on
 * screen the link overlay steps aside. It waits a moment before appearing, so
 * a page that is already in the cache opens without a flash.
 *
 * Every other page change gets a thin bar across the top instead: the public
 * pages (docs, blog, changelog) and links that leave for another site in the
 * same tab, like the live demo. Those are rendered on request and take from a
 * quarter of a second to a few seconds on a cold start, and without a sign the
 * click looks lost. A bar, not the overlay: the page you are reading stays
 * readable while the next one comes.
 */

/** Paths whose links get the overlay; every other page change gets the bar. */
const APP_PATHS = ["/dashboard", "/admin"]
const isAppPath = (pathname: string) =>
  APP_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
/** Below this a page change reads as instant, and an overlay would only flicker. */
const SHOW_AFTER_MS = 120
/** A navigation that never lands (offline, an error) must not lock the page. */
const GIVE_UP_AFTER_MS = 10_000

// ─── Shared state ───────────────────────────────────────────────────────────

// A link navigation is pending from the click to the new URL; it becomes
// visible only after SHOW_AFTER_MS. The timers live here, next to the state,
// so the component only reads it.
let linkPending = false
let linkVisible = false
let linkKind: "overlay" | "bar" = "overlay"
let showTimer: ReturnType<typeof setTimeout> | undefined
let giveUpTimer: ReturnType<typeof setTimeout> | undefined
let boundaries = 0
// The path the app last rendered, to tell a real page change from a history
// step that lands on the page already on screen.
let renderedPath: string | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function startLink(kind: "overlay" | "bar" = "overlay") {
  if (linkPending) return
  linkPending = true
  linkKind = kind
  showTimer = setTimeout(() => {
    linkVisible = true
    emit()
  }, SHOW_AFTER_MS)
  giveUpTimer = setTimeout(endLink, GIVE_UP_AFTER_MS)
}

function endLink() {
  clearTimeout(showTimer)
  clearTimeout(giveUpTimer)
  if (!linkPending) return
  linkPending = false
  linkVisible = false
  emit()
}

// ─── The overlay ────────────────────────────────────────────────────────────

/**
 * The dim of a dialog's overlay (src/components/ui/dialog.tsx), with the
 * loader in the middle. Exported for anything else that makes the
 * user wait for a whole page, so every wait in the app looks the same.
 */
export function LoadingOverlay({ label, animate = true }: { label?: string; animate?: boolean }) {
  return (
    <div
      data-loading-overlay
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]",
        animate && "animate-in fade-in-0 duration-200"
      )}
    >
      {/* The label in white: it sits on the dim, in light mode as in dark. */}
      {/* Without the ring: on the dim, the turning logo head is enough. */}
      {/* will-change: the turning head on a layer of its own. Without it Chrome
          redraws the strip of the screen around it every frame, and in dark
          mode that strip comes out a shade off the rest of the dim: a band
          across the page, visible on a large screen. */}
      <BrandLoader label={label} ring={false} className="min-h-0 will-change-transform [&_p]:text-white/90" />
    </div>
  )
}

/**
 * For `loading.tsx`: the overlay, rendered on the server so it is there on
 * the first load as well. Without a fade when a link overlay was already up,
 * so the hand-over between the two does not blink.
 */
export function RouteLoading({ label }: { label?: string }) {
  const [continued] = useState(() => linkVisible)
  useEffect(() => {
    boundaries++
    emit()
    return () => {
      boundaries--
      emit()
    }
  }, [])
  return <LoadingOverlay label={label} animate={!continued} />
}

/**
 * What a click on this anchor needs: the overlay for a page of the app, the bar
 * for any other page change in this tab, nothing when no page loads.
 */
function navigationKind(event: MouseEvent, anchor: HTMLAnchorElement): "overlay" | "bar" | null {
  if (event.defaultPrevented || event.button !== 0) return null
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null
  if (anchor.target && anchor.target !== "_self") return null
  if (anchor.hasAttribute("download")) return null
  const url = new URL(anchor.href, window.location.href)
  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  // Another site in this tab, like the demo: this page stays until it answers.
  if (url.origin !== window.location.origin) return "bar"
  // Same page, or only the hash changes: nothing loads.
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null
  return isAppPath(url.pathname) ? "overlay" : "bar"
}

/**
 * A thin bar across the top that fills while the next page comes, in the
 * brand gradient. It slows down as it goes and never reaches the end on its
 * own: the new page arriving is what ends it. Without motion for people who
 * asked for less, it simply shows.
 */
function ProgressBar() {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden"
    >
      <div className="h-full w-[85%] origin-left [background-image:var(--gradient-brand)] shadow-[0_0_8px_var(--color-primary)] motion-safe:animate-route-progress" />
    </div>
  )
}

function LinkNavigationOverlay() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const visible = useSyncExternalStore(subscribe, () => linkVisible, () => false)
  const boundaryShown = useSyncExternalStore(subscribe, () => boundaries > 0, () => false)

  // Links: started on the click, in the capture phase so a handler that stops
  // propagation further down cannot hide it from us.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      const kind = navigationKind(event, anchor)
      if (kind) startLink(kind)
    }
    // Back from another site restores this page from the browser's cache,
    // with the bar still up from the click that left it.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) endLink()
    }
    // Back and forward: the URL has already changed when this fires, and the
    // page follows. Only when the page on screen is a different one: closing
    // the settings modal is a step back too (route-modal.tsx), and it lands
    // on the dashboard that is already rendered, so nothing would come to
    // end the wait.
    const onPopState = () => {
      const path = window.location.pathname
      if (path !== renderedPath) startLink(isAppPath(path) ? "overlay" : "bar")
    }
    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    window.addEventListener("pageshow", onPageShow)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener("pageshow", onPageShow)
    }
  }, [])

  // Done when the URL has changed: the new page is the one rendering.
  useEffect(() => {
    renderedPath = pathname
    endLink()
  }, [pathname, searchParams])

  if (!visible) return null
  if (linkKind === "bar") return <ProgressBar />
  return boundaryShown ? null : <LoadingOverlay />
}

/** Mounted once, in the root layout. */
export function NavigationOverlay() {
  // useSearchParams needs a Suspense boundary of its own.
  return (
    <Suspense fallback={null}>
      <LinkNavigationOverlay />
    </Suspense>
  )
}

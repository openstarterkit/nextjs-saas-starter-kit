"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

/**
 * Shell for a route rendered as a modal by an intercepting route.
 *
 * It opens on mount, because reaching this component already means the route
 * was navigated to, and closing goes back in history rather than flipping a
 * local flag: the modal *is* the URL, so dismissing it has to leave that URL
 * the way the browser back button would.
 *
 * The title is passed in and visually hidden. The surface inside already shows
 * its own heading, but a dialog without an accessible name is announced as an
 * unlabelled group, so screen reader users would not be told what opened.
 */
export function RouteModal({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && router.back()}>
      {/* Two jobs, two elements. The shell keeps the rounded corners and clips
          whatever reaches them; the scrolling happens one level in. Scrolling
          the shell itself paints the native scrollbar, which is a rectangle,
          over its own rounded edge and squares off the right corners.
          `scrollbar-gutter: stable` reserves the track from the start, so the
          content does not shift sideways the moment it grows past one screen. */}
      <DialogContent
        ref={contentRef}
        className="overflow-hidden p-0 sm:max-w-3xl"
        // A dialog moves focus inside itself on open, and by default that means
        // the first field. Here the first field is the display name, already
        // filled: focused with its text selected, one keystroke replaces the
        // name the person came in with.
        //
        // The fix is not to suppress the focus move, which would leave the
        // keyboard behind the open dialog. Focus goes to the dialog itself
        // instead: it is announced, Escape and Tab work from there, and nothing
        // is selected. A form whose first field is empty, like new project,
        // still wants the caret in it and is left alone.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          contentRef.current?.focus()
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="max-h-[85vh] overflow-y-auto p-6 [scrollbar-color:var(--border)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

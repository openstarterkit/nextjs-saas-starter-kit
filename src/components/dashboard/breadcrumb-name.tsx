"use client"

import { useEffect, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"

/**
 * How a page with a name of its own (a project, a guide) tells the header
 * breadcrumbs what to call it. The header sits in the layout and cannot read
 * the page's data, and an id in the address is not a name: the page renders
 * <BreadcrumbName name={project.name} /> and the header picks it up.
 *
 * A tiny store keyed by the path, so a name never outlives its page: leaving
 * the page takes it out again. The URL path here, not the rendered one the
 * header reads: useRenderedPathname answers relative to the layout that calls
 * it, so from inside a page it would be a shorter path than the header's. The
 * two agree everywhere except under the Settings modal, which names nothing.
 */
const store = {
  names: new Map<string, string>(),
  listeners: new Set<() => void>(),
  set(path: string, name: string) {
    this.names.set(path, name)
    this.listeners.forEach((listener) => listener())
  },
  clear(path: string, name: string) {
    if (this.names.get(path) === name) this.names.delete(path)
    this.listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    store.listeners.add(listener)
    return () => store.listeners.delete(listener)
  },
}

export function BreadcrumbName({ name }: { name: string }) {
  const path = usePathname()
  useEffect(() => {
    store.set(path, name)
    return () => store.clear(path, name)
  }, [path, name])
  return null
}

export function useBreadcrumbName(path: string): string | undefined {
  return useSyncExternalStore(
    store.subscribe,
    () => store.names.get(path),
    () => undefined
  )
}

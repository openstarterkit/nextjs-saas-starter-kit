/**
 * Slim amber notice for the email-dependent auth pages (signup, password
 * reset): tells demo visitors why the flow is disconnected there, and
 * self-hosters what to wire up. Copy is provided by each page.
 */
export function AuthNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-700 dark:text-amber-400">
      {children}
    </div>
  )
}

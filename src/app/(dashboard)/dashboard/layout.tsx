/**
 * Holds the parallel slot the settings modal renders into.
 *
 * `modal` is empty on every route except an intercepted one, where Next fills
 * it with the intercepting page. A slot needs a `default.tsx` to say what
 * "empty" looks like, otherwise a refresh on any other route fails to resolve
 * it.
 */
export default function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}

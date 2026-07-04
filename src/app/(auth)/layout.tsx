export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/40">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-glow" />
      <div className="relative w-full max-w-md px-4">{children}</div>
    </div>
  )
}

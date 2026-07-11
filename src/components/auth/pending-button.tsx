"use client"

import { useFormStatus } from "react-dom"
import { Spinner } from "@/components/ui/spinner"

/**
 * Submit button that shows a spinner while its parent form's server action
 * runs — OAuth redirects and demo sign-in take a moment, and a silent click
 * reads as broken.
 */
export function PendingButton({
  className,
  children,
  disabled,
  formAction,
  formNoValidate,
}: {
  className?: string
  children: React.ReactNode
  disabled?: boolean
  /** Alternative server action for this button within a shared form. */
  formAction?: string | ((formData: FormData) => void | Promise<void>)
  formNoValidate?: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      formAction={formAction}
      formNoValidate={formNoValidate}
      disabled={disabled || pending}
      aria-busy={pending}
      className={className}
    >
      {pending ? <Spinner className="h-[18px] w-[18px]" /> : children}
    </button>
  )
}

/**
 * What every call to Resend goes through, because the SDK does not throw when
 * Resend refuses a message: it resolves with `{ data: null, error }`, and its
 * own logging is switched off in production. Without this, an email refused
 * for an unverified sending domain, an exhausted quota or a suppressed
 * recipient leaves no trace anywhere, and the page that sent it says it went.
 *
 * It logs and reports instead of throwing, and that is deliberate. Four flows
 * answer the same way whether or not an address is registered (password reset,
 * magic link, change of email, newsletter signup), so an exception here would
 * either change that answer, which tells a caller who has an account, or be
 * swallowed by the catch that keeps it uniform. The log is written here, where
 * no caller's catch can eat it, and the one caller that has to tell the person
 * (the contact form) reads the boolean.
 *
 * The recipient is never logged. Callers never hand it over, and anything that
 * looks like an address in Resend's own message is masked, because some of its
 * validation errors quote the address back.
 */

/** The part of a Resend SDK response this looks at. */
export type ResendOutcome = {
  error: { name?: string; message?: string; statusCode?: number | null } | null
}

const ADDRESS = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g

/** Replaces anything shaped like an email address with a placeholder. */
export function maskAddresses(text: string): string {
  return text.replace(ADDRESS, "[address]")
}

/**
 * Runs one Resend call and says whether Resend accepted it.
 *
 * `kind` names the email in the log line, which is what someone reading the
 * logs searches for. `whenRefused` is an instruction for that person, for the
 * one refusal that needs a human: a contact who unsubscribed and is still in
 * the audience.
 *
 * An exception thrown by `send` (no API key, the network) is not caught here.
 * Those already reach the caller's catch, and changing that path is not what
 * this is for.
 */
export async function deliver(
  kind: string,
  send: () => Promise<ResendOutcome>,
  whenRefused?: string,
): Promise<boolean> {
  const { error } = await send()
  if (!error) return true
  console.error(`[email] ${kind} rejected by Resend`, {
    name: error.name ?? null,
    statusCode: error.statusCode ?? null,
    message: maskAddresses(error.message ?? ""),
    ...(whenRefused ? { todo: whenRefused } : {}),
  })
  return false
}

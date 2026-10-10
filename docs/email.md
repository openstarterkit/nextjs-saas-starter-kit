# Email

The kit sends email for sign-in by link, password reset, the welcome message, receipts and cancellations, the contact form and the newsletter. All of it goes out through one file, [`src/lib/email-transport.ts`](../src/lib/email-transport.ts), and Resend is the default provider.

## With Resend (the default)

Set two variables, described in [Configuration](./configuration.md):

| Variable | Notes |
|---|---|
| `RESEND_API_KEY` | Turns email on. Without it the sign-in link and password reset hide themselves, and nothing is sent. |
| `EMAIL_FROM` | The sender, e.g. `"YourApp <hello@yourdomain.com>"`. The domain must be verified in Resend. |

Nothing else to do.

## Bring your own provider

Two functions in `src/lib/email-transport.ts` are the whole contract between the kit and the provider:

- **`emailEnabled()`** answers *is email set up?*. The sign-in page, sign-up, password reset, the Stripe webhook and the welcome email all ask it.
- **`sendEmail({ kind, to, subject, html, replyTo })`** sends one email and returns `true` when the provider accepted it.

Replace their bodies and every email follows. Keep three behaviours, because the rest of the kit relies on them:

1. **Return `false` when the provider refuses a message, do not throw.** Password reset, sign-in by link, change of email and the newsletter answer the same way whether or not an address exists; an exception would change that answer and tell a stranger who has an account.
2. **Log the refusal, never the recipient.** `deliver()` in [`src/lib/email-delivery.ts`](../src/lib/email-delivery.ts) does this for Resend and masks anything shaped like an address; reuse `maskAddresses()` from the same file.
3. **Throw when the provider is not configured at all.** Callers check `emailEnabled()` first, so this only happens on a real misconfiguration, where an error is what you want.

Two things stay Resend's own and simply switch off with another provider: mirroring newsletter subscribers onto a Resend Audience (`RESEND_AUDIENCE_ID`, see [Newsletter](./newsletter.md)), and the `re_` format check on `RESEND_API_KEY` in `src/lib/env.ts`. Add your own variables to `.env.example` and, if you want the boot to fail on a half configuration, to `src/lib/env.ts`.

### Example: SMTP with Nodemailer

Any mailbox or service that speaks SMTP: your host's mail server, Gmail with an app password, Amazon SES over SMTP, Mailgun, Brevo.

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

```env
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT="587"
SMTP_USER="hello@yourdomain.com"
SMTP_PASS="..."
EMAIL_FROM="YourApp <hello@yourdomain.com>"
```

```ts title="src/lib/email-transport.ts"
import { siteConfig } from "@/config/site"
import { maskAddresses } from "@/lib/email-delivery"

export function emailEnabled(): boolean {
  return !!process.env.SMTP_HOST
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? `${siteConfig.name} <${siteConfig.contactEmail}>`

export type OutgoingEmail = { kind: string; to: string; subject: string; html: string; replyTo?: string }

export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST is not set")
  const { createTransport } = await import("nodemailer")
  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  try {
    await transport.sendMail({
      from: EMAIL_FROM,
      to: email.to,
      replyTo: email.replyTo,
      subject: email.subject,
      html: email.html,
    })
    return true
  } catch (error) {
    // The server said no: an unknown mailbox, a rejected sender, a quota.
    console.error(`[email] ${email.kind} rejected by the SMTP server`, {
      message: maskAddresses(error instanceof Error ? error.message : String(error)),
    })
    return false
  }
}

// Only used by the Resend Audience sync, which stays off without RESEND_AUDIENCE_ID.
export async function resendClient(): Promise<never> {
  throw new Error("Resend is not the email provider")
}
```

One difference from an HTTP API: SMTP reports a network failure and a refusal through the same exception. The example treats both as a refusal and returns `false`, which keeps the uniform answers above; the log line tells you which one it was.

### Example: an HTTP API (Postmark)

Most providers are one `fetch` away, with no SDK. Postmark, for instance:

```env
POSTMARK_SERVER_TOKEN="..."
EMAIL_FROM="YourApp <hello@yourdomain.com>"
```

```ts title="src/lib/email-transport.ts (sendEmail only)"
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const token = process.env.POSTMARK_SERVER_TOKEN
  if (!token) throw new Error("POSTMARK_SERVER_TOKEN is not set")
  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: EMAIL_FROM,
      To: email.to,
      ReplyTo: email.replyTo,
      Subject: email.subject,
      HtmlBody: email.html,
      MessageStream: "outbound",
    }),
  })
  if (response.ok) return true
  const body = await response.json().catch(() => ({}))
  console.error(`[email] ${email.kind} rejected by Postmark`, {
    status: response.status,
    message: maskAddresses(String(body.Message ?? "")),
  })
  return false
}
```

with `emailEnabled()` returning `!!process.env.POSTMARK_SERVER_TOKEN`. The same shape works for SendGrid, Mailgun, Brevo or SES: only the URL, the header and the field names change.

### Check it

Request a password reset for your own address on `/forgot-password`, and sign up with a new address: the reset link and the welcome email are the two that exercise the whole path. A refusal shows up in the server log as `[email] <kind> rejected by ...`.

## Text messages (SMS)

The kit sends no text messages and has no sign-in by phone number. If your product needs one, Better Auth's [phone number plugin](https://www.better-auth.com/docs/plugins/phone-number) adds it: you register the plugin in `src/auth.ts`, run the migration it needs, and send the code yourself in its `sendOTP` callback, through Twilio or any SMS provider, following the same idea as `sendEmail()` above.

Before you turn it on, two things the plugin cannot do for you:

- **Limit who can make you send a message.** Every SMS costs money, and bots request codes in bulk towards premium numbers (*SMS pumping*) so that you pay for them. Rate limit by number and by address (the kit's `checkRateLimit()` in `src/lib/rate-limit.ts` is a start), and allow only the countries you actually serve.
- **Keep it out of two-factor.** A phone number can be taken over with a swapped SIM. The kit already has two-factor with an authenticator app, which is stronger: use text messages to verify a number or to sign in, not as a second factor.

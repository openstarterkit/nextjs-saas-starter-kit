import { Resend } from "resend"
import { siteConfig } from "@/config/site"
import { emailAccent } from "@/config/brand"
import { isKitSite } from "@/config/kit"

let _instance: Resend | null = null

function getInstance(): Resend {
  if (!_instance) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error("RESEND_API_KEY is not set")
    _instance = new Resend(key)
  }
  return _instance
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? `${siteConfig.name} <${siteConfig.contactEmail}>`

export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Welcome to ${siteConfig.name}!`,
    html: welcomeTemplate(name),
  })
}

export async function sendSubscriptionConfirmation(
  to: string,
  name: string,
  planName: string,
  amount: number,
  currency: string,
  renewalDate: string
) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your ${planName} subscription is active`,
    html: subscriptionTemplate(name, planName, amount, currency, renewalDate),
  })
}

export async function sendPurchaseConfirmation(
  to: string,
  name: string,
  planName: string,
  amount: number,
  currency: string
) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your ${planName} purchase is confirmed`,
    html: purchaseTemplate(name, planName, amount, currency),
  })
}

export async function sendMagicLinkEmail(to: string, url: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Sign in to ${siteConfig.name}`,
    html: magicLinkTemplate(url),
  })
}

export async function sendPasswordResetEmail(to: string, url: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Reset your ${siteConfig.name} password`,
    html: passwordResetTemplate(url),
  })
}

export async function sendSubscriptionCancelledEmail(to: string, name: string, endDate: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your ${siteConfig.name} subscription has been cancelled`,
    html: cancellationTemplate(name, endDate),
  })
}

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
  .header { background: ${emailAccent}; padding: 32px 40px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
  .body { padding: 40px; color: #1e293b; }
  .body p { margin: 0 0 16px; line-height: 1.6; font-size: 15px; color: #475569; }
  .highlight { background: #f1f5f9; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
  .highlight p { margin: 4px 0; font-size: 14px; }
  .highlight strong { color: #0f172a; }
  .btn { display: inline-block; background: ${emailAccent}; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; }
  .footer { padding: 24px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
  .footer p { margin: 0; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>⚡ ${siteConfig.name}</h1>
    <p>${siteConfig.tagline}</p>
  </div>
  <div class="body">
    ${content}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} ${siteConfig.name} · <a href="${siteConfig.url}" style="color:#94a3b8">${siteConfig.url.replace(/^https?:\/\//, "")}</a></p>
  </div>
</div>
</body>
</html>`
}

function welcomeTemplate(name: string) {
  return baseTemplate(`
    <p>Hey ${name || "there"} 👋</p>
    ${
      isKitSite
        ? `<p>Welcome to ${siteConfig.name}! Your account is ready. You're now part of a community of developers shipping SaaS products faster.</p>
    <p>Here's what you can do right now:</p>
    <div class="highlight">
      <p>🔐 <strong>Authentication</strong>: Google & GitHub OAuth, fully configured</p>
      <p>💳 <strong>Billing</strong>: Stripe checkout ready to go</p>
      <p>📊 <strong>Dashboard</strong>: Track your subscription and account</p>
    </div>`
        : `<p>Welcome to ${siteConfig.name}! Your account is ready and there is nothing left to set up.</p>
    <p>Here's what you can do right now:</p>
    <div class="highlight">
      <p>📁 <strong>Start a project</strong>: create your first one and invite your team</p>
      <p>⚙️ <strong>Make it yours</strong>: add your name and preferences in settings</p>
      <p>💳 <strong>Pick a plan</strong>: upgrade when you need more, cancel any time</p>
    </div>`
    }
    <p>Ready to dive in?</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Go to Dashboard →</a>
    <p style="margin-top:24px">If you have any questions, just reply to this email. We're happy to help.</p>
  `)
}

function magicLinkTemplate(url: string) {
  return baseTemplate(`
    <p>Hey there 👋</p>
    <p>Click the button below to sign in to ${siteConfig.name}. The link is valid for 15 minutes and can be used once.</p>
    <a href="${url}" class="btn">Sign in to ${siteConfig.name} →</a>
    <p style="margin-top:24px">If you didn't request this email, you can safely ignore it: nothing happens unless the link is clicked.</p>
  `)
}

function passwordResetTemplate(url: string) {
  return baseTemplate(`
    <p>Hey there,</p>
    <p>We received a request to reset your ${siteConfig.name} password. Click the button below to choose a new one. The link is valid for 30 minutes and can be used once.</p>
    <a href="${url}" class="btn">Reset password →</a>
    <p style="margin-top:24px">If you didn't request a password reset, you can safely ignore this email: your password will not change.</p>
  `)
}

function subscriptionTemplate(
  name: string,
  planName: string,
  amount: number,
  currency: string,
  renewalDate: string
) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)

  return baseTemplate(`
    <p>Hey ${name || "there"} 👋</p>
    <p>Your <strong>${planName}</strong> subscription is now active. Thanks for subscribing!</p>
    <div class="highlight">
      <p><strong>Plan:</strong> ${planName}</p>
      <p><strong>Amount:</strong> ${formatted}</p>
      <p><strong>Next renewal:</strong> ${renewalDate}</p>
    </div>
    <p>You have full access to all ${siteConfig.name} features.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" class="btn">Manage Billing →</a>
    <p style="margin-top:24px">Need to make changes? You can manage your subscription anytime from your billing page.</p>
  `)
}

function purchaseTemplate(name: string, planName: string, amount: number, currency: string) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)

  return baseTemplate(`
    <p>Hey ${name || "there"} 👋</p>
    <p>Your <strong>${planName}</strong> purchase is confirmed. It was a one-time payment: no renewals, no recurring billing.</p>
    <div class="highlight">
      <p><strong>Plan:</strong> ${planName}</p>
      <p><strong>Amount:</strong> ${formatted} (one time)</p>
    </div>
    <p>You now have full access to all ${siteConfig.name} features.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" class="btn">View billing →</a>
    <p style="margin-top:24px">Your receipt is available on the billing page. Questions? Just reply to this email.</p>
  `)
}

function cancellationTemplate(name: string, endDate: string) {
  return baseTemplate(`
    <p>Hey ${name || "there"},</p>
    <p>Your ${siteConfig.name} subscription has been cancelled. You'll continue to have access until <strong>${endDate}</strong>.</p>
    <div class="highlight">
      <p>📅 <strong>Access ends:</strong> ${endDate}</p>
      <p>Your data is safe and will remain available.</p>
    </div>
    <p>Changed your mind? You can resubscribe anytime before your access expires.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" class="btn">Resubscribe →</a>
    <p style="margin-top:24px">If you'd like to share feedback on why you cancelled, just reply to this email - we read every response.</p>
  `)
}

// ─── Contact form ───────────────────────────────────────────────────────────

/**
 * Delivers a contact-form message to the site owner. replyTo points at the
 * visitor, so answering is a normal reply. All user input is HTML-escaped:
 * the message lands in an HTML email and must never carry markup through.
 */
export async function sendContactMessage(fromEmail: string, name: string | undefined, message: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to: siteConfig.contactEmail,
    replyTo: fromEmail,
    subject: `Contact form: ${name || fromEmail}`,
    html: contactTemplate(escapeHtml(fromEmail), name ? escapeHtml(name) : undefined, escapeHtml(message)),
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function contactTemplate(email: string, name: string | undefined, message: string) {
  return baseTemplate(`
    <p>New message from the contact form:</p>
    <div class="highlight">
      <p><strong>From:</strong> ${name ? `${name} · ` : ""}${email}</p>
    </div>
    <p style="white-space:pre-wrap">${message}</p>
    <p style="margin-top:24px">Reply to this email to answer directly.</p>
  `)
}

// ─── Newsletter / waitlist (double opt-in) ──────────────────────────────────

export async function sendNewsletterConfirmEmail(to: string, confirmUrl: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Confirm your spot on the ${siteConfig.name} waitlist`,
    html: newsletterConfirmTemplate(confirmUrl),
  })
}

export async function sendNewsletterWelcomeEmail(to: string, unsubscribeUrl: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "You're on the list",
    html: newsletterWelcomeTemplate(unsubscribeUrl),
  })
}

/**
 * Mirrors a confirmed subscriber onto the Resend Audience so issues can be
 * sent as Broadcasts from the Resend dashboard. No-op when
 * RESEND_AUDIENCE_ID is unset: the database list still works on its own.
 */
export async function syncNewsletterContact(email: string) {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) return
  const resend = getInstance()
  await resend.contacts.create({ email, audienceId, unsubscribed: false })
}

export async function removeNewsletterContact(email: string) {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) return
  const resend = getInstance()
  await resend.contacts.remove({ email, audienceId })
}

function newsletterConfirmTemplate(confirmUrl: string) {
  return baseTemplate(`
    <p>You asked to join the ${siteConfig.name} waitlist. Click below to confirm.</p>
    <a href="${confirmUrl}" class="btn">Confirm my spot →</a>
    <p style="margin-top:24px">The link expires in 7 days. If this was not you, just ignore this email and nothing will happen.</p>
  `)
}

function newsletterWelcomeTemplate(unsubscribeUrl: string) {
  // The kit's own waitlist sells the Pro tier; your clone's list promises
  // only what a generic waitlist can: news when there is some.
  //
  // Neither branch promises a cadence, and that is deliberate. A frequency
  // written here is the one the subscriber keeps in their inbox and can hold
  // you to, so only promise what you will still be doing in three months.
  return baseTemplate(`
    <p>You're in. Here is the deal:</p>
    <div class="highlight">
    ${
      isKitSite
        ? `  <p>📬 <strong>One short email</strong> when there is real news on the Pro.</p>
      <p>🎟️ <strong>A launch discount</strong> reserved for early adopters.</p>`
        : `  <p>📬 <strong>One short email</strong> when there is real news to share.</p>
      <p>🎟️ <strong>Early access</strong> when what you signed up for goes live.</p>`
    }
    </div>
    <p>No spam, no daily drip. Unsubscribe anytime with one click.</p>
    <p style="margin-top:24px"><a href="${unsubscribeUrl}" style="color:#94a3b8">Unsubscribe</a></p>
  `)
}

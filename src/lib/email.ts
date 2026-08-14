import { Resend } from "resend"
import { siteConfig } from "@/config/site"
import { emailAccent } from "@/config/brand"
import { getTranslations } from "next-intl/server"
import { routing } from "@/i18n/routing"

/**
 * Subjects for the transactional emails.
 *
 * Resolved against an **explicit** locale, not the request one. These are sent
 * from a Stripe webhook and from Auth.js callbacks: those requests come from a
 * server, not from the recipient's browser, so there is no locale to inherit
 * and asking for one would silently give you the default anyway.
 *
 * Sending in the recipient's own language needs somewhere to store it, which
 * today is nowhere: there is no language column on the user. Add one and pass
 * it here, and the subjects follow without touching this file again.
 */
function emailStrings() {
  return getTranslations({ locale: routing.defaultLocale, namespace: "email" })
}

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
    subject: (await emailStrings())("welcome", { site: siteConfig.name }),
    html: await welcomeTemplate(name),
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
    subject: (await emailStrings())("subscriptionActive", { plan: planName }),
    html: await subscriptionTemplate(name, planName, amount, currency, renewalDate),
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
    subject: (await emailStrings())("purchaseConfirmed", { plan: planName }),
    html: await purchaseTemplate(name, planName, amount, currency),
  })
}

export async function sendMagicLinkEmail(to: string, url: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: (await emailStrings())("magicLink", { site: siteConfig.name }),
    html: await magicLinkTemplate(url),
  })
}

export async function sendPasswordResetEmail(to: string, url: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: (await emailStrings())("passwordReset", { site: siteConfig.name }),
    html: await passwordResetTemplate(url),
  })
}

export async function sendSubscriptionCancelledEmail(to: string, name: string, endDate: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: (await emailStrings())("subscriptionCancelled", { site: siteConfig.name }),
    html: await cancellationTemplate(name, endDate),
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

async function welcomeTemplate(name: string) {
  const t = await emailStrings()
  return baseTemplate(`
    <p>${t("welcomeBody.hello", { name: name || t("welcomeBody.helloFallback") })}</p>
    <p>${t("welcomeBody.intro", { site: siteConfig.name })}</p>
    <p>${t("welcomeBody.whatNext")}</p>
    <div class="highlight">
      ${t.raw("welcomeBody.bullets")}
    </div>
    <p>${t("welcomeBody.ready")}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">${t("welcomeBody.cta")}</a>
    <p style="margin-top:24px">${t("welcomeBody.help")}</p>
  `)
}

async function magicLinkTemplate(url: string) {
  const t = await emailStrings()
  return baseTemplate(`
    <p>${t("magicLinkBody.hello")}</p>
    <p>${t("magicLinkBody.intro", { site: siteConfig.name })}</p>
    <a href="${url}" class="btn">${t("magicLinkBody.cta", { site: siteConfig.name })}</a>
    <p style="margin-top:24px">${t("magicLinkBody.ignore")}</p>
  `)
}

async function passwordResetTemplate(url: string) {
  const t = await emailStrings()
  return baseTemplate(`
    <p>${t("passwordResetBody.hello")}</p>
    <p>${t("passwordResetBody.intro", { site: siteConfig.name })}</p>
    <a href="${url}" class="btn">${t("passwordResetBody.cta")}</a>
    <p style="margin-top:24px">${t("passwordResetBody.ignore")}</p>
  `)
}

async function subscriptionTemplate(
  name: string,
  planName: string,
  amount: number,
  currency: string,
  renewalDate: string
) {
  const t = await emailStrings()
  const formatted = new Intl.NumberFormat(routing.defaultLocale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)

  return baseTemplate(`
    <p>${t("subscriptionBody.hello", { name: name || t("welcomeBody.helloFallback") })}</p>
    <p>${t.raw("subscriptionBody.intro").replace("{plan}", planName)}</p>
    <div class="highlight">
      <p><strong>${t("subscriptionBody.labelPlan")}</strong> ${planName}</p>
      <p><strong>${t("subscriptionBody.labelAmount")}</strong> ${formatted}</p>
      <p><strong>${t("subscriptionBody.labelRenewal")}</strong> ${renewalDate}</p>
    </div>
    <p>${t("subscriptionBody.access", { site: siteConfig.name })}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" class="btn">${t("subscriptionBody.cta")}</a>
    <p style="margin-top:24px">${t("subscriptionBody.changes")}</p>
  `)
}

async function purchaseTemplate(name: string, planName: string, amount: number, currency: string) {
  const t = await emailStrings()
  const formatted = new Intl.NumberFormat(routing.defaultLocale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)

  return baseTemplate(`
    <p>${t("purchaseBody.hello", { name: name || t("welcomeBody.helloFallback") })}</p>
    <p>${t.raw("purchaseBody.intro").replace("{plan}", planName)}</p>
    <div class="highlight">
      <p><strong>${t("purchaseBody.labelPlan")}</strong> ${planName}</p>
      <p><strong>${t("purchaseBody.labelAmount")}</strong> ${formatted} ${t("purchaseBody.oneTime")}</p>
    </div>
    <p>${t("purchaseBody.access", { site: siteConfig.name })}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" class="btn">${t("purchaseBody.cta")}</a>
    <p style="margin-top:24px">${t("purchaseBody.receipt")}</p>
  `)
}

async function cancellationTemplate(name: string, endDate: string) {
  const t = await emailStrings()
  return baseTemplate(`
    <p>${t("cancellationBody.hello", { name: name || t("welcomeBody.helloFallback") })}</p>
    <p>${t.raw("cancellationBody.intro").replace("{site}", siteConfig.name).replace("{date}", endDate)}</p>
    <div class="highlight">
      <p>📅 <strong>${t("cancellationBody.labelEnds")}</strong> ${endDate}</p>
      <p>${t("cancellationBody.dataSafe")}</p>
    </div>
    <p>${t("cancellationBody.changedMind")}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" class="btn">${t("cancellationBody.cta")}</a>
    <p style="margin-top:24px">${t("cancellationBody.feedback")}</p>
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
    subject: (await emailStrings())("contact", { from: name || fromEmail }),
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
    subject: (await emailStrings())("newsletterConfirm", { site: siteConfig.name }),
    html: await newsletterConfirmTemplate(confirmUrl),
  })
}

export async function sendNewsletterWelcomeEmail(to: string, unsubscribeUrl: string) {
  const resend = getInstance()
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: (await emailStrings())("newsletterWelcome"),
    html: await newsletterWelcomeTemplate(unsubscribeUrl),
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

async function newsletterConfirmTemplate(confirmUrl: string) {
  const t = await emailStrings()
  return baseTemplate(`
    <p>${t("newsletterConfirmBody.intro", { site: siteConfig.name })}</p>
    <a href="${confirmUrl}" class="btn">${t("newsletterConfirmBody.cta")}</a>
    <p style="margin-top:24px">${t("newsletterConfirmBody.expiry")}</p>
  `)
}

async function newsletterWelcomeTemplate(unsubscribeUrl: string) {
  // The kit's own waitlist sells the Pro tier; your clone's list promises
  // only what a generic waitlist can: news when there is some.
  //
  // Neither branch promises a cadence, and that is deliberate. A frequency
  // written here is the one the subscriber keeps in their inbox and can hold
  // you to, so only promise what you will still be doing in three months.
  const t = await emailStrings()
  return baseTemplate(`
    <p>${t("newsletterWelcomeBody.intro")}</p>
    <div class="highlight">
      ${t.raw("newsletterWelcomeBody.bullets")}
    </div>
    <p>${t("newsletterWelcomeBody.noSpam")}</p>
    <p style="margin-top:24px"><a href="${unsubscribeUrl}" style="color:#94a3b8">${t("newsletterWelcomeBody.unsubscribe")}</a></p>
  `)
}

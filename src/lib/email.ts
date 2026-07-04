import { Resend } from "resend"
import { siteConfig } from "@/config/site"

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
  .header { background: #2563eb; padding: 32px 40px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
  .body { padding: 40px; color: #1e293b; }
  .body p { margin: 0 0 16px; line-height: 1.6; font-size: 15px; color: #475569; }
  .highlight { background: #f1f5f9; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
  .highlight p { margin: 4px 0; font-size: 14px; }
  .highlight strong { color: #0f172a; }
  .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; }
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
    <p>Welcome to ${siteConfig.name}! Your account is ready. You're now part of a community of developers shipping SaaS products faster.</p>
    <p>Here's what you can do right now:</p>
    <div class="highlight">
      <p>🔐 <strong>Authentication</strong> — Google & GitHub OAuth, fully configured</p>
      <p>💳 <strong>Billing</strong> — Stripe checkout ready to go</p>
      <p>📊 <strong>Dashboard</strong> — Track your subscription and account</p>
    </div>
    <p>Ready to explore?</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Go to Dashboard →</a>
    <p style="margin-top:24px">If you have any questions, just reply to this email. We're happy to help.</p>
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
    <p style="margin-top:24px">If you'd like to share feedback on why you cancelled, just reply to this email — we read every response.</p>
  `)
}

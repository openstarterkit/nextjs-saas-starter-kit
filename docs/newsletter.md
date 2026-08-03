# Newsletter & waitlist

The kit ships a double opt-in mailing list you own in your own database. It powers the pre-launch waitlist on the pricing page, and it is a reusable feature: the list, the confirmation flow and the admin export are yours to keep.

## How it works

1. A visitor submits their email in the signup form. `POST /api/newsletter` validates it (Zod), checks a honeypot field and rate-limits by IP and by email, then stores a `NewsletterSubscriber` row and sends a confirmation email.
2. The confirmation link (`/newsletter/confirm?token=...`) sets `confirmedAt`, sends a welcome email and, if configured, adds the contact to a Resend Audience. Links expire after 7 days.
3. Every email carries a one-click unsubscribe link (`/newsletter/unsubscribe?token=...`) that takes effect immediately.

The API always answers a neutral `200`: whether the address is new, already subscribed or invalid, the response is identical, so the endpoint never reveals who is on the list. Real feedback arrives by email.

## Consent record

`createdAt` (signup request) and `confirmedAt` (completed opt-in) together document the double opt-in for each address. The admin CSV export includes both, so the file doubles as your consent record. The kit deliberately does not store IP addresses: they are personal data you do not need here.

## Sending the emails

The kit does not include a newsletter editor by design. Confirmed subscribers are synced to a Resend Audience, and you send each issue as a Broadcast from the Resend dashboard, which gives you the editor, scheduling, unsubscribe handling and open/click tracking for free.

Nothing sends on its own: there is no cron, no scheduled job, no automation in the kit. An issue goes out when you press send.

One word on the cadence you promise. The signup form, the confirmation page and the welcome email all describe what a subscriber will get, and the kit words them without a frequency on purpose. A cadence is easy to write and hard to keep, and the one in the welcome email is the version that sits in their inbox. Promise what you will still be doing in three months, and if you do commit to a rhythm, change all three together.

Set `RESEND_AUDIENCE_ID` to enable the sync. Without it, the database list still works on its own; only the Resend Audience mirror is skipped.

## Admin

The admin panel (`/admin`) shows the confirmed and pending counts, the most recent signups, and an **Export CSV** button backed by `/api/admin/newsletter-export` (admin-only).

## Demo mode

When `DEMO_MODE="true"` the form stays visible but the API writes nothing and sends no email, the same pattern as checkout.

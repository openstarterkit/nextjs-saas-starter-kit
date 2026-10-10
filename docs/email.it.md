---
title: Email
description: "Resend di default, oppure il tuo provider: SMTP, Postmark, SES."
translated_from: email.md
source_checksum: 83024dcd145f
---

# Email

Il kit invia email per l'accesso con link, il reset della password, il benvenuto, le ricevute e le disdette, il modulo contatti e la newsletter. Tutte escono da un solo file, [`src/lib/email-transport.ts`](../src/lib/email-transport.ts), e il provider di default è Resend.

## Con Resend (il default)

Imposta due variabili, descritte in [Configurazione](./configuration.md):

| Variabile | Note |
|---|---|
| `RESEND_API_KEY` | Accende le email. Senza, l'accesso con link e il reset della password si nascondono, e non parte niente. |
| `EMAIL_FROM` | Il mittente, per esempio `"LaTuaApp <ciao@iltuodominio.com>"`. Il dominio deve essere verificato su Resend. |

Non serve altro.

## Il tuo provider

Due funzioni in `src/lib/email-transport.ts` sono tutto il contratto fra il kit e il provider:

- **`emailEnabled()`** risponde a *le email sono attive?*. Lo chiedono la pagina di accesso, la registrazione, il reset della password, il webhook di Stripe e l'email di benvenuto.
- **`sendEmail({ kind, to, subject, html, replyTo })`** invia un'email e restituisce `true` quando il provider l'ha accettata.

Sostituisci il loro contenuto e tutte le email seguono. Mantieni tre comportamenti, perché il resto del kit ci conta:

1. **Restituisci `false` quando il provider rifiuta un messaggio, non lanciare un errore.** Reset della password, accesso con link, cambio email e newsletter rispondono allo stesso modo che l'indirizzo esista o no; un'eccezione cambierebbe quella risposta e direbbe a uno sconosciuto chi ha un account.
2. **Registra il rifiuto nel log, mai il destinatario.** `deliver()` in [`src/lib/email-delivery.ts`](../src/lib/email-delivery.ts) lo fa per Resend e maschera tutto ciò che sembra un indirizzo; riusa `maskAddresses()` dallo stesso file.
3. **Lancia un errore quando il provider non è configurato del tutto.** Chi chiama controlla prima `emailEnabled()`, quindi succede solo con una configurazione davvero sbagliata, dove un errore è quello che vuoi.

Due cose restano di Resend e con un altro provider semplicemente si spengono: la copia degli iscritti alla newsletter su una Audience di Resend (`RESEND_AUDIENCE_ID`, vedi [Newsletter](./newsletter.md)) e il controllo del formato `re_` di `RESEND_API_KEY` in `src/lib/env.ts`. Aggiungi le tue variabili a `.env.example` e, se vuoi che l'avvio si fermi con una configurazione a metà, a `src/lib/env.ts`.

### Esempio: SMTP con Nodemailer

Qualunque casella o servizio che parla SMTP: il server di posta del tuo hosting, Gmail con una password per le app, Amazon SES via SMTP, Mailgun, Brevo.

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

```env
SMTP_HOST="smtp.iltuoprovider.com"
SMTP_PORT="587"
SMTP_USER="ciao@iltuodominio.com"
SMTP_PASS="..."
EMAIL_FROM="LaTuaApp <ciao@iltuodominio.com>"
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
    // Il server ha detto no: una casella inesistente, un mittente rifiutato, una quota.
    console.error(`[email] ${email.kind} rejected by the SMTP server`, {
      message: maskAddresses(error instanceof Error ? error.message : String(error)),
    })
    return false
  }
}

// Usata solo dalla sincronizzazione con l'Audience di Resend, spenta senza RESEND_AUDIENCE_ID.
export async function resendClient(): Promise<never> {
  throw new Error("Resend is not the email provider")
}
```

Una differenza rispetto a un'API HTTP: SMTP segnala un guasto di rete e un rifiuto con la stessa eccezione. L'esempio li tratta entrambi come un rifiuto e restituisce `false`, il che mantiene le risposte uniformi di cui sopra; la riga di log dice quale dei due era.

### Esempio: un'API HTTP (Postmark)

La maggior parte dei provider è a una `fetch` di distanza, senza SDK. Postmark, per esempio:

```env
POSTMARK_SERVER_TOKEN="..."
EMAIL_FROM="LaTuaApp <ciao@iltuodominio.com>"
```

```ts title="src/lib/email-transport.ts (solo sendEmail)"
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

con `emailEnabled()` che restituisce `!!process.env.POSTMARK_SERVER_TOKEN`. La stessa forma vale per SendGrid, Mailgun, Brevo o SES: cambiano solo l'URL, l'intestazione e i nomi dei campi.

### Verifica

Chiedi un reset della password per il tuo indirizzo su `/forgot-password` e registrati con un indirizzo nuovo: il link di reset e l'email di benvenuto sono le due che percorrono tutta la strada. Un rifiuto compare nel log del server come `[email] <kind> rejected by ...`.

## Messaggi di testo (SMS)

Il kit non invia SMS e non ha l'accesso con il numero di telefono. Se il tuo prodotto ne ha bisogno, il [plugin phone number](https://www.better-auth.com/docs/plugins/phone-number) di Better Auth lo aggiunge: registri il plugin in `src/auth.ts`, esegui la migrazione che richiede e invii tu il codice nella sua callback `sendOTP`, con Twilio o qualunque provider SMS, seguendo la stessa idea della `sendEmail()` qui sopra.

Prima di accenderlo, due cose che il plugin non può fare per te:

- **Limitare chi può farti inviare un messaggio.** Ogni SMS costa, e dei bot chiedono codici a raffica verso numeri a pagamento (*SMS pumping*) perché sia tu a pagarli. Limita i tentativi per numero e per indirizzo (`checkRateLimit()` del kit in `src/lib/rate-limit.ts` è un punto di partenza) e ammetti solo i Paesi che servi davvero.
- **Tenerlo fuori dalla verifica in due passaggi.** Un numero di telefono si può rubare con un duplicato della SIM. Il kit ha già la verifica in due passaggi con un'app di autenticazione, più sicura: usa gli SMS per verificare un numero o per entrare, non come secondo fattore.

---
title: Pagamenti e abbonamenti
description: Abbonamenti, pagamenti una tantum, consumo a metrica e diritti d'accesso.
translated_from: billing.md
source_checksum: c899248002a2
---

# Pagamenti e abbonamenti

Il kit include un'integrazione Stripe completa: abbonamenti ricorrenti, pagamenti una tantum (le offerte a vita) e un esempio a consumo. Tutto gira sul tuo account Stripe e sui tuoi prezzi; i piani inseriti dal seed sono segnaposto da sostituire col listino del tuo prodotto.

## Il modello dei dati

Tre modelli Prisma reggono la fatturazione (vedi `prisma/schema.prisma`):

| Modello | Cosa contiene |
|---|---|
| `Plan` | L'unica fonte di verità per ogni livello vendibile: nome, prezzo, `interval` (`MONTH`, `YEAR` o `ONE_TIME`), l'ID del prezzo su Stripe, le funzioni mostrate sulle schede, e `isActive`. |
| `Subscription` | Una riga per utente abbonato, tenuta allineata dal webhook: stato, periodo corrente, flag di disdetta. |
| `Purchase` | Una riga per pagamento una tantum, creata dal webhook. L'ID del PaymentIntent di Stripe è unico, il che rende innocui i tentativi ripetuti del webhook. |

Per sapere cosa ha un utente, chiama `getEntitlement(userId)` da `src/lib/billing.ts`. Restituisce `lifetime`, `subscription` o `free` (a vita vince quando ci sono entrambi) ed è lo schema da copiare quando devi proteggere una tua funzione:

```ts
import { getEntitlement } from "@/lib/billing"

const entitlement = await getEntitlement(session.user.id)
if (entitlement.kind === "free") {
  // mostra l'invito a passare a un piano
}
```

## Abbonamenti

Il flusso: l'utente sceglie un piano su `/dashboard/billing`, `POST /api/checkout` valida il prezzo contro la tabella `Plan` e apre Stripe Checkout in modalità `subscription`, e il webhook (`/api/webhooks/stripe`) crea o aggiorna la riga `Subscription` quando arriva `checkout.session.completed`. Cambi di piano, disdette e metodi di pagamento li gestisce il Customer Portal di Stripe (`POST /api/billing/portal`): il kit **non** include logica di rateo dentro l'app, di proposito.

Un utente con un abbonamento attivo non può avviare un secondo checkout; l'API risponde 400 e lo manda al portale.

## Pagamenti una tantum

Un piano con `interval: "ONE_TIME"` (il piano «Lifetime» del seed) passa invece dal checkout in modalità `payment`:

1. `POST /api/checkout` crea la sessione con `invoice_creation` attivo, così il pagamento compare nello storico delle fatture e nel portale come qualsiasi fattura di abbonamento.
2. Su `checkout.session.completed` il webhook crea una riga `Purchase`. Gli eventi ripetuti trovano la riga già presente e non fanno nulla.
3. Parte un'email di conferma tramite Resend, quando è configurato.

Rimborsi: su `charge.refunded` il webhook segna l'acquisto come `REFUNDED`, il che toglie il diritto d'accesso. I rimborsi parziali lasciano l'acquisto intatto; solo un rimborso totale lo revoca.

Se chi ha comprato a vita ha anche un vecchio abbonamento, la pagina dei pagamenti glielo segnala suggerendo di disdirlo dal portale. Il kit non lo disdice da solo: è una decisione di prodotto che resta tua.

## Più livelli di prezzo

Le schede su `/dashboard/billing` rendono ogni riga `Plan` attiva, con l'interruttore mensile/annuale quando esistono entrambi gli intervalli e un'etichetta «Pay once» sui piani una tantum. Per cambiare il listino modifichi dati, non componenti: aggiorni `prisma/seed.ts` (o le righe direttamente) e l'interfaccia segue.

Accanto a queste c'è una scheda facoltativa per la vendita assistita, `src/components/billing/enterprise-card.ts`, che non è una riga `Plan` e non avvia nessun checkout. Segue anche lei l'interruttore: imposta il suo blocco `yearly` per mostrare una cifra diversa sul lato annuale, per esempio `$500` «al mese» contro `$5.000` «all'anno». Lascia fuori `yearly` e la scheda dice la stessa cosa da entrambe le parti.

## Fatturazione a consumo

Il kit include un esempio a metrica ridotto all'osso: un aiuto `recordUsage()`, un piano «Pay as you go» disattivo nel seed, e questa guida. Per accenderlo:

1. **Crea un Billing Meter** nel pannello Stripe (Billing → Meters → Create meter). Imposta il nome dell'evento su `api_request`, o uno tuo, e l'aggregazione su Sum.
2. **Crea un prezzo a consumo**: sul tuo prodotto aggiungi un prezzo ricorrente, scegli «Usage-based» e seleziona il meter. Copia l'ID del prezzo in `STRIPE_METERED_PRICE_ID`.
3. **Riesegui il seed e attiva**: lancia `npm run db:seed`, poi imposta `isActive: true` sul piano `metered-example` (modifica il seed o la riga). Il `meterEventName` del piano deve coincidere col nome dell'evento del meter.
4. **Registra il consumo** dal codice lato server, dove avviene la cosa che fatturi:

   ```ts
   import { recordUsage } from "@/lib/usage"

   // per esempio dentro una server action o una route API
   await recordUsage(session.user.id, "api_request")
   ```

   Passa un `identifier` unico quando il chiamante potrebbe riprovare: Stripe lo usa per non contare due volte lo stesso evento. L'aiuto non fa nulla, con un avviso in console, quando Stripe non è configurato o l'utente non ha ancora un cliente Stripe, così il codice strumentato è sicuro ovunque.

Il checkout gestisce i prezzi a consumo da solo (vengono inviati senza quantità). Stripe fattura il consumo accumulato alla fine di ogni periodo.

## Eventi del webhook

Il gestore su `/api/webhooks/stripe` tratta questi eventi; selezionali quando crei l'endpoint di produzione (vedi [Deployment](./deployment.md)):

- `checkout.session.completed` (abbonamenti e pagamenti una tantum)
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `charge.refunded`

## Provare in locale

Con le chiavi di test in `.env.local` e la [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Usa la carta `4242 4242 4242 4242` nel checkout. Controlli utili: compra il piano Lifetime e verifica la riga `Purchase` e la fattura nella pagina dei pagamenti; rimanda l'evento (`stripe events resend <event_id>`) e verifica che non si duplichi niente; rimborsa il pagamento dal pannello e verifica che il piano torni Free.

## Senza Stripe

Tutto degrada con eleganza quando `STRIPE_SECRET_KEY` non è impostata: la pagina dei pagamenti rende con i pulsanti di checkout disattivati, la lista delle fatture si spiega da sola, `recordUsage()` non fa nulla, e `/api/checkout` risponde con un 503 chiaro. Anche la modalità demo (`DEMO_MODE="true"`) disattiva il checkout, così la demo pubblica può mostrare l'interfaccia dei pagamenti su dati di esempio senza un account Stripe.

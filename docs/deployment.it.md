---
title: Deployment
description: "In produzione su Vercel: variabili, migrazioni, webhook, e come diventare amministratore."
translated_from: deployment.md
source_checksum: 5bf6eeac6b2d
---

# Deployment

Il kit gira ovunque giri Next.js. Questa guida copre Vercel, la strada per cui il kit è tarato.

## Pubblicare su Vercel

Con un clic: usa il pulsante **Deploy with Vercel** nel README. Oppure da riga di comando:

```bash
npm i -g vercel
vercel          # primo deploy, collega il progetto
vercel --prod   # deploy in produzione
```

## Ambiente di produzione

Imposta le variabili di [.env.example](../.env.example) nel pannello Vercel (Project → Settings → Environment Variables). Il minimo per andare in produzione:

- `DATABASE_URL` (e `DIRECT_URL` se il tuo provider distingue connessione pooled e diretta)
- `AUTH_SECRET` (generane uno nuovo per la produzione, non riusare quello di sviluppo)
- `NEXT_PUBLIC_APP_URL` impostata a `https://iltuodominio.com` (le email e i link di reset si costruiscono da lì)
- Le credenziali OAuth, con le **URL di callback di produzione** aggiunte nella console di ogni provider:
  - `https://iltuodominio.com/api/auth/callback/google`
  - `https://iltuodominio.com/api/auth/callback/github`
- `RESEND_API_KEY` e `EMAIL_FROM` se vuoi magic link, reset della password ed email transazionali

## Deploy fuori da Vercel

Il kit è una normale app Next.js, quindi Docker, un VPS o qualsiasi host Node vanno bene. Serve una variabile che su Vercel non è richiesta:

```bash
AUTH_TRUST_HOST="true"
```

Auth.js si fida dell'host da cui viene servito quando rileva Vercel, e lo rifiuta ovunque altro: è la protezione contro un header `Host` falsificato dietro un proxy che non controlli. Senza, l'app compila e parte normalmente, poi l'accesso fallisce con *«There was a problem with the server configuration»*, con `UntrustedHost` nel log del server e niente sulla pagina che indichi la causa. Impostala quando sei dietro un proxy o un bilanciatore di cui ti fidi.

Vale anche quando esegui il build di produzione sulla tua macchina con `npm start`. Con `npm run dev` non serve.

Fuori da Vercel cambia anche un'altra cosa. I form pubblici (contatti, newsletter) sono limitati per IP, e l'IP viene letto da `x-forwarded-for`. Vercel lo imposta sempre; un host Node nudo, o un proxy che non lo aggiunge, lascia il kit senza un indirizzo su cui contare, e si ripiega su un unico secchio condiviso: quei form si fermano a cinque invii ogni quindici minuti **per tutti insieme**. Nella direzione opposta, dove l'header arriva da un proxy che non controlli, un client se lo scrive da solo e il limite per IP smette di significare qualcosa. Imposta l'header nel tuo proxy, e assicurati che sia il proxy a scriverlo e non il client.

## Migrazioni del database

I build non eseguono le migrazioni. Applicale al database di produzione come passo deliberato:

```bash
npx prisma migrate deploy
```

Eseguilo prima del primo deploy, o subito dopo, e dopo ogni release che aggiunge una migrazione. Poi inserisci i piani una volta sola: `npx prisma db seed`.

## Webhook Stripe in produzione

Crea un endpoint nel pannello Stripe (Developers → Webhooks) che punti a:

```
https://iltuodominio.com/api/webhooks/stripe
```

Iscrivilo agli eventi del ciclo di vita degli abbonamenti, copia il signing secret in `STRIPE_WEBHOOK_SECRET` su Vercel, e rifai il deploy. Le chiavi live (`sk_live_...`) solo in produzione.

## Diventare amministratore

Dopo il tuo primo accesso in produzione:

```bash
npx prisma studio
```

Trova il tuo utente nella tabella `User` e imposta `role` su `ADMIN`. La tua sessione rilegge il ruolo entro un minuto, quindi la scorciatoia al pannello di amministrazione compare nella sidebar della dashboard senza bisogno di uscire e rientrare. Da lì puoi promuovere altre persone dal pannello stesso, e per loro vale lo stesso minuto.

> Stai aggiornando da una versione precedente alla 1.6.4? Il ruolo veniva letto solo alla creazione della sessione, quindi questo passaggio sembrava non fare niente finché non uscivi e rientravi. Non c'è nulla da migrare: la correzione è nel codice.

## Facoltativo: un deploy dimostrativo pubblico

Per offrire una demo come [demo.openstarterkit.dev](https://demo.openstarterkit.dev) senza raccogliere dati personali, pubblica una **seconda istanza** del repository su un **database isolato** e lì imposta `DEMO_MODE="true"`, più le chiavi di test di Stripe. Sul deploy di marketing imposta `NEXT_PUBLIC_DEMO_URL` all'indirizzo della demo, così i link di accesso puntano lì. Riempi la demo con dati credibili:

```bash
npm run db:seed:demo   # cancella utenti e progetti su quel database e ricrea i dati di esempio
```

Cosa cambia esattamente la modalità demo è spiegato in [Autenticazione](./authentication.md).

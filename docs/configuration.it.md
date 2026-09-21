---
title: Configurazione
description: "Ogni variabile d'ambiente spiegata: database, OAuth, Stripe, email, marchio."
translated_from: configuration.md
source_checksum: bc249b8dfb06
---

# Configurazione

Ogni variabile vive in [.env.example](../.env.example) con i commenti accanto. Copialo in `.env.local` e riempi quello che ti serve: ogni funzione si accende quando le sue variabili sono impostate, e resta spenta in silenzio quando non lo sono.

## Database

| Variabile | Note |
|---|---|
| `DATABASE_URL` | Stringa di connessione PostgreSQL. Con Neon, qui va quella pooled. |
| `DIRECT_URL` | Il kit non la legge. Prisma 7 prende la connessione da `DATABASE_URL` in `prisma.config.ts`, sia per l'app sia per le migrazioni: per migrare sulla connessione diretta, non pooled, imposta `DATABASE_URL` su quella per il solo comando, come mostra [Deployment](./deployment.md). |

## Nucleo dell'autenticazione

| Variabile | Note |
|---|---|
| `AUTH_SECRET` | Firma il cookie di sessione e cifra i codici di backup del secondo fattore. Generala con `openssl rand -base64 32`. Cambiarla fa uscire tutti, e i codici di backup generati col valore precedente smettono di funzionare. |
| `NEXT_PUBLIC_APP_URL` | Indirizzo canonico dell'app (`http://localhost:3000` in sviluppo). Usato nelle email e nei link di reset. |

## Provider OAuth

Entrambi i provider sono facoltativi: configura quelli che vuoi sulla pagina di accesso.

**Google** ([console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID)

- URI di reindirizzamento autorizzato: `http://localhost:3000/api/auth/callback/google` (ripeti col tuo dominio di produzione quando pubblichi)
- Copia client ID e secret in `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`

**GitHub** ([github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App)

- URL di callback: `http://localhost:3000/api/auth/callback/github`
- Copia i valori in `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`

## Email (Resend)

| Variabile | Note |
|---|---|
| `RESEND_API_KEY` | Abilita tutta la posta in uscita: benvenuto, abbonamento, **accesso con magic link** e **reset della password**. Senza, quei due flussi di accesso si nascondono nell'interfaccia. |
| `EMAIL_FROM` | Identità del mittente, per esempio `"LaTuaApp <ciao@iltuodominio.com>"`. Il dominio deve essere verificato su Resend. |

Come si prepara: apri un account su [resend.com](https://resend.com), verifica il dominio, crea una chiave API.

La verifica del dominio su Resend imposta SPF e DKIM, non una politica DMARC. Aggiungi anche un record DMARC dal tuo provider DNS, un record `TXT` su `_dmarc.iltuodominio.com` come `v=DMARC1; p=quarantine; rua=mailto:tu@iltuodominio.com`: senza, alcuni provider di posta mettono le email transazionali nello spam, e nessuno dice ai server che le ricevono cosa fare con la posta che si finge spedita dal tuo dominio.

**Quando un'email non arriva, guarda nei log.** Resend può rifiutare un messaggio che il kit gli ha passato: il dominio mittente non è ancora verificato, la quota giornaliera del piano è finita, oppure il destinatario è nella lista di soppressione di Resend. Ogni rifiuto viene scritto nei log come `[email] <tipo> rejected by Resend`, con il motivo e il codice di Resend, e mai con l'indirizzo del destinatario. Il modulo contatti avvisa il visitatore quando il suo messaggio non è partito. Il reset della password, il link magico, il cambio email e l'iscrizione alla newsletter invece no, di proposito: rispondono allo stesso modo che un indirizzo sia registrato o no, così nessuno li può usare per scoprire chi ha un account, e un errore visibile in caso di rifiuto annullerebbe questa protezione. Con un dominio non verificato viene rifiutata ogni email fin dalla prima, ed è quindi la causa più probabile su un deploy nuovo.

*Un caso richiede una persona invece di una correzione:* un contatto che si disiscrive viene tolto anche dall'audience di Resend, e se Resend rifiuta la rimozione la riga di log lo dice, perché un broadcast spedito da Resend lo raggiungerebbe lo stesso. Toglilo a mano prima del prossimo invio.

## Stripe

1. Apri un account su [stripe.com](https://stripe.com) e copia la **Secret key** in `STRIPE_SECRET_KEY` (e la publishable key in `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
2. Crea prodotti e prezzi nel pannello Stripe. Il seed include sei piani di esempio (Starter e Pro nelle varianti mensile e annuale, un piano Lifetime una tantum, e un esempio a consumo disattivo) così il checkout funziona subito; sostituiscili coi tuoi.
3. Copia gli ID dei prezzi in `STRIPE_STARTER_PRICE_ID`, `STRIPE_STARTER_YEARLY_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_PRO_YEARLY_PRICE_ID` e `STRIPE_LIFETIME_PRICE_ID` (oppure modifica `prisma/seed.ts`), poi lancia `npx prisma db seed`. `STRIPE_METERED_PRICE_ID` serve solo se attivi l'esempio a consumo (vedi [Pagamenti](./billing.md)).
4. Webhook in locale, con la [Stripe CLI](https://stripe.com/docs/stripe-cli):

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copia il signing secret in `STRIPE_WEBHOOK_SECRET`. I webhook di produzione sono in [Deployment](./deployment.md); come funzionano i flussi di pagamento (abbonamenti, una tantum, a consumo) è in [Pagamenti](./billing.md).

Due interruttori facoltativi, spenti finché non valgono `"true"`:

| Variabile | Note |
|---|---|
| `STRIPE_ALLOW_PROMOTION_CODES` | Mostra il campo del codice promozionale nel Checkout. Vedi [Pagamenti](./billing.md). |
| `STRIPE_AUTOMATIC_TAX` | Attiva Stripe Tax nel Checkout. Prima attiva Stripe Tax nel pannello Stripe: con Tax non attivo il checkout funziona lo stesso e non applica nessuna tassa. Vedi [Pagamenti](./billing.md). |

## Limitazione delle richieste

| Variabile | Note |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Facoltativa. Se non impostata, i limiti vivono nella memoria di ogni istanza: su serverless una richiesta che atterra altrove riparte da zero. |
| `UPSTASH_REDIS_REST_TOKEN` | Facoltativa. Impostandole entrambe gli stessi contatori si spostano su Upstash Redis, condivisi da ogni istanza e regione. |

Sono facoltative di proposito: una variabile obbligatoria avrebbe reso una major, per chiunque avesse già clonato il kit, la release che ha aggiunto questa funzione. Impostandole non cambia nient'altro, non viene installata nessuna libreria client, e se l'archivio è configurato ma irraggiungibile il limitatore ricade sul contatore in memoria invece di fallire in una delle due direzioni.

Vale la pena sapere quale limite spostare per primo, perché non proteggono la stessa cosa. Il limite sull'accesso protegge i tentativi di password, e lì il costo di bcrypt porta gran parte del peso. I limiti su magic link, registrazione e reset proteggono **l'invio di email**: ognuno stabilisce quanti messaggi può innescare un singolo indirizzo, e bcrypt non c'entra niente. Se quello che stai proteggendo è la bolletta di Resend o la tua reputazione da mittente, è quello che guadagna di più da un archivio condiviso. Il resto sta in [Autenticazione](./authentication.md).

## Interruttori ed extra

| Variabile | Note |
|---|---|
| `DEMO_MODE` | `"true"` trasforma il deploy in una demo pubblica: account condivisi a un clic, OAuth reale disattivato, moduli di accesso via email nascosti. Usa un database isolato. |
| `NEXT_PUBLIC_DEMO_URL` | Su un deploy di marketing, fa puntare i link di accesso alla tua istanza dimostrativa. |
| `CRON_SECRET` | Solo per i deploy dimostrativi. `vercel.json` programma un ripopolamento giornaliero alle 04:00 UTC così i dati condivisi della demo non vanno alla deriva; Vercel manda questo valore come bearer token e la route si rifiuta di girare quando non è impostato, quindi lasciarlo vuoto disattiva semplicemente il ripristino. La route cancella ogni utente, e `DEMO_MODE="true"` è la guardia che la tiene lontana da un database vero. |
| `KIT_SITE` | Lascialo vuoto. È riservato al deploy che vende il kit stesso: `"true"` cambia il copy della landing, i prezzi (livelli open source scritti a mano più una waitlist Pro al posto delle tue righe `Plan`), le FAQ, i link di licenza nel footer e l'invito nella dashboard, così parlano del repository invece che del tuo prodotto. Vedi sotto. |
| `WAITLIST_ENABLED` | Ha senso solo insieme a `KIT_SITE`. Il form della lista d'attesa Pro sulla pagina dei prezzi open source parte **disattivato** finché questa non vale `"true"`, così nessun deploy può raccogliere indirizzi prima che la sua informativa vera sia pubblicata. |
| `NEXT_PUBLIC_DISABLE_ANALYTICS` | `"true"` non monta Vercel Analytics. Lasciata vuota resta acceso, che è il valore utile su Vercel e quello sbagliato ovunque tu preferisca non spedire nessuna analitica. |
| `NEXT_PUBLIC_REMOVE_BRANDING` | `"true"` toglie il badge «Built with» dal footer. È gratis, non c'è niente da sbloccare. |
| `NEXT_PUBLIC_GITHUB_URL` | Link al repository mostrato in navbar e footer. |

### Due distribuzioni da un solo codice

`KIT_SITE` esiste perché openstarterkit.dev e il kit che hai clonato sono un repository solo. L'alternativa era una seconda copia del sito di marketing, e una copia si allontana: il giorno che sistemassimo qualcosa sul sito, quello smetterebbe di essere il codice che cloni.

**Accenderlo nella tua app ti dà il nostro sito, non un suo modello.** Il nostro titolo, i nostri livelli open source e la waitlist Pro al posto delle tue righe `Plan`, le FAQ sulla licenza, i link MIT nel footer, e il nostro nome e indirizzo di contatto ovunque tu non abbia impostato le variabili del marchio. Spento è lo stato che vuoi, e spento è il valore predefinito.

**Il meccanismo che ci sta sotto invece vale la pena averlo, ed è la parte che è tua.** Le sezioni che si leggono diversamente fra due distribuzioni portano entrambe le varianti sotto `$kit` e `$product` nei file dei messaggi, e il build butta via quella che non può rendere, così nessuna delle due si porta dietro il testo dell'altra. Rinomina l'interruttore, metti le tue parole sotto i marcatori, e hai un sito di marketing e un'app su due domini da un repository solo, che divergono solo dove devono. I dettagli sono in [Lingue](./i18n.md).

**Se quello che vuoi è una seconda distribuzione per mostrare il prodotto, quella è `DEMO_MODE`, non questa**: account condivisi a un clic, OAuth reale spento, un ripopolamento giornaliero, e la tua app intatta sul suo dominio.

## Marchio e tema

Il kit arriva **neutro**: un nome segnaposto e un tema nero con scala di grigi, così si legge come una tela bianca da fare tua. Ci sono due modi per rifarne il marchio.

**Dalla configurazione** (modificando il codice):

- `src/config/site.ts`: nome, tagline, descrizione, email di contatto, link
- `src/components/logo.tsx`: il simbolo del logo (cambia l'icona); la scritta segue `siteConfig.name`
- `src/app/icon.tsx`: la favicon, disegnata con lo stesso simbolo e generata al build, quindi non c'è nessun `.ico` da ridisegnare. Prende da sola il tuo colore d'accento; cambia il fulmine qui quando cambi il simbolo del logo.
- `src/app/globals.css`: i token di colore sotto `:root` e `.dark` (`--primary`, `--primary-2`, `--gradient-brand`)
- `src/app/globals.css`: gli sfondi decorativi dell'hero, `.bg-grid` (griglia tenue) e `.bg-glow` (alone d'accento). Sono puramente estetici, quindi svuotare una regola li toglie ovunque siano usati: hero della landing, pagine di accesso e 404.

**Dall'ambiente** (senza toccare il codice): ogni campo ha un valore neutro di ripiego, quindi imposta solo quello che vuoi cambiare.

| Variabile | Note |
|---|---|
| `NEXT_PUBLIC_BRAND_NAME` | Nome dell'app, mostrato ovunque: scritta del logo, metadati, email. |
| `NEXT_PUBLIC_BRAND_TAGLINE` | Titolo o slogan. Si vede sulla pagina: hero, footer, immagine social, email. |
| `NEXT_PUBLIC_BRAND_DESCRIPTION` | Meta description. |
| `NEXT_PUBLIC_SEO_TITLE` | Titolo per `<title>` e per i risultati di ricerca. Se non lo imposti, il titolo è `nome \| tagline`. Impostalo quando le parole che la gente cerca non sono l'affermazione che vuoi sulla pagina: lo slogan resta dove lo legge una persona, questo lavora per la macchina. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Indirizzo di contatto pubblico. |
| `NEXT_PUBLIC_MAINTAINER_NAME`, `NEXT_PUBLIC_MAINTAINER_URL` | Chi costruisce il prodotto, mostrato in una sezione «Who builds it» nella pagina About. La sezione sparisce del tutto quando il nome non è impostato; l'indirizzo è facoltativo e il nome rende comunque, senza link. |
| `NEXT_PUBLIC_GITHUB_ORG_URL`, `NEXT_PUBLIC_X_URL` | Link social; le icone nel footer si nascondono quando non ci sono. |
| `NEXT_PUBLIC_BRAND_WORDMARK_ACCENT` | La porzione del nome da evidenziare col gradiente nel logo. |
| `NEXT_PUBLIC_BRAND_PRIMARY`, `NEXT_PUBLIC_BRAND_PRIMARY_2` | Colori d'accento (esadecimali). Gradiente, alone e immagini Open Graph li seguono da soli. |
| `NEXT_PUBLIC_BRAND_GRADIENT` | Gradiente CSS completo, se preferisci scriverlo invece di farlo derivare. |

Il codice è MIT, quindi usalo per qualsiasi cosa. Il badge «Built with» nel footer è facoltativo (`NEXT_PUBLIC_REMOVE_BRANDING="true"`).

## SEO

Buona parte è già collegata, e segue il tuo marchio invece di chiedere di ripetere le stesse cose:

- **Titoli e descrizioni** per pagina, con `NEXT_PUBLIC_SEO_TITLE` visto sopra per la home quando il titolo cercabile e lo slogan leggibile non coincidono
- **Indirizzi canonici** sulla home, su `/pricing`, `/blog`, `/docs` e su ogni articolo, costruiti da `NEXT_PUBLIC_APP_URL`. **Imposta quella variabile in produzione**: senza, ricade su `localhost` e ogni canonico punta a una macchina che nessuno può raggiungere
- **Dati strutturati**: `Organization` e `FAQPage` sulla home, `Article` su ogni articolo. Il markup delle FAQ è generato dalle stesse domande che modifichi in `src/components/landing/faq.tsx`, quindi rispondere per il tuo prodotto aggiorna entrambe le cose insieme
- **`sitemap.xml` e `robots.txt`** generati dal codice, con le bozze escluse
- **`/llms.txt`**, che descrive il sito alle macchine che lo riassumono, a partire da nome, descrizione e contenuti. `NEXT_PUBLIC_LLMS_SUMMARY` ci aggiunge in cima una frase tua: di' cosa fai e per chi, con le parole che userebbe chi lo sta cercando

La sezione FAQ rende su più di una pagina, quindi i dati strutturati vengono emessi solo dove si usa `<FAQ withJsonLd />`, che di default è la home. Se la sposti, sposta anche il flag e tienilo su una pagina sola: la stessa FAQ pubblicata sotto più indirizzi vale meno che sotto uno solo.

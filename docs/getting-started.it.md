---
title: Primi passi
description: Da git clone all'app che gira, in una decina di minuti.
translated_from: getting-started.md
source_checksum: 380e119ddacd
---

# Primi passi

Da zero all'app che gira in una decina di minuti.

**Ti servono:** Node 24 o superiore, git e un database PostgreSQL ([Neon](https://neon.tech) ha un piano gratuito).

## 1. Clona e installa

```bash
git clone https://github.com/openstarterkit/nextjs-saas-starter-kit.git
cd nextjs-saas-starter-kit
npm install
```

## 2. Avvialo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000). Il database non c'è ancora, quindi la pagina elenca i passi che restano e segna quello a cui sei arrivato. Compare solo in sviluppo, finché il database non è pronto.

## 3. Crea il database, poi riempi `.env.local`

Crea un database PostgreSQL e copia la stringa di connessione che ti dà. Su Neon è quella *pooled*, e finisce con `?sslmode=require`: cambialo in `?sslmode=verify-full`, la modalità più severa, altrimenti Node stampa un avviso SSL a ogni avvio.

```bash
cp .env.example .env.local      # nel Prompt dei comandi di Windows: copy .env.example .env.local
```

Per il primo avvio bastano due valori:

```bash title=".env.local"
DATABASE_URL="postgresql://..."   # la stringa di connessione del tuo database
AUTH_SECRET="..."                 # un valore casuale qualsiasi; generane uno col comando qui sotto
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Incolla quello che stampa fra le virgolette di `AUTH_SECRET`.

Lascia `DIRECT_URL` com'è: il kit non la legge, ed è nell'esempio solo perché certi hosting la impostano da soli.

Il resto (OAuth, Stripe, email) può aspettare: il kit funziona lo stesso e ogni funzione si accende quando le sue variabili sono impostate. Il riferimento completo è in [Configurazione](./configuration.md).

## 4. Crea le tabelle

```bash
npx prisma migrate deploy   # applica le migrazioni gia in repository
npx prisma db seed          # sei piani di esempio, uno spento (poi modifica prisma/seed.ts)
```

Tutti e due leggono `.env.local`, lo stesso file che legge l'app.

## 5. Entra

Riavvia `npm run dev` e riapri il sito. Premi **Sign in**: in sviluppo la pagina di accesso ha un pulsante **Dev Login (Admin)**, che non richiede nessuna app OAuth e ti porta nella dashboard come amministratore.

## 6. Da qui in poi

- Metodi di accesso veri (Google, GitHub, magic link, email e password): [Configurazione](./configuration.md) e [Autenticazione](./authentication.md)
- Pagamenti e webhook: la sezione Stripe di [Configurazione](./configuration.md)
- Fallo tuo: il marchio vive in `src/config/site.ts` e `src/components/logo.tsx`; cambia quei due file e tutta l'app (metadati, navbar, footer, email, pagine legali) segue
- Mandalo in produzione: [Deployment](./deployment.md)

---
title: Primi passi
description: Da git clone all'app che gira, in una decina di minuti.
translated_from: getting-started.md
source_commit: 7ec7ed8
---

# Primi passi

Da zero all'app che gira in una decina di minuti. Servono solo Node 24+ e un database PostgreSQL.

## 1. Clona e installa

```bash
git clone https://github.com/openstarterkit/nextjs-saas-starter-kit.git
cd nextjs-saas-starter-kit
npm install
```

## 2. Variabili d'ambiente

```bash
cp .env.example .env.local
```

Per il primo avvio in locale bastano due valori:

```bash
DATABASE_URL="postgresql://..."   # la stringa di connessione a Postgres
AUTH_SECRET="..."                 # generane uno: npx auth secret
```

Il resto (OAuth, Stripe, email) può aspettare: il kit funziona lo stesso e ogni funzione si accende quando le sue variabili sono impostate. Il riferimento completo è in [Configurazione](./configuration.md).

## 3. Database

Crea un database PostgreSQL (Neon ha un piano gratuito su [neon.tech](https://neon.tech)), poi:

```bash
npx prisma migrate deploy   # applica le migrazioni gia in repository
npx prisma generate         # genera il client Prisma
npx prisma db seed          # inserisce due piani di esempio (poi modifica prisma/seed.ts)
```

## 4. Avvia

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) e premi **Sign in**. In sviluppo la pagina di accesso ha un pulsante **Dev Login (Admin)**: un clic, nessuna app OAuth da configurare, e ti ritrovi nella dashboard come amministratore.

## 5. Da qui in poi

- Metodi di accesso veri (Google, GitHub, magic link, email e password): [Configurazione](./configuration.md) e [Autenticazione](./authentication.md)
- Pagamenti e webhook: la sezione Stripe di [Configurazione](./configuration.md)
- Fallo tuo: il marchio vive in `src/config/site.ts` e `src/components/logo.tsx`; cambia quei due file e tutta l'app (metadati, navbar, footer, email, pagine legali) segue
- Mandalo in produzione: [Deployment](./deployment.md)

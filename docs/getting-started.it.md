---
title: Primi passi
description: Da git clone all'app che gira, in circa cinque minuti.
translated_from: getting-started.md
source_checksum: ef59818a6544
---

# Primi passi

Da git clone all'app che gira in circa cinque minuti.

**Ti servono:** Node 24 o superiore, git e un database PostgreSQL ([Neon](https://neon.tech) ha un piano gratuito).

![Un terminale esegue git clone, npm install e npm run dev, poi l'app si apre su localhost:3000](../public/media/quick-setup.webp "I passi 1 e 2 su un clone appena fatto: la pagina che si apre elenca cosa manca.")

## 1. Clona e installa

```bash
git clone https://github.com/openstarterkit/nextjs-saas-starter-kit.git
cd nextjs-saas-starter-kit
npm install
```

GitHub non risponde, o non usi GitHub? Lo stesso repository ha un mirror su GitLab, con gli stessi commit e gli stessi tag:

```bash
git clone https://gitlab.com/openstarterkit/nextjs-saas-starter-kit.git
```

Le versioni recenti di npm chiudono l'installazione elencando gli script che hanno saltato, di Prisma e di `unrs-resolver`, e suggeriscono `npm approve-scripts`. È normale: npm non esegue più gli script d'installazione delle dipendenze se non li autorizzi, e al kit questi due non servono. Il passo che conta, `prisma generate`, parte dal `postinstall` del kit stesso. Non c'è niente da approvare.

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

## 7. Il tuo codice, in TypeScript o in JavaScript

Il kit è scritto in TypeScript rigoroso, ed è lì che stanno i suoi controlli: il codice di accesso, pagamenti e database su cui costruisci è tipizzato e coperto dai test. Il tuo codice non deve esserlo per forza. Le pagine e i componenti che aggiungi possono essere JavaScript semplice, file `.js` o `.jsx` accanto ai `.ts` del kit. Importano i componenti del kit, `prisma` e il resto così come sono, e `npm run build`, `npm run lint` e `npx tsc --noEmit` passano anche con loro, perché il `tsconfig.json` del kit ha `allowJs`.

```jsx
// src/app/(dashboard)/dashboard/reports/page.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

export default async function ReportsPage() {
  const plans = await prisma.plan.count()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plans</CardTitle>
      </CardHeader>
      <CardContent>{plans}</CardContent>
    </Card>
  )
}
```

La pagina sta nella dashboard, quindi è già protetta dall'accesso. Quando un file cresce, rinominalo in `.tsx`: TypeScript comincia a controllarlo e l'editor ti mostra cosa sistemare. Nient'altro cambia.

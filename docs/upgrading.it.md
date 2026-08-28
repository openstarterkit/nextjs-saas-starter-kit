---
title: Aggiornare
description: Prendere una versione nuova del kit senza perdere il proprio lavoro, e sapere prima quanto costa.
translated_from: upgrading.md
source_checksum: 7cd525958114
---

# Aggiornare

Hai clonato questo kit e l'hai fatto tuo. Questa guida parla di come prendere una versione più recente senza perdere quel lavoro, e di come sapere in anticipo quanto ti costerà una certa release.

## Cosa promette un numero di versione

Le release seguono [SemVer](https://semver.org/), e qui la domanda che decide il numero riguarda deliberatamente te, non quanto lavoro c'è dentro:

> Cosa devi fare per prendere questa versione?

| Devi | Numero |
|---|---|
| `git pull`, al massimo `npm install` | **PATCH**: 1.6.**1** |
| `git pull`, `npm install`, al massimo una migrazione che gira da sola o una variabile d'ambiente **facoltativa** | **MINOR**: 1.**7**.0 |
| Metterci le mani: una variabile obbligatoria, una migrazione da valutare sui tuoi dati, un file spostato, un runtime da alzare, una funzione rimossa | **MAJOR**: **2**.0.0 |

Una release può costare due settimane di lavoro ed essere una MINOR. Rinominare una variabile d'ambiente costa dieci minuti ed è una MAJOR. Il numero descrive il tuo lato dello scambio.

## Prendere una versione più recente

Aggiungi il kit come secondo remote, una volta sola:

```bash
git remote add upstream https://github.com/openstarterkit/nextjs-saas-starter-kit.git
git fetch upstream
```

Poi, per ogni release che vuoi:

```bash
git fetch upstream --tags
git merge v1.7.0        # oppure: git rebase v1.7.0
npm install
npx prisma migrate deploy
```

I conflitti nascono dove hai modificato le stesse righe toccate dalla release. È il costo onesto di possedere il codice, ed è più piccolo di quanto sembri se il tuo lavoro vive dove il kit se lo aspetta: le tue rotte sotto `src/app`, i tuoi componenti in cartelle proprie, i tuoi testi in `src/locales`. I file che vanno in conflitto più spesso sono quelli che tutti modificano: `src/config/site.ts`, i file dei messaggi, `prisma/schema.prisma`.

Prima di una MAJOR leggi il [CHANGELOG](https://github.com/openstarterkit/nextjs-saas-starter-kit/blob/main/CHANGELOG.md). Dice cosa si è spostato.

## 2.0: è cambiata la libreria di autenticazione

La versione 2.0 sostituisce Auth.js con Better Auth. È l'unica cosa che quella
release contiene: nessuna funzione nuova, niente altro da rivedere.

**Il confine ha tenuto.** Tutto ciò che legge l'utente collegato passa ancora da
un modulo solo, e restituisce sempre gli stessi cinque campi:

```ts
import { getCurrentUser, requireUser } from "@/lib/auth"

const user = await getCurrentUser()   // l'utente, oppure null
const user = await requireUser()      // l'utente, oppure un redirect all'accesso
```

Cambiare libreria ha toccato sette file del kit, e sono esattamente quelli che
la 1.7 aveva nominato in anticipo: le due azioni di accesso, la pagina di login,
il route handler, il middleware, la configurazione e il confine stesso. **Se il
tuo codice legge la sessione dal confine, non serve cambiare niente.** Se importa
`auth()` da `@/auth` direttamente, sono quelli i punti da riscrivere.

### Vengono scollegati tutti

Leggi prima questo. I token di sessione appartengono alla libreria che li ha
emessi, quindi **ogni sessione attiva finisce nel momento in cui pubblichi**. I
tuoi utenti non restano chiusi fuori: fanno di nuovo l'accesso e ritrovano tutto
dov'era. Scegli il momento di conseguenza.

### La migrazione del database

La release porta una migration. Sposta dati, non è una rinomina, e uno degli
spostamenti fallisce in silenzio se non avviene: **le password escono da
`User.passwordHash` per finire in una riga di `Account`**. Se salta, il database
resta valido, non compare nessun errore, e ogni utente con una password
semplicemente non riesce più ad accedere.

Quindi conta, prima e dopo. Non come rito: è l'unico segnale che ricevi.

```sql
-- PRIMA della migration
SELECT count(*) FROM "User" WHERE "passwordHash" IS NOT NULL;

-- DOPO la migration
SELECT count(*) FROM "Account" WHERE "providerId" = 'credential';
```

**I due numeri devono coincidere.** Se non coincidono, fermati e ripristina: non
pubblicare l'applicazione sopra un database migrato a metà.

La migration gira dentro una transazione, quindi un errore lascia il database
esattamente com'era. È voluto: Prisma non avvolge i file di migration in una
transazione da sé, e una migrazione di questo tipo applicata a metà è peggio di
una fallita del tutto, perché nessuna versione dell'applicazione sa parlare al
risultato.

Provala prima su una copia che contenga dati veri. Una migration provata contro
un database appena seminato passa sempre, perché un seed pulito non produce mai
le righe che la rompono: l'utente senza nome, l'account la cui scadenza del token
è un intero, l'utente da magic link che non ha nessuna riga account.

### Cos'altro fa la migration

| Cambiamento | Cosa significa per i tuoi dati |
|-------------|--------------------------------|
| `emailVerified` diventa un booleano | Chi aveva una data di verifica ora è `true`. La data in sé è persa. |
| `name` diventa obbligatorio | Chi non ne aveva uno riceve la parte locale della sua email. Le stringhe vuote contano come mancanti, perché soddisfano il vincolo mostrando comunque un nome vuoto. |
| `Account` viene ricostruita | Colonne rinominate, più una chiave unica nuova su `issuer` e `accountId`. |
| `Session` viene ricostruita | Il kit usava sessioni JWT, quindi la tabella era vuota e non c'è niente da portare. Ora le sessioni sono righe. |
| `VerificationToken` diventa `Verification` | Chiave primaria singola, `token` rinominato in `value`. |
| `PasswordResetToken` sparisce | I token di reset stanno in `Verification`. Chi ha un link inutilizzato deve chiederne uno nuovo. |

**Se ti sei scritto la migration da solo**, due dettagli valgono la pena, perché
la guida ufficiale di Better Auth non documenta né l'uno né l'altro e tutti e due
falliscono in silenzio:

1. **L'`issuer` di un account OAuth non è il nome del provider.** La guida mostra
   `local:credential` per le password e si ferma lì. Per gli account sociali il
   valore è `local:oauth:google`, `local:oauth:github` e così via. Se scrivi il
   nome nudo del provider, gli account esistenti non vengono riconosciuti al
   primo accesso.
2. **`expires_at` è una conversione, non una rinomina.** Conteneva secondi unix
   come intero; `accessTokenExpiresAt` è un timestamp. Rinominala e ogni token
   OAuth nella tua tabella risulta scaduto nel 1970.

### Cose che non esistono più

Se usavi una di queste direttamente, ecco cosa la sostituisce:

| Rimosso | Sostituto |
|---------|-----------|
| `User.sessionVersion` | Le sessioni sono righe. Revocarne una è cancellarla. |
| `src/lib/session.ts` | Lo stesso, più `session.cookieCache` in `src/auth.ts`. |
| `PasswordResetToken` e i suoi aiutanti | `auth.api.requestPasswordReset` e `auth.api.resetPassword`. |
| `SessionProvider` nel layout radice | Non serve. Il client legge la sessione senza provider. |
| `next-auth`, `@auth/prisma-adapter` | `better-auth`, `@better-auth/prisma-adapter`. |

### Variabili d'ambiente: niente da rinominare

`AUTH_SECRET` mantiene il suo nome, e `NEXT_PUBLIC_APP_URL` viene riusata come
URL di base. Better Auth preferirebbe `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL`,
ma l'aggiornamento scollega già tutti, e aggiungerci sopra una variabile da
rinominare non porta niente.

### Due cambi di comportamento da sapere

**La registrazione non manda più un magic link.** Crea l'account, collega la
persona, e manda l'email di verifica separatamente. Stessa destinazione, un
trucco in meno in mezzo.

**Il rate limiting è integrato.** `/sign-in/email` consente tre tentativi ogni
dieci secondi di suo, il che è più severo di quello che il kit faceva a mano.

### Se il build fallisce su una rotta che hai cancellato

Dopo l'aggiornamento, `next build` può fallire con un modulo mancante che punta a
`src/app/api/auth/[...nextauth]/route.js`, un file che non esiste più. È la cache
del build che ricorda il vecchio nome della rotta. Cancella `.next` e ricostruisci.

### Farsi avvisare quando esce una release

Ogni release è taggata e pubblicata, quindi non serve seguire i commit di questo
repository per sapere quando esce qualcosa. Su GitHub apri il repository, usa
**Watch**, scegli **Custom** e spunta solo **Releases**. Riceverai una notifica
quando viene pubblicata una versione e silenzio per tutto il resto.

## Prima di aggiornare qualsiasi cosa

Committa o metti da parte il tuo lavoro, così il diff che rivedi è la release e nient'altro. Poi, dopo il merge:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Quattro comandi, in quest'ordine, perché falliscono dal più economico al più costoso. Un errore di tipo trovato in due secondi è un errore di tipo per cui non hai aspettato quattro minuti di build.

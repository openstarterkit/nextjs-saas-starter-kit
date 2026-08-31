---
title: Aggiornare
description: Prendere una versione nuova del kit senza perdere il proprio lavoro, e sapere prima quanto costa.
translated_from: upgrading.md
source_checksum: afb28ea5c810
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

## 2.0.2: riparare l'issuer degli account OAuth

**Leggi questa sezione se hai migrato alla 2.0 e i tuoi utenti accedono con
Google, Apple, Facebook o LINE.** Se usi solo GitHub, una password o il magic
link, non ti riguarda e la migration di questa release non trova niente da fare.

### Cosa c'era di sbagliato

La migration della 2.0 assegnava a ogni account OAuth un issuer nella forma
`local:oauth:<provider>`. È il valore che Better Auth costruisce per un provider
che non dichiara un issuer proprio. I provider OpenID Connect lo dichiarano,
quindi il valore giusto per un account Google è `https://accounts.google.com`.
GitHub non dichiara niente, quindi per lui `local:oauth:github` era corretto.

Better Auth cerca l'account per coppia `(issuer, accountId)` e non ripiega su
`providerId`, quindi una riga Google scritta dalla migration della 2.0 non viene
mai trovata all'accesso.

### Perché questo chiude fuori le persone

La conclusione naturale è che l'utente si ritrovi un secondo account. Per la
maggior parte non succede questo. Better Auth collegherebbe l'accesso non
riconosciuto all'utente esistente tramite l'email, ma quel percorso viene
rifiutato quando l'utente locale ha `emailVerified` falso, che è il valore
predefinito (`accountLinking.requireLocalEmailVerified`). La migration della 2.0
ricava `emailVerified` dal fatto che il timestamp di Auth.js fosse valorizzato,
e Auth.js lo lascia nullo per quasi tutti gli account creati via OAuth. Quegli
utenti ricevono `account not linked` e non entrano affatto.

### Cosa fare

Prendi la release ed esegui la migration. È un file nuovo e non una correzione
di quello della 2.0, perché una migration applicata non viene mai rieseguita:
modificare il file della 2.0 non riparerebbe nessuno di quelli che hanno già
migrato, cioè tutti quelli che il difetto colpisce.

```bash
git fetch upstream --tags
git merge v2.0.2
npm install
npx prisma migrate deploy
```

Poi verifica il risultato contro quello che la libreria cercherebbe davvero:

```bash
node --env-file=.env scripts/verify-auth-migration.mjs
```

Lo script è di sola lettura. Legge l'issuer che ogni provider configurato
dichiara, lo confronta con quello memorizzato ed elenca ogni riga che non
verrebbe trovata. Non confronta il tuo database con un valore scritto dentro lo
script, ed è la ragione per cui l'errore originale è sopravvissuto ai nostri
controlli: una verifica che confronta i dati con la propria assunzione non può
che confermarla.

Il campo `emailVerified` dei tuoi utenti resta com'è, ed è corretto così. Con
l'issuer giusto la coppia `(issuer, accountId)` trova l'account direttamente e
il collegamento per email non viene mai raggiunto, quindi non c'è niente da
riparare a mano. Il primo accesso riuscito riporta `emailVerified` a true da
solo, con quello che dichiara il provider.

### Se la migration si ferma con un errore

Anche Cognito, Microsoft Entra ID e Paybin dichiarano un issuer, ma il loro è
costruito dalla tua configurazione o dal token: la region e lo user pool, il
claim `iss`, l'opzione `issuer`. Nessun file spedito col kit può sapere quale
valore sia giusto per la tua installazione, quindi la migration si ferma invece
di scriverne uno plausibile.

Ripara quelle righe a mano, dentro una transazione, poi riesegui la migration:

```sql
UPDATE "Account"
   SET "issuer" = 'https://l-issuer-che-usa-davvero-il-tuo-provider'
 WHERE "providerId" = 'id-del-tuo-provider'
   AND "issuer" = 'local:oauth:id-del-tuo-provider';
```

Il valore da scrivere è quello che il tuo provider mette nel claim `iss` del suo
ID token. Per Cognito è `https://cognito-idp.<region>.amazonaws.com/<userPoolId>`.

Se un utente ha già fatto un accesso riuscito dopo la 2.0, ha due righe: quella
migrata e quella creata da Better Auth. Cancella la migrata invece di
aggiornarla, altrimenti collide con l'indice unico su `(issuer, accountId)`. La
migration lo fa da sé per i provider che ripara.

### Provider aggiunti con generic-oauth

Un provider che hai aggiunto tu ha un id che la migration non sa classificare,
quindi resta intatto e viene nominato in un avviso. Quasi tutti questi provider
usano il ripiego e sono già corretti.

**Quell'avviso non lo vedrai.** L'abbiamo verificato: con un account GitHub nel
database la migration lo emette e la CLI di Prisma non stampa niente. Vale anche
per i provider OAuth semplici che la migration salta di proposito, quindi
un'esecuzione silenziosa è l'esito normale e non il segno che tutto è stato
classificato.

Esegui `scripts/verify-auth-migration.mjs` dopo la migration. Legge la tua
configurazione e riporta quello che la migration non ha potuto decidere, ed è
l'unica cosa che te lo dirà.

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
la guida di migrazione da Auth.js non documenta né l'uno né l'altro e tutti e due
falliscono in silenzio:

1. **L'`issuer` di un account OAuth non è il nome del provider, e non è lo stesso
   per tutti i provider.** La guida mostra `local:credential` per le password e
   si ferma lì. `local:oauth:<provider>` è quello che la libreria costruisce per
   un provider che non dichiara un issuer proprio, quindi è giusto per GitHub e
   sbagliato per Google, il cui issuer è `https://accounts.google.com`. Se lo
   sbagli, gli account esistenti non vengono riconosciuti al primo accesso.
   Leggi la [2.0.2](#202-riparare-lissuer-degli-account-oauth) qui sopra: il kit
   questo errore lo ha spedito nella 2.0 e lo ripara lì, e la stessa sezione
   spiega come controllare le tue righe invece di fidarti di un valore scritto
   a mano.
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

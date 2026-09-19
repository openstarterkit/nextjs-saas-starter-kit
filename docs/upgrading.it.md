---
title: Aggiornare
description: Prendere una versione nuova del kit senza perdere il proprio lavoro, e sapere prima quanto costa.
translated_from: upgrading.md
source_checksum: 886cfe93cefe
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
npm run check:deploy    # dalla 2.3.0: cosa manca al tuo database
npx prisma migrate deploy
```

I conflitti nascono dove hai modificato le stesse righe toccate dalla release. È il costo onesto di possedere il codice, ed è più piccolo di quanto sembri se il tuo lavoro vive dove il kit se lo aspetta: le tue rotte sotto `src/app`, i tuoi componenti in cartelle proprie, i tuoi testi in `src/locales`. I file che vanno in conflitto più spesso sono quelli che tutti modificano: `src/config/site.ts`, i file dei messaggi, `prisma/schema.prisma`.

Prima di una MAJOR leggi il [CHANGELOG](https://github.com/openstarterkit/nextjs-saas-starter-kit/blob/main/CHANGELOG.md). Dice cosa si è spostato.

## 2.3.0: pagamenti più completi, e un controllo prima di ogni migrazione

Una MINOR. È anche la release che aggiunge `npm run check:deploy`, quindi da qui in poi l'ordine è merge, install, controllo, migrazione:

```bash
git fetch upstream --tags
git merge v2.3.0
npm install
npm run check:deploy
npx prisma migrate deploy
npm run check:deploy
```

Il primo `check:deploy` nomina la migrazione che questa release aggiunge, `20260915104106_trials`, e qualunque migrazione più vecchia che al tuo database manca ancora. Il secondo deve dire *Ready*. Per controllare la produzione, imposta la sua stringa di connessione nella shell per quel solo comando: vince sui file env, e la prima riga dell'output dice quale database sta guardando. Usa la connessione diretta, non quella pooled.

La migrazione aggiunge `Plan.trialDays` e `Subscription.trialEndsAt`, entrambe nullabili, quindi gira su un database popolato senza chiederti niente. I piani esistenti non offrono prove finché non imposti la colonna, e gli abbonamenti esistenti non hanno una fine prova. Non c'è nessuna nuova variabile d'ambiente obbligatoria.

### Cosa cambia senza che tu faccia niente

- L'email di conferma dell'abbonamento, quando un abbonamento parte con una prova, dice quando arriva il primo addebito invece di annunciare un abbonamento attivo
- La tabella delle fatture mostra i totali nella valuta di ogni fattura, un link al PDF, e gli stati come etichette
- Due colori del tema chiaro sono più scuri, il rosso distruttivo e il testo attenuato, e il badge di successo è di una tonalità più profonda: tutti e tre superano il contrasto AA anche sulle superfici tinte. Se hai impostato valori tuoi per `--destructive` o `--muted-foreground` in `src/app/globals.css`, controllali sulle superfici tinte oltre che sul bianco
- `scripts/verify-auth-migration.mjs` non c'è più: `npm run check:deploy` fa i suoi controlli insieme agli altri
- La versione dell'API di Stripe è `2026-08-26.dahlia`. Se avevi fissato la precedente di proposito, la riga è in `src/lib/stripe.ts`

### Cosa puoi accendere

- **Prove gratuite**: imposta `trialDays` su un piano. Se rilanci il seed, il piano Pro mensile di esempio prende 14 giorni
- **Codici promozionali**: `STRIPE_ALLOW_PROMOTION_CODES="true"`
- **Stripe Tax**: `STRIPE_AUTOMATIC_TAX="true"`, dopo aver attivato Stripe Tax nel pannello Stripe. Leggi prima [Pagamenti](./billing.md): con Tax non attivo il checkout continua a funzionare e non applica nessuna tassa

### Se hai personalizzato il checkout o i pacchetti di Better Auth

La rotta del checkout costruisce i parametri di Stripe in un solo punto, e prove, codici promozionali e tasse sono tre rami lì dentro: uniscili ai tuoi se l'hai sostituita. E aggiorna `better-auth` e `@better-auth/prisma-adapter` insieme: spostati uno alla volta, npm può lasciare nell'albero due copie di `@better-auth/core` con il build ancora verde. `npm ls @better-auth/core` deve stampare una sola versione.

## 2.2.0: autenticazione a due fattori, e niente da decidere

Questa è una MINOR, e il numero è tutto il riassunto:

```bash
git fetch upstream --tags
git merge v2.2.0
npm install
npx prisma migrate deploy
```

La migrazione aggiunge una tabella `TwoFactor` e una colonna `User.twoFactorEnabled` con un default. Sono entrambe additive, quindi gira su un database popolato senza chiederti niente, e non c'è nessuna nuova variabile d'ambiente obbligatoria.

### Tre cambi di comportamento da leggere prima del merge

Riguardano gli account che attivano la funzione, quindi finché nessuno la attiva non cambia niente per nessuno. Sono elencati qui perché ognuno è una decisione che nel tuo prodotto puoi voler rivedere invece che ereditare in silenzio.

**Agli account con 2FA non viene più inviato il magic link.** Il link apre una sessione direttamente, quindi per un account con un secondo fattore sarebbe un modo per aggirare proprio la cosa che il suo proprietario ha acceso. La risposta è identica a quella normale, così il form non può essere usato per chiedere se un indirizzo ha un account o se quell'account ha il 2FA. Nessuno resta chiuso fuori: per attivare il 2FA serve già una password.

**Il collegamento automatico degli account è rifiutato per gli account con 2FA.** Un provider che verifica un indirizzo email normalmente si aggancia all'account che ce l'ha già. Per un account protetto da password e TOTP questo permetterebbe a chi controlla un account Google con lo stesso indirizzo di entrare senza password e senza codice. Collegare un provider da Impostazioni continua a funzionare, perché quella richiesta porta con sé la tua sessione. La regola sta in quattro booleani in `src/lib/account-linking.ts`, se vuoi leggerla o cambiarla.

**Agli accessi OAuth non viene chiesto un codice in più**, perché un secondo fattore dalla parte del provider è compito del provider. Se il tuo prodotto lo richiede comunque, è quella la decisione da cambiare, e [Autenticazione](./authentication.md) ha la tabella di cosa chiede ogni via d'accesso.

### Una conseguenza operativa

I segreti TOTP e i codici di backup sono conservati cifrati con `AUTH_SECRET`. **Ruotare quella variabile li rende illeggibili**, il che significa che ogni utente che aveva la funzione attiva deve riconfigurare la sua app authenticator. Era già vero per altre cose che quella variabile protegge; con il 2FA acceso è quella da sapere prima di ruotarla.

Se sia il telefono sia i codici di backup sono persi non c'è un modo automatico per rientrare, ed è voluto. Un amministratore azzera il secondo fattore con due istruzioni SQL, che stanno in [Autenticazione](./authentication.md).

### Se hai personalizzato il flusso di accesso

Il kit fa l'accesso con una server action invece che con l'SDK client. Con il 2FA attivo `signInEmail` non crea la sessione: risponde `twoFactorRedirect`, e un chiamante che lo ignora porta l'utente sul dashboard senza sessione e senza errore. Se hai scritto la tua action di accesso appoggiandoti a `@/lib/auth`, è quella la riga da aggiungere. In `src/app/actions/auth.ts` si vede com'è fatta.

## 2.1.0: la tabella account torna allineata a Better Auth 1.7.3

**Leggi questa sezione se sei sulla 2.0.0, 2.0.1, 2.0.2 o 2.0.3.** Se stai
installando il kit per la prima volta il tuo database nasce dallo schema
attuale e qui non c'è niente che ti riguardi.

### Cosa è cambiato, e non siamo stati noi

Better Auth 1.7.0 aveva aggiunto alla tabella account una colonna `issuer`
obbligatoria e cercava gli account con la coppia `(issuer, accountId)`. La 2.0
di questo kit è stata costruita su quello, e la 2.0.2 ha riparato i valori che
aveva scritto.

Il 5 settembre 2026 Better Auth ha fatto marcia indietro. La loro motivazione,
dalla pull request: una colonna obbligatoria che un database 1.6 già popolato
non può accettare senza un backfill è troppo rischiosa da chiedere a un servizio
in produzione, quindi ripristinare lo schema precedente è la strada meno
dirompente. Gli account tornano a essere identificati da
`(providerId, accountId)`, esattamente come nella 1.6, e si sono impegnati a non
toccare più lo schema core per tutto il resto della v1.

È uscita come `better-auth@1.7.3` il 6 settembre 2026. La loro guida è
[qui](https://www.better-auth.com/docs/guides/1-7-upgrade-guide).

### Cosa si rompe se non fai niente

Better Auth 1.7.3 non scrive mai `issuer`. Una colonna `NOT NULL` senza default
che nessuno scrive rifiuta ogni inserimento, quindi ogni registrazione e ogni
collegamento di un account fallisce. La libreria inoltre controlla lo schema
all'avvio, anche in produzione, e rifiuta le richieste di autenticazione invece
di fallire un inserimento alla volta.

Il tuo lockfile è fermo alla 1.7.2, quindi finché non aggiorni le dipendenze non
si rompe niente. Ed è proprio lì il rischio: il cambiamento arriva vestito da
numero di patch.

### Cosa fare

```bash
git fetch upstream --tags
git merge v2.1.0
npm install
```

Prima di migrare, chiedi al tuo database se può:

```bash
npm run check:deploy
```

È in sola lettura. Dice se la colonna `issuer` è ancora obbligatoria e se due
account condividono la stessa coppia `(providerId, accountId)`, che è l'unica
cosa che può fermare la migrazione. Poi:

```bash
npx prisma migrate deploy
npm run check:deploy
```

La migrazione rilascia l'indice unico prima della colonna, che è l'ordine su cui
insiste la guida di Better Auth: MySQL ricostruisce un indice a cui sparisce una
colonna, trasformando un indice unico composto in un vincolo sul solo
`accountId`, e questo rifiuta un utente che ha lo stesso identificativo presso
due provider diversi. Questo kit è su Postgres, dove non succede, ma l'ordine
non costa niente e l'SQL viene copiato.

Non si perde nulla. L'issuer era una funzione del provider, quindi niente di ciò
che viveva solo in quella colonna esisteva davvero solo lì.

### Se la migrazione si ferma sui duplicati

Nella 1.7.0-1.7.2 due configurazioni di provider potevano condividere un issuer
e finire in un'unica riga. Dalla 1.7.3 ogni provider si tiene la propria riga,
quindi l'indice unico ripristinato non può essere creato finché due righe hanno
la stessa coppia `(providerId, accountId)`. La migrazione controlla prima e si
ferma nominando le coppie, invece di lasciare che sia Postgres a segnalare una
violazione di vincolo alla fine.

Decidi quale riga sopravvive, cancella le altre e rilanciala. Due righe con lo
stesso provider e lo stesso identificativo sono due registrazioni di una sola
identità, quindi tenerle entrambe non ha mai voluto dire niente. La riga da
tenere di solito è quella i cui token vengono da un accesso vero.

### Se preferisci non eliminare ancora la colonna

Allentare il vincolo basta a sbloccare le registrazioni, ed è reversibile:

```sql
ALTER TABLE "Account" ALTER COLUMN "issuer" DROP NOT NULL;
DROP INDEX "Account_issuer_accountId_key";
```

Il kit la elimina perché `prisma/schema.prisma` è lo schema da cui parte ogni
clone, e una colonna che nessuno scrive sopravvivrebbe alla ragione per cui
esiste. La tua copia però è tua.

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
npm run check:deploy
```

Il controllo è di sola lettura. Nella 2.0.2 era uno script a sé, `scripts/verify-auth-migration.mjs`, che leggeva l'issuer che ogni provider configurato
dichiara, lo confrontava con quello memorizzato ed elencava ogni riga che non
sarebbe stata trovata, invece di confrontare il tuo database con un valore
scritto dentro lo script, ed è quella distinzione la ragione per cui l'errore
originale è sopravvissuto ai nostri controlli: una verifica che confronta i dati
con la propria assunzione non può che confermarla.

**Dalla 2.1.0 controlla altro**, perché Better Auth ha rimosso la colonna e con
lei i due helper che lo script leggeva. Se sei sulla 2.1.0 o successiva non puoi
più verificare con questo una riparazione della 2.0.2, e non ti serve: la
migrazione della 2.1.0 elimina la colonna in cui quei valori vivevano. Vai alla
[2.1.0](#210-la-tabella-account-torna-allineata-a-better-auth-173) e prendi
quella.

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

Esegui `npm run check:deploy` dopo la migration. Sulla 2.0.x lo script che ha sostituito leggeva
la tua configurazione e riportava quello che la migration non aveva potuto
decidere, ed era l'unica cosa che te lo diceva. Dalla 2.1.0 la colonna non c'è
più e il controllo risponde a una domanda diversa, quindi su quella versione qui non
resta niente da classificare.

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

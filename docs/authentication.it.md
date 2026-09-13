---
title: Autenticazione
description: OAuth, magic link, email e password, reset e collegamento degli account.
translated_from: authentication.md
source_checksum: d1729d4c21b0
---

# Autenticazione

Il kit offre quattro modi per accedere, tutti collegati alla stessa riga `User`, così qualsiasi combinazione funziona su un solo account. Better Auth con sessioni su database e l'adapter Prisma (`src/auth.ts`). Le sessioni sono righe, quindi revocarne una significa cancellarla.

| Metodo | Richiede | Note |
|---|---|---|
| OAuth Google / GitHub | le credenziali di un'app OAuth | Vedi [Configurazione](./configuration.md) |
| Magic link (senza password) | `RESEND_API_KEY` | Link monouso via email, valido 15 minuti |
| Email e password | niente | Hash bcrypt, con un flusso di reset completo |
| Accesso di sviluppo | `NODE_ENV=development` | Amministratore con un clic, mai attivo in produzione |


Sopra a ognuno di questi, un account con una password può richiedere un **secondo fattore**: vedi [Verifica in due passaggi](#verifica-in-due-passaggi), che dice anche quale dei quattro modi di entrare lo chiede e quale no.
Un deploy dimostrativo pubblico (`DEMO_MODE="true"`) sostituisce tutto questo con account condivisi a un clic. Le pagine di registrazione e di reset della password restano visibili come vetrina, ma i loro moduli sono disattivati, con un avviso che spiega perché, e anche le server action rifiutano gli invii in demo: così nessun visitatore può far partire email o creare account dalla tua demo.

## Magic link

La pagina di accesso manda un link monouso («Email me a sign-in link»). Sotto c'è il plugin magic link di Better Auth con un `sendMagicLink` personalizzato, così l'email usa lo stesso modello con il tuo marchio delle transazionali (`src/lib/email.ts`). I link valgono 15 minuti e si consumano al primo uso. Cliccare il link imposta anche `emailVerified` sull'utente.

Se `RESEND_API_KEY` non è impostata, il pulsante si nasconde da solo e il provider non viene registrato.

## Email e password

- **Registrazione** (`/signup`): validata con Zod (`src/lib/password.ts`, da 8 a 72 caratteri), con hash bcrypt (costo 12, tramite `bcryptjs` in JavaScript puro: nessuna compilazione nativa). Quando Resend è configurato, la registrazione manda un magic link che verifica l'indirizzo e completa il primo accesso in un colpo solo; senza Resend ti fa entrare direttamente.
- **Accesso**: ogni modo di fallire (indirizzo sconosciuto, account solo OAuth, password sbagliata) restituisce lo stesso messaggio generico, così il modulo non si può usare per scoprire quali email hanno un account.
- **Reset** (`/forgot-password` → link via email → `/reset-password`): i token sono valori casuali da 32 byte, e il database ne conserva solo l'hash SHA-256. Scadono dopo 30 minuti e valgono una volta sola, consumati nella stessa transazione che sostituisce l'hash della password.

### Limite di frequenza, detto onestamente

Accesso, registrazione, magic link e richieste di reset passano da un piccolo limitatore a finestra fissa (`src/lib/rate-limit.ts`). Di default i contatori vivono nella memoria di ogni istanza, il che su serverless significa che una richiesta finita su un'altra istanza riparte da zero: consideralo un dosso e non un muro, con il costo di bcrypt come freno vero contro la forza bruta.

Dalla v2.2 il muro dista due variabili d'ambiente. Imposta `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` e gli stessi contatori si spostano su Upstash Redis, condivisi fra tutte le istanze e tutte le regioni. Sono entrambe facoltative per scelta — una variabile obbligatoria avrebbe reso questa release una major per chiunque avesse già clonato il kit — e non cambia nient'altro: nessuna libreria client installata, sono due comandi in una sola `fetch`.

Se l'archivio condiviso è configurato ma irraggiungibile, il limitatore ricade sul contatore in memoria invece di fallire in una delle due direzioni. Rifiutare tutti porterebbe giù il sito insieme al Redis; lasciar passare tutti toglierebbe la protezione proprio quando qualcosa è già rotto.

Vale la pena sapere quale limite fa cosa, perché l'argomento qui sopra ne copre solo uno. Il limite sull'accesso protegge i tentativi di password, e lì il peso lo regge bcrypt. I limiti su magic link, registrazione e reset proteggono invece **l'invio di email**: ognuno stabilisce quanti messaggi un singolo indirizzo può far partire, e bcrypt non c'entra niente. Se quello che stai proteggendo è la bolletta di Resend o la reputazione del tuo dominio, è questo il limite da spostare per primo su un archivio condiviso.

I form pubblici (contatti, newsletter) sono limitati per IP invece che per indirizzo. Come si comporta questo fuori da Vercel è spiegato in [Deployment](./deployment.it.md#deploy-fuori-da-vercel).

### Una nota sulle sessioni

Le sessioni sono **righe nel database**, una per accesso, e portano con sé l'indirizzo IP e lo user agent con cui sono nate. Revocarne una è cancellarla, con effetto immediato e ovunque. Fino alla v2.0 erano JWT senza stato con un contatore `sessionVersion` che fingeva quella possibilità: la colonna non c'è più, e non serve più.

Resta un compromesso voluto. `session.cookieCache` (60 secondi, in `src/auth.ts`) tiene la sessione in un cookie firmato per un minuto, così rileggerla non costa una query a ogni richiesta. Una sessione revocata altrove può quindi restare viva su un altro dispositivo fino a quel minuto: stessa finestra che aveva il vecchio contatore, una riga di configurazione invece di tre file. Il reset della password continua a chiudere subito tutte le altre sessioni (`revokeSessionsOnPasswordReset`), e il ruolo viene letto dalla riga, quindi promuovere o degradare qualcuno raggiunge una sessione già aperta entro lo stesso minuto senza disconnetterla.

### Sessioni attive, in Impostazioni

Dashboard → Impostazioni elenca ogni sessione dell'account con il dispositivo, il browser e l'indirizzo IP con cui è nata, quella corrente marcata, e un bottone per chiudere una qualsiasi delle altre. È una vista su righe che c'erano già dalla 2.0, non qualcosa di nuovo da conservare.

Due dettagli vale la pena conoscerli. Quello che il browser invia è l'**id della sessione** di `revokeSession`, mai il token: il token è la credenziale, e una pagina che lo stampa consegna una sessione funzionante a qualsiasi cosa sappia leggere il DOM o uno screenshot. E la riga del dispositivo è una lettura dello user agent (`src/lib/user-agent.ts`), che è una stringa scelta liberamente dal client: serve a far riconoscere a qualcuno il proprio portatile, non a dimostrare niente.

La sessione corrente non si chiude dalla lista, perché il bottone per farlo si chiama "Esci" ed esiste già.

## Cambiare il proprio indirizzo email

Dashboard → Impostazioni → Metodi di accesso. L'indirizzo non cambia all'invio del form: cambia quando viene cliccato il link mandato al **nuovo** indirizzo, che è l'unico modo di sapere che chi lo sta chiedendo può leggere la posta lì.

Un secondo messaggio va al **vecchio** indirizzo, a dire cosa è stato richiesto. Non è un veto, è un avviso: chi mette le mani su una sessione viva non deve poter spostare un account altrove in silenzio. Se quel messaggio arriva e non l'hai chiesto tu, la cosa da fare subito dopo è il reset della password.

La risposta è la stessa sia che il nuovo indirizzo appartenga già a un altro account sia che non ci appartenga, per lo stesso motivo per cui il form di accesso dà un solo messaggio per ogni fallimento: un form che risponde in modo diverso è un modo per chiedere al sito chi è registrato.

## Verifica in due passaggi

Ogni account con una password può attivare un secondo fattore da Dashboard → Settings: un codice a sei cifre da un'app di autenticazione (TOTP, RFC 6238). È self-hosted, quindi nessun fornitore esterno e nessuna bolletta di SMS. Il nome che i tuoi utenti leggeranno dentro la loro app viene da `siteConfig.name`, motivo per cui conviene impostarlo prima che qualcuno attivi tutto questo.

**L'attivazione è in due passi di proposito.** Il primo salva un segreto non verificato e mostra il QR, la chiave da digitare e dieci codici di backup; solo un codice corretto dall'app lo accende davvero. Un'attivazione abbandonata a metà lascia quindi l'account esattamente com'era, ed è la differenza fra una funzione e un'esclusione.

**Cosa chiede il codice e cosa no:**

| Modo di entrare | Secondo fattore |
|---|---|
| Email e password | **Richiesto.** La password da sola non apre nessuna sessione |
| Magic link | **Non viene proprio inviato** agli account con la verifica attiva |
| Google / GitHub | **Non richiesto** — il provider lo fa già meglio |
| Accesso dev / demo | Non richiesto, e l'account demo non può attivarla |

Tre di queste righe sono decisioni, non impostazioni predefinite, e ognuna merita una frase.

**Il magic link viene trattenuto** perché apre una sessione direttamente: per un account con la verifica attiva sarebbe un modo di girare intorno proprio alla cosa che il suo proprietario ha acceso. Nessuno resta chiuso fuori, perché per attivare la verifica serve comunque una password. La risposta è identica a quella normale — stesso reindirizzamento, nessun messaggio — così non la si può usare per chiedere se un indirizzo ha un account o se quell'account ha la verifica attiva; al posto della spiegazione c'è una riga sulla pagina di accesso, rivolta a tutti.

**Il reset della password non è lo stesso buco**, e vale la pena sapere perché: dopo un reset si rientra comunque da email e password, che il codice lo chiedono.

**A OAuth non chiediamo un TOTP sopra**, perché un secondo fattore dalla parte di Google è compito di Google, e lo fa meglio. Ma la metà automatica del collegamento degli account viene rifiutata per questi account: vedi più sotto.

**Gli accessi dev e demo** aprono una sessione senza verificare niente, quindi un controllo lì sorveglierebbe una porta senza serratura. A tenerli al sicuro è quello che li ha sempre tenuti al sicuro: dev è rifiutato fuori dallo sviluppo, demo esiste solo quando `DEMO_MODE` è attivo. In più l'account demo non può attivare la verifica in due passaggi, perché il ripristino notturno lascerebbe il visitatore successivo con un fattore che nessuno possiede.

### Codici di backup

Dieci, ognuno valido per un solo accesso e consumato quando lo usi. Si vedono **una volta sola**, in fase di attivazione, e non sono più recuperabili: rigenerarli sostituisce l'intera serie e i vecchi smettono di funzionare subito.

Sono generati in maiuscolo e senza `0`, `O`, `1` e `I` (`src/lib/backup-codes.ts`), perché finiscono scritti su carta e vengono ridigitati il giorno in cui il telefono non c'è più; a chi li digita si perdonano minuscole, spazi e trattino mancante, mai un codice sbagliato. Sono conservati **cifrati** con `AUTH_SECRET`, come il segreto TOTP stesso — ed è l'unica conseguenza operativa da conoscere prima di ruotare quella variabile: ruotarla rende illeggibili tutti i segreti e tutti i codici di backup.

### Se sono spariti sia il telefono sia i codici

Non esiste un modo di rientrare da soli, e la schermata di accesso lo dice invece di lasciare che qualcuno tenti combinazioni a mezzanotte. Un amministratore azzera il secondo fattore per quell'utente:

```sql
DELETE FROM "TwoFactor" WHERE "userId" = '...';
UPDATE "User" SET "twoFactorEnabled" = false WHERE id = '...';
```

Verifica chi te lo sta chiedendo prima di eseguirla. Quella query è l'intero percorso di recupero, ed è esattamente il motivo per cui non deve essere raggiungibile da un modulo.

## Collegare più account

Un utente, più modi per entrare:

- **Automatico**: un provider che ha verificato l'indirizzo si aggancia all'account che ce l'ha già. Entra con Google, più avanti con GitHub sullo stesso indirizzo, e finisci sullo stesso account. Il magic link e il flusso con password fanno corrispondere l'email allo stesso modo.
- **Tranne che per gli account con la verifica in due passaggi**, dove la metà automatica viene rifiutata. Better Auth chiede il secondo fattore all'accesso con email e da nessun'altra parte, quindi senza questo un account protetto da password e TOTP potrebbe essere aperto da chiunque controlli un account Google con lo stesso indirizzo: preme «Continue with Google», viene agganciato, ed entra senza password e senza codice — anche non avendo mai collegato Google. Viene rifiutata solo la metà automatica: collegare il provider **tu stesso da Settings** continua a funzionare, perché quella richiesta porta con sé la tua sessione e quando la fai sei già passato dal secondo fattore. La regola sta in quattro booleani, in `src/lib/account-linking.ts`.
- **Manuale**: Dashboard → Settings → **Sign-in methods** mostra i provider collegati con i pulsanti Connect e Disconnect, più un modulo per impostare o cambiare la password. Collegarne uno avvia un normale flusso OAuth mentre sei già dentro, e questo fa sì che l'adapter agganci il nuovo account invece di crearne uno.
- **Protezione dall'autoesclusione**: non puoi scollegare l'unico modo che ti resta per entrare. Il server verifica che sopravviva almeno un metodo: un altro provider, una password, oppure il magic link quando Resend è configurato.

## Aggiungere un altro provider OAuth

1. Aggiungi il provider sotto `socialProviders` in `src/auth.ts`. Il collegamento a un account che ha già lo stesso indirizzo verificato è il comportamento predefinito, quindi non c'è nessun flag da mettere: `account.accountLinking` è dove lo cambi se vuoi il contrario.
2. Aggiungi le sue credenziali a `.env.example` e ai tuoi file di ambiente.
3. Aggiungi un pulsante in `src/app/(auth)/login/page.tsx`, copiando uno dei moduli OAuth già presenti.
4. Se vuoi, elencalo in `PROVIDER_LABELS` dentro `src/app/(dashboard)/dashboard/settings/page.tsx`, così compare sotto Sign-in methods.

---
title: Autenticazione
description: OAuth, magic link, email e password, reset e collegamento degli account.
translated_from: authentication.md
source_commit: 7fd7e49
---

# Autenticazione

Il kit offre quattro modi per accedere, tutti collegati alla stessa riga `User`, così qualsiasi combinazione funziona su un solo account. Auth.js v5 con sessioni JWT e l'adapter Prisma (`src/auth.ts`).

| Metodo | Richiede | Note |
|---|---|---|
| OAuth Google / GitHub | le credenziali di un'app OAuth | Vedi [Configurazione](./configuration.md) |
| Magic link (senza password) | `RESEND_API_KEY` | Link monouso via email, valido 15 minuti |
| Email e password | niente | Hash bcrypt, con un flusso di reset completo |
| Accesso di sviluppo | `NODE_ENV=development` | Amministratore con un clic, mai attivo in produzione |

Un deploy dimostrativo pubblico (`DEMO_MODE="true"`) sostituisce tutto questo con account condivisi a un clic. Le pagine di registrazione e di reset della password restano visibili come vetrina, ma i loro moduli sono disattivati, con un avviso che spiega perché, e anche le server action rifiutano gli invii in demo: così nessun visitatore può far partire email o creare account dalla tua demo.

## Magic link

La pagina di accesso manda un link monouso («Email me a sign-in link»). Sotto c'è il provider Resend di Auth.js con un `sendVerificationRequest` personalizzato, così l'email usa lo stesso modello con il tuo marchio delle transazionali (`src/lib/email.ts`). I link valgono 15 minuti e si consumano al primo uso. Cliccare il link imposta anche `emailVerified` sull'utente.

Se `RESEND_API_KEY` non è impostata, il pulsante si nasconde da solo e il provider non viene registrato.

## Email e password

- **Registrazione** (`/signup`): validata con Zod (`src/lib/password.ts`, da 8 a 72 caratteri), con hash bcrypt (costo 12, tramite `bcryptjs` in JavaScript puro: nessuna compilazione nativa). Quando Resend è configurato, la registrazione manda un magic link che verifica l'indirizzo e completa il primo accesso in un colpo solo; senza Resend ti fa entrare direttamente.
- **Accesso**: ogni modo di fallire (indirizzo sconosciuto, account solo OAuth, password sbagliata) restituisce lo stesso messaggio generico, così il modulo non si può usare per scoprire quali email hanno un account.
- **Reset** (`/forgot-password` → link via email → `/reset-password`): i token sono valori casuali da 32 byte, e il database ne conserva solo l'hash SHA-256. Scadono dopo 30 minuti e valgono una volta sola, consumati nella stessa transazione che sostituisce l'hash della password.

### Limite di frequenza, detto onestamente

Accesso, registrazione, magic link e richieste di reset passano da un piccolo limitatore a finestra fissa tenuto in memoria (`src/lib/rate-limit.ts`). Sulle piattaforme serverless ogni istanza ha la propria memoria, quindi consideralo un dosso e non un muro: il freno vero contro la forza bruta è il costo di bcrypt. Se ti servono garanzie forti su larga scala, sostituiscilo con un archivio condiviso, per esempio Upstash Redis, dietro la stessa firma di funzione.

### Una nota sulle sessioni JWT

Le sessioni sono JWT senza stato, il che di norma le rende impossibili da revocare lato server. Il kit chiude la falla che conta: ogni utente ha un contatore `sessionVersion` che viene scritto nel token e riconfrontato col database al massimo una volta al minuto. Un reset della password incrementa il contatore, quindi ogni altra sessione muore entro una sessantina di secondi; il controllo, se il database dà errore, lascia passare (prima la disponibilità) ed è limitato nella frequenza perché il middleware gira su quasi ogni richiesta. Cambiare la password dalle impostazioni **non** incrementa il contatore, di proposito, così la sessione che sta facendo la modifica resta dentro. Se il tuo modello di rischio richiede la revoca istantanea, passa alle sessioni su database.

## Collegare più account

Un utente, più modi per entrare:

- **Automatico**: Google e GitHub sono configurati con `allowDangerousEmailAccountLinking`. Nonostante il nome faccia paura qui è sicuro, perché entrambi i provider verificano la proprietà dell'indirizzo; quel parametro esiste per proteggere dai provider che non lo fanno. Entra con Google, più avanti con GitHub sullo stesso indirizzo, e finisci sullo stesso account. Il magic link e il flusso con password fanno corrispondere l'email allo stesso modo.
- **Manuale**: Dashboard → Settings → **Sign-in methods** mostra i provider collegati con i pulsanti Connect e Disconnect, più un modulo per impostare o cambiare la password. Collegarne uno avvia un normale flusso OAuth mentre sei già dentro, e questo fa sì che l'adapter agganci il nuovo account invece di crearne uno.
- **Protezione dall'autoesclusione**: non puoi scollegare l'unico modo che ti resta per entrare. Il server verifica che sopravviva almeno un metodo: un altro provider, una password, oppure il magic link quando Resend è configurato.

## Aggiungere un altro provider OAuth

1. Aggiungi il provider in `src/auth.ts` (Auth.js ne offre decine: `next-auth/providers/*`). Se il provider verifica gli indirizzi, puoi mettere `allowDangerousEmailAccountLinking: true` per avere lo stesso collegamento automatico.
2. Aggiungi le sue credenziali a `.env.example` e ai tuoi file di ambiente.
3. Aggiungi un pulsante in `src/app/(auth)/login/page.tsx`, copiando uno dei moduli OAuth già presenti.
4. Se vuoi, elencalo in `PROVIDER_LABELS` dentro `src/app/(dashboard)/dashboard/settings/page.tsx`, così compare sotto Sign-in methods.

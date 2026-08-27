---
title: Aggiornare
description: Prendere una versione nuova del kit senza perdere il proprio lavoro, e sapere prima quanto costa.
translated_from: upgrading.md
source_checksum: 4747515650e2
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

## La prossima major: cambia l'autenticazione

La versione **2.0** sostituisce la libreria di autenticazione. È l'unica cosa che quella release contiene: nessuna funzione nuova, nient'altro da rivedere, così che la migrazione sia il più facile possibile da adottare.

La 1.7 ha già fatto la parte che la rende economica. Tutto ciò che legge l'utente collegato passa ora da un modulo solo:

```ts
import { getCurrentUser, requireUser } from "@/lib/auth"

const user = await getCurrentUser()   // l'utente, oppure null
const user = await requireUser()      // l'utente, oppure un rimando all'accesso
```

`getCurrentUser()` funziona già oggi, sulla libreria attuale. Continuerà a funzionare dopo la 2.0, restituendo la stessa forma: `id`, `role`, `email`, `name`, `image`.

**Cosa fare adesso, nel tuo codice:** leggi la sessione attraverso quelle funzioni e non importando `auth()` da `@/auth`. Il codice scritto contro il confine sopravvive all'aggiornamento senza essere toccato. Il codice scritto contro la libreria è codice che dovrai cercare e riscrivere.

Le eccezioni, che il kit gestisce già per te, sono i punti in cui una libreria è inevitabile: le action di accesso e uscita, la route sotto `src/app/api/auth` e il middleware. Se non li hai modificati, la 2.0 non ti chiederà niente su di loro.

## Prima di aggiornare qualsiasi cosa

Committa o metti da parte il tuo lavoro, così il diff che rivedi è la release e nient'altro. Poi, dopo il merge:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Quattro comandi, in quest'ordine, perché falliscono dal più economico al più costoso. Un errore di tipo trovato in due secondi è un errore di tipo per cui non hai aspettato quattro minuti di build.

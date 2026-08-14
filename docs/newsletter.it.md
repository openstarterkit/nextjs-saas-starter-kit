---
title: Newsletter e waitlist
description: Lista con doppio opt-in, registro del consenso, sincronizzazione con Resend ed export dall'amministrazione.
translated_from: newsletter.md
source_checksum: e88bee27b420
---

# Newsletter e waitlist

Il kit include una lista con doppio opt-in che vive nel tuo database. È quella che alimenta la waitlist pre-lancio sulla pagina dei prezzi, ed è una funzione riutilizzabile: la lista, il flusso di conferma e l'export dall'amministrazione restano tuoi.

## Come funziona

1. Un visitatore inserisce la sua email nel modulo. `POST /api/newsletter` la valida (Zod), controlla un campo esca e applica un limite di frequenza per IP e per indirizzo, poi salva una riga `NewsletterSubscriber` e invia l'email di conferma.
2. Il link di conferma (`/newsletter/confirm?token=...`) imposta `confirmedAt`, manda l'email di benvenuto e, se configurato, aggiunge il contatto a una Resend Audience. I link scadono dopo 7 giorni.
3. Ogni email porta un link di disiscrizione a un clic (`/newsletter/unsubscribe?token=...`) che ha effetto immediato.

L'API risponde sempre un `200` neutro: che l'indirizzo sia nuovo, già iscritto o non valido, la risposta è identica, quindi l'endpoint non rivela mai chi è in lista. La risposta vera arriva per email.

## Registro del consenso

`createdAt` (la richiesta di iscrizione) e `confirmedAt` (l'opt-in completato) documentano insieme il doppio consenso per ogni indirizzo. L'export CSV dall'amministrazione contiene entrambi, quindi il file vale anche come registro del consenso. Il kit **non** salva gli indirizzi IP, di proposito: sono dati personali di cui qui non hai bisogno.

## Spedire le email

Il kit non include un editor per la newsletter, ed è una scelta. Gli iscritti confermati vengono sincronizzati su una Resend Audience, e ogni numero lo mandi come Broadcast dal pannello Resend, che ti dà editor, programmazione, gestione delle disiscrizioni e tracciamento di aperture e clic senza costruirli.

Niente parte da solo: nel kit non c'è nessun cron, nessun job programmato, nessuna automazione. Un numero esce quando premi invia.

Una parola sulla cadenza che prometti. Il modulo di iscrizione, la pagina di conferma e l'email di benvenuto descrivono tutti e tre cosa riceverà chi si iscrive, e il kit li scrive senza indicare una frequenza, di proposito. Una cadenza è facile da scrivere e difficile da mantenere, e quella dell'email di benvenuto è la versione che resta nella loro casella. Prometti quello che starai ancora facendo fra tre mesi, e se decidi di impegnarti su un ritmo, cambiali tutti e tre insieme.

Imposta `RESEND_AUDIENCE_ID` per attivare la sincronizzazione. Senza, la lista nel database funziona lo stesso: salta solo la copia su Resend.

## Amministrazione

Il pannello (`/admin`) mostra il conteggio dei confermati e di quelli in attesa, le iscrizioni più recenti, e un pulsante **Export CSV** servito da `/api/admin/newsletter-export`, riservato agli amministratori.

## Modalità demo

Con `DEMO_MODE="true"` il modulo resta visibile ma l'API non scrive niente e non manda nessuna email, lo stesso schema del checkout.

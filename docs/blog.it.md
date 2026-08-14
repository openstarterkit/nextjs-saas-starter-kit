---
title: Blog e contenuti
description: Blog MDX su file, con categorie, feed RSS e SEO per ogni articolo.
translated_from: blog.md
source_checksum: b4491fb3a20b
---

# Blog e contenuti

Il kit include un blog basato su file: ogni articolo è un file `.mdx` (o `.md`) in `content/blog/`, e pubblicare è un commit. Nessun database, nessun CMS, nessun servizio esterno.

## Scrivere un articolo

Crea un file in `content/blog/`. Il nome del file diventa lo slug dell'indirizzo (`content/blog/mio-articolo.mdx` viene servito su `/blog/mio-articolo`). Il frontmatter porta i metadati:

```mdx
---
title: "Il mio primo articolo"
description: "Compare nell'indice, nei risultati di ricerca e nel feed RSS."
date: "2026-08-01"
category: "Product"
---

Il tuo contenuto qui. Markdown e tabelle GFM funzionano, e trattandosi di file
MDX puoi anche importare e usare componenti React.
```

I campi obbligatori del frontmatter sono `title`, `description`, `date` e `category`. `cover` è facoltativo. Un campo obbligatorio mancante ferma il build con un errore, invece di spedire una scheda rotta. Il tempo di lettura è calcolato per te, e gli articoli sono ordinati dal più recente.

## Immagini di copertina

Aggiungi un `cover`, se vuoi:

```mdx
cover: "/blog/covers/mio-articolo.svg"
```

Compare come miniatura nell'indice del blog e come banner in cima all'articolo. Gli articoli senza `cover` rendono benissimo come solo testo.

Gli articoli di esempio portano copertine vettoriali che prendono il tuo colore d'accento. I sorgenti vivono in `content/blog/covers/*.svg`, disegnati in grigi neutri con due segnaposto, `__ACCENT_1__` e `__ACCENT_2__`, e una route li riempie col tuo marchio prima di servirli sotto `/blog/covers/`. Quindi il kit arriva in scala di grigi, e impostando `NEXT_PUBLIC_BRAND_PRIMARY` (più `_2`) le ridipinge tutte insieme, senza un file da ridisegnare. Pesano poche centinaia di byte l'una, restano nitide su qualsiasi schermo e non hanno licenze.

Preferisci disegni tuoi? Metti un file in `public/blog/covers/` e punta `cover` lì: un file statico vince sulla route, quindi fotografie e PNG esportati funzionano esattamente come prima.

### Prima di sostituirle con immagini generate

Le copertine incluse sono forme vettoriali astratte: nessuna persona, nessun luogo, niente di fotorealistico. Vale la pena pensarci prima di rimpiazzarle con l'output di un modello di immagini.

Dal 2 agosto 2026 l'AI Act europeo chiede a chi pubblica contenuti generati o manipolati dall'intelligenza artificiale, di un certo tipo, di dichiararlo. La norma riguarda i contenuti che somigliano a persone, oggetti o luoghi reali e che passerebbero per autentici, quindi la geometria astratta ne resta fuori e queste copertine non pongono alcuna domanda. Un'immagine generata fotorealistica può invece rientrarci, e ciò che conta è **quando** l'immagine è stata generata, quindi tutto quello che produci da qui in avanti merita un secondo sguardo.

Non è un motivo per evitare le immagini generate e non è un parere legale. È un avviso: quella scelta porta con sé una domanda che le copertine incluse non hanno, e la domanda diventa tua nel momento in cui pubblichi. Se preferisci non avercela, tieni le copertine vettoriali o usa fotografie tue.

Nota che questo non c'entra con l'anteprima social: ogni articolo riceve comunque un'immagine Open Graph generata al volo per quando il link viene condiviso, che abbia una copertina o no.

## Categorie

`category` è una stringa libera. Il kit costruisce da solo una pagina per ogni categoria su `/blog/category/[slug]` e la collega da ogni articolo. Tieni l'insieme piccolo: due o tre categorie coprono quasi tutti i prodotti.

## Bozze

Aggiungi `draft: true` al frontmatter per tenere un articolo fuori dall'indice, dalle pagine di categoria, dal feed RSS e dalla sitemap. In sviluppo continua a rendere al suo indirizzo diretto, così puoi vederlo in anteprima.

## RSS

Il feed è generato dallo stesso frontmatter e servito su `/blog/rss.xml`. È dichiarato nei metadati dell'indice del blog, quindi i lettori di feed lo trovano da soli.

## SEO

Ogni articolo imposta i propri metadati, un indirizzo canonico, i tag Open Graph e un blocco JSON-LD `Article`, e riceve un'immagine Open Graph resa al volo (vedi `src/app/[locale]/(public)/blog/[slug]/opengraph-image.tsx`). Gli articoli finiscono in `sitemap.xml` automaticamente.

## Dove vive il codice

| File | Ruolo |
|---|---|
| `src/lib/blog.ts` | Legge e interpreta i file, espone `getAllPosts`, `getPost`, `getCategories` |
| `src/app/[locale]/(public)/blog/` | Indice, pagina articolo, pagina categoria e la route del feed RSS |
| `content/blog/` | I tuoi articoli |

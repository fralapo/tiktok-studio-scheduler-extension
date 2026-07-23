# TikTok Studio Scheduler

[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4)](manifest.json)
[![Version](https://img.shields.io/badge/version-2.2.2-ff2c55)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Estensione Chrome open source per applicare una didascalia comune e programmare più clip nella pagina TikTok Studio Upload.

> [!IMPORTANT]
> Il progetto automatizza l'interfaccia web di TikTok Studio e può richiedere aggiornamenti quando TikTok modifica il DOM. Verifica sempre il riepilogo prima di usare il comando separato **Pubblica sulla pagina**.

## Funzioni principali

- programmazione da adesso o da data/ora specifica;
- intervalli normalizzati per eccesso a multipli di 5 minuti;
- supporto del calendario TikTok fino al limite disponibile di 30 giorni;
- modifica didascalie tramite Draft.js;
- conferma separata per `Pubblica (N)`;
- nessun server esterno e nessuna raccolta di credenziali.

## Normalizzazione automatica dell’intervallo — 2.2.2

Anche il campo **Intervallo tra le clip** viene corretto automaticamente per eccesso al multiplo di 5 successivo, sia dopo la digitazione sia prima dell’avvio:

- `7` → `10` minuti
- `13` → `15` minuti
- `15` → `15` minuti
- `18` → `20` minuti

Il valore resta compreso tra 5 e 1440 minuti. La normalizzazione della data/ora specifica continua a funzionare nello stesso modo.

## Sicurezza

La preparazione non preme mai automaticamente il pulsante globale `Pubblica (N)`. Dopo il riepilogo serve il comando separato **Pubblica sulla pagina** e una conferma dell’utente.

## Modalità di partenza

- **Da adesso**: la prima clip viene impostata al primo multiplo di 5 almeno 20 minuti nel futuro.
- **Da data e ora specifica**: permette di scegliere il momento della prima clip, sempre:
  - almeno 20 minuti nel futuro;
  - con minuti multipli di 5;
  - entro il limite TikTok di 30 giorni.

Le clip successive seguono l’intervallo configurato, anch’esso multiplo di 5.

## Arrotondamento automatico dell’orario

Quando la data e l’ora vengono digitate manualmente, i minuti sono normalizzati automaticamente **per eccesso** al multiplo di 5 successivo:

- `13:13` diventa `13:15`;
- `13:55` resta `13:55`;
- `13:58` diventa `14:00`;
- `23:58` diventa `00:00` del giorno successivo.

La normalizzazione avviene durante la modifica del campo, quando il campo perde il focus e nuovamente prima dell’avvio dell’automazione.

## Correzione calendario 2.2.0

La selezione della data usa la struttura reale verificata del calendario TikTok:

- legge mese e anno da `.month-header-wrapper .title-wrapper`;
- cambia mese cliccando i due `span.arrow` in ordine DOM;
- attende il cambiamento effettivo del titolo dopo ogni click;
- distingue i giorni del mese corrente cercando la sequenza consecutiva `1..N` nella griglia;
- clicca esattamente `span.day`, il nodo che possiede il gestore React;
- verifica la classe `.day.selected` prima di impostare ora e minuti;
- rifiuta giorni senza classe `valid`.

Questo evita sia il click sul contenitore non interattivo sia la selezione del giorno duplicato appartenente al mese precedente o successivo.

## Installazione

1. Rimuovi tutte le versioni precedenti da `chrome://extensions`.
2. Chiudi tutte le schede TikTok Studio.
3. Estrai lo ZIP in una cartella nuova.
4. Attiva **Modalità sviluppatore**.
5. Premi **Carica estensione non pacchettizzata** e scegli la cartella estratta.
6. Apri una nuova pagina `https://www.tiktok.com/tiktokstudio/upload`.

Nel popup devono apparire `v2.2.2` e `Content script 2.2.2`.

## Uso

1. Carica le clip su TikTok Studio.
2. Apri il popup.
3. Inserisci la didascalia.
4. Scegli l’intervallo.
5. Scegli **Da adesso** oppure **Da data e ora specifica**.
6. Premi **Avvia automazione**.
7. Controlla il riepilogo e la tabella.
8. Premi separatamente **Pubblica sulla pagina** solo quando sei soddisfatto.

## Note

TikTok può modificare il DOM senza preavviso. La versione 2.2.2 si basa sui selettori e comportamenti verificati nel luglio 2026, evitando classi styled-jsx con hash dinamici.

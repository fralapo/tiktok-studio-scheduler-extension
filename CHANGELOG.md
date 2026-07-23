# Changelog


## 2.2.2

- Normalizzazione automatica per eccesso anche del campo **Intervallo tra le clip**.
- Esempi: `7 → 10`, `13 → 15`, `15 → 15`, `18 → 20`.
- Correzione applicata dopo una breve pausa nella digitazione, su cambio/focus perso e nuovamente prima dell’avvio.
- Allineate le versioni di Manifest, popup e content script a 2.2.2.

## 2.2.1

- Arrotondamento automatico per eccesso della data/ora digitata al multiplo di 5 successivo.
- Normalizzazione applicata durante input, change, blur e prima dell’avvio.
- Gestiti correttamente cambio ora, cambio giorno, mese e anno.
- Aggiornati popup, Manifest e content script alla versione 2.2.1.

## 2.2.0

- Corretto il calendario della modalità data/ora specifica.
- Click sul nodo interattivo `span.day`, non su `div.day-span-container`.
- Individuazione del giorno nel mese corrente tramite sequenza consecutiva `1..N`.
- Navigazione mensile mediante `.month-header-wrapper .arrow` con attesa del cambio titolo.
- Verifica della selezione tramite `.day.selected`.
- Blocco delle date non `valid` e delle programmazioni oltre 30 giorni.
- Ripristinati nel popup i controlli **Da adesso** e **Da data e ora specifica**.
- Allineate tutte le versioni a 2.2.0.

## 2.1.0

- Aggiunta modalità di partenza da data e ora specifica.

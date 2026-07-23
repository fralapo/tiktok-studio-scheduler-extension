# Test report 2.2.2

## Verifiche eseguite

- `manifest.json` valido e versione 2.2.2.
- Controllo sintattico JavaScript superato per `popup.js` e `content.js`.
- Versione allineata tra Manifest, popup e content script.
- Normalizzazione intervallo verificata con casi:
  - `7 → 10`
  - `13 → 15`
  - `15 → 15`
  - `18 → 20`
  - `1439 → 1440`
- Il valore viene normalizzato dopo 500 ms di inattività nella digitazione, su `change`, su perdita del focus e prima dell’avvio.
- La pubblicazione globale resta separata e non viene avviata automaticamente.

## Nota

Questa modifica riguarda esclusivamente la validazione e normalizzazione del campo intervallo nel popup; la logica DOM TikTok della versione 2.2.1 resta invariata.

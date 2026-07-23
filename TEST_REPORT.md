# Test report 2.3.1

## Checks performed

- `manifest.json` is valid and reports version 2.3.1.
- JavaScript syntax checks pass for `popup.js` and `content.js`.
- Manifest, popup, and content-script versions match.
- Empty captions are accepted by popup and content-script validation.
- When the caption is empty, `updateCaption()` is not called and existing TikTok captions remain unchanged.
- Popup HTML uses `lang="en"`.
- All user-facing popup labels, status labels, confirmations, errors, and documentation are in English.
- Date display uses `en-US`.
- Interval normalization remains verified for `7 → 10`, `13 → 15`, `15 → 15`, `18 → 20`, and `1439 → 1440`.
- Custom time normalization remains verified for hour and day rollover.
- Italian TikTok strings remain only in internal compatibility matchers so the automation can still detect an Italian TikTok interface.
- Global publishing remains separate and is not triggered automatically.

## Scope

This release makes the caption optional. Scheduling, calendar selection, interval rounding, and publish-safety behavior remain unchanged.

# Changelog

## 2.3.1

- Made the shared caption optional.
- When the caption field is empty, caption editing is skipped and every existing TikTok caption is preserved.
- Updated the popup, validation logic, summary text, documentation, and release version.

## 2.3.0

- Translated the extension interface, status messages, errors, documentation, issue templates, and workflow output to English.
- Switched user-facing date formatting to `en-US`.
- Kept multilingual TikTok DOM matching so the extension still works when TikTok itself is displayed in Italian or English.
- Updated Manifest, popup, and content-script versions to 2.3.0.

## 2.2.2

- Added automatic upward rounding to the **Interval between clips** field.
- Examples: `7 → 10`, `13 → 15`, `15 → 15`, `18 → 20`.
- Applied normalization after a short typing pause, on change/blur, and again before starting.
- Aligned Manifest, popup, and content-script versions to 2.2.2.

## 2.2.1

- Added automatic upward rounding of typed date/time values to the next 5-minute increment.
- Applied normalization on input, change, blur, and before starting.
- Correctly handled hour, day, month, and year rollover.

## 2.2.0

- Fixed the custom date/time calendar flow.
- Clicked the interactive `span.day` node instead of `div.day-span-container`.
- Identified the current month through the consecutive `1..N` sequence.
- Navigated months through `.month-header-wrapper .arrow` while waiting for title changes.
- Verified selection through `.day.selected`.
- Blocked invalid dates and schedules beyond 30 days.

## 2.1.0

- Added scheduling from a specific date and time.

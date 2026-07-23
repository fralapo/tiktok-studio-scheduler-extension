# TikTok Studio Scheduler

[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4)](manifest.json)
[![Version](https://img.shields.io/badge/version-2.3.1-ff2c55)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An open-source Chrome extension that optionally applies one shared caption and schedules multiple clips on the TikTok Studio Upload page.

> [!IMPORTANT]
> This project automates TikTok Studio’s web interface and may require updates whenever TikTok changes its DOM. Always review the schedule summary before using the separate **Publish on TikTok** command.

## Features

- schedule from now or from a specific date and time;
- automatically round typed times and intervals up to 5-minute increments;
- support TikTok’s available scheduling window of up to 30 days;
- optionally edit Draft.js captions, or leave existing captions untouched;
- keep the global `Publish (N)` action separate;
- use no external server and collect no credentials.

## Optional caption

The caption field is optional:

- enter text to replace the caption on every clip;
- leave it empty to skip caption editing and preserve each clip’s existing caption exactly as it is.

## Start modes

- **From now**: schedules the first clip at the first 5-minute increment at least 20 minutes in the future.
- **From a specific date and time**: uses an exact first-clip start time that is:
  - at least 20 minutes in the future;
  - aligned to a 5-minute increment;
  - within TikTok’s 30-day scheduling window.

Each following clip is scheduled from the previously accepted time plus the chosen interval.

## Automatic rounding

Typed values are rounded **up** to the next 5-minute increment.

Time examples:

- `13:13` → `13:15`
- `13:55` → `13:55`
- `13:58` → `14:00`
- `23:58` → `00:00` on the next day

Interval examples:

- `7` → `10` minutes
- `13` → `15` minutes
- `15` → `15` minutes
- `18` → `20` minutes

## Calendar handling

The extension uses TikTok’s verified calendar structure:

- reads the displayed month and year from `.month-header-wrapper .title-wrapper`;
- navigates months through the two `.month-header-wrapper .arrow` elements;
- waits for the month title to change after every navigation click;
- identifies the displayed month by finding the consecutive `1..N` day sequence;
- clicks the actual interactive `span.day` element;
- verifies `.day.selected` before setting the time;
- rejects days without the `valid` class.

This avoids clicking a non-interactive wrapper or selecting a duplicate day number from an adjacent month.

## Installation

1. Remove older versions from `chrome://extensions`.
2. Close all open TikTok Studio tabs.
3. Download or clone this repository.
4. Open `chrome://extensions` and enable **Developer mode**.
5. Click **Load unpacked** and select the repository folder.
6. Open a fresh `https://www.tiktok.com/tiktokstudio/upload` page.

The popup should show `v2.3.1` and `Content script 2.3.1`.

## Usage

1. Upload the clips in TikTok Studio.
2. Open the extension popup.
3. Optionally enter a shared caption, or leave the field empty to preserve existing captions.
4. Choose the interval between clips.
5. Select **From now** or **From a specific date and time**.
6. Click **Start automation**.
7. Review the summary and the TikTok Studio table.
8. Use **Publish on TikTok** only after confirming every row is correct.

## Safety behavior

Preparation never clicks the global `Publish (N)` button automatically. Publishing requires a separate command and an explicit browser confirmation.

## Compatibility note

TikTok may change its DOM without notice. Version 2.3.1 uses selectors and behavior verified in July 2026 and avoids dynamically hashed styled-jsx classes.

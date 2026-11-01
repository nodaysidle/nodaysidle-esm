# Every Second Counts

A minimal black-and-white Chrome extension that shows how much of your life is left, in real time. It runs fully offline: no network requests, no analytics, and data stays on your device in `chrome.storage.local`.

> **Config note:** the birthdate and assumed lifespan are the `birthdate` and `lifespanYears` settings defined in `shared/storage.js` (defaults: 30 years before today, and 80). Your values are saved to `chrome.storage.local` from the Settings dialog (`S`).

## Install in Helium Browser (load unpacked)

1. Open `helium://extensions`. In Chrome, Brave or Edge, open `chrome://extensions` instead.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick this folder (the one that contains `manifest.json`).
4. Pin **Every Second Counts** to the toolbar. Click it to open the popup, then **Open full dashboard**.

On first open the dashboard asks for your birthdate.

## Keyboard shortcuts (dashboard)

| Key | Action |
| --- | --- |
| `Z` or `B` | Toggle Zen mode (4-7-8 breathing circle) |
| `/` or `Ctrl/Cmd + K` | Open search |
| `,` or `S` | Open settings |
| `Esc` | Close the open dialog or leave Zen mode |
| `↑` `↓` `Enter` | Move through and pick search results |

Search accepts an age (`40`), a year (`2050`), a date (`2031-06-01`), a week number (`week 2000`), or a command (`settings`, `breathe`, `this week`). Picking a result jumps to that week in the grid and shows its details.

## File tree

```
ESM/
├── manifest.json            Manifest V3: popup action, storage permission, offline CSP
├── README.md
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── popup/
│   ├── popup.html           Compact view: live age, weeks left, % lived
│   ├── popup.css
│   └── popup.js             Ticks every second, opens the dashboard tab
├── dashboard/
│   ├── dashboard.html       Full page: readout, stats, grid, dialogs
│   ├── dashboard.css        Monochrome typography, grid, breathing motion
│   └── dashboard.js         Ticker, grid, hover tooltip, search, settings, Zen, shortcuts
├── shared/
│   ├── time-engine.js       Lifespan math (age, weeks, summers, weekends, waking hours)
│   ├── storage.js           Settings: chrome.storage.local, localStorage fallback
│   └── breathing.js         4-7-8 phase timing
└── tests/
    └── time-engine.test.js  node --test tests/
```

## Where each feature lives

| Feature | File |
| --- | --- |
| Big age readout, updated every second | `dashboard/dashboard.js` (`tick`, `loop`), `popup/popup.js` |
| Weeks left, % lived, summers, weekends, waking hours | `shared/time-engine.js` (`computeStats`) |
| 52-week grid, decade markers, hover details | `dashboard/dashboard.js` (`buildGrid`, `describeWeek`), `dashboard/dashboard.css` |
| Zen mode, 4-7-8 breathing | `shared/breathing.js`, `dashboard/dashboard.js` (`openZen`), `dashboard/dashboard.css` (`.breath-circle`) |
| Search | `dashboard/dashboard.js` (`searchResults`) |
| Settings | `dashboard/dashboard.html` (`#settings`), `shared/storage.js` |
| Shortcuts | `dashboard/dashboard.js` (the `keydown` listener) |
| Offline and private | `manifest.json` CSP sets `connect-src 'none'`. The only permission is `storage`. |

## Notes on the math

- Age counts from local midnight on your birthdate. The fraction is measured against the current birthday year, so it reads exactly `N.00000000` on each birthday.
- Each grid row is one year of life, starting on a birthday. The 52nd week takes the extra 1–2 days so rows stay aligned to birthdays.
- Summers are northern-hemisphere summers (21 Jun – 22 Sep) that have not yet ended before your assumed lifespan runs out.
- Weekends are the Saturdays left before that date. Waking hours are the remaining hours × waking hours ÷ 24.

## Checks

```bash
node --test tests/
node --check shared/*.js dashboard/*.js popup/*.js
! grep -rnE "https?://|fetch\(|XMLHttpRequest|WebSocket" dashboard/ popup/ shared/ manifest.json
```

# CLAUDE.md — Every Second Counts (ESM)

Guidelines, developer commands, and workflow constraints for `Every Second Counts`.

---

## Project Overview

- **Name**: Every Second Counts (`ESM`)
- **Type**: Chrome Extension (Manifest V3) for Helium Browser and Chromium-based browsers.
- **Description**: Real-time minimal black-and-white mortality dashboard visualizing lifespan, age in seconds, weeks remaining, life stats, a 52-week grid, and a 4-7-8 breathing pacer.
- **Stack**: Pure Vanilla Web (HTML5, Modern CSS, ES Modules, `chrome.storage.local`). Zero build step required.

---

## Development & Testing Workflow

### Load Unpacked in Helium / Chromium Browser

1. Open Helium Browser (or Chrome / Brave / Edge).
2. Navigate to `helium://extensions` or `chrome://extensions`.
3. Enable **Developer Mode** (toggle in upper right).
4. Click **Load unpacked** and select the `/home/arch/dev/nodaysidle/ESM` directory.
5. Inspect the popup via the extension toolbar icon, or open the full dashboard at `chrome-extension://<EXTENSION_ID>/dashboard/dashboard.html`.

### Local Validation Commands

```bash
# Verify no external network calls or remote CDNs exist in the codebase
! grep -rnE "https?://|fetch\(|XMLHttpRequest|WebSocket" dashboard/ popup/ shared/ manifest.json

# Syntax check all JS files using Node.js
node --check shared/*.js dashboard/*.js popup/*.js
```

---

## Key Technical Invariants

1. **100% Offline & Private**:
   - Zero telemetry, zero analytics, zero external network requests.
   - All styling uses system font stacks (`ui-monospace`, `SF Mono`, `system-ui`). No remote web fonts.
   - Storage uses `chrome.storage.local` with fallback to `localStorage`.
2. **Configuration Source of Truth**:
   - Primary config file: `shared/storage.js`
   - Settings keys:
     - `birthdate`: Birthdate in `YYYY-MM-DD` format (default: 30 years prior to current year).
     - `lifespanYears`: Target life expectancy (default: `80`).
     - `wakingHoursPerDay`: Waking hours per day for calculations (default: `16`).
3. **Core Shortcuts**:
   - `Z` or `B`: Toggle 4-7-8 breathing circle (Zen Mode).
   - `/` or `Cmd/Ctrl + K`: Open quick search.
   - `,` or `S`: Open Settings modal.
   - `Escape`: Close modals or dismiss Zen mode.
4. **Anti-Sloth Quality Standard**:
   - Every file must be complete, runnable, and free of placeholders, TODOs, or mock stubs.
   - Visual aesthetics must strictly adhere to the calm, high-contrast, typographic monochrome specification.

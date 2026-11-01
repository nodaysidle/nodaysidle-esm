# AGENTS.md — Every Second Counts (ESM)

Operating rules, architectural boundaries, and implementation requirements for `Every Second Counts`.

---

## 1. Project Scope & Purpose

`Every Second Counts` is a private, local-first Chrome extension (Manifest V3) designed for **Helium Browser** and Chromium-based browsers. It renders a minimal, typographic, black-and-white mortality dashboard that visualizes the passage of human lifespan in real time.

### Core Experience
- **Time Ticker**: Real-time age display with sub-second / second precision.
- **Mortality Metrics**: Weeks left counter, percentage of life elapsed, remaining summers, weekends, and waking hours.
- **52-Week Lifespan Grid**: Visual matrix spanning the entire lifespan (rows = years, columns = 52 weeks) with decade markers, status states (lived, current, remaining), and hover metadata.
- **Zen Mode**: 4-7-8 breathing rhythm circle (Inhale 4s, Hold 7s, Exhale 8s) toggled instantly via hotkeys (`Z` or `B`).
- **Modal Controllers**: Settings (birthdate, expected lifespan, waking hour assumptions) and quick search.
- **Privacy Guarantee**: 100% offline, zero network requests, local storage only (`chrome.storage.local` with fallback to `localStorage`).

---

## 2. Architectural Boundaries & Conventions

### Stack & Platform
- **Extension Platform**: Chrome Manifest V3 (`manifest.json`).
- **Codebase**: Standard Vanilla Web Stack (HTML5, modern CSS, ES Modules) — zero external build complexity, instant load-unpacked workflow.
- **Target Browser**: Helium Browser / Chromium.
- **Views**:
  - `popup/`: Compact popup triggered from the browser toolbar (`popup.html`, `popup.js`, `popup.css`).
  - `dashboard/`: Immersive full-page dashboard view (`dashboard.html`, `dashboard.js`, `dashboard.css`), also launchable from the popup or as a new tab override.
  - `shared/`: Shared computation utilities, time engine, storage abstraction, and constants.

### Component Architecture
```
ESM/
├── manifest.json              # Manifest V3 configuration (offline CSP, action, permissions)
├── dashboard/                 # Full-page dashboard view
│   ├── dashboard.html         # Full-screen typographic layout & modals
│   ├── dashboard.css          # Minimalist B&W typography, grid, & breathing animations
│   └── dashboard.js           # Controller: ticker, grid generation, modals, hotkeys
├── popup/                     # Compact extension popup view
│   ├── popup.html             # Compact summary card + "Open Full Dashboard" link
│   ├── popup.css              # Minimal popup styling
│   └── popup.js               # Quick stats preview & deep-link launcher
├── shared/
│   ├── storage.js             # Storage provider (chrome.storage.local + localStorage fallback)
│   ├── time-engine.js         # Lifespan math (age, weeks, summers, weekends, waking hours)
│   └── breathing.js           # 4-7-8 Zen cycle state machine and timer
├── icons/                     # Extension icons (16, 48, 128)
└── README.md                  # Install instructions for Helium Browser & shortcut guide
```

---

## 3. Strict Invariants

1. **Zero Network Traffic**:
   - Do NOT use `fetch()`, `XMLHttpRequest`, WebSockets, WebRTC, or EventSource.
   - Do NOT include external stylesheets, remote fonts (`@import`, Google Fonts), CDNs, analytics, telemetry, or remote script tags.
   - Content Security Policy (CSP) in `manifest.json` must enforce:
     `"script-src 'self'; object-src 'self'; connect-src 'none';"`
2. **Deterministic Data Store**:
   - All state must reside in `chrome.storage.local` (with seamless fallback to `localStorage` when opened outside extension context).
   - Single source of truth for user profile:
     - Birthdate: stored under key `birthdate` (ISO format `YYYY-MM-DD` or timestamp).
     - Assumed lifespan: stored under key `lifespanYears` (default: 80).
     - Daily waking hours: stored under key `wakingHoursPerDay` (default: 16).
3. **No Placeholders or Slop**:
   - No `// TODO: implement later`, placeholder divs, mock calculations, or commented-out stubs. Every feature must be fully functional and tested end-to-end.
4. **Keyboard Control Contract**:
   - `Z` or `B`: Toggle 4-7-8 Zen breathing mode.
   - `/` or `Cmd/Ctrl+K`: Open search palette.
   - `,` or `S`: Open Settings modal.
   - `Escape`: Close any open modal / exit Zen mode.

---

## 4. Visual & Aesthetic Guidelines

- **Palette**: Strict monochrome (deep black `#0a0a0a` or `#000000`, crisp white `#ffffff`, subtle grays `#222222`, `#444444`, `#888888`).
- **Atmosphere**: Calm, stark, deliberate, slightly unsettling mortality awareness.
- **Typography**: Clean monospace and refined sans-serif system fonts (`ui-monospace`, `SF Mono`, `Menlo`, `system-ui`, `-apple-system`, `sans-serif`).
- **Motion**: High-tension, disciplined transitions. The 4-7-8 breathing circle must exhibit a gentle, natural cubic-bezier expansion and contraction.

---

## 5. Definition of Done ("Done When")

- [ ] Every functional requirement is mapped to a tangible, existing source file.
- [ ] Automated or manual audit confirms 0 network calls across all files.
- [ ] Helium Browser unpacked extension loads cleanly with zero manifest warnings or errors.
- [ ] Keyboard hotkeys (`Z`, `B`, search, settings, `Escape`) trigger expected UI states cleanly.
- [ ] Lifespan grid properly displays 52 weeks/year across the configured lifespan with decade markers and hover inspections.
- [ ] Live counter ticks reliably every second with zero memory leaks.
- [ ] README contains load-unpacked instructions for Helium Browser and the one-line configuration location note.

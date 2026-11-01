// Settings live here: `birthdate` (YYYY-MM-DD), `lifespanYears`, `wakingHoursPerDay`.
// chrome.storage.local inside the extension; localStorage when the page is opened as a plain file.
import { parseBirthdate, toISODate, addYears } from './time-engine.js';

const KEYS = ['birthdate', 'lifespanYears', 'wakingHoursPerDay'];
const chromeStore = globalThis.chrome?.storage?.local;

export function defaultSettings(now = new Date()) {
  return { birthdate: toISODate(addYears(now, -30)), lifespanYears: 80, wakingHoursPerDay: 16 };
}

// Stored values are untrusted (hand-edited localStorage, older versions): fall back per field.
export function sanitize(raw, now = new Date()) {
  const d = defaultSettings(now);
  const birth = parseBirthdate(raw?.birthdate);
  const lifespan = Number(raw?.lifespanYears);
  const waking = Number(raw?.wakingHoursPerDay);
  return {
    birthdate: birth && birth <= now && birth.getFullYear() >= 1900 ? raw.birthdate : d.birthdate,
    lifespanYears: Number.isInteger(lifespan) && lifespan >= 1 && lifespan <= 130 ? lifespan : d.lifespanYears,
    wakingHoursPerDay: waking >= 1 && waking <= 24 ? waking : d.wakingHoursPerDay,
  };
}

async function readRaw() {
  if (chromeStore) return chromeStore.get(KEYS);
  try {
    return JSON.parse(localStorage.getItem('esm-settings')) ?? {};
  } catch {
    return {};
  }
}

// `isFirstRun` is true until the user has saved a birthdate once.
export async function loadSettings() {
  const raw = await readRaw();
  return { settings: sanitize(raw), isFirstRun: !raw?.birthdate };
}

export async function saveSettings(settings) {
  const clean = sanitize(settings);
  if (chromeStore) await chromeStore.set(clean);
  else localStorage.setItem('esm-settings', JSON.stringify(clean));
  return clean;
}

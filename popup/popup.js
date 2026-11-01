import { computeStats } from '../shared/time-engine.js';
import { loadSettings } from '../shared/storage.js';

const $ = (id) => document.getElementById(id);
const num = new Intl.NumberFormat();
const { settings } = await loadSettings();

function tick() {
  const s = computeStats(settings);
  $('age').textContent = s.ageYears.toFixed(8);
  $('weeks-left').textContent = num.format(s.weeksLeft);
  $('percent').textContent = `${s.percentLived.toFixed(2)}%`;
  $('progress').setAttribute('aria-valuenow', s.percentLived.toFixed(2));
  $('progress-fill').style.width = `${s.percentLived}%`;
  setTimeout(tick, 1000 - (Date.now() % 1000));
}
tick();

$('open').addEventListener('click', async () => {
  const url = new URL('../dashboard/dashboard.html', location.href).href;
  if (globalThis.chrome?.tabs) {
    await chrome.tabs.create({ url });
    window.close();
  } else {
    location.href = url;
  }
});

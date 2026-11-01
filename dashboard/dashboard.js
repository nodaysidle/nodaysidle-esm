import { computeStats, weekInfo, weekIndexForDate, parseBirthdate, toISODate, WEEKS_PER_YEAR } from '../shared/time-engine.js';
import { loadSettings, saveSettings } from '../shared/storage.js';
import { createBreather } from '../shared/breathing.js';

const $ = (id) => document.getElementById(id);
const num = new Intl.NumberFormat();
const day = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const grid = $('grid');
const tooltip = $('tooltip');
const settingsDialog = $('settings');
const settingsForm = $('settings-form');
const searchDialog = $('search');
const searchInput = $('search-input');
const searchList = $('search-results');
const zenDialog = $('zen');
const circle = $('breath-circle');

let settings;
let stats;
let cells = [];
let markedWeek = -1;
let foundCell = null;

/* ---------- Live readout ---------- */

function tick() {
  stats = computeStats(settings);
  $('age').textContent = stats.ageYears.toFixed(8);
  $('seconds').textContent = num.format(stats.secondsLived);
  $('weeks-left').textContent = num.format(stats.weeksLeft);
  $('percent').textContent = `${stats.percentLived.toFixed(6)}%`;
  $('summers').textContent = num.format(stats.summersLeft);
  $('weekends').textContent = num.format(stats.weekendsLeft);
  $('waking').textContent = num.format(stats.wakingHoursLeft);
  $('progress').setAttribute('aria-valuenow', stats.percentLived.toFixed(2));
  $('progress-fill').style.width = `${stats.percentLived}%`;
  if (stats.currentWeek !== markedWeek) markWeeks();
}

function loop() {
  tick();
  // Align to the wall-clock second so the readout never drifts or skips.
  setTimeout(loop, 1000 - (Date.now() % 1000));
}

/* ---------- Life grid ---------- */

function buildGrid() {
  const frag = document.createDocumentFragment();
  cells = [];
  for (let y = 0; y < settings.lifespanYears; y++) {
    const row = document.createElement('div');
    row.className = y > 0 && y % 10 === 0 ? 'row decade' : 'row';
    const label = document.createElement('span');
    label.className = 'row-label';
    label.textContent = y % 5 === 0 ? y : '';
    row.append(label);
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      const cell = document.createElement('i');
      cell.className = 'cell';
      cell.dataset.week = y * WEEKS_PER_YEAR + w;
      row.append(cell);
      cells.push(cell);
    }
    frag.append(row);
  }
  grid.replaceChildren(frag);
  foundCell = null;
  markedWeek = -1;

  const s = computeStats(settings);
  $('assumption').textContent =
    `Born ${day.format(s.birth)}. Assuming ${settings.lifespanYears} years, ending around ${day.format(s.death)}. ` +
    `${settings.wakingHoursPerDay} waking hours a day. Each row is one year.`;
}

function markWeeks() {
  const current = stats.currentWeek;
  cells.forEach((cell, i) => {
    cell.classList.toggle('lived', i < current);
    cell.classList.toggle('now', i === current);
  });
  markedWeek = current;
  grid.setAttribute('aria-label',
    `Life grid: ${settings.lifespanYears} rows of ${WEEKS_PER_YEAR} weeks. ` +
    `${num.format(Math.min(current, stats.totalWeeks))} weeks lived, ${num.format(Math.max(0, stats.totalWeeks - current - 1))} remaining.`);
}

function weeksPhrase(n) {
  return `${num.format(n)} week${n === 1 ? '' : 's'}`;
}

function relativeWeek(delta) {
  if (delta === 0) return 'This week. Now.';
  if (delta < 0) return `Lived. ${weeksPhrase(-delta)} ago.`;
  return `Remaining. In ${weeksPhrase(delta)}.`;
}

function weekState(delta) {
  if (delta === 0) return 'now';
  return delta < 0 ? 'lived' : 'ahead';
}

function describeWeek(index) {
  const info = weekInfo(stats.birth, index);
  const when = relativeWeek(index - stats.currentWeek);
  return [
    `Week ${num.format(index + 1)} of ${num.format(stats.totalWeeks)}`,
    `Age ${info.year}, week ${info.week + 1}`,
    `${day.format(info.start)} – ${day.format(info.end)}`,
    when,
  ];
}

function showTooltip(index, x, y) {
  const [title, ...lines] = describeWeek(index);
  const strong = document.createElement('strong');
  strong.textContent = title;
  tooltip.replaceChildren(strong, ...lines.map((text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div;
  }));
  tooltip.hidden = false;
  const { width, height } = tooltip.getBoundingClientRect();
  tooltip.style.left = `${x + 16 + width > innerWidth ? x - 16 - width : x + 16}px`;
  tooltip.style.top = `${Math.min(y + 16, innerHeight - height - 8)}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

grid.addEventListener('mousemove', (e) => {
  const cell = e.target.closest('.cell');
  if (cell) showTooltip(+cell.dataset.week, e.clientX, e.clientY);
  else hideTooltip();
});
grid.addEventListener('mouseleave', hideTooltip);
addEventListener('scroll', hideTooltip, { passive: true });

function focusWeek(index) {
  foundCell?.classList.remove('found');
  foundCell = cells[index];
  foundCell.classList.add('found');
  foundCell.scrollIntoView({ block: 'center' });
  const r = foundCell.getBoundingClientRect();
  // scrollIntoView fires a scroll event; show the tooltip after it lands.
  requestAnimationFrame(() => showTooltip(index, r.right, r.bottom));
}

/* ---------- Dialogs ---------- */

function openDialog(dialog) {
  for (const d of document.querySelectorAll('dialog[open]')) if (d !== dialog) d.close();
  hideTooltip();
  if (!dialog.open) dialog.showModal();
}

function openSettings(firstRun = false) {
  settingsForm.birthdate.value = settings.birthdate;
  settingsForm.birthdate.max = toISODate(new Date());
  settingsForm.lifespanYears.value = settings.lifespanYears;
  settingsForm.wakingHoursPerDay.value = settings.wakingHoursPerDay;
  $('first-run-note').hidden = !firstRun;
  $('settings-error').textContent = '';
  openDialog(settingsDialog);
  settingsForm.birthdate.focus();
}

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(settingsForm);
  const birth = parseBirthdate(form.get('birthdate'));
  if (!birth || birth > new Date()) {
    $('settings-error').textContent = 'Enter a real birthdate, not one in the future.';
    return;
  }
  settings = await saveSettings({
    birthdate: form.get('birthdate'),
    lifespanYears: Number(form.get('lifespanYears')),
    wakingHoursPerDay: Number(form.get('wakingHoursPerDay')),
  });
  buildGrid();
  tick();
  settingsDialog.close();
});
settingsForm.querySelector('[data-close]').addEventListener('click', () => settingsDialog.close());

/* ---------- Search ---------- */

let results = [];
let active = 0;

function weekResult(index, label) {
  if (index < 0 || index >= stats.totalWeeks) return null;
  const state = weekState(index - stats.currentWeek);
  return { label, hint: `${state} · ${day.format(weekInfo(stats.birth, index).start)}`, run: () => focusWeek(index) };
}

function searchResults(raw) {
  const q = raw.trim().toLowerCase();
  const out = [];
  const birthYear = stats.birth.getFullYear();
  let m;
  if (/^\d{4}-\d{2}-\d{2}$/.test(q)) {
    const d = parseBirthdate(q);
    if (d && d >= stats.birth) out.push(weekResult(weekIndexForDate(stats.birth, d), `The week of ${day.format(d)}`));
  } else if ((m = /^w(?:eek)?\s*(\d+)$/.exec(q))) {
    out.push(weekResult(+m[1] - 1, `Week ${num.format(+m[1])} of your life`));
  } else if (/^\d+$/.test(q)) {
    const n = +q;
    if (n < settings.lifespanYears) out.push(weekResult(n * WEEKS_PER_YEAR, `Age ${n}`));
    if (q.length === 4) out.push(weekResult((n - birthYear) * WEEKS_PER_YEAR, `${n}, the year you turn ${n - birthYear}`));
  }
  const commands = [
    // Null once the assumed lifespan has passed: there is no "this week" cell left.
    weekResult(stats.currentWeek, 'This week'),
    { label: 'Breathe (Zen mode)', hint: 'Z', run: openZen },
    { label: 'Settings', hint: 'S', run: () => openSettings() },
  ];
  out.push(...commands.filter((c) => c && (!q || c.label.toLowerCase().includes(q))));
  return out.filter(Boolean);
}

function renderResults() {
  results = searchResults(searchInput.value);
  active = Math.min(active, Math.max(0, results.length - 1));
  if (!results.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Nothing there. Try 40, 2050, 2031-06-01 or week 2000.';
    searchList.replaceChildren(li);
    searchInput.removeAttribute('aria-activedescendant');
    return;
  }
  searchList.replaceChildren(...results.map((r, i) => {
    const li = document.createElement('li');
    li.id = `result-${i}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', i === active);
    const label = document.createElement('span');
    label.textContent = r.label;
    const hint = document.createElement('span');
    hint.textContent = r.hint;
    li.append(label, hint);
    li.addEventListener('click', () => runResult(i));
    return li;
  }));
  searchInput.setAttribute('aria-activedescendant', `result-${active}`);
  $(`result-${active}`).scrollIntoView({ block: 'nearest' });
}

function runResult(i) {
  const r = results[i];
  if (!r) return;
  searchDialog.close();
  r.run();
}

function openSearch() {
  searchInput.value = '';
  active = 0;
  renderResults();
  openDialog(searchDialog);
  searchInput.focus();
}

searchInput.addEventListener('input', () => {
  active = 0;
  renderResults();
});
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (!results.length) return;
    active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
    renderResults();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    runResult(active);
  }
});

/* ---------- Zen mode ---------- */

const breather = createBreather((p) => {
  circle.className = `breath-circle ${p.name}`;
  $('breath-label').textContent = p.label;
  $('breath-count').textContent = p.remaining;
});

function openZen() {
  circle.className = 'breath-circle';
  openDialog(zenDialog);
  // Flush the collapsed state so the first inhale animates instead of snapping.
  circle.getBoundingClientRect();
  breather.start();
}

function toggleZen() {
  if (zenDialog.open) zenDialog.close();
  else openZen();
}

zenDialog.addEventListener('close', () => breather.stop());

/* ---------- Shortcuts ---------- */

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && key === 'k') {
    e.preventDefault();
    if (searchDialog.open) searchDialog.close();
    else openSearch();
    return;
  }
  if (e.key === 'Escape') {
    // Open dialogs close themselves on Escape; with none open, clear the search highlight.
    if (!document.querySelector('dialog[open]')) {
      foundCell?.classList.remove('found');
      foundCell = null;
      hideTooltip();
    }
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input')) return;
  if (key === 'z' || key === 'b') {
    e.preventDefault();
    toggleZen();
  } else if (zenDialog.open) {
    return;
  } else if (key === '/') {
    e.preventDefault();
    openSearch();
  } else if (key === ',' || key === 's') {
    e.preventDefault();
    openSettings();
  }
});

const actions = { zen: toggleZen, search: openSearch, settings: () => openSettings() };
for (const btn of document.querySelectorAll('[data-action]')) {
  btn.addEventListener('click', () => actions[btn.dataset.action]());
}

/* ---------- Boot ---------- */

const loaded = await loadSettings();
settings = loaded.settings;
stats = computeStats(settings);
buildGrid();
loop();
if (loaded.isFirstRun) openSettings(true);

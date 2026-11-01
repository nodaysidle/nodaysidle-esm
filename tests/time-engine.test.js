// Run: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, weekIndexForDate, weekInfo, parseBirthdate } from '../shared/time-engine.js';
import { phaseAt } from '../shared/breathing.js';
import { sanitize } from '../shared/storage.js';

const settings = { birthdate: '1990-06-15', lifespanYears: 80, wakingHoursPerDay: 16 };

test('age and percentages on a birthday', () => {
  const s = computeStats(settings, new Date(2030, 5, 15));
  assert.equal(s.ageYears, 40);
  assert.equal(s.percentLived.toFixed(4), '50.0000');
  assert.equal(s.currentWeek, 40 * 52);
  assert.equal(s.totalWeeks, 80 * 52);
});

test('remaining summers, weekends, waking hours', () => {
  // Saturday 1 Jan 2067; death on 15 Jun 2070.
  const now = new Date(2067, 0, 1);
  const s = computeStats(settings, now);
  assert.equal(s.summersLeft, 3); // 2067, 2068, 2069 (2070's starts after death)
  const days = Math.round((Date.UTC(2070, 5, 15) - Date.UTC(2067, 0, 1)) / 864e5);
  assert.equal(s.weekendsLeft, Math.floor((days - 1) / 7) + 1);
  assert.ok(Math.abs(s.wakingHoursLeft - Math.floor(((s.death - now) / 36e5) * (16 / 24))) <= 0);
});

test('past the assumed lifespan everything clamps', () => {
  const s = computeStats(settings, new Date(2075, 0, 1));
  assert.equal(s.weeksLeft, 0);
  assert.equal(s.percentLived, 100);
  assert.equal(s.weekendsLeft, 0);
  assert.equal(s.summersLeft, 0);
  assert.equal(s.currentWeek, s.totalWeeks);
});

test('week index round-trips through weekInfo', () => {
  const birth = parseBirthdate(settings.birthdate);
  for (const i of [0, 1, 51, 52, 2000, 4159]) {
    const { start, end } = weekInfo(birth, i);
    assert.equal(weekIndexForDate(birth, start), i);
    assert.equal(weekIndexForDate(birth, end), i);
  }
});

test('4-7-8 phases', () => {
  assert.deepEqual([0, 3999, 4000, 10999, 11000, 18999, 19000].map((t) => phaseAt(t).name),
    ['inhale', 'inhale', 'hold', 'hold', 'exhale', 'exhale', 'inhale']);
  assert.equal(phaseAt(0).remaining, 4);
});

test('stored settings are sanitized per field', () => {
  const now = new Date(2026, 10, 1);
  assert.deepEqual(sanitize({ birthdate: '2001-02-30', lifespanYears: 'x', wakingHoursPerDay: 99 }, now),
    { birthdate: '1996-11-01', lifespanYears: 80, wakingHoursPerDay: 16 });
  assert.deepEqual(sanitize(settings, now), settings);
  assert.equal(parseBirthdate('2030-01-01') > now, true);
  assert.equal(sanitize({ ...settings, birthdate: '2030-01-01' }, now).birthdate, '1996-11-01');
});

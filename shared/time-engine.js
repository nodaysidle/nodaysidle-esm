// Lifespan math. Pure functions: every result is derived from (settings, now).

export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;
export const WEEKS_PER_YEAR = 52;

export function parseBirthdate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  // Reject roll-overs such as 2001-02-30.
  return d.getMonth() === +m[2] - 1 ? d : null;
}

export function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addYears(date, n) {
  return new Date(date.getFullYear() + n, date.getMonth(), date.getDate());
}

export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

// Calendar day number, immune to DST hour shifts.
function dayNumber(d) {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

export function fullYearsBetween(birth, date) {
  let y = date.getFullYear() - birth.getFullYear();
  if (addYears(birth, y) > date) y--;
  return y;
}

// Week index of `date` on the life grid: year of life * 52 + week within that year.
// The 52nd week absorbs the extra 1–2 days of each year so rows stay aligned to birthdays.
export function weekIndexForDate(birth, date) {
  const year = fullYearsBetween(birth, date);
  const days = dayNumber(date) - dayNumber(addYears(birth, year));
  return year * WEEKS_PER_YEAR + Math.min(WEEKS_PER_YEAR - 1, Math.floor(days / 7));
}

export function weekInfo(birth, index) {
  const year = Math.floor(index / WEEKS_PER_YEAR);
  const week = index % WEEKS_PER_YEAR;
  const yearStart = addYears(birth, year);
  const start = addDays(yearStart, week * 7);
  const end = week === WEEKS_PER_YEAR - 1 ? addDays(addYears(birth, year + 1), -1) : addDays(start, 6);
  return { index, year, week, start, end };
}

function countSummers(now, death) {
  // Northern-hemisphere astronomical summer: 21 Jun – 22 Sep.
  let n = 0;
  for (let y = now.getFullYear(); y <= death.getFullYear(); y++) {
    if (new Date(y, 8, 23) > now && new Date(y, 5, 21) < death) n++;
  }
  return n;
}

function countWeekends(now, death) {
  const today = dayNumber(now);
  const last = dayNumber(death) - 1;
  const firstSaturday = today + ((6 - now.getDay() + 7) % 7);
  return firstSaturday > last ? 0 : Math.floor((last - firstSaturday) / 7) + 1;
}

export function computeStats({ birthdate, lifespanYears, wakingHoursPerDay }, now = new Date()) {
  const birth = parseBirthdate(birthdate);
  const death = addYears(birth, lifespanYears);
  const ageMs = Math.max(0, now - birth);
  const remainingMs = Math.max(0, death - now);

  const years = fullYearsBetween(birth, now);
  const lastBirthday = addYears(birth, years);
  const nextBirthday = addYears(birth, years + 1);
  const ageYears = years + (now - lastBirthday) / (nextBirthday - lastBirthday);

  const totalWeeks = lifespanYears * WEEKS_PER_YEAR;
  return {
    birth,
    death,
    ageYears,
    secondsLived: Math.floor(ageMs / 1000),
    remainingMs,
    weeksLeft: Math.floor(remainingMs / WEEK_MS),
    percentLived: Math.min(100, (ageMs / (death - birth)) * 100),
    summersLeft: countSummers(now, death),
    weekendsLeft: countWeekends(now, death),
    wakingHoursLeft: Math.floor((remainingMs / 3_600_000) * (wakingHoursPerDay / 24)),
    totalWeeks,
    currentWeek: Math.min(totalWeeks, weekIndexForDate(birth, now)),
  };
}

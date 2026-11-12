// Mood maths shared by the orb, charts, garden and insights.
import { dayKey, startOfDay, addDays } from './dates.js';

export const BANDS = [
  { max: 20, label: 'Really low' },
  { max: 40, label: 'Low' },
  { max: 60, label: 'Steady' },
  { max: 80, label: 'Good' },
  { max: 100, label: 'Glowing' }
];
export const moodLabel = score => (BANDS.find(b => score <= b.max) || BANDS[4]).label;

// Colour ramp: indigo (low) -> blue -> teal -> green -> gold (high).
const STOPS = [
  [0,  [91, 91, 214]],
  [30, [76, 143, 217]],
  [55, [42, 157, 143]],
  [78, [132, 196, 108]],
  [100, [242, 184, 75]]
];
export function moodRGB(score) {
  const v = Math.max(0, Math.min(100, score));
  for (let i = 1; i < STOPS.length; i++) {
    const [b, cb] = STOPS[i];
    if (v <= b) {
      const [a, ca] = STOPS[i - 1];
      const t = (v - a) / (b - a);
      return ca.map((c, k) => Math.round(c + (cb[k] - c) * t));
    }
  }
  return STOPS[STOPS.length - 1][1];
}
export const moodColor = score => `rgb(${moodRGB(score).join(',')})`;

export const FEELINGS = [
  'calm', 'grateful', 'hopeful', 'focused', 'tired', 'restless',
  'anxious', 'stressed', 'lonely', 'sad', 'irritable', 'overwhelmed'
];

// Average score per local calendar day -> Map('YYYY-MM-DD' -> { avg, entries })
export function groupByDay(history) {
  const map = new Map();
  for (const e of history) {
    const k = dayKey(e.date);
    if (!map.has(k)) map.set(k, { entries: [] });
    map.get(k).entries.push(e);
  }
  for (const v of map.values()) v.avg = Math.round(v.entries.reduce((a, e) => a + e.score, 0) / v.entries.length);
  return map;
}

// Consecutive days with a check-in, counting back from today (or from yesterday if today is empty).
export function computeStreak(history) {
  const days = groupByDay(history);
  let cursor = startOfDay(new Date());
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) { streak++; cursor = addDays(cursor, -1); }
  return streak;
}

// Plain-language observations about the last weeks. Needs a little data to say anything.
export function buildInsights(history) {
  const out = [];
  if (history.length < 3) return out;
  const now = Date.now();
  const inRange = (from, to) => history.filter(e => { const age = (now - new Date(e.date)) / 864e5; return age >= from && age < to; });
  const avg = list => (list.length ? list.reduce((a, e) => a + e.score, 0) / list.length : null);

  const thisWeek = avg(inRange(0, 7)), lastWeek = avg(inRange(7, 14));
  if (thisWeek != null && lastWeek != null) {
    const diff = Math.round(thisWeek - lastWeek);
    if (Math.abs(diff) >= 4) out.push(diff > 0
      ? `Your mood is up ${diff} points compared with last week.`
      : `Your mood is ${Math.abs(diff)} points lower than last week. Be kind to yourself.`);
    else out.push('Your mood has been steady compared with last week.');
  }

  const byWeekday = {};
  history.forEach(e => { const d = new Date(e.date).getDay(); (byWeekday[d] = byWeekday[d] || []).push(e.score); });
  const ranked = Object.entries(byWeekday).filter(([, v]) => v.length >= 2)
    .map(([d, v]) => [Number(d), v.reduce((a, b) => a + b, 0) / v.length]).sort((a, b) => b[1] - a[1]);
  const names = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  if (ranked.length >= 3) {
    out.push(`${names[ranked[0][0]]} tend to be your brightest days, and ${names[ranked[ranked.length - 1][0]].toLowerCase()} your toughest.`);
  }

  const tagCount = {};
  history.forEach(e => e.tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
  const top = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 3) out.push(`You mention feeling “${top[0]}” the most (${top[1]} times).`);
  return out;
}

// Garden growth stage from total check-ins.
export const GARDEN_STAGES = [
  { min: 0,  name: 'A seed, waiting' },
  { min: 1,  name: 'A first sprout' },
  { min: 4,  name: 'Growing steadily' },
  { min: 10, name: 'Leafing out' },
  { min: 20, name: 'In bud' },
  { min: 35, name: 'In full bloom' }
];
export function gardenStage(total) {
  let idx = 0;
  GARDEN_STAGES.forEach((s, i) => { if (total >= s.min) idx = i; });
  const next = GARDEN_STAGES[idx + 1];
  return { index: idx, name: GARDEN_STAGES[idx].name, toNext: next ? next.min - total : 0 };
}

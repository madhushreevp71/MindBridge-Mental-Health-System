// Calendar heatmap: one square per day, coloured by that day's average mood.
import { h } from '../core/dom.js';
import { groupByDay, moodColor, moodLabel } from '../utils/mood.js';
import { dayKey, addDays, startOfDay, fmtLong } from '../utils/dates.js';

export function createHeatmap(history, { weeks = 12, onSelect } = {}) {
  const byDay = groupByDay(history);
  const today = startOfDay(new Date());
  // Align so the last column ends on this week's Sunday (Monday-first grid).
  const dow = (today.getDay() + 6) % 7;
  const gridStart = addDays(today, -dow - (weeks - 1) * 7);

  const columns = [];
  let selected = null;
  for (let w = 0; w < weeks; w++) {
    const col = h('div', { class: 'heat-col' });
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d);
      const key = dayKey(date);
      const data = byDay.get(key);
      const future = date > today;
      const cell = h('button', {
        class: `heat-cell${data ? ' filled' : ''}${future ? ' future' : ''}`, type: 'button', disabled: future,
        style: data ? { '--cell': moodColor(data.avg) } : null,
        'aria-label': data ? `${fmtLong(date)}: ${moodLabel(data.avg)}` : `${fmtLong(date)}: no check-in`,
        title: data ? `${fmtLong(date)} · ${moodLabel(data.avg)}` : fmtLong(date),
        onclick: () => {
          if (selected) selected.classList.remove('selected');
          selected = cell; cell.classList.add('selected');
          if (onSelect) onSelect({ date, data });
        }
      });
      col.append(cell);
    }
    columns.push(col);
  }

  const labels = h('div', { class: 'heat-days', 'aria-hidden': 'true' }, ['Mon', '', 'Wed', '', 'Fri', '', ''].map(t => h('span', null, t)));
  return h('div', { class: 'heatmap' }, labels, h('div', { class: 'heat-grid' }, columns));
}

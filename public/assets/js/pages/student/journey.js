// Journey: how your mood has moved, and what the data says in plain language.
import { h } from '../../core/dom.js';
import { api } from '../../core/api.js';
import { emptyState } from '../../core/ui.js';
import { router } from '../../core/router.js';
import { fmtLong, fmtShort, fmtTime } from '../../utils/dates.js';
import { buildInsights, moodLabel, moodColor } from '../../utils/mood.js';
import { createLineChart } from '../../components/lineChart.js';
import { createHeatmap } from '../../components/heatmap.js';

export const severityText = { mild: 'Mild', moderate: 'Moderate', severe: 'Severe' };

export async function renderJourney() {
  const [{ history }, { assessments }] = await Promise.all([api.get('/mood?days=120'), api.get('/assessments')]);

  if (!history.length) {
    return h('div', { class: 'page' }, emptyState({
      title: 'Your journey starts with one check-in',
      text: 'Log how you feel on the Today page and this view will fill in with trends and patterns.',
      action: h('button', { class: 'btn btn-primary', type: 'button', onclick: () => router.go('today') }, 'Go to Today')
    }));
  }

  // ---- Chart with range switch ----
  const chartHost = h('div', { class: 'chart-host' });
  let days = 30;
  const ranges = [14, 30, 60, 90].map(n => h('button', { type: 'button', class: n === days ? 'on' : '', 'aria-pressed': n === days, onclick: e => {
    days = n; ranges.forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
    e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-pressed', 'true'); drawChart();
  } }, `${n} days`));
  const drawChart = () => chartHost.replaceChildren(createLineChart(history, { days, height: 260 }));
  drawChart();

  // ---- Insights ----
  const insights = buildInsights(history);

  // ---- Heatmap + day detail ----
  const detail = h('div', { class: 'day-detail', 'aria-live': 'polite' }, h('p', { class: 'muted' }, 'Select a day to see what you logged.'));
  const heat = createHeatmap(history, { weeks: 14, onSelect: ({ date, data }) => {
    if (!data) { detail.replaceChildren(h('strong', null, fmtLong(date)), h('p', { class: 'muted' }, 'No check-in this day.')); return; }
    detail.replaceChildren(h('strong', null, fmtLong(date)),
      ...data.entries.map(e => h('div', { class: 'day-entry' },
        h('span', { class: 'swatch', style: { background: moodColor(e.score) } }),
        h('div', null, h('span', null, `${fmtTime(e.date)} · ${moodLabel(e.score)}`),
          e.tags.length > 0 && h('small', null, e.tags.join(', ')),
          e.note && h('p', { class: 'quote' }, e.note)))));
  } });

  // ---- Check-in results ----
  const results = assessments.length
    ? h('ul', { class: 'result-list' }, assessments.map(a => h('li', null,
        h('span', { class: 'when' }, fmtShort(a.date)),
        h('div', { class: 'bar', role: 'img', 'aria-label': `Score ${a.total} of 24` }, h('i', { class: `sev-${a.severity}`, style: { width: `${(a.total / 24) * 100}%` } })),
        h('span', { class: `sev sev-${a.severity}` }, severityText[a.severity]))))
    : h('p', { class: 'muted' }, 'No check-ins yet. The short questionnaire takes about two minutes.');

  return h('div', { class: 'page journey' },
    h('section', { class: 'panel wide' },
      h('div', { class: 'panel-head' }, h('h2', null, 'Mood over time'), h('div', { class: 'segmented sm', role: 'group', 'aria-label': 'Time range' }, ranges)),
      chartHost),
    insights.length > 0 && h('section', { class: 'insights' },
      h('h2', null, 'What stands out'),
      h('ul', null, insights.map(t => h('li', null, t)))),
    h('section', { class: 'panel' }, h('h2', null, 'Every day at a glance'), heat, detail),
    h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', null, 'Questionnaire results'),
        h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => router.go('checkin') }, 'Take it again')),
      results,
      h('p', { class: 'fine' }, 'This is a screening check-in, not a diagnosis.')));
}

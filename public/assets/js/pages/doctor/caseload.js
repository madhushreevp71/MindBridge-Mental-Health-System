// Doctor caseload: students with an active appointment, sorted by how much support they may need.
import { h } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { api } from '../../core/api.js';
import { toast, openOverlay, closeButton, emptyState } from '../../core/ui.js';
import { fmtShort } from '../../utils/dates.js';
import { createLineChart } from '../../components/lineChart.js';
import { sparkline } from '../../components/sparkline.js';
import { severityText } from '../student/journey.js';

const TEMPLATES = [
  'Please keep logging your mood daily so we can see patterns before our session.',
  'Try the 4-7-8 breathing exercise before bed this week.',
  'Let us talk about sleep and study load at your next appointment.'
];

export async function renderCaseload() {
  const { students, stats } = await api.get('/doctor/caseload');

  async function openStudent(st) {
    const detail = await api.get(`/doctor/students/${st.id}`).catch(err => { toast(err.message, 'error'); return null; });
    if (!detail) return;
    const note = h('textarea', { rows: 4, maxLength: 600, placeholder: 'Write a recommendation. The student receives it as a notification.', 'aria-label': 'Recommendation' });
    const send = h('button', { class: 'btn btn-primary', type: 'button', onclick: async () => {
      if (!note.value.trim()) { toast('Write a recommendation first.', 'error'); return; }
      send.disabled = true;
      try { await api.post('/doctor/recommendations', { studentId: st.id, recommendation: note.value }); toast('Recommendation sent.', 'ok'); note.value = ''; }
      catch (err) { toast(err.message, 'error'); } finally { send.disabled = false; }
    } }, 'Send recommendation');

    const ov = openOverlay({ variant: 'drawer', label: `${st.name} details`, content: h('div', { class: 'drawer-body' },
      h('div', { class: 'drawer-head' }, h('div', null, h('h2', null, st.name), h('p', { class: 'muted' }, st.email)), closeButton(() => ov.close())),
      h('h3', null, 'Mood, last 30 days'),
      detail.mood.length ? createLineChart(detail.mood, { days: 30, height: 200 }) : h('p', { class: 'muted' }, 'No mood entries yet.'),
      h('h3', null, 'Questionnaire results'),
      detail.assessments.length
        ? h('ul', { class: 'result-list' }, detail.assessments.map(a => h('li', null, h('span', { class: 'when' }, fmtShort(a.date)),
            h('div', { class: 'bar' }, h('i', { class: `sev-${a.severity}`, style: { width: `${(a.total / 24) * 100}%` } })),
            h('span', { class: `sev sev-${a.severity}` }, `${a.total}/24`))))
        : h('p', { class: 'muted' }, 'Not taken yet.'),
      h('h3', null, 'Send a note'),
      h('div', { class: 'chips' }, TEMPLATES.map(t => h('button', { class: 'chip', type: 'button', onclick: () => { note.value = t; note.focus(); } }, t.split(' ').slice(0, 5).join(' ') + '…'))),
      note, send)
    });
  }

  if (!students.length) return h('div', { class: 'page' }, emptyState({ title: 'No students yet', text: 'Students appear here once they request an appointment with you.' }));

  return h('div', { class: 'page caseload' },
    h('div', { class: 'tally' },
      h('div', null, h('strong', null, stats.total), h('span', null, 'on your caseload')),
      h('div', { class: 'sev-severe' }, h('strong', null, stats.severe), h('span', null, 'severe')),
      h('div', { class: 'sev-moderate' }, h('strong', null, stats.moderate), h('span', null, 'moderate'))),
    h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', null, h('tr', null, ['Student', 'Latest result', 'Mood trend', 'Average', ''].map(t => h('th', { scope: 'col' }, t)))),
      h('tbody', null, students.map(st => h('tr', { class: 'row-link', tabindex: 0, onclick: () => openStudent(st), onkeydown: e => { if (e.key === 'Enter') openStudent(st); } },
        h('td', null, h('div', { class: 'who' }, h('span', { class: 'avatar' }, st.name[0]), h('div', null, h('strong', null, st.name), h('small', null, st.email)))),
        h('td', null, st.latest
          ? h('div', { class: 'latest' }, h('span', { class: `sev sev-${st.latest.severity}` }, severityText[st.latest.severity]), h('small', null, `${st.latest.total}/24 · ${fmtShort(st.latest.date)}`))
          : h('span', { class: 'muted' }, 'Not taken')),
        h('td', null, sparkline(st.moodTrend)),
        h('td', null, st.moodAverage ?? '–'),
        h('td', { class: 'chev' }, icon('arrowRight', 18))))))));
}

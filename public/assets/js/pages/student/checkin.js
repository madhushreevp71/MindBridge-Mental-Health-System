// Check-in: one question at a time, then a gentle, honest result.
import { h, s } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { api } from '../../core/api.js';
import { router } from '../../core/router.js';
import { toast } from '../../core/ui.js';
import { openBreathing } from '../../components/breathing.js';

const SEV_COLOR = { mild: 'var(--sev-mild)', moderate: 'var(--sev-moderate)', severe: 'var(--sev-severe)' };
const SEV_TITLE = { mild: 'Mostly steady', moderate: 'A noticeable load', severe: 'You are carrying a lot' };

function gauge(percent, severity) {
  const r = 78, c = Math.PI * r;
  const svg = s('svg', { viewBox: '0 0 200 112', class: 'gauge', role: 'img', 'aria-label': `${percent} percent` });
  svg.append(
    s('path', { d: 'M22,100 A78,78 0 0 1 178,100', class: 'gauge-track', fill: 'none', 'stroke-width': 16, 'stroke-linecap': 'round' }),
    s('path', { d: 'M22,100 A78,78 0 0 1 178,100', class: 'gauge-fill', fill: 'none', 'stroke-width': 16, 'stroke-linecap': 'round',
      stroke: SEV_COLOR[severity], 'stroke-dasharray': c, 'stroke-dashoffset': c }));
  requestAnimationFrame(() => requestAnimationFrame(() =>
    svg.querySelector('.gauge-fill').setAttribute('stroke-dashoffset', c * (1 - Math.max(percent, 4) / 100))));
  return svg;
}

export async function renderCheckin() {
  const { questions, options } = await api.get('/assessments/questions');
  const answers = {};
  let step = -1; // -1 intro, 0..n-1 questions, n result
  const stage = h('div', { class: 'checkin' });

  function show(node, dir = 1) {
    node.classList.add(dir > 0 ? 'enter-right' : 'enter-left');
    stage.replaceChildren(node);
  }

  function intro() {
    return h('div', { class: 'ci-card intro' },
      h('h2', null, 'A two-minute check-in'),
      h('p', null, `Eight short questions about the last two weeks. There are no right answers, and nothing here is a diagnosis.`),
      h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: () => go(0) }, 'Start'),
      h('p', { class: 'fine' }, 'Tip: press 1 to 4 on your keyboard to answer.'));
  }

  function question(i) {
    const q = questions[i];
    return h('div', { class: 'ci-card' },
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': questions.length, 'aria-valuenow': i },
        questions.map((_, k) => h('i', { class: k < i ? 'done' : k === i ? 'now' : '' }))),
      h('p', { class: 'ci-count' }, `Question ${i + 1} of ${questions.length}`),
      h('p', { class: 'ci-lead' }, 'Over the last two weeks, how often have you had this?'),
      h('h2', { class: 'ci-q' }, q.text),
      h('div', { class: 'ci-options', role: 'group', 'aria-label': q.text },
        options.map((o, v) => h('button', { type: 'button', class: `ci-opt${answers[q.id] === v ? ' picked' : ''}`, onclick: () => pick(i, v) },
          h('kbd', null, v + 1), h('span', null, o)))),
      i > 0 && h('button', { class: 'link-btn back', type: 'button', onclick: () => go(i - 1, -1) }, 'Back'));
  }

  function pick(i, v) {
    answers[questions[i].id] = v;
    stage.querySelectorAll('.ci-opt').forEach((b, k) => b.classList.toggle('picked', k === v));
    setTimeout(() => (i + 1 < questions.length ? go(i + 1) : submit()), 220);
  }

  function go(i, dir = 1) { step = i; show(question(i), dir); }

  async function submit() {
    stage.replaceChildren(h('div', { class: 'ci-card' }, h('p', { class: 'muted' }, 'Working it out…')));
    try {
      const r = await api.post('/assessments', { answers });
      step = questions.length; show(result(r));
    } catch (err) { toast(err.message, 'error'); go(questions.length - 1, -1); }
  }

  function result(r) {
    const needHelp = r.severity !== 'mild';
    return h('div', { class: 'ci-card result' },
      h('div', { class: 'gauge-wrap' }, gauge(r.percent, r.severity), h('div', { class: 'gauge-num' }, h('strong', null, r.total), h('span', null, 'out of 24'))),
      h('h2', null, SEV_TITLE[r.severity]),
      h('p', null, r.message),
      h('div', { class: 'split' },
        h('div', null, h('span', null, 'Mood'), h('div', { class: 'bar' }, h('i', { style: { width: `${(r.phq / 12) * 100}%` } })), h('small', null, `${r.phq} / 12`)),
        h('div', null, h('span', null, 'Anxiety'), h('div', { class: 'bar' }, h('i', { style: { width: `${(r.gad / 12) * 100}%` } })), h('small', null, `${r.gad} / 12`))),
      h('div', { class: 'row center gap wrap' },
        needHelp && h('button', { class: 'btn btn-primary', type: 'button', onclick: () => router.go('care') }, 'Book a doctor'),
        h('button', { class: needHelp ? 'btn btn-quiet' : 'btn btn-primary', type: 'button', onclick: () => router.go('companion') }, 'Talk it through'),
        h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => openBreathing() }, 'Breathe first')),
      h('p', { class: 'fine' }, 'Screening only. If you ever feel unsafe, contact a local emergency number or iCall at 9152987821.'),
      h('button', { class: 'link-btn', type: 'button', onclick: () => router.go('journey') }, 'See it in your journey'));
  }

  const onKey = e => {
    if (!stage.isConnected) { document.removeEventListener('keydown', onKey); return; }
    if (step >= 0 && step < questions.length && /^[1-4]$/.test(e.key)) pick(step, Number(e.key) - 1);
  };
  document.addEventListener('keydown', onKey);

  show(intro());
  return h('div', { class: 'page narrow' }, stage);
}

// Today: the orb check-in, your garden, and a short self-care list.
import { h } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { api } from '../../core/api.js';
import { store } from '../../core/store.js';
import { router } from '../../core/router.js';
import { toast } from '../../core/ui.js';
import { greeting, fmtTime, dayKey } from '../../utils/dates.js';
import { FEELINGS, computeStreak, gardenStage, moodLabel } from '../../utils/mood.js';
import { createMoodOrb } from '../../components/moodOrb.js';
import { createGarden } from '../../components/garden.js';
import { openBreathing } from '../../components/breathing.js';

export async function renderToday({ user }) {
  const [moodData, remData, tipData] = await Promise.all([api.get('/mood?days=120'), api.get('/reminders'), api.get('/tips')]);
  let history = moodData.history, total = moodData.totalCheckins, reminders = remData.reminders;

  // Start the orb where the last check-in left off so the page feels continuous.
  const last = history[history.length - 1];
  const orb = createMoodOrb({ value: last ? last.score : 55, onChange: v => store.set({ moodScore: v }) });
  store.set({ moodScore: orb.value });

  // ---- Feelings + note + save ----
  const chosen = new Set();
  const chips = FEELINGS.map(f => h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: e => {
    const btn = e.currentTarget;
    if (chosen.has(f)) { chosen.delete(f); btn.classList.remove('on'); btn.setAttribute('aria-pressed', 'false'); }
    else if (chosen.size < 6) { chosen.add(f); btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true'); }
    else toast('Six feelings is plenty. Deselect one to add another.');
  } }, f));
  const note = h('textarea', { class: 'note', rows: 3, maxLength: 500, placeholder: 'Anything on your mind? (optional)', 'aria-label': 'Add a note' });
  const saveBtn = h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: save }, 'Save check-in');
  const todayLine = h('p', { class: 'today-line' });

  const gardenHost = h('div', { class: 'garden-host' });
  const gardenCopy = h('div', { class: 'garden-copy' });
  const streakEl = h('div', { class: 'streak' });

  function paintGarden() {
    const stage = gardenStage(total), streak = computeStreak(history);
    gardenHost.replaceChildren(createGarden(total));
    gardenCopy.replaceChildren(
      h('h3', null, stage.name),
      h('p', null, stage.toNext ? `${stage.toNext} more check-in${stage.toNext === 1 ? '' : 's'} until the next stage.` : 'Fully grown. Keep tending it.'));
    streakEl.replaceChildren(h('strong', null, streak), h('span', null, streak === 1 ? 'day in a row' : 'days in a row'));
    const todays = history.filter(e => dayKey(e.date) === dayKey(new Date()));
    todayLine.textContent = todays.length
      ? `Last check-in today at ${fmtTime(todays[todays.length - 1].date)}: ${moodLabel(todays[todays.length - 1].score).toLowerCase()}.`
      : 'You have not checked in today.';
  }

  async function save() {
    saveBtn.disabled = true; saveBtn.classList.add('busy');
    try {
      const score = orb.value;
      const res = await api.post('/mood', { score, tags: [...chosen], note: note.value });
      history = [...history, { score, tags: [...chosen], note: note.value, date: new Date().toISOString() }];
      total = res.totalCheckins;
      orb.pulse(); paintGarden();
      toast(res.message, 'ok');
      chosen.clear(); chips.forEach(c => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); }); note.value = '';
      if (score <= 30) setTimeout(() => toast('Want company? The companion is a tap away.'), 1400);
    } catch (err) { toast(err.message, 'error'); }
    finally { saveBtn.disabled = false; saveBtn.classList.remove('busy'); }
  }

  // ---- Self-care list ----
  const listEl = h('ul', { class: 'care-list' });
  const ring = h('div', { class: 'ring', role: 'img' });
  const addInput = h('input', { type: 'text', maxLength: 200, placeholder: 'Add something kind for yourself', 'aria-label': 'New self-care item' });

  function paintReminders() {
    const done = reminders.filter(r => r.done).length;
    const pct = reminders.length ? Math.round((done / reminders.length) * 100) : 0;
    ring.style.setProperty('--pct', pct);
    ring.setAttribute('aria-label', `${done} of ${reminders.length} done`);
    ring.replaceChildren(h('span', null, `${done}/${reminders.length}`));
    listEl.replaceChildren(...reminders.map(r => h('li', { class: r.done ? 'done' : '' },
      h('label', null,
        h('input', { type: 'checkbox', checked: r.done, onchange: e => toggle(r, e.target.checked) }),
        h('span', { class: 'box' }, icon('check', 14)),
        h('span', { class: 'text' }, r.text)),
      h('button', { class: 'icon-btn sm', type: 'button', 'aria-label': `Remove ${r.text}`, onclick: () => remove(r) }, icon('x', 16)))));
  }
  async function toggle(r, done) {
    r.done = done; paintReminders();
    try { await api.patch(`/reminders/${r.id}`, { done }); } catch (err) { r.done = !done; paintReminders(); toast(err.message, 'error'); }
  }
  async function remove(r) {
    const before = reminders; reminders = reminders.filter(x => x.id !== r.id); paintReminders();
    try { await api.del(`/reminders/${r.id}`); } catch (err) { reminders = before; paintReminders(); toast(err.message, 'error'); }
  }
  async function add(e) {
    e.preventDefault();
    const text = addInput.value.trim(); if (!text) return;
    addInput.value = '';
    try { reminders = (await api.post('/reminders', { text })).reminders; paintReminders(); } catch (err) { toast(err.message, 'error'); }
  }

  paintGarden(); paintReminders();
  const tip = tipData.tips[0];

  return h('div', { class: 'page today' },
    h('section', { class: 'today-main' },
      h('header', { class: 'hello' },
        h('h2', null, `${greeting()}, ${user.name.split(' ')[0]}.`),
        h('p', null, 'How are you feeling right now?')),
      orb.el,
      h('div', { class: 'feelings' }, h('p', { class: 'label' }, 'What fits? Pick any that apply.'), h('div', { class: 'chips' }, chips)),
      note,
      h('div', { class: 'save-row' }, saveBtn, todayLine),
      h('button', { class: 'pause-link', type: 'button', onclick: () => openBreathing() }, icon('wind', 18), h('span', null, 'Feeling tense? Take a minute to breathe'))),
    h('aside', { class: 'today-side' },
      h('section', { class: 'garden-card', 'aria-label': 'Your garden' }, gardenHost, h('div', { class: 'garden-info' }, gardenCopy, streakEl)),
      h('section', { class: 'care' },
        h('div', { class: 'care-head' }, h('h3', null, 'Small things for today'), ring),
        listEl,
        h('form', { class: 'add-row', onsubmit: add }, addInput, h('button', { class: 'icon-btn solid', type: 'submit', 'aria-label': 'Add item' }, icon('plus', 18)))),
      tip && h('blockquote', { class: 'tip' }, h('p', null, tip.text), tip.by && h('footer', null, tip.by))));
}

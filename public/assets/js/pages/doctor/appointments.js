// Doctor appointments: requests, confirmed and on hold as three columns.
import { h } from '../../core/dom.js';
import { api } from '../../core/api.js';
import { toast, emptyState } from '../../core/ui.js';
import { parseDateOnly, weekday } from '../../utils/dates.js';

const COLUMNS = [
  { status: 'requested', title: 'New requests', empty: 'No new requests.' },
  { status: 'accepted', title: 'Confirmed', empty: 'Nothing confirmed yet.' },
  { status: 'pending', title: 'On hold', empty: 'Nothing on hold.' }
];

export async function renderInbox() {
  let { appointments } = await api.get('/appointments/inbox');
  const board = h('div', { class: 'board' });
  const past = h('section', { class: 'past' });

  async function act(a, action) {
    try {
      const res = await api.patch(`/appointments/${a.id}/${action}`);
      a.status = { accept: 'accepted', pending: 'pending', reject: 'rejected' }[action];
      toast(res.message, 'ok'); paint();
    } catch (err) { toast(err.message, 'error'); }
  }

  const card = a => h('article', { class: 'ticket' },
    h('div', { class: 'ticket-date' }, h('strong', null, `${weekday(parseDateOnly(a.date))} ${parseDateOnly(a.date).getDate()}`), h('span', null, a.time)),
    h('h3', null, a.studentName),
    a.reason ? h('p', null, a.reason) : h('p', { class: 'muted' }, 'No reason given.'),
    h('div', { class: 'ticket-actions' },
      a.status !== 'accepted' && h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => act(a, 'accept') }, 'Accept'),
      a.status !== 'pending' && h('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: () => act(a, 'pending') }, 'Hold'),
      h('button', { class: 'btn btn-quiet btn-sm danger', type: 'button', onclick: () => act(a, 'reject') }, 'Decline')));

  function paint() {
    board.replaceChildren(...COLUMNS.map(col => {
      const items = appointments.filter(a => a.status === col.status);
      return h('section', { class: `column col-${col.status}` },
        h('header', null, h('h2', null, col.title), h('span', { class: 'count' }, items.length)),
        items.length ? items.map(card) : h('p', { class: 'muted empty-col' }, col.empty));
    }));
    const done = appointments.filter(a => ['rejected', 'cancelled'].includes(a.status));
    past.replaceChildren(done.length ? h('details', null, h('summary', null, `Declined or cancelled (${done.length})`),
      h('ul', null, done.map(a => h('li', null, `${a.studentName} · ${a.date} ${a.time} · ${a.status}`)))) : '');
  }

  if (!appointments.length) return h('div', { class: 'page' }, emptyState({ title: 'No appointment requests yet', text: 'Requests from students will arrive here.' }));
  paint();
  return h('div', { class: 'page inbox' }, board, past);
}

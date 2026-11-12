import { h, clear } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { api } from '../core/api.js';
import { store } from '../core/store.js';
import { timeAgo } from '../utils/dates.js';

// Bell button with an unread dot and a popover list. Polls gently in the background.
export function createBell() {
  const dot = h('span', { class: 'bell-dot', hidden: true });
  const list = h('div', { class: 'pop-list' });
  const pop = h('div', { class: 'popover', hidden: true, role: 'dialog', 'aria-label': 'Notifications' },
    h('div', { class: 'pop-head' }, h('strong', null, 'Notifications'),
      h('button', { class: 'link-btn', type: 'button', onclick: markAll }, 'Mark all read')),
    list);
  const btn = h('button', { class: 'icon-btn bell', type: 'button', 'aria-label': 'Notifications', 'aria-expanded': 'false', onclick: toggle }, icon('bell'), dot);
  const el = h('div', { class: 'bell-wrap' }, btn, pop);

  function paint() {
    const items = store.get().notifications;
    dot.hidden = !items.some(n => !n.read);
    clear(list);
    if (!items.length) list.append(h('p', { class: 'pop-empty' }, 'You are all caught up.'));
    items.forEach(n => list.append(h('button', { class: `pop-item${n.read ? '' : ' unread'}`, type: 'button', onclick: () => read(n) },
      h('strong', null, n.title), h('span', null, n.message), h('small', null, timeAgo(n.createdAt)))));
  }
  async function load() {
    try { store.set({ notifications: (await api.get('/notifications')).notifications }); paint(); } catch { /* signed out */ }
  }
  async function read(n) {
    if (n.read) return;
    try { store.set({ notifications: (await api.patch(`/notifications/${n.id}/read`)).notifications }); paint(); } catch { /* ignore */ }
  }
  async function markAll() {
    try { store.set({ notifications: (await api.patch('/notifications/read-all')).notifications }); paint(); } catch { /* ignore */ }
  }
  function toggle() {
    pop.hidden = !pop.hidden;
    btn.setAttribute('aria-expanded', String(!pop.hidden));
  }
  document.addEventListener('click', e => { if (!el.contains(e.target) && !pop.hidden) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; btn.focus(); } });

  load();
  const timer = setInterval(() => { if (!el.isConnected) clearInterval(timer); else load(); }, 45000);
  return { el, reload: load };
}

import { h } from '../../core/dom.js';
import { api } from '../../core/api.js';
import { toast, confirmDialog } from '../../core/ui.js';
import { store } from '../../core/store.js';
import { fmtShort } from '../../utils/dates.js';

export async function renderPeople() {
  let { users } = await api.get('/admin/users');
  const me = store.get().user.id;
  const body = h('tbody');
  const q = h('input', { type: 'search', class: 'search', placeholder: 'Search by name or email', 'aria-label': 'Search people', oninput: paint });

  async function setActive(u, active) {
    if (!active && !await confirmDialog({ title: `Deactivate ${u.name}?`, body: 'They will not be able to sign in until you reactivate the account.', confirmText: 'Deactivate', danger: true })) { paint(); return; }
    try { toast((await api.patch(`/admin/users/${u.id}/active`, { active })).message, 'ok'); u.active = active; } catch (err) { toast(err.message, 'error'); }
    paint();
  }

  function paint() {
    const term = q.value.trim().toLowerCase();
    const rows = users.filter(u => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    body.replaceChildren(...rows.map(u => h('tr', { class: u.active ? '' : 'inactive' },
      h('td', null, h('div', { class: 'who' }, h('span', { class: 'avatar' }, u.name[0]), h('div', null, h('strong', null, u.name), h('small', null, u.email)))),
      h('td', null, h('span', { class: 'role-tag' }, u.role), u.doctorStatus && h('small', { class: 'muted' }, ` ${u.doctorStatus}`)),
      h('td', null, fmtShort(u.createdAt)),
      h('td', null, u.id === me ? h('span', { class: 'muted' }, 'You') : h('label', { class: 'switch-ctl' },
        h('input', { type: 'checkbox', role: 'switch', checked: u.active, 'aria-label': `${u.name} is ${u.active ? 'active' : 'deactivated'}`, onchange: e => setActive(u, e.target.checked) }),
        h('span', { class: 'track' }, h('i')))))));
  }
  paint();
  return h('div', { class: 'page narrow-wide' }, q,
    h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('thead', null, h('tr', null, ['Person', 'Role', 'Joined', 'Active'].map(t => h('th', { scope: 'col' }, t)))), body)));
}

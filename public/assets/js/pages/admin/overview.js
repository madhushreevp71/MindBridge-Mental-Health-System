import { h } from '../../core/dom.js';
import { api } from '../../core/api.js';
import { router } from '../../core/router.js';

export async function renderOverview() {
  const o = await api.get('/admin/overview');
  const n = (obj, k) => obj[k] || 0;
  const appts = Object.values(o.appointments).reduce((a, b) => a + b, 0);

  return h('div', { class: 'page overview' },
    o.pendingDoctors > 0
      ? h('button', { class: 'callout', type: 'button', onclick: () => router.go('verification') },
          h('strong', null, `${o.pendingDoctors} doctor${o.pendingDoctors === 1 ? '' : 's'} waiting for verification`),
          h('span', null, 'Review licence details'))
      : h('p', { class: 'callout calm' }, 'No doctors are waiting for verification.'),
    h('div', { class: 'figures' },
      h('div', null, h('strong', null, n(o.users, 'student')), h('span', null, 'students')),
      h('div', null, h('strong', null, n(o.users, 'doctor')), h('span', null, 'doctors')),
      h('div', null, h('strong', null, appts), h('span', null, 'appointments')),
      h('div', null, h('strong', null, n(o.appointments, 'accepted')), h('span', null, 'confirmed'))));
}

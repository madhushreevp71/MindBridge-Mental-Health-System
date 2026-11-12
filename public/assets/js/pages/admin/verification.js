// Verification queue: review licence details, optionally check the US NPI registry, approve or reject.
import { h } from '../../core/dom.js';
import { api } from '../../core/api.js';
import { toast, emptyState } from '../../core/ui.js';
import { fmtShort } from '../../utils/dates.js';

const TABS = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']];

export async function renderVerification() {
  let status = 'pending';
  const list = h('div', { class: 'review-list' });
  const tabs = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Filter by status' });

  async function load() {
    list.replaceChildren(h('p', { class: 'muted' }, 'Loading…'));
    const { doctors } = await api.get(`/admin/doctors?status=${status}`);
    list.replaceChildren(...(doctors.length ? doctors.map(card) : [emptyState({ title: 'Nothing here', text: status === 'pending' ? 'Every doctor has been reviewed.' : 'No doctors with this status.' })]));
  }

  function paintTabs() {
    tabs.replaceChildren(...TABS.map(([val, text]) => h('button', { type: 'button', class: val === status ? 'on' : '', 'aria-pressed': val === status, onclick: () => { status = val; paintTabs(); load(); } }, text)));
  }

  function card(d) {
    const notes = h('input', { type: 'text', placeholder: 'Notes for the doctor (shown if rejected)', 'aria-label': 'Notes', value: d.notes });
    const npiOut = h('div', { class: 'npi-out', 'aria-live': 'polite' });
    const decide = async kind => {
      try { toast((await api.post(`/admin/doctors/${d.id}/${kind}`, { notes: notes.value })).message, 'ok'); load(); }
      catch (err) { toast(err.message, 'error'); }
    };
    return h('article', { class: 'review' },
      h('header', null, h('div', null, h('h3', null, d.name), h('p', { class: 'muted' }, `${d.email} · applied ${fmtShort(d.createdAt)}`)), h('span', { class: `status st-${d.status}` }, d.status)),
      h('dl', null,
        h('div', null, h('dt', null, 'Licence number'), h('dd', null, d.licenseNumber)),
        h('div', null, h('dt', null, 'Issued by'), h('dd', null, d.licenseAuthority)),
        h('div', null, h('dt', null, 'Specialization'), h('dd', null, d.specialization)),
        h('div', null, h('dt', null, 'NPI number'), h('dd', null, d.npiNumber || 'Not provided'))),
      d.npiNumber && h('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: async () => {
        npiOut.textContent = 'Checking the US registry…';
        try {
          const r = await api.post('/admin/npi-lookup', { npiNumber: d.npiNumber });
          npiOut.textContent = r.found ? `Registry match: ${r.name}${r.credential ? ', ' + r.credential : ''} · ${r.taxonomy || 'no specialty listed'} · ${r.state || 'state n/a'} · ${r.status || ''}` : 'No record found for this NPI number.';
        } catch (err) { npiOut.textContent = err.message; }
      } }, 'Check US NPI registry'),
      npiOut,
      d.status !== 'approved' || true ? h('div', { class: 'review-actions' }, notes,
        d.status !== 'approved' && h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => decide('approve') }, 'Approve'),
        d.status !== 'rejected' && h('button', { class: 'btn btn-quiet btn-sm danger', type: 'button', onclick: () => decide('reject') }, 'Reject')) : null);
  }

  paintTabs(); await load();
  return h('div', { class: 'page narrow-wide' }, h('p', { class: 'lede' }, 'Check licence details before anyone can sign in as a doctor. The NPI lookup only covers US providers and never approves automatically.'), tabs, list);
}

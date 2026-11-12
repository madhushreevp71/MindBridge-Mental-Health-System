// Care: pick a verified doctor, pick a day and a time, track your requests.
import { h } from '../../core/dom.js';
import { api } from '../../core/api.js';
import { toast, confirmDialog, emptyState } from '../../core/ui.js';
import { dayKey, addDays, startOfDay, weekday, fmtLong, parseDateOnly } from '../../utils/dates.js';

const STATUS = { requested: 'Waiting for reply', accepted: 'Confirmed', pending: 'On hold', rejected: 'Declined', cancelled: 'Cancelled' };
const tint = name => `hsl(${[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360} 48% 46%)`;

export async function renderCare() {
  const [{ doctors }, mine] = await Promise.all([api.get('/auth/doctors'), api.get('/appointments/mine')]);
  let appointments = mine.appointments;
  let doctor = null, date = null, time = null;

  const doctorList = h('ul', { class: 'doctor-list' });
  const booking = h('section', { class: 'booking' });
  const upcoming = h('section', { class: 'appointments' });

  function paintDoctors() {
    doctorList.replaceChildren(...doctors.map(d => h('li', null,
      h('button', { type: 'button', class: `doctor${doctor && doctor.id === d.id ? ' on' : ''}`, 'aria-pressed': !!(doctor && doctor.id === d.id), onclick: () => { doctor = d; time = null; paintDoctors(); paintBooking(); } },
        h('span', { class: 'avatar lg', style: { background: tint(d.name) }, 'aria-hidden': 'true' }, d.name.replace(/^Dr\.?\s*/, '')[0]),
        h('span', { class: 'doctor-text' }, h('strong', null, d.name), h('small', null, d.specialization || 'General'))))));
  }

  async function paintBooking() {
    if (!doctor) { booking.replaceChildren(h('p', { class: 'muted pick-hint' }, 'Choose a doctor to see their available times.')); return; }
    if (!date) date = dayKey(addDays(startOfDay(new Date()), 1));

    const strip = h('div', { class: 'date-strip', role: 'group', 'aria-label': 'Choose a date' },
      Array.from({ length: 14 }, (_, i) => {
        const d = addDays(startOfDay(new Date()), i), key = dayKey(d);
        return h('button', { type: 'button', class: `date-pill${key === date ? ' on' : ''}`, 'aria-pressed': key === date, onclick: () => { date = key; time = null; paintBooking(); } },
          h('small', null, i === 0 ? 'Today' : weekday(d)), h('strong', null, d.getDate()));
      }));

    const slotsBox = h('div', { class: 'slots', role: 'group', 'aria-label': 'Choose a time' }, h('p', { class: 'muted' }, 'Loading times…'));
    const reason = h('textarea', { rows: 3, maxLength: 500, placeholder: 'What would you like to talk about? (optional)', 'aria-label': 'Reason for visit' });
    const submit = h('button', { class: 'btn btn-primary', type: 'button', disabled: !time, onclick: request }, 'Request appointment');

    booking.replaceChildren(
      h('h2', null, `Book with ${doctor.name}`), strip,
      h('p', { class: 'label' }, fmtLong(parseDateOnly(date))), slotsBox, reason, submit);

    try {
      const { slots } = await api.get(`/appointments/slots?doctorId=${doctor.id}&date=${date}`);
      const now = new Date(), isToday = date === dayKey(now);
      slotsBox.replaceChildren(...slots.map(sl => {
        const past = isToday && sl.time <= `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return h('button', { type: 'button', class: `slot${sl.time === time ? ' on' : ''}`, disabled: sl.taken || past, 'aria-pressed': sl.time === time,
          title: sl.taken ? 'Already booked' : undefined, onclick: () => { time = sl.time; slotsBox.querySelectorAll('.slot').forEach(b => b.classList.toggle('on', b.textContent === time)); submit.disabled = false; } }, sl.time);
      }));
    } catch (err) { slotsBox.replaceChildren(h('p', { class: 'notice notice-error' }, err.message)); }

    async function request() {
      submit.disabled = true; submit.classList.add('busy');
      try {
        const res = await api.post('/appointments', { doctorId: doctor.id, date, time, reason: reason.value });
        appointments = [res.appointment, ...appointments]; time = null;
        toast(res.message, 'ok'); paintAppointments(); paintBooking();
      } catch (err) { toast(err.message, 'error'); paintBooking(); }
    }
  }

  function paintAppointments() {
    if (!appointments.length) { upcoming.replaceChildren(h('h2', null, 'Your appointments'), emptyState({ title: 'Nothing booked yet', text: 'When you request a time it will show up here.' })); return; }
    upcoming.replaceChildren(h('h2', null, 'Your appointments'),
      h('ul', { class: 'appt-list' }, appointments.map(a => h('li', { class: `appt st-${a.status}` },
        h('div', { class: 'appt-date' }, h('strong', null, parseDateOnly(a.date).getDate()), h('small', null, new Intl.DateTimeFormat(undefined, { month: 'short' }).format(parseDateOnly(a.date)))),
        h('div', { class: 'appt-body' }, h('strong', null, a.doctorName), h('span', null, `${weekday(parseDateOnly(a.date))} at ${a.time}`), a.reason && h('small', null, a.reason)),
        h('div', { class: 'appt-side' }, h('span', { class: `status st-${a.status}` }, STATUS[a.status]),
          ['requested', 'accepted', 'pending'].includes(a.status) && h('button', { class: 'link-btn', type: 'button', onclick: () => cancel(a) }, 'Cancel'))))));
  }

  async function cancel(a) {
    if (!await confirmDialog({ title: 'Cancel this appointment?', body: `${a.doctorName} will be told you can no longer make it.`, confirmText: 'Cancel appointment', danger: true })) return;
    try { await api.patch(`/appointments/${a.id}/cancel`); a.status = 'cancelled'; paintAppointments(); toast('Appointment cancelled.'); if (doctor) paintBooking(); }
    catch (err) { toast(err.message, 'error'); }
  }

  paintDoctors(); paintBooking(); paintAppointments();
  if (!doctors.length) return h('div', { class: 'page' }, emptyState({ title: 'No doctors available yet', text: 'Verified doctors will appear here once an admin approves them.' }));

  return h('div', { class: 'page care-page' },
    h('section', { class: 'care-pick' }, h('h2', null, 'Verified doctors'), doctorList),
    booking, upcoming);
}

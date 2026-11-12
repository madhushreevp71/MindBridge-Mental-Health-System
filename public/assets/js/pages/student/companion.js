// Companion: a calm chat with typing indicator, follow-up suggestions and a crisis path.
import { h } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { api } from '../../core/api.js';
import { router } from '../../core/router.js';
import { toast, confirmDialog } from '../../core/ui.js';
import { fmtTime } from '../../utils/dates.js';
import { openBreathing } from '../../components/breathing.js';

const STARTERS = ["I'm stressed about exams", "I can't sleep", 'I feel low today', 'I just want to talk'];
const ACTIONS = {
  breathe: () => openBreathing(),
  mood: () => router.go('today'),
  checkin: () => router.go('checkin'),
  selfcare: () => router.go('today')
};

export async function renderCompanion() {
  const { messages } = await api.get('/chat');
  const log = h('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversation' });
  const input = h('textarea', { class: 'chat-input', rows: 1, maxLength: 1000, placeholder: 'Write what is on your mind…', 'aria-label': 'Message' });
  const sendBtn = h('button', { class: 'icon-btn solid', type: 'submit', 'aria-label': 'Send message' }, icon('send', 18));
  let busy = false;

  const scroll = () => { log.scrollTop = log.scrollHeight; };

  function bubble(m) {
    if (m.crisis) {
      return h('div', { class: 'bubble crisis', role: 'alert' },
        h('strong', null, 'You are not alone in this'),
        h('p', null, m.text),
        h('a', { class: 'btn btn-danger', href: 'tel:9152987821' }, icon('phone', 16), 'Call iCall: 9152987821'));
    }
    return h('div', { class: `bubble ${m.sender}` }, h('p', null, m.text), m.date && h('time', null, fmtTime(m.date)));
  }
  const typing = () => h('div', { class: 'bubble bot typing', 'aria-label': 'Companion is typing' }, h('i'), h('i'), h('i'));

  function welcome() {
    log.append(h('div', { class: 'chat-empty' },
      h('h2', null, 'Hi. I am here to listen.'),
      h('p', null, 'I am an AI companion, not a therapist. Say whatever is on your mind, or start with one of these.'),
      h('div', { class: 'chips center' }, STARTERS.map(t => h('button', { class: 'chip', type: 'button', onclick: () => send(t) }, t)))));
  }

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    log.querySelector('.chat-empty')?.remove();
    log.querySelectorAll('.suggest').forEach(n => n.remove());
    log.append(bubble({ sender: 'user', text, date: new Date().toISOString() }));
    input.value = ''; autosize();
    const dots = typing(); log.append(dots); scroll();
    try {
      const [res] = await Promise.all([api.post('/chat', { message: text }), new Promise(r => setTimeout(r, 700))]); // short pause feels more human
      dots.remove();
      res.replies.forEach(r => log.append(bubble(r)));
      if (res.suggestions.length) log.append(h('div', { class: 'suggest' }, res.suggestions.map(sg => h('button', { class: 'chip accent', type: 'button', onclick: () => ACTIONS[sg.action]() }, sg.label))));
    } catch (err) { dots.remove(); toast(err.message, 'error'); }
    finally { busy = false; sendBtn.disabled = false; input.focus(); scroll(); }
  }

  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); } });

  async function clearChat() {
    if (!await confirmDialog({ title: 'Clear this conversation?', body: 'Your messages with the companion will be deleted.', confirmText: 'Clear', danger: true })) return;
    await api.del('/chat'); log.replaceChildren(); welcome();
  }

  if (messages.length) messages.forEach(m => log.append(bubble(m))); else welcome();
  requestAnimationFrame(scroll);

  return h('div', { class: 'page chat-page' },
    h('div', { class: 'chat-head' },
      h('p', { class: 'muted small' }, 'Private to you. If you are in danger, call your local emergency number.'),
      messages.length > 0 && h('button', { class: 'link-btn', type: 'button', onclick: clearChat }, 'Clear conversation')),
    log,
    h('form', { class: 'chat-form', onsubmit: e => { e.preventDefault(); send(input.value); } }, input, sendBtn));
}

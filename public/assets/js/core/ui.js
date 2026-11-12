// Shared UI behaviours: toasts, modal layer, drawer, confirm dialogs.
import { h, $, clear, reducedMotion } from './dom.js';
import { icon } from './icons.js';

// ---------- Toasts ----------
export function toast(message, kind = 'info') {
  let host = $('#toasts');
  if (!host) { host = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(host); }
  const node = h('div', { class: `toast toast-${kind}`, role: kind === 'error' ? 'alert' : 'status' }, message);
  host.append(node);
  setTimeout(() => {
    node.classList.add('leaving');
    setTimeout(() => node.remove(), reducedMotion() ? 0 : 250);
  }, kind === 'error' ? 5000 : 3200);
}

// ---------- Overlay (modal / drawer) ----------
// openOverlay({ content, variant: 'modal' | 'drawer' | 'full', label, onClose }) -> { close, root }
let overlayCount = 0;
export function openOverlay({ content, variant = 'modal', label = '', onClose } = {}) {
  const previouslyFocused = document.activeElement;
  const panel = h('div', { class: `overlay-panel overlay-${variant}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': label, tabindex: '-1' }, content);
  const backdrop = h('div', { class: 'overlay' }, panel);
  document.body.append(backdrop);
  document.body.classList.add('no-scroll');
  overlayCount++;
  requestAnimationFrame(() => backdrop.classList.add('open'));
  panel.focus();

  function close() {
    if (!backdrop.isConnected) return;
    document.removeEventListener('keydown', onKey);
    backdrop.classList.remove('open');
    overlayCount--;
    if (!overlayCount) document.body.classList.remove('no-scroll');
    setTimeout(() => backdrop.remove(), reducedMotion() ? 0 : 250);
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    if (onClose) onClose();
  }
  function onKey(e) {
    if (e.key === 'Escape' && backdrop.lastElementChild === panel) { e.stopPropagation(); close(); }
  }
  document.addEventListener('keydown', onKey);
  backdrop.addEventListener('mousedown', e => { if (e.target === backdrop) close(); });
  return { close, root: panel };
}

export function closeButton(onClick, label = 'Close') {
  return h('button', { class: 'icon-btn', type: 'button', 'aria-label': label, onclick: onClick }, icon('x'));
}

export function confirmDialog({ title, body, confirmText = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    let done = false;
    const finish = value => { if (!done) { done = true; resolve(value); } };
    const ov = openOverlay({
      label: title,
      onClose: () => finish(false),
      content: h('div', { class: 'confirm' },
        h('h2', null, title),
        h('p', null, body),
        h('div', { class: 'row end gap' },
          h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => ov.close() }, 'Cancel'),
          h('button', { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, type: 'button', onclick: () => { finish(true); ov.close(); } }, confirmText)))
    });
  });
}

// ---------- Small shared widgets ----------
export function spinner(text = 'Loading') {
  return h('div', { class: 'loading', role: 'status' }, h('span', { class: 'loading-dot' }), h('span', { class: 'loading-dot' }), h('span', { class: 'loading-dot' }), h('span', { class: 'sr-only' }, text));
}

export function emptyState({ title, text, action }) {
  return h('div', { class: 'empty' },
    h('h3', null, title),
    text && h('p', null, text),
    action);
}

export function mount(container, ...nodes) {
  clear(container);
  container.append(...nodes);
}

// The living mood orb: drag it (or use the slider) and its colour, size and pulse follow.
import { h } from '../core/dom.js';
import { moodColor, moodLabel } from '../utils/mood.js';

const HINTS = [
  [20, "It's okay to feel this way. Nothing to fix right now."],
  [40, 'A lower day. Naming it is already a small step.'],
  [60, 'Somewhere in the middle. Steady counts.'],
  [80, 'A good one. What helped?'],
  [100, 'Notice what made today feel like this.']
];

export function createMoodOrb({ value = 55, onChange } = {}) {
  let current = value;

  const label = h('h2', { class: 'orb-label' });
  const hint = h('p', { class: 'orb-hint' });
  const range = h('input', {
    class: 'orb-range', type: 'range', min: 0, max: 100, value: current, step: 1,
    'aria-label': 'How are you feeling right now? 0 is very low, 100 is great.',
    oninput: e => set(Number(e.target.value))
  });
  const core = h('div', { class: 'orb-core' }, h('div', { class: 'orb-shine' }));
  const orb = h('div', { class: 'orb', 'aria-hidden': 'true' }, h('div', { class: 'orb-glow' }), core);
  const stage = h('div', { class: 'orb-stage' }, orb);

  function paint() {
    const color = moodColor(current);
    stage.style.setProperty('--orb-color', color);
    stage.style.setProperty('--orb-scale', (0.7 + (current / 100) * 0.42).toFixed(3));
    stage.style.setProperty('--orb-speed', `${(13 - (current / 100) * 7).toFixed(1)}s`);
    stage.style.setProperty('--orb-glow', (0.25 + (current / 100) * 0.55).toFixed(2));
    range.style.setProperty('--fill', current + '%');
    range.value = current;
    label.textContent = moodLabel(current);
    hint.textContent = HINTS.find(([max]) => current <= max)[1];
  }
  function set(v, { silent = false } = {}) {
    current = Math.max(0, Math.min(100, Math.round(v)));
    paint();
    if (!silent && onChange) onChange(current);
  }

  // Drag the orb itself: up = brighter, down = lower.
  let dragStart = null;
  stage.addEventListener('pointerdown', e => {
    if (e.target === range) return;
    dragStart = { y: e.clientY, v: current };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove', e => {
    if (!dragStart) return;
    set(dragStart.v + (dragStart.y - e.clientY) / 2.4);
  });
  const end = () => { dragStart = null; stage.classList.remove('dragging'); };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  const el = h('div', { class: 'orb-wrap' },
    stage,
    h('div', { class: 'orb-readout' }, label, hint),
    h('div', { class: 'orb-slider' }, h('span', null, 'Low'), range, h('span', null, 'Great')));

  paint();
  return {
    el,
    get value() { return current; },
    set: v => set(v),
    pulse() { orb.classList.remove('pulse'); void orb.offsetWidth; orb.classList.add('pulse'); }
  };
}

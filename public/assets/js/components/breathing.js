// Guided breathing overlay. Phase timings drive both the animation and the text.
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { openOverlay, closeButton } from '../core/ui.js';

const PATTERNS = {
  box:  { name: 'Box', blurb: 'In 4, hold 4, out 4, hold 4. Steadies a busy mind.', phases: [['Breathe in', 4, 'in'], ['Hold', 4, 'hold'], ['Breathe out', 4, 'out'], ['Hold', 4, 'hold']] },
  calm: { name: '4-7-8', blurb: 'In 4, hold 7, out 8. Helps you wind down before sleep.', phases: [['Breathe in', 4, 'in'], ['Hold', 7, 'hold'], ['Breathe out', 8, 'out']] },
  easy: { name: 'Easy', blurb: 'In 5, out 5. The gentlest way to begin.', phases: [['Breathe in', 5, 'in'], ['Breathe out', 5, 'out']] }
};

export function openBreathing(pattern = 'box') {
  let key = pattern, running = false, runId = 0, cycles = 0;

  const phaseLabel = h('div', { class: 'breath-phase' }, 'Ready when you are');
  const count = h('div', { class: 'breath-count', 'aria-hidden': 'true' }, '');
  const orb = h('div', { class: 'breath-orb' }, h('div', { class: 'breath-text' }, phaseLabel, count));
  const rings = h('div', { class: 'breath-rings', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
  const blurb = h('p', { class: 'breath-blurb' }, PATTERNS[key].blurb);
  const tally = h('p', { class: 'breath-tally', role: 'status' }, 'Take a moment. Sit comfortably and relax your shoulders.');
  const toggle = h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: () => (running ? stop() : start()) }, 'Begin');
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite' });

  const chips = Object.entries(PATTERNS).map(([k, p]) =>
    h('button', { class: `chip${k === key ? ' on' : ''}`, type: 'button', 'aria-pressed': k === key, onclick: e => {
      key = k; stop(); cycles = 0; blurb.textContent = p.blurb;
      chips.forEach(c => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
      e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-pressed', 'true');
      tally.textContent = 'Press begin when you are ready.';
    } }, p.name));

  const content = h('div', { class: 'breath' },
    h('div', { class: 'breath-top' }, h('div', { class: 'chips' }, chips), closeButton(() => ov.close(), 'Close breathing exercise')),
    h('div', { class: 'breath-stage' }, rings, orb),
    blurb, tally, h('div', { class: 'row center' }, toggle), live);

  const ov = openOverlay({ content, variant: 'full', label: 'Guided breathing', onClose: () => { runId++; running = false; } });

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function start() {
    running = true; const myRun = ++runId;
    toggle.textContent = 'Pause';
    while (running && myRun === runId) {
      for (const [label, secs, kind] of PATTERNS[key].phases) {
        if (!running || myRun !== runId) return;
        phaseLabel.textContent = label; live.textContent = label;
        orb.style.setProperty('--dur', secs + 's');
        orb.dataset.phase = kind;
        for (let t = secs; t > 0; t--) {
          count.textContent = t;
          await wait(1000);
          if (!running || myRun !== runId) return;
        }
      }
      cycles++;
      tally.textContent = cycles === 1 ? 'One round done. Keep going as long as it feels good.' : `${cycles} rounds done. Notice how your shoulders feel.`;
    }
  }
  function stop() {
    running = false; runId++;
    toggle.textContent = cycles ? 'Continue' : 'Begin';
    phaseLabel.textContent = cycles ? 'Paused' : 'Ready when you are';
    count.textContent = '';
    orb.dataset.phase = '';
  }
  return ov;
}

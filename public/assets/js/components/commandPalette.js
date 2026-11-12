// Ctrl/Cmd + K quick switcher.
import { h, clear } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { openOverlay } from '../core/ui.js';

export function openCommandPalette(commands) {
  let results = commands, active = 0;

  const input = h('input', { class: 'palette-input', type: 'text', placeholder: 'Jump to a page or start something…', 'aria-label': 'Search commands', autocomplete: 'off', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'palette-list' });
  const list = h('ul', { class: 'palette-list', id: 'palette-list', role: 'listbox' });

  function paint() {
    clear(list);
    if (!results.length) list.append(h('li', { class: 'palette-empty' }, 'Nothing matches. Try another word.'));
    results.forEach((cmd, i) => list.append(
      h('li', { role: 'option', 'aria-selected': i === active, class: `palette-item${i === active ? ' active' : ''}`,
        onmousemove: () => { if (active !== i) { active = i; paint(); } }, onclick: () => run(cmd) },
        icon(cmd.icon || 'arrowRight', 18), h('span', null, cmd.label), cmd.hint && h('kbd', null, cmd.hint))));
    const el = list.querySelector('.active'); if (el) el.scrollIntoView({ block: 'nearest' });
  }
  function run(cmd) { ov.close(); setTimeout(cmd.run, 60); }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    results = commands.filter(c => c.label.toLowerCase().includes(q) || (c.keywords || '').includes(q));
    active = 0; paint();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, results.length - 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); paint(); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); run(results[active]); }
  });

  const ov = openOverlay({ variant: 'palette', label: 'Command palette', content: h('div', null, h('div', { class: 'palette-head' }, icon('search', 18), input), list) });
  paint(); input.focus();
}

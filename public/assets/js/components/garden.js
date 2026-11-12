// "Mind garden": an arched window with a plant that grows as you check in.
import { s } from '../core/dom.js';
import { gardenStage } from '../utils/mood.js';

const leaf = (x, y, angle, size, fill) =>
  s('ellipse', { cx: x, cy: y, rx: size, ry: size * 0.45, transform: `rotate(${angle} ${x} ${y})`, fill });

export function createGarden(totalCheckins) {
  const { index } = gardenStage(totalCheckins);
  const svg = s('svg', { viewBox: '0 0 200 240', class: 'garden', role: 'img', 'aria-label': `Your garden: ${gardenStage(totalCheckins).name}` });

  const arch = 'M8,240 V104 A92,92 0 0 1 192,104 V240 Z';
  svg.append(
    s('defs', null,
      s('clipPath', { id: 'arch-clip' }, s('path', { d: arch })),
      s('linearGradient', { id: 'sky', x1: 0, y1: 0, x2: 0, y2: 1 },
        s('stop', { offset: '0%', 'stop-color': 'var(--sky-top)' }),
        s('stop', { offset: '100%', 'stop-color': 'var(--sky-bottom)' }))));

  const scene = s('g', { 'clip-path': 'url(#arch-clip)' });
  scene.append(s('rect', { width: 200, height: 240, fill: 'url(#sky)' }));
  scene.append(s('circle', { cx: 150, cy: 62, r: 17, fill: 'var(--sun)' }), s('circle', { cx: 150, cy: 62, r: 28, fill: 'var(--sun)', opacity: 0.22 }));
  scene.append(s('path', { d: 'M0,196 C50,176 120,178 200,194 V240 H0 Z', fill: 'var(--hill-far)' }));
  scene.append(s('path', { d: 'M0,212 C60,196 130,200 200,210 V240 H0 Z', fill: 'var(--hill-near)' }));

  const plant = s('g', { class: 'garden-plant', style: 'transform-origin: 100px 208px' });
  const green = 'var(--leaf)', green2 = 'var(--leaf-2)';
  const stem = (h2, w = 4) => s('path', { d: `M100,208 C100,${208 - h2 * 0.4} ${97},${208 - h2 * 0.7} 100,${208 - h2}`, stroke: 'var(--stem)', 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round' });

  if (index === 0) {
    plant.append(s('ellipse', { cx: 100, cy: 207, rx: 6, ry: 3.5, fill: 'var(--stem)' }));
  } else {
    const heights = [0, 22, 48, 78, 104, 118];
    const hgt = heights[index];
    plant.append(stem(hgt, index > 3 ? 6 : 4));
    const pairs = [0, 1, 2, 4, 5, 6][index];
    for (let i = 0; i < pairs; i++) {
      const y = 206 - (hgt * (i + 1)) / (pairs + 0.6);
      const size = 8 + index * 2.2 - i * 0.6;
      plant.append(leaf(100 - size * 0.9, y, -28, size, i % 2 ? green : green2), leaf(100 + size * 0.9, y - 4, 28, size, i % 2 ? green2 : green));
    }
    if (index >= 4) { // buds
      [[84, 208 - hgt * 0.7], [118, 208 - hgt * 0.82], [100, 208 - hgt - 4]].forEach(([x, y]) => plant.append(s('circle', { cx: x, cy: y, r: 4, fill: 'var(--bud)' })));
    }
    if (index === 5) { // canopy + blossoms
      const top = 208 - hgt;
      [[100, top - 4, 30], [76, top + 14, 22], [124, top + 12, 23]].forEach(([x, y, r]) => plant.append(s('circle', { cx: x, cy: y, r, fill: green, opacity: 0.95 })));
      [[88, top - 8], [112, top - 14], [100, top + 6], [74, top + 14], [126, top + 8], [96, top - 22], [82, top + 22], [118, top + 24]]
        .forEach(([x, y], i) => plant.append(s('circle', { cx: x, cy: y, r: 4.6, fill: i % 2 ? 'var(--bloom-a)' : 'var(--bloom-b)' })));
    }
  }
  scene.append(plant);
  svg.append(scene, s('path', { d: arch, fill: 'none', stroke: 'var(--garden-frame)', 'stroke-width': 3 }));
  return svg;
}

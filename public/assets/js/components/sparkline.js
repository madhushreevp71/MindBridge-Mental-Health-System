import { s } from '../core/dom.js';
import { moodColor } from '../utils/mood.js';

// Tiny trend line for table rows.
export function sparkline(values, { width = 92, height = 28 } = {}) {
  const svg = s('svg', { width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': values.length ? `Mood trend, last ${values.length} check-ins` : 'No mood data', class: 'spark' });
  if (values.length < 2) { svg.append(s('line', { x1: 2, x2: width - 2, y1: height / 2, y2: height / 2, class: 'spark-empty' })); return svg; }
  const step = (width - 6) / (values.length - 1);
  const pts = values.map((v, i) => [3 + i * step, 3 + (1 - v / 100) * (height - 6)]);
  svg.append(s('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'spark-line' }));
  const last = pts[pts.length - 1];
  svg.append(s('circle', { cx: last[0], cy: last[1], r: 3, fill: moodColor(values[values.length - 1]) }));
  return svg;
}

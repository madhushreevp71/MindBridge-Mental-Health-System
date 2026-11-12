// Responsive SVG line chart for mood over time, with a hover tooltip.
import { h, s, clear } from '../core/dom.js';
import { moodColor, groupByDay } from '../utils/mood.js';
import { dayKey, addDays, startOfDay, fmtDay } from '../utils/dates.js';

// Catmull-Rom -> cubic Bezier, so the line is smooth without overshooting wildly.
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
}

export function createLineChart(history, { days = 30, height = 240 } = {}) {
  const host = h('div', { class: 'chart', style: { height: height + 'px' } });
  const tip = h('div', { class: 'chart-tip', role: 'status' });
  host.append(tip);
  let svg;

  function draw() {
    const width = host.clientWidth;
    if (!width) return;
    if (svg) svg.remove();

    const pad = { l: 44, r: 14, t: 14, b: 26 };
    const w = width - pad.l - pad.r, ht = height - pad.t - pad.b;
    const start = startOfDay(addDays(new Date(), -(days - 1)));
    const byDay = groupByDay(history);
    const x = i => pad.l + (i / (days - 1)) * w;
    const y = v => pad.t + (1 - v / 100) * ht;

    const points = [];
    for (let i = 0; i < days; i++) {
      const k = dayKey(addDays(start, i));
      if (byDay.has(k)) {
        const g = byDay.get(k);
        points.push({ x: x(i), y: y(g.avg), avg: g.avg, date: addDays(start, i), entries: g.entries });
      }
    }

    svg = s('svg', { width, height, role: 'img', 'aria-label': `Mood over the last ${days} days` });
    const defs = s('defs');
    const grad = s('linearGradient', { id: 'lc-stroke', x1: 0, y1: y(100), x2: 0, y2: y(0), gradientUnits: 'userSpaceOnUse' });
    [100, 78, 55, 30, 0].forEach(v => grad.append(s('stop', { offset: `${100 - v}%`, 'stop-color': moodColor(v) })));
    const fill = s('linearGradient', { id: 'lc-fill', x1: 0, y1: 0, x2: 0, y2: 1 });
    fill.append(s('stop', { offset: '0%', 'stop-color': 'var(--brand)', 'stop-opacity': 0.22 }), s('stop', { offset: '100%', 'stop-color': 'var(--brand)', 'stop-opacity': 0 }));
    defs.append(grad, fill);
    svg.append(defs);

    // Horizontal guides labelled in words, not numbers.
    [[75, 'Good'], [50, 'Steady'], [25, 'Low']].forEach(([v, text]) => {
      svg.append(s('line', { x1: pad.l, x2: width - pad.r, y1: y(v), y2: y(v), class: 'chart-grid' }));
      svg.append(s('text', { x: pad.l - 8, y: y(v) + 4, class: 'chart-axis', 'text-anchor': 'end' }, text));
    });
    // X labels: roughly 5 evenly spaced dates.
    for (let i = 0; i < days; i += Math.ceil(days / 5)) {
      svg.append(s('text', { x: x(i), y: height - 6, class: 'chart-axis', 'text-anchor': i === 0 ? 'start' : 'middle' },
        new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(addDays(start, i))));
    }

    if (points.length > 1) {
      const line = smoothPath(points);
      svg.append(s('path', { d: `${line} L${points[points.length - 1].x},${y(0)} L${points[0].x},${y(0)} Z`, fill: 'url(#lc-fill)' }));
      svg.append(s('path', { d: line, class: 'chart-line', stroke: 'url(#lc-stroke)' }));
    }
    points.forEach(p => svg.append(s('circle', { cx: p.x, cy: p.y, r: 4.5, class: 'chart-dot', fill: moodColor(p.avg) })));

    const cursor = s('line', { class: 'chart-cursor', y1: pad.t, y2: pad.t + ht, opacity: 0 });
    svg.append(cursor);
    const hit = s('rect', { x: pad.l, y: 0, width: w, height, fill: 'transparent' });
    svg.append(hit);

    const show = e => {
      if (!points.length) return;
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const nearest = points.reduce((a, b) => (Math.abs(b.x - mx) < Math.abs(a.x - mx) ? b : a));
      cursor.setAttribute('x1', nearest.x); cursor.setAttribute('x2', nearest.x); cursor.setAttribute('opacity', 1);
      const tags = [...new Set(nearest.entries.flatMap(en => en.tags))];
      tip.replaceChildren(h('strong', null, fmtDay(nearest.date)), h('span', null, `Mood ${nearest.avg}`), tags.length && h('span', { class: 'muted' }, tags.join(', ')));
      tip.style.left = Math.min(Math.max(nearest.x, 70), width - 70) + 'px';
      tip.style.top = nearest.y - 12 + 'px';
      tip.classList.add('show');
    };
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', () => { tip.classList.remove('show'); cursor.setAttribute('opacity', 0); });
    host.append(svg);
  }

  new ResizeObserver(draw).observe(host);
  requestAnimationFrame(draw);
  return host;
}

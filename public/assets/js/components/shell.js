// App chrome: side rail (bottom bar on phones), top bar, theme + palette + bell.
import { h, $, $$ } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { createBell } from './notificationBell.js';
import { openCommandPalette } from './commandPalette.js';
import { openBreathing } from './breathing.js';
import { confirmDialog } from '../core/ui.js';

export const NAV = {
  student: [
    { path: 'today', label: 'Today', icon: 'home' },
    { path: 'journey', label: 'Journey', icon: 'chart' },
    { path: 'checkin', label: 'Check-in', icon: 'clipboard' },
    { path: 'companion', label: 'Companion', icon: 'chat' },
    { path: 'care', label: 'Care', icon: 'calendar' }
  ],
  doctor: [
    { path: 'caseload', label: 'Caseload', icon: 'users' },
    { path: 'appointments', label: 'Appointments', icon: 'calendar' }
  ],
  admin: [
    { path: 'overview', label: 'Overview', icon: 'home' },
    { path: 'verification', label: 'Verification', icon: 'shield' },
    { path: 'users', label: 'People', icon: 'users' }
  ]
};

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#11132A' : '#EEF0FA';
}

export function logoMark(size = 28) {
  const span = h('span', { class: 'logo-mark', 'aria-hidden': 'true' });
  span.innerHTML = `<svg viewBox="0 0 32 32" width="${size}" height="${size}" fill="none"><path d="M4 28V15a12 12 0 0 1 24 0v13" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M10 28v-12a6 6 0 0 1 12 0v12" stroke="var(--lagoon)" stroke-width="2.6" stroke-linecap="round"/></svg>`;
  return span;
}

export function createShell(user) {
  const items = NAV[user.role] || [];
  const title = h('h1', { id: 'page-title', class: 'page-title', tabindex: '-1' });
  const view = h('main', { id: 'view', class: 'view' });
  const bell = createBell();

  const links = items.map(n => h('a', { class: 'nav-link', href: '#/' + n.path, dataset: { path: n.path } }, icon(n.icon, 22), h('span', null, n.label)));
  const themeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Switch colour theme', onclick: toggleTheme });
  const paintTheme = () => { themeBtn.replaceChildren(icon(store.get().theme === 'dark' ? 'sun' : 'moon')); };
  function toggleTheme() {
    const next = store.get().theme === 'dark' ? 'light' : 'dark';
    store.set({ theme: next }); applyTheme(next); paintTheme();
  }
  paintTheme();

  const commands = () => [
    ...items.map(n => ({ label: `Go to ${n.label}`, icon: n.icon, keywords: n.path, run: () => router.go(n.path) })),
    ...(user.role === 'student' ? [
      { label: 'Start a breathing exercise', icon: 'wind', keywords: 'calm anxious panic breathe', run: () => openBreathing() },
      { label: 'Log how I feel right now', icon: 'sparkle', keywords: 'mood orb', run: () => router.go('today') }
    ] : []),
    { label: 'Switch light / dark theme', icon: 'moon', keywords: 'theme dark light', run: toggleTheme },
    { label: 'Sign out', icon: 'logout', keywords: 'logout exit', run: signOut }
  ];

  async function signOut() {
    if (await confirmDialog({ title: 'Sign out?', body: 'You can sign back in any time.', confirmText: 'Sign out' })) {
      store.signOut(); router.go('welcome');
    }
  }

  const rail = h('nav', { class: 'rail', 'aria-label': 'Main' },
    h('a', { class: 'brand', href: '#/' + items[0].path }, logoMark(30), h('span', null, 'MindBridge')),
    h('div', { class: 'nav-links' }, links),
    h('div', { class: 'rail-foot' },
      user.role === 'student' && h('button', { class: 'breathe-link', type: 'button', onclick: () => openBreathing() }, icon('wind', 20), h('span', null, 'Breathe')),
      h('div', { class: 'me' },
        h('span', { class: 'avatar', 'aria-hidden': 'true' }, user.name.trim()[0].toUpperCase()),
        h('div', { class: 'me-text' }, h('strong', null, user.name), h('small', null, user.role)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Sign out', onclick: signOut }, icon('logout', 18)))));

  const topbar = h('header', { class: 'topbar' },
    title,
    h('div', { class: 'top-actions' },
      h('button', { class: 'palette-btn', type: 'button', onclick: () => openCommandPalette(commands()) }, icon('search', 16), h('span', null, 'Jump to'), h('kbd', null, navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl K')),
      themeBtn, bell.el));

  document.addEventListener('keydown', function onKey(e) {
    if (!el.isConnected) { document.removeEventListener('keydown', onKey); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommandPalette(commands()); }
  });

  const el = h('div', { class: 'app' }, rail, h('div', { class: 'main' }, topbar, view));

  return {
    el, view, bell,
    setActive(path, label) {
      $$('.nav-link', el).forEach(a => a.classList.toggle('active', a.dataset.path === path));
      title.textContent = label;
      document.title = `${label} · MindBridge`;
    }
  };
}

// Entry point: boots the theme, wires the router, and decides between auth and the app shell.
import { h, $, clear } from './core/dom.js';
import { store } from './core/store.js';
import { router } from './core/router.js';
import { spinner, toast } from './core/ui.js';
import { createShell, applyTheme, NAV } from './components/shell.js';
import { moodRGB } from './utils/mood.js';
import { renderAuth } from './pages/auth.js';

import { renderToday } from './pages/student/today.js';
import { renderJourney } from './pages/student/journey.js';
import { renderCheckin } from './pages/student/checkin.js';
import { renderCompanion } from './pages/student/companion.js';
import { renderCare } from './pages/student/care.js';
import { renderCaseload } from './pages/doctor/caseload.js';
import { renderInbox } from './pages/doctor/appointments.js';
import { renderOverview } from './pages/admin/overview.js';
import { renderVerification } from './pages/admin/verification.js';
import { renderPeople } from './pages/admin/people.js';

const PAGES = {
  today: renderToday, journey: renderJourney, checkin: renderCheckin, companion: renderCompanion, care: renderCare,
  caseload: renderCaseload, appointments: renderInbox,
  overview: renderOverview, verification: renderVerification, users: renderPeople
};

const root = $('#root');
let shell = null, shellUser = null, renderToken = 0;

// ----- Ambient background: the page tint follows the current mood score -----
function paintAmbient(score) {
  const a = moodRGB(score), b = moodRGB(Math.min(100, score + 24));
  const st = document.documentElement.style;
  st.setProperty('--mood-a', `rgb(${a})`);
  st.setProperty('--mood-b', `rgb(${b})`);
}
store.subscribe((state, patch) => { if ('moodScore' in patch) paintAmbient(state.moodScore); });

async function onRoute(path) {
  const { user } = store.get();

  if (!user) {
    shell = null; shellUser = null;
    paintAmbient(55);
    document.title = 'MindBridge · Welcome';
    clear(root).append(renderAuth());
    return;
  }

  const allowed = NAV[user.role].map(n => n.path);
  if (!allowed.includes(path)) { router.go(allowed[0]); return; }

  if (!shell || shellUser !== user.id) {
    shell = createShell(user); shellUser = user.id;
    clear(root).append(shell.el);
  }
  const nav = NAV[user.role].find(n => n.path === path);
  shell.setActive(path, nav.label);

  const mine = ++renderToken;
  shell.view.replaceChildren(spinner());
  try {
    const page = await PAGES[path]({ user, shell });
    if (mine !== renderToken) return; // user navigated away while loading
    shell.view.replaceChildren(page);
    shell.view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } catch (err) {
    if (mine !== renderToken) return;
    shell.view.replaceChildren(h('div', { class: 'empty' },
      h('h3', null, 'This page did not load'), h('p', null, err.message),
      h('button', { class: 'btn btn-primary', type: 'button', onclick: () => onRoute(path) }, 'Try again')));
  }
}

applyTheme(store.get().theme);
paintAmbient(55);
router.listen(onRoute);
if (!location.hash || location.hash === '#/' || location.hash === '#') {
  const { user } = store.get();
  location.hash = '#/' + (user ? NAV[user.role][0].path : 'welcome');
} else {
  router.start();
}

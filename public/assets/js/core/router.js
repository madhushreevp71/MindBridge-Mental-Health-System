// Hash router: "#/today" style paths, one render function per route.
const routes = new Map();
let onChange = () => {};

export const router = {
  register(path, def) { routes.set(path, def); },
  get: path => routes.get(path),
  current: () => (location.hash.replace(/^#\/?/, '') || '').split('?')[0],
  go(path) { location.hash = '#/' + path; },
  listen(fn) { onChange = fn; window.addEventListener('hashchange', () => onChange(router.current())); },
  start() { onChange(router.current()); }
};

// A very small observable store: just enough shared state for a vanilla app.
const safe = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch { /* private mode */ } }
};

const listeners = new Set();

const state = {
  token: safe.get('mb_token'),
  user: (() => { try { return JSON.parse(safe.get('mb_user')); } catch { return null; } })(),
  theme: safe.get('mb_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  notifications: [],
  moodScore: 55 // drives the ambient background colour
};

export const store = {
  get: () => state,
  set(patch) {
    Object.assign(state, patch);
    if ('token' in patch) safe.set('mb_token', patch.token);
    if ('user' in patch) safe.set('mb_user', patch.user ? JSON.stringify(patch.user) : null);
    if ('theme' in patch) safe.set('mb_theme', patch.theme);
    listeners.forEach(fn => fn(state, patch));
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  signOut() { this.set({ token: null, user: null, notifications: [] }); },
  storage: safe
};

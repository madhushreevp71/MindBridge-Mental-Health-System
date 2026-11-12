import { store } from './store.js';

// Thin fetch wrapper: adds the JWT, parses JSON, throws Error(message) on failures.
async function request(path, { method = 'GET', body } = {}) {
  const { token } = store.get();
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    if (res.status === 401 && token) {
      store.signOut();
      location.hash = '#/welcome';
    }
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: path => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body || {} }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body || {} }),
  del: path => request(path, { method: 'DELETE' })
};

// Date helpers. Everything works in the viewer's local time zone.
export const pad = n => String(n).padStart(2, '0');
export const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
export const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export function greeting(date = new Date()) {
  const hr = date.getHours();
  if (hr < 5) return 'Still up';
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

const fmt = (opts) => new Intl.DateTimeFormat(undefined, opts);
export const fmtDay = d => fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(d));
export const fmtShort = d => fmt({ day: 'numeric', month: 'short' }).format(new Date(d));
export const fmtLong = d => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(d));
export const fmtTime = d => fmt({ hour: 'numeric', minute: '2-digit' }).format(new Date(d));
export const weekday = d => fmt({ weekday: 'short' }).format(new Date(d));

// "2026-11-20" (a plain date from the API) -> a local Date at midnight
export const parseDateOnly = str => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };

export function timeAgo(iso) {
  const secs = Math.round((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} h ago`;
  if (secs < 86400 * 7) return `${Math.floor(secs / 86400)} d ago`;
  return fmtShort(iso);
}

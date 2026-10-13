const pad = (n) => String(n).padStart(2, '0');

/** Today's date as yyyy-MM-dd in the user's local time zone. */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso) {
  if (!iso) return '';
  return toLocalDate(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${pad(m)} ${suffix}`;
}

export function daysUntil(iso) {
  const today = toLocalDate(todayISO());
  return Math.round((toLocalDate(iso) - today) / 86400000);
}

export function daysLabel(days) {
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function capitalize(s = '') {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

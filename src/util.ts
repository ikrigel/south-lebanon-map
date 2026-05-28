export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearingDegrees(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLon = toRad(b[1] - a[1]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// distance from point P to a polyline (km). returns {km, nearest:[lat,lon]}
export function distanceToPolyline(
  p: [number, number],
  line: [number, number][]
): { km: number; nearest: [number, number] } {
  let best = { km: Infinity, nearest: line[0] };
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const proj = projectPointOnSegment(p, a, b);
    const km = haversineKm(p, proj);
    if (km < best.km) best = { km, nearest: proj };
  }
  return best;
}

// approximate projection using equirectangular for small distances
function projectPointOnSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): [number, number] {
  const latRef = (a[0] + b[0]) / 2;
  const cos = Math.cos((latRef * Math.PI) / 180);
  const ax = a[1] * cos, ay = a[0];
  const bx = b[1] * cos, by = b[0];
  const px = p[1] * cos, py = p[0];
  const abx = bx - ax, aby = by - ay;
  const apx = px - ax, apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) return a;
  let t = (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  return [ay + t * aby, (ax + t * abx) / cos];
}

export function fmtKm(km: number): string {
  if (!isFinite(km)) return '—';
  if (km < 10) return km.toFixed(2) + ' ק״מ';
  return km.toFixed(1) + ' ק״מ';
}

export function fmtDate(iso: string): string {
  // simple Hebrew-friendly date "DD.MM.YYYY"
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function safeText(value: unknown, fallback = ''): string {
  return String(value ?? fallback)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

export const TYPE_LABEL: Record<string, string> = {
  rocket: 'ירי רקטות',
  atgm: 'ירי טילים נ״ט',
  uav: 'כטב״ם',
  idf_strike: 'תקיפה ישראלית',
  unifil: 'אירוע יוניפי״ל',
  ground: 'תמרון יבשתי',
  displacement: 'עקורים / הומניטרי',
};

export const TYPE_COLOR: Record<string, string> = {
  rocket: '#d49a3a',
  atgm: '#c45a4b',
  uav: '#b48bd0',
  idf_strike: '#5a8fbf',
  unifil: '#6da7d1',
  ground: '#a87a52',
  displacement: '#87a989',
};

export const SEV_LABEL: Record<string, string> = {
  low: 'נמוכה',
  med: 'בינונית',
  high: 'גבוהה',
};

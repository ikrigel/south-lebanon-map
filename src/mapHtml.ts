import type { Town } from './data/geo';

export const POP_RADIUS: Record<Town['pop_band'], number> = {
  sm: 5,
  md: 8,
  lg: 12,
  xl: 16,
};

export const TILESETS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

export const SECT_COLORS: Record<string, string> = {
  shia: '#2a8a6e',
  sunni: '#c97d2a',
  druze: '#7b3fa0',
  christian: '#b03030',
  mixed: '#6b7280',
  jewish: '#1a5fa8',
};

export const NAVIGATION_FOLLOW_MIN_ZOOM = 11;

export const labelHtml = (he: string, en?: string, sect?: string) => {
  const dot = sect && SECT_COLORS[sect]
    ? `<span class="sect-dot" style="background:${SECT_COLORS[sect]}"></span>`
    : '';
  return `${dot}<span class="label-he">${he}</span>${en ? `<span class="label-en">${en}</span>` : ''}`;
};

export const poiSizePx = (size: string) => size === 'lg' ? 42 : size === 'sm' ? 24 : 32;

export const poiShapeClass = (shape: string) =>
  shape === 'square' || shape === 'diamond' || shape === 'star' ? `poi-shape-${shape}` : 'poi-shape-circle';

export const poiSymbol = (shape: string, draft = false) => draft ? '＋' : shape === 'star' ? '★' : '';

export const poiIconHtml = (color: string, shape: string, size: string, draft = false) => {
  const px = poiSizePx(size);
  const rotation = shape === 'diamond' ? 'rotate(45deg)' : 'none';
  const symbolRotation = shape === 'diamond' ? 'transform: rotate(-45deg);' : '';
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#f6c453';
  return `<span class="poi-pin ${poiShapeClass(shape)}${draft ? ' poi-pin-draft' : ''}" style="width:${px}px;height:${px}px;background:${safeColor};transform:${rotation};"><span style="${symbolRotation}">${poiSymbol(shape, draft)}</span></span>`;
};

export const buildTownInfoHtml = (
  t: { name_he: string; name_en: string; pop_estimate: number; sect?: string; note?: string },
  useSectColors: boolean,
): string => {
  const SECT_LABELS_: Record<string, string> = {
    shia: 'שיעים',
    sunni: 'סונים',
    druze: 'דרוזים',
    christian: 'נוצרים',
    mixed: 'מעורב',
    jewish: 'יהודי',
  };
  const sectColor = (useSectColors && t.sect) ? (SECT_COLORS[t.sect] ?? '#d0b58a') : '#d0b58a';
  const sectLabel = t.sect ? (SECT_LABELS_[t.sect] ?? '') : '';
  return (
    `<strong>${t.name_he}</strong>` +
    (useSectColors && sectLabel ? ` <span style="color:${sectColor};font-size:11px">● ${sectLabel}</span>` : '') +
    `<br/><span style="color:#8b97a8">${t.name_en}</span>` +
    `<br/>אוכלוסייה: ~${t.pop_estimate.toLocaleString('he-IL')}` +
    (t.note ? `<br/><em style="color:#b0bec5">${t.note}</em>` : '') +
    `<br/><span style="color:#6b7a8d;font-size:11px">מקור: ויקיפדיה / אומדן ציבורי</span>`
  );
};

export const townPopup = (
  lat: number,
  lon: number,
  label: string,
  infoHtml: string,
): string => {
  const q = label.replace(/"/g, '&quot;');
  return [
    `<div class="town-popup" dir="rtl">`,
    `<div class="town-popup-nav">`,
    `<button class="popup-nav-btn popup-nav-full" data-nav-lat="${lat}" data-nav-lon="${lon}" data-nav-label="${q}" data-nav-role="end">▶ נווט לכאן — יעד</button>`,
    `<button class="popup-nav-btn popup-nav-btn-start popup-nav-full" data-nav-lat="${lat}" data-nav-lon="${lon}" data-nav-label="${q}" data-nav-role="start">🚦 הגדר כנקודת מוצא</button>`,
    `</div>`,
    `<button class="popup-info-toggle" data-info-toggle="1">פרטים ▼</button>`,
    `<div class="town-popup-info" style="display:none">${infoHtml}</div>`,
    `</div>`,
  ].join('');
};

export const navBtn = (lat: number, lon: number, label: string) =>
  `<div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
     <button class="popup-nav-btn" data-nav-lat="${lat}" data-nav-lon="${lon}" data-nav-label="${label.replace(/"/g, '&quot;')}" data-nav-role="end">▶ נווט לכאן (יעד)</button>
     <button class="popup-nav-btn popup-nav-btn-start" data-nav-lat="${lat}" data-nav-lon="${lon}" data-nav-label="${label.replace(/"/g, '&quot;')}" data-nav-role="start">🚦 הגדר כנקודת מוצא</button>
   </div>`;

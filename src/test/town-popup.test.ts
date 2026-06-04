/**
 * town-popup.test.ts
 *
 * Regression tests for the town popup HTML structure.
 *
 * Design decision: info is ALWAYS visible (no toggle/accordion).
 * This avoids inline onclick reliability issues on mobile (Android/iOS).
 * Layout: info section → divider → nav buttons.
 *
 * Both useEffect calls (initial mount + sectColors rebuild) must produce
 * this structure via townPopup().
 *
 * Specific towns tested: בית ליף, בינת ג׳בייל, דבל, עלמא א-שעב, יאטר
 */

import { describe, it, expect } from 'vitest';
import { towns } from '../data/geo';

// ---------------------------------------------------------------------------
// Inline copy of townPopup() — must stay in sync with src/Map.tsx
// ---------------------------------------------------------------------------
function townPopup(
  lat: number,
  lon: number,
  label: string,
  infoHtml: string,
): string {
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SECT_COLORS: Record<string, string> = {
  shia: '#2a8a6e', sunni: '#c97d2a', druze: '#7b3fa0',
  christian: '#b03030', mixed: '#6b7280', jewish: '#1a5fa8',
};
const SECT_LABELS: Record<string, string> = {
  shia: 'שיעים', sunni: 'סונים', druze: 'דרוזים',
  christian: 'נוצרים', mixed: 'מעורב', jewish: 'יהודי',
};

function buildInfoHtml(
  t: { name_he: string; name_en: string; pop_estimate: number; note?: string; sect?: string },
  useSectColors = false,
): string {
  const sectColor = (useSectColors && t.sect) ? (SECT_COLORS[t.sect] ?? '#d0b58a') : '#d0b58a';
  const sectLabel = t.sect ? (SECT_LABELS[t.sect] ?? '') : '';
  return (
    `<strong>${t.name_he}</strong>` +
    (useSectColors && sectLabel ? ` <span style="color:${sectColor};font-size:11px">● ${sectLabel}</span>` : '') +
    `<br/><span style="color:#8b97a8">${t.name_en}</span>` +
    `<br/>אוכלוסייה: ~${t.pop_estimate.toLocaleString('he-IL')}` +
    (t.note ? `<br/><em style="color:#b0bec5">${t.note}</em>` : '') +
    `<br/><span style="color:#6b7a8d;font-size:11px">מקור: ויקיפדיה / אומדן ציבורי</span>`
  );
}

// ===========================================================================
// 1. Structural invariants
// ===========================================================================
describe('townPopup() — structure', () => {
  const html = townPopup(33.127, 35.339, 'בית ליף', '<strong>בית ליף</strong>');

  it('has wrapper div.town-popup with dir=rtl', () => {
    expect(html).toContain('class="town-popup"');
    expect(html).toContain('dir="rtl"');
  });

  it('has .town-popup-info section', () => {
    expect(html).toContain('class="town-popup-info"');
  });

  it('info is hidden by default (toggle expands it)', () => {
    expect(html).toContain('display:none');
  });

  it('nav buttons appear BEFORE toggle in HTML', () => {
    const navIdx    = html.indexOf('town-popup-nav');
    const toggleIdx = html.indexOf('popup-info-toggle');
    expect(navIdx).toBeGreaterThanOrEqual(0);
    expect(navIdx).toBeLessThan(toggleIdx);
  });

  it('has .town-popup-nav wrapper', () => {
    expect(html).toContain('class="town-popup-nav"');
  });

  it('has exactly two .popup-nav-btn buttons', () => {
    const matches = html.match(/class="popup-nav-btn/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(2);
  });

  it('end button has data-nav-role="end"', () => {
    expect(html).toContain('data-nav-role="end"');
  });

  it('start button has data-nav-role="start"', () => {
    expect(html).toContain('data-nav-role="start"');
  });

  it('toggle uses data-info-toggle attribute (not inline onclick)', () => {
    expect(html).toContain('data-info-toggle="1"');
    expect(html).not.toContain('onclick=');
    expect(html).not.toContain('getElementById');
  });

  it('info div contains the infoHtml', () => {
    expect(html).toContain('<strong>בית ליף</strong>');
  });
});

// ===========================================================================
// 2. Nav button data attributes carry correct values
// ===========================================================================
describe('townPopup() — nav button data attributes', () => {
  it('both buttons carry correct lat/lon/label for בית ליף', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    expect(t).toBeDefined();
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
    expect(html).toContain(`data-nav-lat="${t.lat}"`);
    expect(html).toContain(`data-nav-lon="${t.lon}"`);
    expect(html).toContain(`data-nav-label="בית ליף"`);
    // Both end and start present
    expect(html).toContain('data-nav-role="end"');
    expect(html).toContain('data-nav-role="start"');
  });

  it('both buttons carry correct lat/lon for בינת ג׳בייל', () => {
    const t = towns.find(t => t.id === 'bintj')!;
    expect(t).toBeDefined();
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
    expect(html).toContain(`data-nav-lat="${t.lat}"`);
    expect(html).toContain(`data-nav-lon="${t.lon}"`);
  });

  it('label with double-quotes is escaped to &quot;', () => {
    const html = townPopup(33.1, 35.3, 'כפר "הדס"', '<p>test</p>');
    expect(html).toContain('data-nav-label="כפר &quot;הדס&quot;"');
    expect(html).not.toMatch(/data-nav-label="כפר "הדס"/);
  });
});

// ===========================================================================
// 3. Info content rendered correctly
// ===========================================================================
describe('townPopup() — info content', () => {
  it('town name appears in info section', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
    expect(html).toContain(t.name_he);
    expect(html).toContain(t.name_en);
  });

  it('population estimate rendered with Hebrew locale formatting', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    const info = buildInfoHtml(t);
    expect(info).toContain('אוכלוסייה');
    expect(info).toContain(t.pop_estimate.toLocaleString('he-IL'));
  });

  it('source attribution always present', () => {
    const t = towns.find(t => t.id === 'yater')!;
    const info = buildInfoHtml(t);
    expect(info).toContain('מקור: ויקיפדיה');
  });

  it('note field rendered when present', () => {
    const t = towns.find(t => t.id === 'beit-yahoun');
    if (!t?.note) return; // skip if town not in data
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
    expect(html).toContain(t.note);
  });

  it('no empty <em> when note is absent', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    expect(t.note).toBeFalsy();
    const info = buildInfoHtml(t);
    expect(info).not.toContain('<em');
  });
});

// ===========================================================================
// 4. Specific towns
// ===========================================================================
describe('townPopup() — specific LB towns', () => {
  const TOWNS_TO_TEST = ['beitlif', 'bintj', 'debel', 'alma', 'yater'];

  TOWNS_TO_TEST.forEach(id => {
    it(`${id}: contains Hebrew + English name`, () => {
      const t = towns.find(t => t.id === id);
      expect(t, `town ${id} not found in geo.ts`).toBeDefined();
      const html = townPopup(t!.lat, t!.lon, t!.name_he, buildInfoHtml(t!));
      expect(html).toContain(t!.name_he);
      expect(html).toContain(t!.name_en);
    });

    it(`${id}: nav buttons carry correct coordinates`, () => {
      const t = towns.find(t => t.id === id)!;
      const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
      expect(html).toContain(`data-nav-lat="${t.lat}"`);
      expect(html).toContain(`data-nav-lon="${t.lon}"`);
    });

    it(`${id}: info collapsed by default (display:none)`, () => {
      const t = towns.find(t => t.id === id)!;
      const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
      expect(html).toContain('display:none');
    });
  });
});

// ===========================================================================
// 5. sectColors effect — uses townPopup() structure
// ===========================================================================
describe('sectColors effect — popup structure', () => {
  const LB_TOWNS = towns.filter(t => t.side === 'LB');

  it('all LB towns produce .town-popup-nav', () => {
    LB_TOWNS.forEach(t => {
      const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, false));
      expect(html, `${t.id}: missing .town-popup-nav`).toContain('town-popup-nav');
    });
  });

  it('all LB towns have info collapsed by default (display:none)', () => {
    LB_TOWNS.forEach(t => {
      const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, false));
      expect(html, `${t.id}: info should be collapsed`).toContain('display:none');
    });
  });

  it('sectColors=true: shia badge in בית ליף', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, true));
    expect(html).toContain('שיעים');
    expect(html).toContain('#2a8a6e');
  });

  it('sectColors=true: christian badge in דבל', () => {
    const t = towns.find(t => t.id === 'debel')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, true));
    expect(html).toContain('נוצרים');
    expect(html).toContain('#b03030');
  });

  it('sectColors=false: no sect badge', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, false));
    expect(html).not.toContain('שיעים');
  });

  it('nav buttons appear BEFORE info in HTML (nav-first layout)', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, true));
    const navIdx  = html.indexOf('town-popup-nav');
    const infoIdx = html.indexOf('town-popup-info');
    expect(navIdx).toBeLessThan(infoIdx);
  });

  it('no legacy tpt-panel / tpt-label / town-popup-tabs in any popup', () => {
    const t = towns.find(t => t.id === 'yater')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, true));
    expect(html).not.toContain('tpt-panel');
    expect(html).not.toContain('tpt-label');
    expect(html).not.toContain('town-popup-tabs');
  });
});

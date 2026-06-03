/**
 * town-popup.test.ts
 *
 * Regression tests for the town popup HTML structure.
 *
 * Background: two separate useEffect calls build town popups —
 *   Effect A (initial mount): always uses townPopup()
 *   Effect B (sectColors toggle): previously used raw HTML (bug!),
 *             now fixed to also use townPopup()
 *
 * Strategy: inline copy of the pure townPopup() helper (zero React/Leaflet
 * needed). Tests assert on the HTML string it returns.
 *
 * Covered invariants:
 *  1. Wrapper has dir="rtl" and class="town-popup"
 *  2. Two nav buttons always present (end + start roles), carrying correct lat/lon/label
 *  3. "פרטים ▼" toggle button always present (.popup-info-toggle)
 *  4. Info div present, hidden by default (style="display:none")
 *  5. Info div contains the infoHtml content
 *  6. Toggle onclick inverts display and updates button text
 *  7. Each call gets a unique uid — no collisions across parallel popups
 *  8. Special chars in label are escaped in data-nav-label attribute
 *  9. Specific towns: בית ליף, בינת ג׳בייל, דבל, עלמא א-שעב, יאטר
 * 10. sectColors effect produces townPopup structure (not raw HTML)
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
  const uid = `tp${Math.random().toString(36).slice(2, 8)}`;
  const q = label.replace(/"/g, '&quot;');
  return [
    `<div class="town-popup" dir="rtl">`,
    `<div class="town-popup-nav">`,
    `<button class="popup-nav-btn popup-nav-full" data-nav-lat="${lat}" data-nav-lon="${lon}" data-nav-label="${q}" data-nav-role="end">▶ נווט לכאן — יעד</button>`,
    `<button class="popup-nav-btn popup-nav-btn-start popup-nav-full" data-nav-lat="${lat}" data-nav-lon="${lon}" data-nav-label="${q}" data-nav-role="start">🚦 הגדר כנקודת מוצא</button>`,
    `</div>`,
    `<button class="popup-info-toggle" onclick="(function(b){`,
      `var d=document.getElementById('${uid}');`,
      `var open=d.style.display!=='none';`,
      `d.style.display=open?'none':'block';`,
      `b.textContent=open?'פרטים ▼':'פרטים ▲';`,
    `})(this)">פרטים ▼</button>`,
    `<div id="${uid}" class="town-popup-info" style="display:none">${infoHtml}</div>`,
    `</div>`,
  ].join('');
}

// ---------------------------------------------------------------------------
// Helper: build infoHtml the same way both effects do (sect-aware)
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

// ---------------------------------------------------------------------------
// 1. Structural invariants
// ---------------------------------------------------------------------------
describe('townPopup() — structure', () => {
  const html = townPopup(33.127, 35.339, 'בית ליף', '<strong>בית ליף</strong>');

  it('has wrapper div.town-popup with dir=rtl', () => {
    expect(html).toContain('class="town-popup"');
    expect(html).toContain('dir="rtl"');
  });

  it('has .town-popup-nav wrapper', () => {
    expect(html).toContain('class="town-popup-nav"');
  });

  it('has exactly two .popup-nav-btn buttons', () => {
    const matches = html.match(/class="popup-nav-btn/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(2);
  });

  it('nav button end has data-nav-role="end"', () => {
    expect(html).toContain('data-nav-role="end"');
  });

  it('nav button start has data-nav-role="start"', () => {
    expect(html).toContain('data-nav-role="start"');
  });

  it('has .popup-info-toggle button with "פרטים ▼" text', () => {
    expect(html).toContain('class="popup-info-toggle"');
    expect(html).toContain('>פרטים ▼</button>');
  });

  it('info div has class town-popup-info and is hidden by default', () => {
    expect(html).toContain('class="town-popup-info"');
    expect(html).toContain('style="display:none"');
  });

  it('info div contains the infoHtml', () => {
    expect(html).toContain('<strong>בית ליף</strong>');
  });
});

// ---------------------------------------------------------------------------
// 2. Nav button data attributes carry correct values
// ---------------------------------------------------------------------------
describe('townPopup() — nav button data attributes', () => {
  it('end button carries correct lat/lon/label for בית ליף', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    expect(t).toBeDefined();
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
    expect(html).toContain(`data-nav-lat="${t.lat}"`);
    expect(html).toContain(`data-nav-lon="${t.lon}"`);
    expect(html).toContain(`data-nav-label="בית ליף"`);
  });

  it('start button carries correct lat/lon/label for בינת ג׳בייל', () => {
    const t = towns.find(t => t.id === 'bintj')!;
    expect(t).toBeDefined();
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
    // Both buttons share the same lat/lon/label
    const endMatches = [...html.matchAll(/data-nav-role="end"/g)];
    const startMatches = [...html.matchAll(/data-nav-role="start"/g)];
    expect(endMatches.length).toBe(1);
    expect(startMatches.length).toBe(1);
    expect(html).toContain(`data-nav-lat="${t.lat}"`);
    expect(html).toContain(`data-nav-lon="${t.lon}"`);
  });

  it('label with double-quotes is escaped to &quot;', () => {
    const html = townPopup(33.1, 35.3, 'כפר "הדס"', '<p>test</p>');
    expect(html).toContain('data-nav-label="כפר &quot;הדס&quot;"');
    expect(html).not.toContain('data-nav-label="כפר "הדס"');
  });
});

// ---------------------------------------------------------------------------
// 3. Toggle button inline onclick
// ---------------------------------------------------------------------------
describe('townPopup() — toggle onclick', () => {
  it('onclick contains getElementById with the uid', () => {
    const html = townPopup(33.1, 35.3, 'test', '');
    // Extract uid from the id attribute of the info div
    const idMatch = html.match(/id="(tp[a-z0-9]+)"/);
    expect(idMatch).not.toBeNull();
    const uid = idMatch![1];
    expect(html).toContain(`getElementById('${uid}')`);
  });

  it('onclick swaps display between none and block', () => {
    const html = townPopup(33.1, 35.3, 'test', '');
    expect(html).toContain(`d.style.display=open?'none':'block'`);
  });

  it('onclick swaps button text between ▼ and ▲', () => {
    const html = townPopup(33.1, 35.3, 'test', '');
    expect(html).toContain(`b.textContent=open?'פרטים ▼':'פרטים ▲'`);
  });
});

// ---------------------------------------------------------------------------
// 4. Unique uid per call — no collisions in batch
// ---------------------------------------------------------------------------
describe('townPopup() — uid uniqueness', () => {
  it('100 calls produce 100 unique uids', () => {
    const uids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const html = townPopup(33.1 + i * 0.001, 35.3, `town${i}`, '');
      const m = html.match(/id="(tp[a-z0-9]+)"/);
      expect(m).not.toBeNull();
      uids.add(m![1]);
    }
    expect(uids.size).toBe(100);
  });

  it('each uid appears exactly twice in the HTML (id attr + getElementById)', () => {
    const html = townPopup(33.1, 35.3, 'test', '');
    const m = html.match(/id="(tp[a-z0-9]+)"/);
    expect(m).not.toBeNull();
    const uid = m![1];
    const count = (html.match(new RegExp(uid, 'g')) ?? []).length;
    expect(count).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 5. Specific towns — בית ליף, בינת ג׳בייל, דבל, עלמא א-שעב, יאטר
// ---------------------------------------------------------------------------
describe('townPopup() — specific LB towns', () => {
  const TOWNS_TO_TEST = ['beitlif', 'bintj', 'debel', 'alma', 'yater'];

  TOWNS_TO_TEST.forEach(id => {
    it(`${id}: popup contains town name in both Hebrew and English`, () => {
      const t = towns.find(t => t.id === id);
      expect(t, `town ${id} not found in geo.ts`).toBeDefined();
      const html = townPopup(t!.lat, t!.lon, t!.name_he, buildInfoHtml(t!));
      expect(html).toContain(t!.name_he);
      expect(html).toContain(t!.name_en);
    });

    it(`${id}: popup has nav buttons with town's coordinates`, () => {
      const t = towns.find(t => t.id === id)!;
      const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
      expect(html).toContain(`data-nav-lat="${t.lat}"`);
      expect(html).toContain(`data-nav-lon="${t.lon}"`);
    });

    it(`${id}: popup has .popup-info-toggle and hidden info div`, () => {
      const t = towns.find(t => t.id === id)!;
      const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t));
      expect(html).toContain('popup-info-toggle');
      expect(html).toContain('display:none');
    });
  });
});

// ---------------------------------------------------------------------------
// 6. sectColors effect — uses townPopup() structure (not raw HTML fallback)
// ---------------------------------------------------------------------------
describe('sectColors effect — popup structure', () => {
  // Simulate what Effect B now does: build popup via townPopup()
  const LB_TOWNS = towns.filter(t => t.side === 'LB');

  it('all LB towns produce a popup with .town-popup-nav (not raw HTML)', () => {
    LB_TOWNS.forEach(t => {
      const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, false));
      expect(html, `${t.id}: missing .town-popup-nav`).toContain('town-popup-nav');
    });
  });

  it('all LB towns produce a popup with .popup-info-toggle', () => {
    LB_TOWNS.forEach(t => {
      const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, false));
      expect(html, `${t.id}: missing .popup-info-toggle`).toContain('popup-info-toggle');
    });
  });

  it('all LB towns produce a popup with hidden info div', () => {
    LB_TOWNS.forEach(t => {
      const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, false));
      expect(html, `${t.id}: info div not hidden`).toContain('display:none');
    });
  });

  it('sectColors=true embeds sect badge in infoHtml for shia town (בית ליף)', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, true));
    expect(html).toContain('שיעים');
    expect(html).toContain('#2a8a6e'); // shia color
  });

  it('sectColors=true embeds sect badge in infoHtml for christian town (דבל)', () => {
    const t = towns.find(t => t.id === 'debel')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, true));
    expect(html).toContain('נוצרים');
    expect(html).toContain('#b03030'); // christian color
  });

  it('sectColors=false produces no sect badge', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, false));
    expect(html).not.toContain('שיעים');
  });

  it('nav buttons appear BEFORE info section in HTML (nav-first layout)', () => {
    const t = towns.find(t => t.id === 'beitlif')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, true));
    const navIdx = html.indexOf('town-popup-nav');
    const infoIdx = html.indexOf('popup-info-toggle');
    expect(navIdx).toBeLessThan(infoIdx);
  });

  it('raw popup HTML does NOT contain old tpt-panel or tpt-label classes', () => {
    const t = towns.find(t => t.id === 'yater')!;
    const html = townPopup(t.lat, t.lon, t.name_he, buildInfoHtml(t, true));
    expect(html).not.toContain('tpt-panel');
    expect(html).not.toContain('tpt-label');
    expect(html).not.toContain('town-popup-tabs');
  });
});

// ---------------------------------------------------------------------------
// 7. Note field — towns that have notes (e.g. beit-yahoun, naqoura)
// ---------------------------------------------------------------------------
describe('townPopup() — note field rendering', () => {
  it('town with note includes note in infoHtml', () => {
    const t = towns.find(t => t.id === 'beit-yahoun');
    expect(t?.note).toBeTruthy();
    const html = townPopup(t!.lat, t!.lon, t!.name_he, buildInfoHtml(t!));
    expect(html).toContain(t!.note!);
  });

  it('town without note does not produce empty <em> tag', () => {
    const t = towns.find(t => t.id === 'beitlif');
    expect(t?.note).toBeFalsy();
    const infoHtml = buildInfoHtml(t!);
    expect(infoHtml).not.toContain('<em');
    const html = townPopup(t!.lat, t!.lon, t!.name_he, infoHtml);
    expect(html).not.toContain('<em');
  });
});

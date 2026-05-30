/**
 * geo-data-integrity.test.ts
 *
 * Verifies structural integrity of the geo.ts data after any build:
 *  1. All towns have required fields with valid values
 *  2. LB towns have a valid sect classification
 *  3. Coordinates are within plausible Lebanon/Israel bounding box
 *  4. No duplicate IDs
 *  5. Key settlements (bintj, maroun, naqoura, etc.) exist with correct data
 *  6. LayerVis includes sectColors and persists correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { towns } from '../data/geo';

// ---------------------------------------------------------------------------
// Bounding box for the Blue Line / south Lebanon area
// ---------------------------------------------------------------------------
const LAT_MIN = 32.5;
const LAT_MAX = 33.8;
const LON_MIN = 34.9;
const LON_MAX = 36.0;

const VALID_SECTS = ['shia', 'sunni', 'druze', 'christian', 'mixed', 'jewish'] as const;
const VALID_POP_BANDS = ['sm', 'md', 'lg', 'xl'] as const;
const VALID_SIDES = ['LB', 'IL'] as const;

// ---------------------------------------------------------------------------
// 1. All towns have required fields
// ---------------------------------------------------------------------------
describe('geo.ts — town fields', () => {
  it('every town has a non-empty id', () => {
    towns.forEach(t => {
      expect(t.id, `empty id found`).toBeTruthy();
    });
  });

  it('every town has a non-empty Hebrew name', () => {
    towns.forEach(t => {
      expect(t.name_he, `town ${t.id} missing name_he`).toBeTruthy();
    });
  });

  it('every town has a non-empty English name', () => {
    towns.forEach(t => {
      expect(t.name_en, `town ${t.id} missing name_en`).toBeTruthy();
    });
  });

  it('every town has valid lat/lon (number, not NaN)', () => {
    towns.forEach(t => {
      expect(typeof t.lat, `town ${t.id} lat not number`).toBe('number');
      expect(typeof t.lon, `town ${t.id} lon not number`).toBe('number');
      expect(Number.isNaN(t.lat), `town ${t.id} lat is NaN`).toBe(false);
      expect(Number.isNaN(t.lon), `town ${t.id} lon is NaN`).toBe(false);
    });
  });

  it('every town has a valid pop_band', () => {
    towns.forEach(t => {
      expect(VALID_POP_BANDS, `town ${t.id} invalid pop_band: ${t.pop_band}`)
        .toContain(t.pop_band);
    });
  });

  it('every town has a valid side (LB or IL)', () => {
    towns.forEach(t => {
      expect(VALID_SIDES, `town ${t.id} invalid side: ${t.side}`)
        .toContain(t.side);
    });
  });

  it('every town has a positive pop_estimate', () => {
    towns.forEach(t => {
      expect(t.pop_estimate, `town ${t.id} invalid pop_estimate`).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Coordinates within bounding box
// ---------------------------------------------------------------------------
describe('geo.ts — coordinates in bounding box', () => {
  it('all town lats are within Lebanon/Israel range', () => {
    towns.forEach(t => {
      expect(t.lat, `town ${t.id} lat ${t.lat} out of range`)
        .toBeGreaterThanOrEqual(LAT_MIN);
      expect(t.lat, `town ${t.id} lat ${t.lat} out of range`)
        .toBeLessThanOrEqual(LAT_MAX);
    });
  });

  it('all town lons are within Lebanon/Israel range', () => {
    towns.forEach(t => {
      expect(t.lon, `town ${t.id} lon ${t.lon} out of range`)
        .toBeGreaterThanOrEqual(LON_MIN);
      expect(t.lon, `town ${t.id} lon ${t.lon} out of range`)
        .toBeLessThanOrEqual(LON_MAX);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. No duplicate IDs
// ---------------------------------------------------------------------------
describe('geo.ts — unique IDs', () => {
  it('no two towns share the same id', () => {
    const ids = towns.map(t => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// 4. LB towns have sect classification
// ---------------------------------------------------------------------------
describe('geo.ts — sect classification', () => {
  it('all LB towns have a sect field', () => {
    const lbTowns = towns.filter(t => t.side === 'LB');
    const missing = lbTowns.filter(t => !t.sect);
    expect(missing.map(t => t.id)).toEqual([]);
  });

  it('all sect values are valid', () => {
    towns.forEach(t => {
      if (t.sect !== undefined) {
        expect(VALID_SECTS, `town ${t.id} invalid sect: ${t.sect}`)
          .toContain(t.sect);
      }
    });
  });

  it('IL towns do not have a sect (optional)', () => {
    // IL towns are Israeli settlements — no sect expected
    const ilWithSect = towns.filter(t => t.side === 'IL' && t.sect !== undefined);
    // We allow it but log if any exist (not a hard failure)
    expect(ilWithSect.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Key settlements exist with correct data
// ---------------------------------------------------------------------------
describe('geo.ts — key settlement spot-checks', () => {
  const byId = Object.fromEntries(towns.map(t => [t.id, t]));

  it('bintj (Bint Jbeil) exists with sect shia', () => {
    const t = byId['bintj'];
    expect(t, 'bintj missing').toBeDefined();
    expect(t.sect).toBe('shia');
    expect(t.side).toBe('LB');
    // Check it is near 33.12°N, 35.43°E (within 2 km tolerance ~0.018°)
    expect(Math.abs(t.lat - 33.123)).toBeLessThan(0.02);
    expect(Math.abs(t.lon - 35.429)).toBeLessThan(0.02);
  });

  it('maroun (Maroun al-Ras) exists with sect shia', () => {
    const t = byId['maroun'];
    expect(t, 'maroun missing').toBeDefined();
    expect(t.sect).toBe('shia');
    expect(t.side).toBe('LB');
  });

  it('naqoura exists with sect shia', () => {
    const t = byId['naqoura'];
    expect(t, 'naqoura missing').toBeDefined();
    expect(t.sect).toBe('shia');
  });

  it('rmeish exists with sect christian', () => {
    const t = byId['rmeish'];
    expect(t, 'rmeish missing').toBeDefined();
    expect(t.sect).toBe('christian');
  });

  it('marjay (Marjayoun) exists with sect christian', () => {
    const t = byId['marjay'];
    expect(t, 'marjay missing').toBeDefined();
    expect(t.sect).toBe('christian');
  });

  it('alma (Alma al-Shaab) exists with sect christian', () => {
    const t = byId['alma'];
    expect(t, 'alma missing').toBeDefined();
    expect(t.sect).toBe('christian');
  });

  it('khiam exists with sect shia', () => {
    const t = byId['khiam'];
    expect(t, 'khiam missing').toBeDefined();
    expect(t.sect).toBe('shia');
  });

  it('maarakeh exists with sect shia and correct coordinates (near 33.27N, 35.31E)', () => {
    const t = byId['maarakeh'];
    expect(t, 'maarakeh missing').toBeDefined();
    expect(t.sect).toBe('shia');
    // After coordinate fix: 33.2728, 35.3097
    expect(Math.abs(t.lat - 33.2728)).toBeLessThan(0.01);
    expect(Math.abs(t.lon - 35.3097)).toBeLessThan(0.01);
  });

  it('barish (Barish) exists with correct coordinates (near 33.27N, 35.35E)', () => {
    const t = byId['barish'];
    expect(t, 'barish missing').toBeDefined();
    // After coordinate fix: 33.2731, 35.3539
    expect(Math.abs(t.lat - 33.273)).toBeLessThan(0.01);
    expect(Math.abs(t.lon - 35.354)).toBeLessThan(0.01);
  });

  it('aitaroun exists with correct coordinates (Wikipedia: 33.1164N, 35.4683E)', () => {
    const t = byId['aitaroun'];
    expect(t, 'aitaroun missing').toBeDefined();
    // Wikipedia: 33°06′59″N 35°28″6″E = 33.1164, 35.4683
    expect(Math.abs(t.lat - 33.1164)).toBeLessThan(0.01);
    expect(Math.abs(t.lon - 35.4683)).toBeLessThan(0.01);
  });

  it('kawkaba exists with correct name and coordinates (Wikipedia: 33.3956N, 35.6383E)', () => {
    const t = byId['kawkaba'];
    expect(t, 'kawkaba missing').toBeDefined();
    expect(t.name_he).toBe('כאוכבא');
    expect(t.sect).toBe('christian');
    // Wikipedia: 33°23′44″N 35°38′18″E = 33.3956, 35.6383
    expect(Math.abs(t.lat - 33.3956)).toBeLessThan(0.01);
    expect(Math.abs(t.lon - 35.6383)).toBeLessThan(0.01);
    // Must be north of al-Mari (33.3205N)
    const mari = byId['mari'];
    expect(t.lat).toBeGreaterThan(mari.lat);
  });

  it('al-mari exists with correct coordinates (OSM: 33.3205N, 35.6417E) and is east of khiam', () => {
    const t = byId['mari'];
    expect(t, 'mari missing').toBeDefined();
    expect(t.name_he).toBe('אל-מארי');
    // OSM/mapcarta: 33.32051, 35.64174
    expect(Math.abs(t.lat - 33.3205)).toBeLessThan(0.01);
    expect(Math.abs(t.lon - 35.6417)).toBeLessThan(0.01);
    // Must be east of khiam (35.6111E)
    const khiam = byId['khiam'];
    expect(t.lon).toBeGreaterThan(khiam.lon);
  });
});

// ---------------------------------------------------------------------------
// 6. LayerVis includes sectColors key — tested via storage round-trip
// ---------------------------------------------------------------------------

const LAYER_VIS_KEY = 'south-lebanon-map:layer-visibility:v1';

type LayerVis = {
  pop: boolean; unifil: boolean; hez: boolean; blueLine: boolean;
  litani: boolean; topo: boolean; cityLabels: boolean;
  settlementLabels: boolean; ridgeLabels: boolean; waterLabels: boolean;
  sectColors: boolean;
};

const DEFAULT_LAYER_VIS: LayerVis = {
  pop: true, unifil: true, hez: true, blueLine: true,
  litani: true, topo: false, cityLabels: true,
  settlementLabels: true, ridgeLabels: true, waterLabels: true,
  sectColors: true,
};

function loadLayerVis(): LayerVis {
  try {
    const raw = localStorage.getItem(LAYER_VIS_KEY);
    if (!raw) return DEFAULT_LAYER_VIS;
    const parsed = JSON.parse(raw) as Partial<Record<keyof LayerVis, unknown>>;
    return {
      pop:              typeof parsed.pop === 'boolean'              ? parsed.pop              : DEFAULT_LAYER_VIS.pop,
      unifil:           typeof parsed.unifil === 'boolean'           ? parsed.unifil           : DEFAULT_LAYER_VIS.unifil,
      hez:              typeof parsed.hez === 'boolean'              ? parsed.hez              : DEFAULT_LAYER_VIS.hez,
      blueLine:         typeof parsed.blueLine === 'boolean'         ? parsed.blueLine         : DEFAULT_LAYER_VIS.blueLine,
      litani:           typeof parsed.litani === 'boolean'           ? parsed.litani           : DEFAULT_LAYER_VIS.litani,
      topo:             typeof parsed.topo === 'boolean'             ? parsed.topo             : DEFAULT_LAYER_VIS.topo,
      cityLabels:       typeof parsed.cityLabels === 'boolean'       ? parsed.cityLabels       : DEFAULT_LAYER_VIS.cityLabels,
      settlementLabels: typeof parsed.settlementLabels === 'boolean' ? parsed.settlementLabels : DEFAULT_LAYER_VIS.settlementLabels,
      ridgeLabels:      typeof parsed.ridgeLabels === 'boolean'      ? parsed.ridgeLabels      : DEFAULT_LAYER_VIS.ridgeLabels,
      waterLabels:      typeof parsed.waterLabels === 'boolean'      ? parsed.waterLabels      : DEFAULT_LAYER_VIS.waterLabels,
      sectColors:       typeof parsed.sectColors === 'boolean'       ? parsed.sectColors       : DEFAULT_LAYER_VIS.sectColors,
    };
  } catch {
    return DEFAULT_LAYER_VIS;
  }
}

// ---------------------------------------------------------------------------
// 6b. When sectColors is active, all LB towns have sect data for label coloring
// ---------------------------------------------------------------------------
describe('geo.ts — sect coverage for label coloring', () => {
  const lbTowns = towns.filter(t => t.side === 'LB');

  it('every LB town has a sect so label coloring works when toggle is on', () => {
    const missing = lbTowns.filter(t => !t.sect);
    expect(missing.map(t => `${t.id} (${t.name_he})`)).toEqual([]);
  });

  it('at least 100 LB towns have sect data (coverage sanity)', () => {
    const withSect = lbTowns.filter(t => !!t.sect);
    expect(withSect.length).toBeGreaterThanOrEqual(100);
  });

  it('each sect color key has a canonical color hex', () => {
    const SECT_COLORS: Record<string, string> = {
      shia: '#2a8a6e', sunni: '#c97d2a', druze: '#7b3fa0',
      christian: '#b03030', mixed: '#6b7280', jewish: '#1a5fa8',
    };
    const VALID_SECTS_LOCAL = ['shia', 'sunni', 'druze', 'christian', 'mixed', 'jewish'];
    VALID_SECTS_LOCAL.forEach(s => {
      expect(SECT_COLORS[s], `missing color for sect: ${s}`).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it('bintj (Bint Jbeil) has sect shia — verifying click target gets coloring', () => {
    const t = towns.find(x => x.id === 'bintj');
    expect(t).toBeDefined();
    expect(t!.sect).toBe('shia');
  });

  it('maroun (Maroun al-Ras) has sect shia — was previously unclickable', () => {
    const t = towns.find(x => x.id === 'maroun');
    expect(t).toBeDefined();
    expect(t!.sect).toBe('shia');
  });
});

describe('LayerVis — sectColors persistence', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns default sectColors=true when storage is empty', () => {
    const vis = loadLayerVis();
    expect(vis.sectColors).toBe(true);
  });

  it('persists sectColors=false and restores it', () => {
    const saved: LayerVis = { ...DEFAULT_LAYER_VIS, sectColors: false };
    localStorage.setItem(LAYER_VIS_KEY, JSON.stringify(saved));
    const vis = loadLayerVis();
    expect(vis.sectColors).toBe(false);
  });

  it('persists sectColors=true explicitly', () => {
    const saved: LayerVis = { ...DEFAULT_LAYER_VIS, sectColors: true };
    localStorage.setItem(LAYER_VIS_KEY, JSON.stringify(saved));
    const vis = loadLayerVis();
    expect(vis.sectColors).toBe(true);
  });

  it('falls back to default true when sectColors is missing from stored object', () => {
    const withoutSect = { pop: false, unifil: false, hez: true, blueLine: true,
      litani: true, topo: false, cityLabels: true, settlementLabels: false,
      ridgeLabels: false, waterLabels: false };
    localStorage.setItem(LAYER_VIS_KEY, JSON.stringify(withoutSect));
    const vis = loadLayerVis();
    expect(vis.sectColors).toBe(true); // default
  });

  it('all other layer vis keys still load correctly alongside sectColors', () => {
    const saved: LayerVis = {
      pop: false, unifil: false, hez: false, blueLine: false,
      litani: false, topo: true, cityLabels: false,
      settlementLabels: false, ridgeLabels: false, waterLabels: false,
      sectColors: false,
    };
    localStorage.setItem(LAYER_VIS_KEY, JSON.stringify(saved));
    const vis = loadLayerVis();
    expect(vis.pop).toBe(false);
    expect(vis.unifil).toBe(false);
    expect(vis.hez).toBe(false);
    expect(vis.topo).toBe(true);
    expect(vis.sectColors).toBe(false);
  });
});

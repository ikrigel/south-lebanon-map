/**
 * app-state-persistence.test.ts
 *
 * Verifies that every user-controlled application state is correctly saved to
 * localStorage and restored when the app is re-opened.
 *
 * Covers:
 *  1. UI state   — panelsCollapsed, panelHeightPct, userMapRotation
 *  2. Filters    — yearFrom, yearTo, typeFilter, sevFilter
 *  3. Saved routes (point-to-point navigation routes)
 *  4. Saved multi-point routes
 *
 * Strategy: inline copies of the pure load/save helpers from App.tsx so we
 * can test them without rendering the full React tree.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Storage keys (must match App.tsx)
// ---------------------------------------------------------------------------
const UI_STATE_STORAGE_KEY           = 'south-lebanon-map:ui-state:v1';
const FILTER_STATE_STORAGE_KEY       = 'south-lebanon-map:filter-state:v1';
const SAVED_ROUTES_STORAGE_KEY       = 'south-lebanon-map:saved-routes:v1';
const SAVED_MULTI_ROUTES_STORAGE_KEY = 'south-lebanon-map:saved-multi-routes:v1';

// ---------------------------------------------------------------------------
// Inline type copies
// ---------------------------------------------------------------------------
type LocalUiState = {
  panelsCollapsed?: boolean;
  panelHeightPct?: number;
  userMapRotation?: number;
};
type LocalFilterState = {
  yearFrom?: number;
  yearTo?: number;
  typeFilter?: string[];
  sevFilter?: string[];
};
type SavedRoute = {
  id: string; name: string; createdAt: string;
  start: { lat: number; lon: number; label: string };
  end:   { lat: number; lon: number; label: string };
  km: number;
};
type MultiPointRoute = {
  id: string; name: string; description: string;
  difficulty: string; passability: string;
  points: { lat: number; lon: number; label: string; order: number }[];
  totalKm: number; createdAt: string;
};

// ---------------------------------------------------------------------------
// Inline helper copies (mirrors App.tsx)
// ---------------------------------------------------------------------------
const safeGet = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSet = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

const TYPES = ['rocket', 'atgm', 'uav', 'idf_strike', 'unifil', 'ground', 'displacement'];
const SEVS  = ['low', 'med', 'high'];

const loadLocalUiState = (): LocalUiState => {
  try {
    const raw = safeGet(UI_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalUiState;
    return {
      panelsCollapsed: typeof parsed.panelsCollapsed === 'boolean' ? parsed.panelsCollapsed : undefined,
      panelHeightPct:
        typeof parsed.panelHeightPct === 'number' && isFinite(parsed.panelHeightPct)
          ? Math.min(90, Math.max(8, parsed.panelHeightPct))
          : undefined,
      userMapRotation:
        typeof parsed.userMapRotation === 'number' && isFinite(parsed.userMapRotation)
          ? ((parsed.userMapRotation % 360) + 360) % 360
          : undefined,
    };
  } catch { return {}; }
};

const saveUiState = (state: LocalUiState) => safeSet(UI_STATE_STORAGE_KEY, state);

const loadLocalFilterState = (): LocalFilterState => {
  try {
    const raw = safeGet(FILTER_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalFilterState;
    return {
      yearFrom: typeof parsed.yearFrom === 'number' && isFinite(parsed.yearFrom) ? parsed.yearFrom : undefined,
      yearTo:   typeof parsed.yearTo   === 'number' && isFinite(parsed.yearTo)   ? parsed.yearTo   : undefined,
      typeFilter: Array.isArray(parsed.typeFilter) ? parsed.typeFilter.filter(t => typeof t === 'string') : undefined,
      sevFilter:  Array.isArray(parsed.sevFilter)  ? parsed.sevFilter.filter(s => typeof s === 'string')  : undefined,
    };
  } catch { return {}; }
};

const saveFilterState = (state: LocalFilterState) => safeSet(FILTER_STATE_STORAGE_KEY, state);

const loadLocalSavedRoutes = (): SavedRoute[] => {
  try {
    const raw = safeGet(SAVED_ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is SavedRoute =>
        r && typeof r.id === 'string' && typeof r.name === 'string' && r.start && r.end,
    );
  } catch { return []; }
};

const loadLocalSavedMultiRoutes = (): MultiPointRoute[] => {
  try {
    const raw = safeGet(SAVED_MULTI_ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is MultiPointRoute =>
        r && typeof r.id === 'string' && typeof r.name === 'string' && Array.isArray(r.points),
    );
  } catch { return []; }
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makeRoute = (id: string): SavedRoute => ({
  id,
  name: `מסלול ${id}`,
  createdAt: new Date().toISOString(),
  start: { lat: 33.1, lon: 35.1, label: 'התחלה' },
  end:   { lat: 33.3, lon: 35.4, label: 'סיום' },
  km: 12.5,
});

const makeMultiRoute = (id: string): MultiPointRoute => ({
  id,
  name: `מסלול רב-נקודות ${id}`,
  description: 'תיאור',
  difficulty: 'medium',
  passability: 'dirt',
  points: [
    { lat: 33.1, lon: 35.1, label: 'נקודה 1', order: 0 },
    { lat: 33.2, lon: 35.2, label: 'נקודה 2', order: 1 },
  ],
  totalKm: 8.3,
  createdAt: new Date().toISOString(),
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => { localStorage.clear(); });
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

// ===========================================================================
// Suite 1 — UI state
// ===========================================================================
describe('UI state persistence — panelsCollapsed, panelHeightPct, userMapRotation', () => {
  it('returns empty object when nothing saved', () => {
    expect(loadLocalUiState()).toEqual({});
  });

  it('persists panelsCollapsed=true', () => {
    saveUiState({ panelsCollapsed: true, panelHeightPct: 35, userMapRotation: 0 });
    expect(loadLocalUiState().panelsCollapsed).toBe(true);
  });

  it('persists panelsCollapsed=false', () => {
    saveUiState({ panelsCollapsed: false, panelHeightPct: 35, userMapRotation: 0 });
    expect(loadLocalUiState().panelsCollapsed).toBe(false);
  });

  it('persists panelHeightPct correctly', () => {
    saveUiState({ panelsCollapsed: false, panelHeightPct: 65, userMapRotation: 0 });
    expect(loadLocalUiState().panelHeightPct).toBe(65);
  });

  it('clamps panelHeightPct to minimum 8', () => {
    saveUiState({ panelsCollapsed: false, panelHeightPct: 2, userMapRotation: 0 });
    expect(loadLocalUiState().panelHeightPct).toBe(8);
  });

  it('clamps panelHeightPct to maximum 90', () => {
    saveUiState({ panelsCollapsed: false, panelHeightPct: 99, userMapRotation: 0 });
    expect(loadLocalUiState().panelHeightPct).toBe(90);
  });

  it('persists userMapRotation correctly', () => {
    saveUiState({ panelsCollapsed: false, panelHeightPct: 35, userMapRotation: 135 });
    expect(loadLocalUiState().userMapRotation).toBe(135);
  });

  it('normalises userMapRotation > 360 to 0–360 range', () => {
    saveUiState({ panelsCollapsed: false, panelHeightPct: 35, userMapRotation: 450 });
    const rot = loadLocalUiState().userMapRotation!;
    expect(rot).toBeGreaterThanOrEqual(0);
    expect(rot).toBeLessThan(360);
    expect(rot).toBeCloseTo(90, 1);
  });

  it('normalises negative userMapRotation to 0–360', () => {
    saveUiState({ panelsCollapsed: false, panelHeightPct: 35, userMapRotation: -90 });
    const rot = loadLocalUiState().userMapRotation!;
    expect(rot).toBe(270);
  });

  it('full round-trip: save all three fields, restore all', () => {
    saveUiState({ panelsCollapsed: true, panelHeightPct: 50, userMapRotation: 180 });
    const restored = loadLocalUiState();
    expect(restored.panelsCollapsed).toBe(true);
    expect(restored.panelHeightPct).toBe(50);
    expect(restored.userMapRotation).toBe(180);
  });

  it('overwrites previous value on subsequent save', () => {
    saveUiState({ panelsCollapsed: false, panelHeightPct: 35, userMapRotation: 0 });
    saveUiState({ panelsCollapsed: true, panelHeightPct: 78, userMapRotation: 45 });
    const restored = loadLocalUiState();
    expect(restored.panelsCollapsed).toBe(true);
    expect(restored.panelHeightPct).toBe(78);
    expect(restored.userMapRotation).toBe(45);
  });

  it('returns {} for corrupt JSON', () => {
    localStorage.setItem(UI_STATE_STORAGE_KEY, '{bad json}');
    expect(loadLocalUiState()).toEqual({});
  });

  it('ignores non-boolean panelsCollapsed', () => {
    localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify({ panelsCollapsed: 'yes' }));
    expect(loadLocalUiState().panelsCollapsed).toBeUndefined();
  });

  it('all 7 snap anchor heights round-trip correctly', () => {
    const anchors = [8, 20, 35, 50, 65, 78, 90];
    for (const pct of anchors) {
      saveUiState({ panelHeightPct: pct });
      expect(loadLocalUiState().panelHeightPct).toBe(pct);
    }
  });
});

// ===========================================================================
// Suite 2 — Filter state
// ===========================================================================
describe('Filter state persistence — yearFrom/yearTo/typeFilter/sevFilter', () => {
  it('returns empty object when nothing saved', () => {
    expect(loadLocalFilterState()).toEqual({});
  });

  it('persists yearFrom and yearTo', () => {
    saveFilterState({ yearFrom: 2022, yearTo: 2024, typeFilter: TYPES, sevFilter: SEVS });
    const restored = loadLocalFilterState();
    expect(restored.yearFrom).toBe(2022);
    expect(restored.yearTo).toBe(2024);
  });

  it('persists partial typeFilter (user disabled some types)', () => {
    const partial = ['rocket', 'uav'];
    saveFilterState({ yearFrom: 2020, yearTo: 2024, typeFilter: partial, sevFilter: SEVS });
    const restored = loadLocalFilterState();
    expect(restored.typeFilter).toEqual(partial);
  });

  it('persists partial sevFilter (user disabled some severities)', () => {
    const partial = ['high'];
    saveFilterState({ yearFrom: 2020, yearTo: 2024, typeFilter: TYPES, sevFilter: partial });
    const restored = loadLocalFilterState();
    expect(restored.sevFilter).toEqual(partial);
  });

  it('filters out non-string entries in typeFilter', () => {
    localStorage.setItem(
      FILTER_STATE_STORAGE_KEY,
      JSON.stringify({ typeFilter: ['rocket', 42, null, 'uav'], sevFilter: SEVS }),
    );
    const restored = loadLocalFilterState();
    expect(restored.typeFilter).toEqual(['rocket', 'uav']);
  });

  it('full round-trip: all filter fields', () => {
    saveFilterState({ yearFrom: 2021, yearTo: 2023, typeFilter: ['atgm'], sevFilter: ['med', 'high'] });
    const restored = loadLocalFilterState();
    expect(restored.yearFrom).toBe(2021);
    expect(restored.yearTo).toBe(2023);
    expect(restored.typeFilter).toEqual(['atgm']);
    expect(restored.sevFilter).toEqual(['med', 'high']);
  });

  it('overwrites on second save', () => {
    saveFilterState({ yearFrom: 2020, yearTo: 2022, typeFilter: TYPES, sevFilter: SEVS });
    saveFilterState({ yearFrom: 2023, yearTo: 2024, typeFilter: ['rocket'], sevFilter: ['low'] });
    const restored = loadLocalFilterState();
    expect(restored.yearFrom).toBe(2023);
    expect(restored.typeFilter).toEqual(['rocket']);
  });

  it('returns {} for corrupt JSON', () => {
    localStorage.setItem(FILTER_STATE_STORAGE_KEY, 'not-json');
    expect(loadLocalFilterState()).toEqual({});
  });

  it('returns undefined yearFrom for NaN', () => {
    localStorage.setItem(FILTER_STATE_STORAGE_KEY, JSON.stringify({ yearFrom: 'abc', yearTo: 2024 }));
    expect(loadLocalFilterState().yearFrom).toBeUndefined();
  });
});

// ===========================================================================
// Suite 3 — Saved routes (point-to-point)
// ===========================================================================
describe('Saved routes persistence', () => {
  it('returns empty array when nothing saved', () => {
    expect(loadLocalSavedRoutes()).toEqual([]);
  });

  it('saves and restores a single route', () => {
    const route = makeRoute('r1');
    safeSet(SAVED_ROUTES_STORAGE_KEY, [route]);
    const restored = loadLocalSavedRoutes();
    expect(restored).toHaveLength(1);
    expect(restored[0].id).toBe('r1');
    expect(restored[0].name).toBe('מסלול r1');
  });

  it('saves and restores multiple routes in order', () => {
    const routes = ['r1', 'r2', 'r3'].map(makeRoute);
    safeSet(SAVED_ROUTES_STORAGE_KEY, routes);
    const restored = loadLocalSavedRoutes();
    expect(restored).toHaveLength(3);
    expect(restored.map(r => r.id)).toEqual(['r1', 'r2', 'r3']);
  });

  it('filters out routes missing required fields', () => {
    safeSet(SAVED_ROUTES_STORAGE_KEY, [
      makeRoute('good'),
      { id: 'bad1' },                    // missing name, start, end
      { name: 'no-id', start: {}, end: {} }, // missing id
      null,
    ]);
    const restored = loadLocalSavedRoutes();
    expect(restored).toHaveLength(1);
    expect(restored[0].id).toBe('good');
  });

  it('preserves km and start/end coordinates', () => {
    const route = makeRoute('r1');
    safeSet(SAVED_ROUTES_STORAGE_KEY, [route]);
    const restored = loadLocalSavedRoutes()[0];
    expect(restored.km).toBe(12.5);
    expect(restored.start.lat).toBeCloseTo(33.1, 5);
    expect(restored.end.lat).toBeCloseTo(33.3, 5);
  });

  it('returns [] for corrupt JSON', () => {
    localStorage.setItem(SAVED_ROUTES_STORAGE_KEY, '{{{');
    expect(loadLocalSavedRoutes()).toEqual([]);
  });

  it('returns [] when stored value is not an array', () => {
    safeSet(SAVED_ROUTES_STORAGE_KEY, { single: 'object' });
    expect(loadLocalSavedRoutes()).toEqual([]);
  });

  it('overwrites on subsequent save', () => {
    safeSet(SAVED_ROUTES_STORAGE_KEY, [makeRoute('r1')]);
    safeSet(SAVED_ROUTES_STORAGE_KEY, [makeRoute('r2'), makeRoute('r3')]);
    const restored = loadLocalSavedRoutes();
    expect(restored).toHaveLength(2);
    expect(restored[0].id).toBe('r2');
  });
});

// ===========================================================================
// Suite 4 — Saved multi-point routes
// ===========================================================================
describe('Saved multi-point routes persistence', () => {
  it('returns empty array when nothing saved', () => {
    expect(loadLocalSavedMultiRoutes()).toEqual([]);
  });

  it('saves and restores a single multi-point route', () => {
    const route = makeMultiRoute('m1');
    safeSet(SAVED_MULTI_ROUTES_STORAGE_KEY, [route]);
    const restored = loadLocalSavedMultiRoutes();
    expect(restored).toHaveLength(1);
    expect(restored[0].id).toBe('m1');
    expect(restored[0].name).toBe('מסלול רב-נקודות m1');
  });

  it('preserves all route points', () => {
    const route = makeMultiRoute('m1');
    safeSet(SAVED_MULTI_ROUTES_STORAGE_KEY, [route]);
    const restored = loadLocalSavedMultiRoutes()[0];
    expect(restored.points).toHaveLength(2);
    expect(restored.points[0].lat).toBeCloseTo(33.1, 5);
    expect(restored.points[1].lat).toBeCloseTo(33.2, 5);
  });

  it('preserves difficulty and passability metadata', () => {
    const route = makeMultiRoute('m1');
    safeSet(SAVED_MULTI_ROUTES_STORAGE_KEY, [route]);
    const restored = loadLocalSavedMultiRoutes()[0];
    expect(restored.difficulty).toBe('medium');
    expect(restored.passability).toBe('dirt');
  });

  it('filters out routes missing required fields', () => {
    safeSet(SAVED_MULTI_ROUTES_STORAGE_KEY, [
      makeMultiRoute('good'),
      { id: 'bad', name: 'no-points' },    // missing points array
      { name: 'no-id', points: [] },        // missing id
      null,
    ]);
    const restored = loadLocalSavedMultiRoutes();
    expect(restored).toHaveLength(1);
    expect(restored[0].id).toBe('good');
  });

  it('saves and restores multiple routes in order', () => {
    const routes = ['m1', 'm2', 'm3'].map(makeMultiRoute);
    safeSet(SAVED_MULTI_ROUTES_STORAGE_KEY, routes);
    const restored = loadLocalSavedMultiRoutes();
    expect(restored).toHaveLength(3);
    expect(restored.map(r => r.id)).toEqual(['m1', 'm2', 'm3']);
  });

  it('returns [] for corrupt JSON', () => {
    localStorage.setItem(SAVED_MULTI_ROUTES_STORAGE_KEY, 'not-json');
    expect(loadLocalSavedMultiRoutes()).toEqual([]);
  });

  it('returns [] when stored value is not an array', () => {
    safeSet(SAVED_MULTI_ROUTES_STORAGE_KEY, 'a string');
    expect(loadLocalSavedMultiRoutes()).toEqual([]);
  });
});

// ===========================================================================
// Suite 5 — Cross-state independence (one key doesn't clobber another)
// ===========================================================================
describe('Cross-state independence', () => {
  it('saving UI state does not affect filter state', () => {
    saveFilterState({ yearFrom: 2022, yearTo: 2024, typeFilter: ['rocket'], sevFilter: ['high'] });
    saveUiState({ panelsCollapsed: true, panelHeightPct: 65, userMapRotation: 90 });
    const filter = loadLocalFilterState();
    expect(filter.yearFrom).toBe(2022);
    expect(filter.typeFilter).toEqual(['rocket']);
  });

  it('saving saved-routes does not affect UI state', () => {
    saveUiState({ panelsCollapsed: true, panelHeightPct: 50, userMapRotation: 45 });
    safeSet(SAVED_ROUTES_STORAGE_KEY, [makeRoute('r1')]);
    const ui = loadLocalUiState();
    expect(ui.panelsCollapsed).toBe(true);
    expect(ui.userMapRotation).toBe(45);
  });

  it('all four stores can coexist and restore independently', () => {
    saveUiState({ panelsCollapsed: false, panelHeightPct: 20, userMapRotation: 270 });
    saveFilterState({ yearFrom: 2021, yearTo: 2023, typeFilter: ['uav'], sevFilter: ['med'] });
    safeSet(SAVED_ROUTES_STORAGE_KEY, [makeRoute('r1'), makeRoute('r2')]);
    safeSet(SAVED_MULTI_ROUTES_STORAGE_KEY, [makeMultiRoute('m1')]);

    const ui    = loadLocalUiState();
    const filt  = loadLocalFilterState();
    const routes = loadLocalSavedRoutes();
    const multi  = loadLocalSavedMultiRoutes();

    expect(ui.panelHeightPct).toBe(20);
    expect(ui.userMapRotation).toBe(270);
    expect(filt.typeFilter).toEqual(['uav']);
    expect(routes).toHaveLength(2);
    expect(multi).toHaveLength(1);
  });
});

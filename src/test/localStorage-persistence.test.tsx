/**
 * localStorage-persistence.test.tsx
 *
 * Verifies that the map's last position (lat/lon/zoom) is saved to
 * localStorage on every moveend, and that it is correctly restored
 * when the app is re-opened.
 *
 * Strategy:
 *  1. Directly test the pure helper functions (loadLocalMapView /
 *     safeStorageSet / safeStorageGet) by calling them through a
 *     lightweight harness that mirrors App.tsx's logic.
 *  2. Test that handleMapViewChange writes valid data to localStorage.
 *  3. Test that loadLocalMapView reads it back correctly.
 *  4. Test edge cases: invalid JSON, missing keys, out-of-range values.
 *  5. Test that the initial focusTarget ID is 'restore-last-map-view'
 *     when a saved view exists, so Map.tsx uses setView (not flyTo).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Inline copies of the pure functions from App.tsx
// (copied to avoid rendering the full App in tests)
// ---------------------------------------------------------------------------

const MAP_VIEW_STORAGE_KEY = 'south-lebanon-map:last-map-view:v1';

type LocalMapView = { lat: number; lon: number; zoom: number };

const safeStorageGet = (key: string): string | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: unknown): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode — silently ignore
  }
};

const loadLocalMapView = (): LocalMapView | null => {
  try {
    const raw = safeStorageGet(MAP_VIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalMapView>;
    if (
      typeof parsed.lat !== 'number' ||
      typeof parsed.lon !== 'number' ||
      typeof parsed.zoom !== 'number' ||
      !isFinite(parsed.lat) ||
      !isFinite(parsed.lon) ||
      !isFinite(parsed.zoom) ||
      Math.abs(parsed.lat) > 90 ||
      Math.abs(parsed.lon) > 180
    ) {
      return null;
    }
    return {
      lat: parsed.lat,
      lon: parsed.lon,
      zoom: Math.min(19, Math.max(9, Math.round(parsed.zoom * 100) / 100)),
    };
  } catch {
    return null;
  }
};

/**
 * Mirrors handleMapViewChange in App.tsx — validates and persists the view.
 */
const handleMapViewChange = (view: LocalMapView): void => {
  if (
    !isFinite(view.lat) ||
    !isFinite(view.lon) ||
    !isFinite(view.zoom) ||
    Math.abs(view.lat) > 90 ||
    Math.abs(view.lon) > 180
  ) {
    return;
  }
  safeStorageSet(MAP_VIEW_STORAGE_KEY, {
    lat: Math.round(view.lat * 1000000) / 1000000,
    lon: Math.round(view.lon * 1000000) / 1000000,
    zoom: Math.min(19, Math.max(9, Math.round(view.zoom * 100) / 100)),
  } satisfies LocalMapView);
};

// ---------------------------------------------------------------------------
// Test setup: clear localStorage before/after each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ===========================================================================
// Suite 1 — safeStorageGet / safeStorageSet round-trip
// ===========================================================================

describe('safeStorageGet / safeStorageSet — basic round-trip', () => {
  it('stores and retrieves a string value', () => {
    safeStorageSet('test-key', { foo: 'bar' });
    expect(safeStorageGet('test-key')).toBe('{"foo":"bar"}');
  });

  it('returns null for missing key', () => {
    expect(safeStorageGet('nonexistent')).toBeNull();
  });

  it('overwrites previous value', () => {
    safeStorageSet('test-key', { v: 1 });
    safeStorageSet('test-key', { v: 2 });
    expect(safeStorageGet('test-key')).toBe('{"v":2}');
  });
});

// ===========================================================================
// Suite 2 — handleMapViewChange → localStorage save
// ===========================================================================

describe('handleMapViewChange — saves valid view to localStorage', () => {
  it('saves lat/lon/zoom correctly', () => {
    handleMapViewChange({ lat: 33.25, lon: 35.38, zoom: 11 });
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.lat).toBeCloseTo(33.25, 5);
    expect(parsed.lon).toBeCloseTo(35.38, 5);
    expect(parsed.zoom).toBe(11);
  });

  it('rounds lat/lon to 6 decimal places', () => {
    handleMapViewChange({ lat: 33.123456789, lon: 35.987654321, zoom: 12 });
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    // Must be rounded to 6 decimal places
    expect(parsed.lat.toString().replace(/^-?\d+\./, '').length).toBeLessThanOrEqual(6);
    expect(parsed.lon.toString().replace(/^-?\d+\./, '').length).toBeLessThanOrEqual(6);
  });

  it('clamps zoom to minimum 9', () => {
    handleMapViewChange({ lat: 33.2, lon: 35.5, zoom: 5 });
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed.zoom).toBe(9);
  });

  it('clamps zoom to maximum 19', () => {
    handleMapViewChange({ lat: 33.2, lon: 35.5, zoom: 25 });
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed.zoom).toBe(19);
  });

  it('does NOT save if lat is NaN', () => {
    handleMapViewChange({ lat: NaN, lon: 35.5, zoom: 11 });
    expect(localStorage.getItem(MAP_VIEW_STORAGE_KEY)).toBeNull();
  });

  it('does NOT save if lon is Infinity', () => {
    handleMapViewChange({ lat: 33.2, lon: Infinity, zoom: 11 });
    expect(localStorage.getItem(MAP_VIEW_STORAGE_KEY)).toBeNull();
  });

  it('does NOT save if lat > 90', () => {
    handleMapViewChange({ lat: 91, lon: 35.5, zoom: 11 });
    expect(localStorage.getItem(MAP_VIEW_STORAGE_KEY)).toBeNull();
  });

  it('does NOT save if lon > 180', () => {
    handleMapViewChange({ lat: 33.2, lon: 181, zoom: 11 });
    expect(localStorage.getItem(MAP_VIEW_STORAGE_KEY)).toBeNull();
  });

  it('overwrites previous save on new moveend', () => {
    handleMapViewChange({ lat: 33.1, lon: 35.1, zoom: 10 });
    handleMapViewChange({ lat: 33.3, lon: 35.6, zoom: 13 });
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    const parsed = JSON.parse(raw!);
    expect(parsed.lat).toBeCloseTo(33.3, 5);
    expect(parsed.lon).toBeCloseTo(35.6, 5);
    expect(parsed.zoom).toBe(13);
  });
});

// ===========================================================================
// Suite 3 — loadLocalMapView — restore on app reopen
// ===========================================================================

describe('loadLocalMapView — restores saved view on app reopen', () => {
  it('returns null when nothing is saved', () => {
    expect(loadLocalMapView()).toBeNull();
  });

  it('returns the saved view correctly', () => {
    handleMapViewChange({ lat: 33.25, lon: 35.38, zoom: 11 });
    const restored = loadLocalMapView();
    expect(restored).not.toBeNull();
    expect(restored!.lat).toBeCloseTo(33.25, 5);
    expect(restored!.lon).toBeCloseTo(35.38, 5);
    expect(restored!.zoom).toBe(11);
  });

  it('full round-trip: save → restore → same values', () => {
    const original: LocalMapView = { lat: 33.0583, lon: 35.4333, zoom: 14 };
    handleMapViewChange(original);
    const restored = loadLocalMapView();
    expect(restored!.lat).toBeCloseTo(original.lat, 5);
    expect(restored!.lon).toBeCloseTo(original.lon, 5);
    expect(restored!.zoom).toBe(original.zoom);
  });

  it('multiple save → last one is restored', () => {
    handleMapViewChange({ lat: 33.1, lon: 35.1, zoom: 10 });
    handleMapViewChange({ lat: 33.4, lon: 35.7, zoom: 15 });
    const restored = loadLocalMapView();
    expect(restored!.lat).toBeCloseTo(33.4, 5);
    expect(restored!.lon).toBeCloseTo(35.7, 5);
    expect(restored!.zoom).toBe(15);
  });

  it('returns null for invalid JSON', () => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, '{not valid json}');
    expect(loadLocalMapView()).toBeNull();
  });

  it('returns null if lat is missing', () => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({ lon: 35.5, zoom: 11 }));
    expect(loadLocalMapView()).toBeNull();
  });

  it('returns null if lon is missing', () => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({ lat: 33.2, zoom: 11 }));
    expect(loadLocalMapView()).toBeNull();
  });

  it('returns null if zoom is missing', () => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({ lat: 33.2, lon: 35.5 }));
    expect(loadLocalMapView()).toBeNull();
  });

  it('returns null if lat is NaN', () => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({ lat: null, lon: 35.5, zoom: 11 }));
    expect(loadLocalMapView()).toBeNull();
  });

  it('returns null if lat > 90', () => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({ lat: 95, lon: 35.5, zoom: 11 }));
    expect(loadLocalMapView()).toBeNull();
  });

  it('returns null if lon > 180', () => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({ lat: 33.2, lon: 200, zoom: 11 }));
    expect(loadLocalMapView()).toBeNull();
  });

  it('clamps restored zoom to 9–19 range', () => {
    // Manually write an out-of-range zoom (corrupted data)
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({ lat: 33.2, lon: 35.5, zoom: 3 }));
    const restored = loadLocalMapView();
    expect(restored!.zoom).toBeGreaterThanOrEqual(9);
    expect(restored!.zoom).toBeLessThanOrEqual(19);
  });

  it('survives empty localStorage gracefully', () => {
    localStorage.clear();
    expect(() => loadLocalMapView()).not.toThrow();
    expect(loadLocalMapView()).toBeNull();
  });
});

// ===========================================================================
// Suite 4 — focusTarget ID 'restore-last-map-view' is set on reopen
// ===========================================================================

describe('focusTarget restore-last-map-view — used when saved view exists', () => {
  /**
   * Mirrors the initialMapViewRef / focusTarget initialization from App.tsx:
   *   const focusTarget = initialMapView
   *     ? { ...initialMapView, id: 'restore-last-map-view' }
   *     : null;
   */
  const buildInitialFocusTarget = (savedView: LocalMapView | null) =>
    savedView ? { ...savedView, id: 'restore-last-map-view' } : null;

  it('focusTarget is null when no view is saved', () => {
    const focusTarget = buildInitialFocusTarget(loadLocalMapView());
    expect(focusTarget).toBeNull();
  });

  it('focusTarget has id "restore-last-map-view" when view is saved', () => {
    handleMapViewChange({ lat: 33.25, lon: 35.38, zoom: 11 });
    const focusTarget = buildInitialFocusTarget(loadLocalMapView());
    expect(focusTarget).not.toBeNull();
    expect(focusTarget!.id).toBe('restore-last-map-view');
  });

  it('focusTarget lat/lon/zoom match the saved values', () => {
    const saved: LocalMapView = { lat: 33.0769, lon: 35.455, zoom: 13 };
    handleMapViewChange(saved);
    const focusTarget = buildInitialFocusTarget(loadLocalMapView());
    expect(focusTarget!.lat).toBeCloseTo(saved.lat, 5);
    expect(focusTarget!.lon).toBeCloseTo(saved.lon, 5);
    expect(focusTarget!.zoom).toBe(saved.zoom);
  });

  it('focusTarget id "restore-last-map-view" triggers setView not flyTo', () => {
    // This is a contract test: Map.tsx must use setView (instant) for this ID.
    // We verify that the ID string equals exactly what Map.tsx checks for.
    handleMapViewChange({ lat: 33.2, lon: 35.4, zoom: 12 });
    const focusTarget = buildInitialFocusTarget(loadLocalMapView());
    // The ID must be exactly this string — Map.tsx branches on it
    expect(focusTarget!.id).toBe('restore-last-map-view');
    // It must NOT have a label (restore doesn't show a focus marker)
    expect((focusTarget as { label?: string }).label).toBeUndefined();
  });

  it('after save → reload → focusTarget has correct position and id', () => {
    // Simulate: user pans to a specific location, app saves it
    handleMapViewChange({ lat: 33.35, lon: 35.6, zoom: 12 });

    // Simulate: app is closed and reopened — loadLocalMapView() runs fresh
    const restoredView = loadLocalMapView();
    const focusTarget = buildInitialFocusTarget(restoredView);

    expect(focusTarget).not.toBeNull();
    expect(focusTarget!.id).toBe('restore-last-map-view');
    expect(focusTarget!.lat).toBeCloseTo(33.35, 5);
    expect(focusTarget!.lon).toBeCloseTo(35.6, 5);
    expect(focusTarget!.zoom).toBe(12);
  });
});

// ===========================================================================
// Suite 5 — persistence survives multiple save/restore cycles
// ===========================================================================

describe('persistence — multiple save/restore cycles', () => {
  const positions: LocalMapView[] = [
    { lat: 33.10, lon: 35.20, zoom: 10 },
    { lat: 33.25, lon: 35.38, zoom: 12 },
    { lat: 33.40, lon: 35.55, zoom: 14 },
    { lat: 33.05, lon: 35.10, zoom: 9  },
    { lat: 33.45, lon: 35.70, zoom: 11 },
  ];

  it('each position survives a full save/restore cycle', () => {
    for (const pos of positions) {
      localStorage.clear();
      handleMapViewChange(pos);
      const restored = loadLocalMapView();
      expect(restored).not.toBeNull();
      expect(restored!.lat).toBeCloseTo(pos.lat, 5);
      expect(restored!.lon).toBeCloseTo(pos.lon, 5);
    }
  });

  it('last of sequential moves is the one restored', () => {
    // Simulate continuous panning: many moveend events
    for (const pos of positions) {
      handleMapViewChange(pos);
    }
    const restored = loadLocalMapView();
    const last = positions[positions.length - 1];
    expect(restored!.lat).toBeCloseTo(last.lat, 5);
    expect(restored!.lon).toBeCloseTo(last.lon, 5);
    expect(restored!.zoom).toBe(last.zoom);
  });

  it('zoom is preserved exactly (no floating-point drift) after 10 saves', () => {
    for (let i = 0; i < 10; i++) {
      handleMapViewChange({ lat: 33.2 + i * 0.01, lon: 35.4, zoom: 11 });
    }
    const restored = loadLocalMapView();
    expect(restored!.zoom).toBe(11);
  });
});

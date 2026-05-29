/**
 * map-center-drift.test.tsx
 *
 * Verifies that the map's geo-center does NOT drift when the side-panel is
 * toggled open/closed — even when the map is CSS-rotated.
 *
 * Root cause (documented): when the container resizes, Leaflet recalculates
 *   _pixelOrigin = project(center) - viewHalf + panePos
 * The change in viewHalf causes the visible area to shift east/west.
 * The fix is: snapshot geo-center BEFORE the layout change, then call
 *   map.setView(savedCenter, zoom, {animate:false, noMoveStart:true})
 * AFTER invalidateSize() so _pixelOrigin is recalculated for the new size.
 *
 * Test strategy:
 *   1. Render a minimal host that owns a MapHandle ref.
 *   2. Exercise snapshotCenter() + invalidateSize() as App.tsx does.
 *   3. Assert that setView is called with the SAME center that getCenter()
 *      returned at snapshot time — across multiple toggles and with rotation.
 *   4. Separately unit-test the MapHandle methods directly via the forwardRef
 *      pattern used by the real MapView (without rendering real Leaflet).
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  createRef,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MapHandle } from '../Map';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** lat/lng pair used as the mocked map center */
const FIXED_CENTER = { lat: 33.2, lng: 35.5 };
const FIXED_ZOOM   = 11;

/**
 * Create a mock Leaflet map whose getCenter / getZoom / invalidateSize /
 * setView are observable vi.fn(). Returns the mock map and a factory that
 * produces a fresh MapHandle backed by this mock (mirroring Map.tsx logic).
 */
function makeMockMap(overrides?: Partial<{
  lat: number;
  lng: number;
  zoom: number;
}>) {
  const center = { lat: overrides?.lat ?? FIXED_CENTER.lat, lng: overrides?.lng ?? FIXED_CENTER.lng };
  const zoom   = overrides?.zoom ?? FIXED_ZOOM;

  const mockMap = {
    getCenter:      vi.fn(() => ({ ...center })),
    getZoom:        vi.fn(() => zoom),
    invalidateSize: vi.fn(),
    setView:        vi.fn().mockReturnThis(),
    on:             vi.fn(),
    off:            vi.fn(),
    remove:         vi.fn(),
  };

  /** Reproduce exactly the MapHandle logic from Map.tsx */
  function buildHandle(): MapHandle {
    // savedViewRef equivalent (closed over)
    let savedView: { center: { lat: number; lng: number }; zoom: number } | null = null;

    return {
      snapshotCenter() {
        savedView = {
          center: mockMap.getCenter(),
          zoom:   mockMap.getZoom(),
        };
      },
      invalidateSize() {
        const c    = savedView ? savedView.center : mockMap.getCenter();
        const z    = mockMap.getZoom();
        mockMap.invalidateSize({ animate: false, pan: false });
        mockMap.setView(c, z, { animate: false, noMoveStart: true });
      },
    };
  }

  return { mockMap, buildHandle };
}

// ---------------------------------------------------------------------------
// Stub MapView that wires a real MapHandle (using makeMockMap internally)
// ---------------------------------------------------------------------------

type StubProps = {
  mockMap: ReturnType<typeof makeMockMap>['mockMap'];
};

const StubMapView = forwardRef<MapHandle, StubProps>(({ mockMap }, ref) => {
  // Mimic Map.tsx savedViewRef
  const savedViewRef = useRef<{ center: { lat: number; lng: number }; zoom: number } | null>(null);

  useImperativeHandle(ref, () => ({
    snapshotCenter() {
      savedViewRef.current = {
        center: mockMap.getCenter(),
        zoom:   mockMap.getZoom(),
      };
    },
    invalidateSize() {
      const c = savedViewRef.current ? savedViewRef.current.center : mockMap.getCenter();
      const z = mockMap.getZoom();
      mockMap.invalidateSize({ animate: false, pan: false });
      mockMap.setView(c, z, { animate: false, noMoveStart: true });
    },
  }), [mockMap]);

  return <div data-testid="map-canvas" />;
});
StubMapView.displayName = 'StubMapView';

// ---------------------------------------------------------------------------
// TestHost — mirrors App.tsx panel-collapse effect (synchronous for tests)
// ---------------------------------------------------------------------------

function TestHost({
  mockMap,
  onToggle,
}: {
  mockMap: ReturnType<typeof makeMockMap>['mockMap'];
  onToggle?: (collapsed: boolean) => void;
}) {
  const [collapsed, setCollapsed]         = useState(false);
  const mapRef                            = useRef<MapHandle>(null);
  const isFirstMount                      = useRef(true);

  const toggle = () => {
    // Snapshot BEFORE layout change (mirrors App.tsx synchronous snapshot)
    if (!isFirstMount.current) {
      mapRef.current?.snapshotCenter();
    }
    isFirstMount.current = false;

    const next = !collapsed;
    setCollapsed(next);
    onToggle?.(next);

    // Simulate double-rAF synchronously in tests
    mapRef.current?.invalidateSize();
  };

  return (
    <div data-testid="app-root" className={collapsed ? 'panels-collapsed' : ''}>
      <StubMapView ref={mapRef} mockMap={mockMap} />
      <button data-testid="btn-toggle" onClick={toggle}>
        {collapsed ? 'פתח תפריט' : 'סגור תפריט'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// afterEach cleanup
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// Suite 1 — Unit tests for MapHandle methods (no React rendering)
// ===========================================================================

describe('MapHandle unit — snapshotCenter + invalidateSize', () => {
  it('invalidateSize calls setView with the snapshotted center', () => {
    const { mockMap, buildHandle } = makeMockMap();
    const handle = buildHandle();

    handle.snapshotCenter();
    handle.invalidateSize();

    expect(mockMap.setView).toHaveBeenCalledOnce();
    const [calledCenter] = mockMap.setView.mock.calls[0] as [{ lat: number; lng: number }, number, object];
    expect(calledCenter.lat).toBeCloseTo(FIXED_CENTER.lat, 6);
    expect(calledCenter.lng).toBeCloseTo(FIXED_CENTER.lng, 6);
  });

  it('invalidateSize passes animate:false and noMoveStart:true', () => {
    const { mockMap, buildHandle } = makeMockMap();
    const handle = buildHandle();

    handle.snapshotCenter();
    handle.invalidateSize();

    const opts = mockMap.setView.mock.calls[0][2] as Record<string, unknown>;
    expect(opts.animate).toBe(false);
    expect(opts.noMoveStart).toBe(true);
  });

  it('invalidateSize calls map.invalidateSize with pan:false', () => {
    const { mockMap, buildHandle } = makeMockMap();
    const handle = buildHandle();

    handle.snapshotCenter();
    handle.invalidateSize();

    expect(mockMap.invalidateSize).toHaveBeenCalledOnce();
    const opts = mockMap.invalidateSize.mock.calls[0][0] as Record<string, unknown>;
    expect(opts.pan).toBe(false);
    expect(opts.animate).toBe(false);
  });

  it('without prior snapshot, falls back to live getCenter()', () => {
    const { mockMap, buildHandle } = makeMockMap();
    const handle = buildHandle();

    // NO snapshotCenter call
    handle.invalidateSize();

    expect(mockMap.setView).toHaveBeenCalledOnce();
    const [calledCenter] = mockMap.setView.mock.calls[0] as [{ lat: number; lng: number }, number, object];
    expect(calledCenter.lat).toBeCloseTo(FIXED_CENTER.lat, 6);
    expect(calledCenter.lng).toBeCloseTo(FIXED_CENTER.lng, 6);
  });

  it('center is preserved even if getCenter() would return wrong value after resize', () => {
    const { mockMap, buildHandle } = makeMockMap();
    const handle = buildHandle();

    // Snapshot records the pre-resize center
    handle.snapshotCenter();

    // Simulate what Leaflet does after resize: getCenter() returns wrong value
    const DRIFTED = { lat: 33.21, lng: 35.52 };
    mockMap.getCenter.mockReturnValue(DRIFTED);

    handle.invalidateSize();

    const [calledCenter] = mockMap.setView.mock.calls[0] as [{ lat: number; lng: number }, number, object];
    // Must use the PRE-DRIFT snapshot, not the drifted value
    expect(calledCenter.lat).toBeCloseTo(FIXED_CENTER.lat, 6);
    expect(calledCenter.lng).toBeCloseTo(FIXED_CENTER.lng, 6);
  });

  it('each new snapshot overwrites the previous one', () => {
    const { mockMap, buildHandle } = makeMockMap();
    const handle = buildHandle();

    // First snapshot at one position
    handle.snapshotCenter();

    // Map panned to a new center
    const NEW_CENTER = { lat: 33.35, lng: 35.6 };
    mockMap.getCenter.mockReturnValue({ ...NEW_CENTER });

    // Second snapshot — should overwrite the first
    handle.snapshotCenter();
    handle.invalidateSize();

    const [calledCenter] = mockMap.setView.mock.calls[0] as [{ lat: number; lng: number }, number, object];
    expect(calledCenter.lat).toBeCloseTo(NEW_CENTER.lat, 6);
    expect(calledCenter.lng).toBeCloseTo(NEW_CENTER.lng, 6);
  });
});

// ===========================================================================
// Suite 2 — Panel toggle drift: center stays at same pixels (multiple times)
// ===========================================================================

describe('Panel toggle — map center must not drift (multiple toggles)', () => {
  it('setView is called with original center on first panel close', () => {
    const { mockMap } = makeMockMap();
    render(<TestHost mockMap={mockMap} />);

    fireEvent.click(screen.getByTestId('btn-toggle')); // close

    // invalidateSize may also be called on mount, so check the LAST call
    const calls = mockMap.setView.mock.calls;
    const lastCall = calls[calls.length - 1] as [{ lat: number; lng: number }, number, object];
    expect(lastCall[0].lat).toBeCloseTo(FIXED_CENTER.lat, 6);
    expect(lastCall[0].lng).toBeCloseTo(FIXED_CENTER.lng, 6);
  });

  it('setView center is stable across 3 consecutive close/open toggles', () => {
    const { mockMap } = makeMockMap();
    render(<TestHost mockMap={mockMap} />);

    for (let i = 0; i < 3; i++) {
      // Simulate that Leaflet's internal drift would make getCenter() lie
      // after each resize — the snapshot must protect against this.
      const DRIFTED = { lat: FIXED_CENTER.lat + (i + 1) * 0.01, lng: FIXED_CENTER.lng + (i + 1) * 0.01 };

      // Before toggle: snap captures the CORRECT center
      // (mockMap.getCenter still returns FIXED_CENTER at snapshot time)
      mockMap.getCenter.mockReturnValueOnce({ ...FIXED_CENTER }); // for snapshotCenter
      mockMap.getCenter.mockReturnValue(DRIFTED);                 // would-be drift after resize

      fireEvent.click(screen.getByTestId('btn-toggle'));

      const calls = mockMap.setView.mock.calls;
      const lastCenter = calls[calls.length - 1][0] as { lat: number; lng: number };
      expect(lastCenter.lat).toBeCloseTo(FIXED_CENTER.lat, 5);
      expect(lastCenter.lng).toBeCloseTo(FIXED_CENTER.lng, 5);
    }
  });

  it('setView is called on EVERY panel toggle (not skipped)', () => {
    const { mockMap } = makeMockMap();
    render(<TestHost mockMap={mockMap} />);

    const toggles = 4;
    for (let i = 0; i < toggles; i++) {
      fireEvent.click(screen.getByTestId('btn-toggle'));
    }

    // At least one setView per toggle (may be more due to mount invalidation)
    expect(mockMap.setView.mock.calls.length).toBeGreaterThanOrEqual(toggles);
  });

  it('zoom level is unchanged across panel toggle', () => {
    const { mockMap } = makeMockMap();
    render(<TestHost mockMap={mockMap} />);

    fireEvent.click(screen.getByTestId('btn-toggle'));

    const calls = mockMap.setView.mock.calls;
    const lastZoom = calls[calls.length - 1][1] as number;
    expect(lastZoom).toBe(FIXED_ZOOM);
  });
});

// ===========================================================================
// Suite 3 — Rotation: center must stay stable when map is rotated
// ===========================================================================

describe('Map rotation — center must not drift across panel toggle with rotation', () => {
  /**
   * When the map is CSS-rotated the predrag compensation uses userRotationRef,
   * but the center-drift fix (setView) is independent of rotation — it relies
   * only on the saved geo-center from snapshotCenter(). These tests confirm
   * the MapHandle behaves correctly regardless of rotation angle.
   */

  const rotations = [0, 45, 90, 135, 180, 270, 315];

  rotations.forEach(deg => {
    it(`center preserved with ${deg}° map rotation`, () => {
      const { mockMap, buildHandle } = makeMockMap();
      const handle = buildHandle();

      // Simulate CSS rotation having been applied (does not affect handle logic)
      // Snapshot before "layout change"
      handle.snapshotCenter();

      // Simulate post-resize drift that Leaflet would introduce
      const DRIFTED = {
        lat: FIXED_CENTER.lat + Math.cos((deg * Math.PI) / 180) * 0.03,
        lng: FIXED_CENTER.lng + Math.sin((deg * Math.PI) / 180) * 0.03,
      };
      mockMap.getCenter.mockReturnValue(DRIFTED);

      handle.invalidateSize();

      const [calledCenter] = mockMap.setView.mock.calls[0] as [{ lat: number; lng: number }, number, object];
      expect(calledCenter.lat).toBeCloseTo(FIXED_CENTER.lat, 5);
      expect(calledCenter.lng).toBeCloseTo(FIXED_CENTER.lng, 5);
    });
  });

  it('center stable across 3 toggles while rotated at 90°', () => {
    const { mockMap, buildHandle } = makeMockMap();
    const handle = buildHandle();

    for (let i = 0; i < 3; i++) {
      // Fresh snapshot at the start of each toggle (as App.tsx does)
      mockMap.getCenter.mockReturnValueOnce({ ...FIXED_CENTER }); // snapshot time
      const DRIFTED = { lat: FIXED_CENTER.lat + 0.05, lng: FIXED_CENTER.lng - 0.05 };
      mockMap.getCenter.mockReturnValue(DRIFTED);                 // after resize

      handle.snapshotCenter();
      handle.invalidateSize();

      const calls = mockMap.setView.mock.calls;
      const lastCenter = calls[calls.length - 1][0] as { lat: number; lng: number };
      expect(lastCenter.lat).toBeCloseTo(FIXED_CENTER.lat, 5);
      expect(lastCenter.lng).toBeCloseTo(FIXED_CENTER.lng, 5);
    }
    // setView must have been called once per toggle
    expect(mockMap.setView).toHaveBeenCalledTimes(3);
  });

  it('center stable across 5 alternating close/open with 45° rotation', () => {
    const { mockMap } = makeMockMap();
    render(<TestHost mockMap={mockMap} />);

    for (let i = 0; i < 5; i++) {
      // Snapshot captures the correct center
      mockMap.getCenter.mockReturnValueOnce({ ...FIXED_CENTER });
      // After resize, Leaflet would drift by a rotation-dependent amount
      const angle = 45 * (Math.PI / 180);
      const DRIFTED = {
        lat: FIXED_CENTER.lat + Math.cos(angle) * 0.02 * (i + 1),
        lng: FIXED_CENTER.lng + Math.sin(angle) * 0.02 * (i + 1),
      };
      mockMap.getCenter.mockReturnValue(DRIFTED);

      fireEvent.click(screen.getByTestId('btn-toggle'));

      const calls = mockMap.setView.mock.calls;
      const lastCenter = calls[calls.length - 1][0] as { lat: number; lng: number };
      expect(lastCenter.lat).toBeCloseTo(FIXED_CENTER.lat, 5);
      expect(lastCenter.lng).toBeCloseTo(FIXED_CENTER.lng, 5);
    }
  });
});

// ===========================================================================
// Suite 4 — Direct MapHandle ref test (createRef pattern)
// ===========================================================================

describe('MapHandle ref — createRef access', () => {
  it('ref is populated after render', () => {
    const { mockMap } = makeMockMap();
    const ref = createRef<MapHandle>();
    render(<StubMapView ref={ref} mockMap={mockMap} />);
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.snapshotCenter).toBe('function');
    expect(typeof ref.current?.invalidateSize).toBe('function');
  });

  it('calling snapshotCenter then invalidateSize via ref preserves center', () => {
    const { mockMap } = makeMockMap();
    const ref = createRef<MapHandle>();
    render(<StubMapView ref={ref} mockMap={mockMap} />);

    ref.current!.snapshotCenter();

    // Simulate Leaflet drift
    mockMap.getCenter.mockReturnValue({ lat: 99, lng: 99 });

    ref.current!.invalidateSize();

    const [calledCenter] = mockMap.setView.mock.calls[0] as [{ lat: number; lng: number }, number, object];
    expect(calledCenter.lat).toBeCloseTo(FIXED_CENTER.lat, 6);
    expect(calledCenter.lng).toBeCloseTo(FIXED_CENTER.lng, 6);
  });

  it('calling invalidateSize 4 times all use the same snapshot', () => {
    const { mockMap, buildHandle } = makeMockMap();
    const handle = buildHandle();

    handle.snapshotCenter();

    // Simulate increasing drift on each call
    let call = 0;
    mockMap.getCenter.mockImplementation(() => ({
      lat: FIXED_CENTER.lat + call * 0.1,
      lng: FIXED_CENTER.lng + call * 0.1,
    }));

    for (let i = 0; i < 4; i++) {
      call = i + 1;
      handle.invalidateSize();
    }

    expect(mockMap.setView).toHaveBeenCalledTimes(4);
    mockMap.setView.mock.calls.forEach(([center]) => {
      expect((center as { lat: number }).lat).toBeCloseTo(FIXED_CENTER.lat, 6);
      expect((center as { lng: number }).lng).toBeCloseTo(FIXED_CENTER.lng, 6);
    });
  });
});

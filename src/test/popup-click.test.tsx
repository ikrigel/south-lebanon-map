/**
 * popup-click.test.tsx
 *
 * Integration tests: simulate opening a town popup and tapping the nav
 * buttons — both with mouse (desktop) and touch (mobile).
 *
 * Root cause this tests:
 *   The sectColors useEffect previously built raw HTML bypassing townPopup(),
 *   so nav buttons were missing from re-rendered popups.  Even after that fix
 *   the delegated click handler in MapView only registered for "click" events —
 *   on mobile Leaflet fires a synthetic "click" from touchend, but only if the
 *   touch target is outside any interactive element; inside a <button> the
 *   native "click" from the tap fires normally via the OS, so we test both
 *   paths.
 *
 * Strategy:
 *  1. Render <MapView>. The Leaflet mock in setup.ts captures all HTML strings
 *     passed to circleMarker().bindPopup() into globalThis.__capturedPopups
 *     (keyed by the first data-nav-label value in the HTML).
 *  2. After mount, extract the captured HTML for specific LB towns.
 *  3. Inject the HTML into a real JSDOM container that is a child of the
 *     MapView container element (simulating Leaflet appending popup content
 *     to the map DOM — required for the delegated click handler to fire).
 *  4. Fire click / touchstart+touchend+click events on the nav buttons.
 *  5. Assert that onNavigateToPoint / onSetNavStart callbacks received the
 *     correct lat, lon, label arguments.
 *
 * NOTE: do NOT add a second vi.mock('leaflet') here — setup.ts owns that mock.
 */

import { render, act } from '@testing-library/react';
import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MapHandle, MapProps } from '../Map';
import { towns } from '../data/geo';

// Typed accessor for the global capture store
const getCaptured = (): Map<string, string> =>
  (globalThis as unknown as Record<string, Map<string, string>>).__capturedPopups;

// ---------------------------------------------------------------------------
// Minimal valid MapProps factory
// ---------------------------------------------------------------------------
function makeProps(overrides: Partial<MapProps> = {}): MapProps {
  return {
    visible: {
      blueLine: false, incidents: false, pop: true, unifil: false,
      hezInfluence: false, terrain: false, rivers: false,
      cityLabels: false, sectColors: false, navLabels: false,
      topo: false, pois: false,
    },
    filteredIncidents: [],
    selectedIncident: null,
    onSelectIncident: vi.fn(),
    measureMode: false,
    pointPickMode: false,
    manualMeasure: [],
    onMapClick: vi.fn(),
    distanceLine: null,
    theme: 'dark',
    largeLabels: false,
    allLabels: false,
    focusTarget: null,
    navigationRoute: null,
    routeOverlays: [],
    routeDisplayMode: 'road',
    liveLocation: null,
    liveCenterRequestId: 0,
    onLiveFollowDetachedChange: vi.fn(),
    onMapViewChange: vi.fn(),
    recordedTrack: [],
    compassMode: false,
    mapBearing: 0,
    userRotation: 0,
    onUserRotationChange: vi.fn(),
    poiDraft: null,
    poiDraftStyle: { markerColor: '#ff4444', markerShape: 'circle', markerSize: 'md' },
    customPois: [],
    multiRouteDraft: [],
    activeMultiRoute: null,
    onNavigateToPoint: vi.fn(),
    onSetNavStart: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helper: simulate a touch tap (touchstart → touchend → click)
// ---------------------------------------------------------------------------
function simulateTouchTap(el: Element): void {
  const touch = {
    identifier: 1, target: el, clientX: 10, clientY: 10,
    pageX: 10, pageY: 10, screenX: 10, screenY: 10,
    radiusX: 5, radiusY: 5, rotationAngle: 0, force: 1,
  };
  el.dispatchEvent(new TouchEvent('touchstart', {
    bubbles: true, cancelable: true,
    touches: [touch as unknown as Touch],
    changedTouches: [touch as unknown as Touch],
  }));
  el.dispatchEvent(new TouchEvent('touchend', {
    bubbles: true, cancelable: true,
    touches: [],
    changedTouches: [touch as unknown as Touch],
  }));
  // Browsers fire a click after touchend on interactive elements
  (el as HTMLElement).click();
}

// ---------------------------------------------------------------------------
// Helper: mount popup HTML exactly as Leaflet does in production:
//   map-container → .leaflet-pane.leaflet-popup-pane → .leaflet-popup → content
// This is the structure that handleClick's .leaflet-popup guard is designed for.
// ---------------------------------------------------------------------------
function mountLeafletPopup(mapDiv: HTMLElement, townHtml: string): {
  popup: HTMLElement;
  endBtn: HTMLButtonElement;
  startBtn: HTMLButtonElement;
} {
  const pane = document.createElement('div');
  pane.className = 'leaflet-pane leaflet-popup-pane';
  const popup = document.createElement('div');
  popup.className = 'leaflet-popup';
  const content = document.createElement('div');
  content.className = 'leaflet-popup-content';
  content.innerHTML = townHtml;
  popup.appendChild(content);
  pane.appendChild(popup);
  mapDiv.appendChild(pane);
  const endBtn   = content.querySelector<HTMLButtonElement>('[data-nav-role="end"]')!;
  const startBtn = content.querySelector<HTMLButtonElement>('[data-nav-role="start"]')!;
  return { popup, endBtn, startBtn };
}

// ---------------------------------------------------------------------------
// Import MapView
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-var-requires
import MapView from '../Map';

beforeEach(() => {
  getCaptured().clear();
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
  getCaptured().clear();
});

// ===========================================================================
// Suite 1 — townPopup HTML is captured for all LB towns during mount
// ===========================================================================
describe('MapView mount — popup HTML captured for LB towns', () => {
  it('captures popup HTML for בית ליף after mount', async () => {
    const ref = createRef<MapHandle>();
    await act(async () => {
      render(<MapView ref={ref} {...makeProps()} />);
    });
    const html = getCaptured().get('בית ליף');
    expect(html, 'popup for בית ליף not captured — circleMarker.bindPopup not called').toBeDefined();
    expect(html).toContain('town-popup-nav');
    expect(html).toContain('town-popup-info');
    // toggle via delegated handler, not inline onclick
    expect(html).toContain('data-info-toggle');
    expect(html).not.toContain('onclick=');
  });

  it("captures popup HTML for בינת ג'בייל after mount", async () => {
    const ref = createRef<MapHandle>();
    await act(async () => {
      render(<MapView ref={ref} {...makeProps()} />);
    });
    const html = getCaptured().get("בינת ג\u05f3בייל");
    expect(html).toBeDefined();
    expect(html).toContain('town-popup-nav');
    expect(html).toContain('data-nav-role="end"');
    expect(html).toContain('data-nav-role="start"');
  });

  it('captures popup HTML for יאטר after mount', async () => {
    const ref = createRef<MapHandle>();
    await act(async () => {
      render(<MapView ref={ref} {...makeProps()} />);
    });
    const t = towns.find(t => t.id === 'yater')!;
    const html = getCaptured().get(t.name_he);
    expect(html).toBeDefined();
    expect(html).toContain(`data-nav-lat="${t.lat}"`);
    expect(html).toContain(`data-nav-lon="${t.lon}"`);
  });

  it('all captured LB town popups contain town-popup-nav (not raw HTML)', async () => {
    const ref = createRef<MapHandle>();
    await act(async () => {
      render(<MapView ref={ref} {...makeProps()} />);
    });
    const captured = getCaptured();
    expect(captured.size, 'no popups captured at all').toBeGreaterThan(0);
    captured.forEach((html, label) => {
      // Only check entries that look like town popups (have town-popup wrapper)
      if (!html.includes('town-popup')) return;
      expect(html, `${label}: missing town-popup-nav`).toContain('town-popup-nav');
      expect(html, `${label}: must have data-info-toggle`).toContain('data-info-toggle');
      expect(html, `${label}: no inline onclick`).not.toContain('onclick=');
    });
  });
});

// ===========================================================================
// Suite 2 — click inside real Leaflet popup DOM structure
// Popup is mounted as: mapDiv > .leaflet-popup-pane > .leaflet-popup > content
// This matches exactly what Leaflet renders in production.
// Regression: handleClick (the map-wide click handler) must NOT intercept
// clicks on nav buttons — it must bail out when target is inside [data-nav-lat].
// ===========================================================================
describe('popup nav button — click inside .leaflet-popup DOM', () => {
  it('end-button click calls onNavigateToPoint, not onMapClick', async () => {
    const onNavigate = vi.fn();
    const onMapClick = vi.fn();
    const ref = createRef<MapHandle>();
    const { container } = render(
      <MapView ref={ref} {...makeProps({ onNavigateToPoint: onNavigate, onMapClick })} />
    );
    await act(async () => {});

    const t = towns.find(t => t.id === 'beitlif')!;
    const html = getCaptured().get(t.name_he);
    expect(html, 'popup HTML not captured for בית ליף').toBeTruthy();

    const mapDiv = container.querySelector('[data-testid="map-canvas"]') as HTMLElement;
    const { endBtn } = mountLeafletPopup(mapDiv, html!);
    expect(endBtn, 'end btn missing').not.toBeNull();

    endBtn.click();

    // nav callback must fire
    expect(onNavigate).toHaveBeenCalledTimes(1);
    const [lat, lon, label] = onNavigate.mock.calls[0] as [number, number, string];
    expect(lat).toBeCloseTo(t.lat, 4);
    expect(lon).toBeCloseTo(t.lon, 4);
    expect(label).toBe(t.name_he);
    // map click must NOT fire (handleClick must bail on [data-nav-lat])
    expect(onMapClick).not.toHaveBeenCalled();
  });

  it('start-button click calls onSetNavStart, not onMapClick', async () => {
    const onSetStart = vi.fn();
    const onMapClick = vi.fn();
    const ref = createRef<MapHandle>();
    const { container } = render(
      <MapView ref={ref} {...makeProps({ onSetNavStart: onSetStart, onMapClick })} />
    );
    await act(async () => {});

    const t = towns.find(t => t.id === 'bintj')!;
    const html = getCaptured().get(t.name_he);
    expect(html).toBeTruthy();

    const mapDiv = container.querySelector('[data-testid="map-canvas"]') as HTMLElement;
    const { startBtn } = mountLeafletPopup(mapDiv, html!);

    startBtn.click();

    expect(onSetStart).toHaveBeenCalledTimes(1);
    const [lat, lon, label] = onSetStart.mock.calls[0] as [number, number, string];
    expect(lat).toBeCloseTo(t.lat, 4);
    expect(lon).toBeCloseTo(t.lon, 4);
    expect(label).toBe(t.name_he);
    expect(onMapClick).not.toHaveBeenCalled();
  });

  it('end-button click works for יאטר too', async () => {
    const onNavigate = vi.fn();
    const ref = createRef<MapHandle>();
    const { container } = render(
      <MapView ref={ref} {...makeProps({ onNavigateToPoint: onNavigate })} />
    );
    await act(async () => {});

    const t = towns.find(t => t.id === 'yater')!;
    const html = getCaptured().get(t.name_he);
    expect(html).toBeTruthy();

    const mapDiv = container.querySelector('[data-testid="map-canvas"]') as HTMLElement;
    const { endBtn } = mountLeafletPopup(mapDiv, html!);
    endBtn.click();

    expect(onNavigate).toHaveBeenCalledTimes(1);
    const [lat, lon] = onNavigate.mock.calls[0] as [number, number];
    expect(lat).toBeCloseTo(t.lat, 4);
    expect(lon).toBeCloseTo(t.lon, 4);
  });

  it('end-button click works for דבל', async () => {
    const onNavigate = vi.fn();
    const ref = createRef<MapHandle>();
    const { container } = render(
      <MapView ref={ref} {...makeProps({ onNavigateToPoint: onNavigate })} />
    );
    await act(async () => {});

    const t = towns.find(t => t.id === 'debel')!;
    const html = getCaptured().get(t.name_he);
    expect(html).toBeTruthy();

    const mapDiv = container.querySelector('[data-testid="map-canvas"]') as HTMLElement;
    const { endBtn } = mountLeafletPopup(mapDiv, html!);
    endBtn.click();

    expect(onNavigate).toHaveBeenCalledTimes(1);
    const [lat, lon] = onNavigate.mock.calls[0] as [number, number];
    expect(lat).toBeCloseTo(t.lat, 4);
    expect(lon).toBeCloseTo(t.lon, 4);
  });
});

// ===========================================================================
// Suite 2b — info toggle (data-info-toggle) works via delegated handler
// Simulates the user tapping "פרטים ▼" to expand the info section.
// ===========================================================================
describe('popup info toggle — delegated handler', () => {
  it('clicking the toggle shows the info div and changes button text', async () => {
    const ref = createRef<MapHandle>();
    const { container } = render(
      <MapView ref={ref} {...makeProps()} />
    );
    await act(async () => {});

    const t = towns.find(t => t.id === 'beitlif')!;
    const html = getCaptured().get(t.name_he);
    expect(html).toBeTruthy();

    const mapDiv = container.querySelector('[data-testid="map-canvas"]') as HTMLElement;
    const { popup } = mountLeafletPopup(mapDiv, html!);

    const toggleBtn = popup.querySelector<HTMLButtonElement>('[data-info-toggle]')!;
    const infoDiv   = popup.querySelector<HTMLDivElement>('.town-popup-info')!;
    expect(toggleBtn, 'toggle button not found').not.toBeNull();
    expect(infoDiv,   'info div not found').not.toBeNull();

    // Initially collapsed
    expect(infoDiv.style.display).toBe('none');
    expect(toggleBtn.textContent).toContain('▼');

    // First click — expand
    toggleBtn.click();
    expect(infoDiv.style.display).toBe('block');
    expect(toggleBtn.textContent).toContain('▲');

    // Second click — collapse again
    toggleBtn.click();
    expect(infoDiv.style.display).toBe('none');
    expect(toggleBtn.textContent).toContain('▼');
  });

  it('toggle click does NOT fire onNavigateToPoint', async () => {
    const onNavigate = vi.fn();
    const ref = createRef<MapHandle>();
    const { container } = render(
      <MapView ref={ref} {...makeProps({ onNavigateToPoint: onNavigate })} />
    );
    await act(async () => {});

    const t = towns.find(t => t.id === 'yater')!;
    const html = getCaptured().get(t.name_he);
    const mapDiv = container.querySelector('[data-testid="map-canvas"]') as HTMLElement;
    const { popup } = mountLeafletPopup(mapDiv, html!);

    const toggleBtn = popup.querySelector<HTMLButtonElement>('[data-info-toggle]')!;
    toggleBtn.click();
    toggleBtn.click(); // expand then collapse

    expect(onNavigate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Suite 3 — mobile touch tap inside .leaflet-popup
// ===========================================================================
describe('popup nav button — mobile touch inside .leaflet-popup', () => {
  it('touch tap on end-button fires onNavigateToPoint, not onMapClick', async () => {
    const onNavigate = vi.fn();
    const onMapClick = vi.fn();
    const ref = createRef<MapHandle>();
    const { container } = render(
      <MapView ref={ref} {...makeProps({ onNavigateToPoint: onNavigate, onMapClick })} />
    );
    await act(async () => {});

    const t = towns.find(t => t.id === 'yater')!;
    const html = getCaptured().get(t.name_he);
    expect(html).toBeTruthy();

    const mapDiv = container.querySelector('[data-testid="map-canvas"]') as HTMLElement;
    const { endBtn } = mountLeafletPopup(mapDiv, html!);
    simulateTouchTap(endBtn);

    expect(onNavigate).toHaveBeenCalledTimes(1);
    const [lat, lon] = onNavigate.mock.calls[0] as [number, number];
    expect(lat).toBeCloseTo(t.lat, 4);
    expect(lon).toBeCloseTo(t.lon, 4);
    expect(onMapClick).not.toHaveBeenCalled();
  });

  it('touch tap on start-button fires onSetNavStart, not onMapClick', async () => {
    const onSetStart = vi.fn();
    const onMapClick = vi.fn();
    const ref = createRef<MapHandle>();
    const { container } = render(
      <MapView ref={ref} {...makeProps({ onSetNavStart: onSetStart, onMapClick })} />
    );
    await act(async () => {});

    const t = towns.find(t => t.id === 'debel')!;
    const html = getCaptured().get(t.name_he);
    expect(html).toBeTruthy();

    const mapDiv = container.querySelector('[data-testid="map-canvas"]') as HTMLElement;
    const { startBtn } = mountLeafletPopup(mapDiv, html!);
    simulateTouchTap(startBtn);

    expect(onSetStart).toHaveBeenCalledTimes(1);
    expect(onMapClick).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Suite 4 — sectColors toggle rebuilds popups with townPopup() structure
// ===========================================================================
describe('sectColors toggle — popup HTML stays accordion-style', () => {
  it('with sectColors=true, popups still have town-popup-nav', async () => {
    const ref = createRef<MapHandle>();
    await act(async () => {
      render(
        <MapView
          ref={ref}
          {...makeProps({
            visible: {
              blueLine: false, incidents: false, pop: true, unifil: false,
              hezInfluence: false, terrain: false, rivers: false,
              cityLabels: false, sectColors: true, navLabels: false,
              topo: false, pois: false,
            },
          })}
        />
      );
    });

    const captured = getCaptured();
    expect(captured.size, 'no popups captured with sectColors=true').toBeGreaterThan(0);
    captured.forEach((html, label) => {
      if (!html.includes('town-popup')) return;
      expect(html, `${label}: missing town-popup-nav with sectColors=true`).toContain('town-popup-nav');
      expect(html, `${label}: must have data-info-toggle`).toContain('data-info-toggle');
      expect(html, `${label}: no inline onclick allowed`).not.toContain('onclick=');
    });
  });

  it('sect badge in בית ליף popup with sectColors=true', async () => {
    const ref = createRef<MapHandle>();
    await act(async () => {
      render(
        <MapView
          ref={ref}
          {...makeProps({
            visible: {
              blueLine: false, incidents: false, pop: true, unifil: false,
              hezInfluence: false, terrain: false, rivers: false,
              cityLabels: false, sectColors: true, navLabels: false,
              topo: false, pois: false,
            },
          })}
        />
      );
    });

    const t = towns.find(t => t.id === 'beitlif')!;
    const html = getCaptured().get(t.name_he);
    expect(html).toBeDefined();
    // shia color in popup
    expect(html).toContain('#2a8a6e');
    // nav appears before info (nav-first layout)
    const navIdx  = html!.indexOf('town-popup-nav');
    const infoIdx = html!.indexOf('town-popup-info');
    expect(navIdx).toBeLessThan(infoIdx);
  });
});

// ===========================================================================
// Suite 5 — no old tab markup in any captured popup
// ===========================================================================
describe('no legacy tab markup in town popups', () => {
  it('no tpt-panel, tpt-label, or town-popup-tabs in any popup', async () => {
    const ref = createRef<MapHandle>();
    await act(async () => {
      render(<MapView ref={ref} {...makeProps()} />);
    });

    getCaptured().forEach((html, label) => {
      expect(html, `${label}: contains old tpt-panel`).not.toContain('tpt-panel');
      expect(html, `${label}: contains old tpt-label`).not.toContain('tpt-label');
      expect(html, `${label}: contains old town-popup-tabs`).not.toContain('town-popup-tabs');
    });
  });
});

import '@testing-library/jest-dom';

// ---- Global popup capture store (used by popup-click.test.tsx) ----
// circleMarker().bindPopup() stores its HTML here, keyed by data-nav-label.
// Tests can read globalThis.__capturedPopups to inspect popup HTML.
(globalThis as unknown as Record<string, unknown>).__capturedPopups = new Map<string, string>();

// ---- Leaflet stubs (Leaflet uses browser APIs not available in JSDOM) ----
// We stub the entire leaflet module so Map.tsx can be imported safely.
// This is the single source of truth — do NOT add a second vi.mock('leaflet')
// in individual test files.
vi.mock('leaflet', () => {
  const createLayer = () => ({
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
    remove: vi.fn(),
    setUrl: vi.fn(),
    setOpacity: vi.fn(),
    bringToFront: vi.fn(),
    hasLayer: vi.fn(() => false),
    // tileLayer needs mutable options object (Map.tsx mutates subdomains etc.)
    options: { subdomains: 'abc', maxNativeZoom: 19, maxZoom: 19 },
  });

  const map = {
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn(),
    getCenter: vi.fn(() => ({ lat: 33.2, lng: 35.5 })),
    getZoom: vi.fn(() => 10),
    panTo: vi.fn(),
    flyTo: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    hasLayer: vi.fn(() => false),
    getPane: vi.fn(() => ({ style: {} })),
    createPane: vi.fn(),
    whenReady: vi.fn((cb: () => void) => { cb(); }),
    closePopup: vi.fn(),
  };

  // circleMarker captures popup HTML into globalThis.__capturedPopups
  const makeCircleMarker = () => {
    const cm = {
      addTo: vi.fn().mockReturnThis(),
      bindTooltip: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockImplementation(function(html: unknown) {
        if (typeof html === 'string') {
          // Extract first data-nav-label value as key
          const m = html.match(/data-nav-label="([^"]+)"/);
          if (m) {
            const store = (globalThis as unknown as Record<string, unknown>).__capturedPopups as Map<string, string>;
            store.set(m[1], html);
          }
        }
        return cm;
      }),
    };
    return cm;
  };

  const makeGenericInteractive = () => ({
    addTo: vi.fn().mockReturnThis(),
    bindTooltip: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    setIcon: vi.fn().mockReturnThis(),
    getLatLng: vi.fn(() => ({ lat: 33.2, lng: 35.4 })),
  });

  const makePolyline = () => ({
    addTo: vi.fn().mockReturnThis(),
    bindTooltip: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    setStyle: vi.fn().mockReturnThis(),
    removeAttribute: vi.fn(),
    getElement: vi.fn(() => null),
  });

  const L = {
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => createLayer()),
    layerGroup: vi.fn(() => createLayer()),
    circleMarker: vi.fn(() => makeCircleMarker()),
    circle: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    polyline: vi.fn(() => makePolyline()),
    polygon: vi.fn(() => makeGenericInteractive()),
    marker: vi.fn(() => makeGenericInteractive()),
    divIcon: vi.fn(() => ({})),
    icon: vi.fn(() => ({})),
    DomEvent: { disableClickPropagation: vi.fn(), disableScrollPropagation: vi.fn() },
    control: { zoom: vi.fn(() => ({ addTo: vi.fn() })), scale: vi.fn(() => ({ addTo: vi.fn() })) },
    latLngBounds: vi.fn(() => ({ extend: vi.fn().mockReturnThis(), isValid: vi.fn(() => true) })),
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
    LatLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
  };

  return { default: L, ...L };
});

// ---- ResizeObserver stub ----
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ---- matchMedia stub ----
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

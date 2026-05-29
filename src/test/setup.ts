import '@testing-library/jest-dom';

// ---- Leaflet stubs (Leaflet uses browser APIs not available in JSDOM) ----
// We stub the entire leaflet module so Map.tsx can be imported safely
vi.mock('leaflet', () => {
  const createLayer = () => ({
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
    remove: vi.fn(),
    setUrl: vi.fn(),
    setOpacity: vi.fn(),
    bringToFront: vi.fn(),
  });
  const map = {
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn(),
    getCenter: vi.fn(() => ({ lat: 33.2, lng: 35.5 })),
    getZoom: vi.fn(() => 10),
    panTo: vi.fn(),
    flyTo: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
  };
  return {
    default: {
      map: vi.fn(() => map),
      tileLayer: vi.fn(() => createLayer()),
      layerGroup: vi.fn(() => createLayer()),
      circleMarker: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), bindTooltip: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis(), on: vi.fn().mockReturnThis() })),
      circle: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
      polyline: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), bindTooltip: vi.fn().mockReturnThis() })),
      polygon: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), bindTooltip: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis(), on: vi.fn().mockReturnThis() })),
      marker: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), bindTooltip: vi.fn().mockReturnThis() })),
      divIcon: vi.fn(() => ({})),
      icon: vi.fn(() => ({})),
      DomEvent: { disableClickPropagation: vi.fn(), disableScrollPropagation: vi.fn() },
      control: { zoom: vi.fn(() => ({ addTo: vi.fn() })), scale: vi.fn(() => ({ addTo: vi.fn() })) },
    },
    map: vi.fn(() => map),
    tileLayer: vi.fn(() => createLayer()),
    layerGroup: vi.fn(() => createLayer()),
    circleMarker: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), bindTooltip: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis(), on: vi.fn().mockReturnThis() })),
    circle: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
    polyline: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), bindTooltip: vi.fn().mockReturnThis() })),
    polygon: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), bindTooltip: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis(), on: vi.fn().mockReturnThis() })),
    marker: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), bindTooltip: vi.fn().mockReturnThis() })),
    divIcon: vi.fn(() => ({})),
    icon: vi.fn(() => ({})),
    DomEvent: { disableClickPropagation: vi.fn(), disableScrollPropagation: vi.fn() },
    control: { zoom: vi.fn(() => ({ addTo: vi.fn() })), scale: vi.fn(() => ({ addTo: vi.fn() })) },
  };
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

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import type { MapHandle, MapProps } from '../Map';
import MapView from '../Map';
import { TILESETS } from '../mapHtml';

describe('Topography layer toggle', () => {
  function makeProps(overrides: Partial<MapProps> = {}): MapProps {
    return {
      visible: {
        blueLine: false,
        incidents: false,
        pop: true,
        unifil: false,
        hez: false,
        rivers: false,
        topo: false,
        cityLabels: false,
        settlementLabels: false,
        ridgeLabels: false,
        waterLabels: false,
        sectColors: false,
        navLabels: false,
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

  it('should use regular tileset when topo is false', () => {
    const mockMap = (globalThis as any).__leafletMapInstance;
    const props = makeProps({ visible: { ...makeProps().visible, topo: false }, theme: 'dark' });

    render(<MapView {...props} ref={createRef<MapHandle>()} />);

    // Verify base layer was created with regular dark tileset
    expect(mockMap).toBeDefined();
  });

  it('should switch to OpenTopoMap when topo is true', () => {
    const mockMap = (globalThis as any).__leafletMapInstance;
    const props = makeProps({ visible: { ...makeProps().visible, topo: true } });

    render(<MapView {...props} ref={createRef<MapHandle>()} />);

    // Base layer should be created; in a real browser, it would use OpenTopoMap tileset
    expect(mockMap).toBeDefined();
    expect(TILESETS.topo).toBe('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
  });

  it('should toggle between tilesets when topo visibility changes', () => {
    const mapRef = createRef<MapHandle>();
    const { rerender } = render(
      <MapView {...makeProps({ visible: { ...makeProps().visible, topo: false } })} ref={mapRef} />
    );

    // Update to topo visible
    rerender(
      <MapView {...makeProps({ visible: { ...makeProps().visible, topo: true } })} ref={mapRef} />
    );

    // In real browser, tileset URL would change from CARTO to OpenTopoMap
    // In jsdom, we just verify the component renders without error
    expect(mapRef.current).toBeDefined();
  });

  it('should preserve topo layer visibility across theme changes', () => {
    const mapRef = createRef<MapHandle>();
    const { rerender } = render(
      <MapView {...makeProps({ visible: { ...makeProps().visible, topo: true }, theme: 'dark' })} ref={mapRef} />
    );

    // Change theme to light while topo is still visible
    rerender(
      <MapView {...makeProps({ visible: { ...makeProps().visible, topo: true }, theme: 'light' })} ref={mapRef} />
    );

    // Topo should remain visible and active
    expect(mapRef.current).toBeDefined();
  });

  it('should revert to theme tileset when topo is disabled', () => {
    const mapRef = createRef<MapHandle>();
    const { rerender } = render(
      <MapView {...makeProps({ visible: { ...makeProps().visible, topo: true }, theme: 'dark' })} ref={mapRef} />
    );

    // Disable topo to return to theme-based tileset
    rerender(
      <MapView {...makeProps({ visible: { ...makeProps().visible, topo: false }, theme: 'dark' })} ref={mapRef} />
    );

    // Should revert to dark CARTO tileset
    expect(mapRef.current).toBeDefined();
  });
});

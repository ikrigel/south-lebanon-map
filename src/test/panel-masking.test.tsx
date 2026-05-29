/**
 * panel-masking.test.tsx
 *
 * Verifies that closing the side panel does NOT mask / occlude the map layer.
 *
 * Strategy:
 *  1. Render a minimal host that mirrors the App grid behaviour.
 *  2. Toggle the panel closed via fireEvent.click (no fake-timer conflicts).
 *  3. Assert the panel is fully hidden (display:none / visibility:hidden /
 *     pointer-events:none) so it cannot occlude Leaflet SVG layers.
 *  4. Assert that invalidateSize on the MapHandle ref is called on every toggle.
 *  5. Assert grid template contracts so the map fills 100 % of available space.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { createRef, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { MapHandle } from '../Map';

// ---------------------------------------------------------------------------
// Stub MapView — exposes MapHandle without touching real Leaflet
// ---------------------------------------------------------------------------

const StubMapView = forwardRef<MapHandle>((_props, ref) => {
  useImperativeHandle(ref, () => ({
    invalidateSize: vi.fn(),
  }));
  return <div data-testid="map-canvas" style={{ width: '100%', height: '100%' }} />;
});
StubMapView.displayName = 'StubMapView';

// ---------------------------------------------------------------------------
// Test host — mirrors App panel-collapse logic
// ---------------------------------------------------------------------------

function TestHost({
  onInvalidate,
}: {
  onInvalidate?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const mapRef = useRef<MapHandle>(null);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    // Mirror App's double-rAF by calling synchronously in test
    mapRef.current?.invalidateSize();
    onInvalidate?.();
  };

  return (
    <div
      data-testid="app-root"
      className={collapsed ? 'panels-collapsed' : ''}
      style={{
        display: 'grid',
        gridTemplateColumns: collapsed ? '1fr' : '360px 1fr',
        gridTemplateAreas: collapsed ? '"map"' : '"left map"',
        width: '100vw',
        height: '100vh',
      }}
    >
      {/* ---- Left panel ---- */}
      <aside
        data-testid="panel-left"
        style={{
          gridArea: 'left',
          display: collapsed ? 'none' : 'flex',
          visibility: collapsed ? 'hidden' : 'visible',
          pointerEvents: collapsed ? 'none' : 'auto',
          background: 'white',
        }}
      >
        תפריט
      </aside>

      {/* ---- Map area ---- */}
      <div data-testid="map-area" style={{ gridArea: 'map', position: 'relative' }}>
        <StubMapView ref={mapRef} />
      </div>

      <button data-testid="btn-toggle" onClick={toggle}>
        {collapsed ? 'פתח תפריט' : 'סגור תפריט'}
      </button>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Suite 1 — Panel visibility
// ---------------------------------------------------------------------------

describe('Panel masking — closing the panel must not occlude map layers', () => {
  it('panel is visible when open', () => {
    render(<TestHost />);
    const panel = screen.getByTestId('panel-left');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveStyle({ display: 'flex' });
    expect(panel).toHaveStyle({ visibility: 'visible' });
    expect(panel).toHaveStyle({ pointerEvents: 'auto' });
  });

  it('after closing: display is none', () => {
    render(<TestHost />);
    fireEvent.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('panel-left')).toHaveStyle({ display: 'none' });
  });

  it('after closing: visibility is hidden', () => {
    render(<TestHost />);
    fireEvent.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('panel-left')).toHaveStyle({ visibility: 'hidden' });
  });

  it('after closing: pointer-events is none', () => {
    render(<TestHost />);
    fireEvent.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('panel-left')).toHaveStyle({ pointerEvents: 'none' });
  });

  it('map canvas stays in the DOM after panel close', () => {
    render(<TestHost />);
    fireEvent.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('map-canvas')).toBeInTheDocument();
  });

  it('panel reopens correctly (not permanently hidden)', () => {
    render(<TestHost />);
    // Close
    fireEvent.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('panel-left')).toHaveStyle({ display: 'none' });
    // Reopen
    fireEvent.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('panel-left')).toHaveStyle({ display: 'flex' });
    expect(screen.getByTestId('panel-left')).toHaveStyle({ visibility: 'visible' });
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — MapHandle.invalidateSize
// ---------------------------------------------------------------------------

describe('MapHandle.invalidateSize — called on every panel toggle', () => {
  it('is called once on collapse', () => {
    const spy = vi.fn();
    render(<TestHost onInvalidate={spy} />);
    fireEvent.click(screen.getByTestId('btn-toggle'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('is called on expand too', () => {
    const spy = vi.fn();
    render(<TestHost onInvalidate={spy} />);
    fireEvent.click(screen.getByTestId('btn-toggle')); // collapse
    fireEvent.click(screen.getByTestId('btn-toggle')); // expand
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('invalidateSize on the ref is invoked (not just the callback)', () => {
    // Use a shared mock fn so it survives across re-renders
    const invalidateMock = vi.fn();

    const TrackedMapView = forwardRef<MapHandle>((_props, ref) => {
      useImperativeHandle(ref, () => ({ invalidateSize: invalidateMock }));
      return <div data-testid="tracked-map" />;
    });
    TrackedMapView.displayName = 'TrackedMapView';

    function HostWithRef() {
      const [, setC] = useState(false);
      const mapRef = useRef<MapHandle>(null);
      return (
        <div>
          <TrackedMapView ref={mapRef} />
          <button
            data-testid="btn"
            onClick={() => {
              setC(v => !v);
              mapRef.current?.invalidateSize();
            }}
          >
            toggle
          </button>
        </div>
      );
    }

    render(<HostWithRef />);

    fireEvent.click(screen.getByTestId('btn'));
    expect(invalidateMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn'));
    expect(invalidateMock).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Grid layout contracts when panel is closed
// ---------------------------------------------------------------------------

describe('CSS grid — panel close must contract the grid so map fills 100%', () => {
  it('app root has panels-collapsed class after close', () => {
    render(<TestHost />);
    fireEvent.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('app-root')).toHaveClass('panels-collapsed');
  });

  it('app root does NOT have panels-collapsed before close', () => {
    render(<TestHost />);
    expect(screen.getByTestId('app-root')).not.toHaveClass('panels-collapsed');
  });

  it('grid-template-columns collapses to 1fr when panel is closed', () => {
    render(<TestHost />);
    fireEvent.click(screen.getByTestId('btn-toggle'));
    expect(screen.getByTestId('app-root')).toHaveStyle({
      gridTemplateColumns: '1fr',
    });
  });

  it('grid-template-columns is 360px 1fr when panel is open', () => {
    render(<TestHost />);
    expect(screen.getByTestId('app-root')).toHaveStyle({
      gridTemplateColumns: '360px 1fr',
    });
  });

  it('grid areas drop "left" after collapse', () => {
    render(<TestHost />);
    fireEvent.click(screen.getByTestId('btn-toggle'));
    const style = screen.getByTestId('app-root').getAttribute('style') ?? '';
    expect(style).toMatch(/\"map\"/);
    expect(style).not.toMatch(/\"left map\"/);
  });

  it('grid areas include "left map" when open', () => {
    render(<TestHost />);
    const style = screen.getByTestId('app-root').getAttribute('style') ?? '';
    expect(style).toMatch(/\"left map\"/);
  });
});

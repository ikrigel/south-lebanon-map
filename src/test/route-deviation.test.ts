import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRouteDeviation } from '../hooks/useRouteDeviation';

describe('useRouteDeviation', () => {
  let onDeviation: ReturnType<typeof vi.fn>;
  let onRouteTypeChange: ReturnType<typeof vi.fn>;
  let showToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onDeviation = vi.fn();
    onRouteTypeChange = vi.fn();
    showToast = vi.fn();
    vi.useFakeTimers();
  });

  it('should not call onDeviation when navStartId is not live-location', () => {
    const routePath: [number, number][] = [[33.0, 35.0], [33.1, 35.1]];
    renderHook(() =>
      useRouteDeviation({
        navPosition: { lat: 33.05, lon: 35.05 },
        liveLocation: { lat: 33.05, lon: 35.05, speed: 10 },
        activeRoutePath: routePath,
        activeRouteId: 'drive',
        navStartId: 'town:beirut',
        navEndId: 'town:sidon',
        onDeviation,
        onRouteTypeChange,
        showToast,
      })
    );
    expect(onDeviation).not.toHaveBeenCalled();
  });

  it('should not call onDeviation when navPosition is null', () => {
    renderHook(() =>
      useRouteDeviation({
        navPosition: null,
        liveLocation: { lat: 33.0, lon: 35.0, speed: 10 },
        activeRoutePath: [[33.0, 35.0], [33.1, 35.1]],
        activeRouteId: 'drive',
        navStartId: 'live-location',
        navEndId: 'town:sidon',
        onDeviation,
        onRouteTypeChange,
        showToast,
      })
    );
    expect(onDeviation).not.toHaveBeenCalled();
  });

  it('should not call onDeviation when activeRouteId is aerial', () => {
    const routePath: [number, number][] = [[33.0, 35.0], [33.1, 35.1]];
    renderHook(() =>
      useRouteDeviation({
        navPosition: { lat: 33.15, lon: 35.15 },
        liveLocation: { lat: 33.15, lon: 35.15, speed: 10 },
        activeRoutePath: routePath,
        activeRouteId: 'aerial',
        navStartId: 'live-location',
        navEndId: 'town:sidon',
        onDeviation,
        onRouteTypeChange,
        showToast,
      })
    );
    expect(onDeviation).not.toHaveBeenCalled();
  });

  it('should reset off-route count when position is back on route', () => {
    const routePath: [number, number][] = [[33.0, 35.0], [33.1, 35.1]];

    const { rerender } = renderHook(
      ({ navPosition }) =>
        useRouteDeviation({
          navPosition,
          liveLocation: { lat: 33.05, lon: 35.05, speed: 10 },
          activeRoutePath: routePath,
          activeRouteId: 'drive',
          navStartId: 'live-location',
          navEndId: 'town:sidon',
          onDeviation,
          onRouteTypeChange,
          showToast,
        }),
      { initialProps: { navPosition: { lat: 33.15, lon: 35.15 } } }
    );

    // First off-route reading
    expect(onDeviation).not.toHaveBeenCalled();

    // Second off-route reading - triggers recalc (2 consecutive readings)
    rerender({ navPosition: { lat: 33.16, lon: 35.16 } });
    expect(onDeviation).toHaveBeenCalledTimes(1);

    // Reset the mock
    onDeviation.mockClear();
    vi.advanceTimersByTime(31000); // Wait past cooldown

    // Back on-route - counter resets
    rerender({ navPosition: { lat: 33.05, lon: 35.05 } });
    expect(onDeviation).not.toHaveBeenCalled();

    // Second on-route reading still doesn't trigger
    rerender({ navPosition: { lat: 33.051, lon: 35.051 } });
    expect(onDeviation).not.toHaveBeenCalled();

    // Now go off-route again
    rerender({ navPosition: { lat: 33.15, lon: 35.15 } });
    expect(onDeviation).not.toHaveBeenCalled();

    // Second off-route triggers again (counter was reset)
    rerender({ navPosition: { lat: 33.16, lon: 35.16 } });
    expect(onDeviation).toHaveBeenCalledTimes(1);
  });

  it('should call onRouteTypeChange when speed exceeds 8 km/h on foot route', () => {
    const routePath: [number, number][] = [[33.0, 35.0], [33.1, 35.1]];

    renderHook(() =>
      useRouteDeviation({
        navPosition: { lat: 33.05, lon: 35.05 },
        liveLocation: { lat: 33.05, lon: 35.05, speed: 10 },
        activeRoutePath: routePath,
        activeRouteId: 'foot',
        navStartId: 'live-location',
        navEndId: 'town:sidon',
        onDeviation,
        onRouteTypeChange,
        showToast,
      })
    );

    expect(onRouteTypeChange).toHaveBeenCalledWith('drive');
  });

  it('should call onRouteTypeChange to foot when all 3 readings are below 3 km/h on drive route', () => {
    const routePath: [number, number][] = [[33.0, 35.0], [33.1, 35.1]];

    const { rerender } = renderHook(
      ({ speed }) =>
        useRouteDeviation({
          navPosition: { lat: 33.05, lon: 35.05 },
          liveLocation: { lat: 33.05, lon: 35.05, speed },
          activeRoutePath: routePath,
          activeRouteId: 'drive',
          navStartId: 'live-location',
          navEndId: 'town:sidon',
          onDeviation,
          onRouteTypeChange,
          showToast,
        }),
      { initialProps: { speed: 2 } }
    );

    // First reading: 2 km/h
    expect(onRouteTypeChange).not.toHaveBeenCalled();

    // Second reading: 1 km/h
    rerender({ speed: 1 });
    expect(onRouteTypeChange).not.toHaveBeenCalled();

    // Third reading: 0.5 km/h - triggers switch to foot
    rerender({ speed: 0.5 });
    expect(onRouteTypeChange).toHaveBeenCalledWith('foot');
  });

  it('should respect 30s cooldown between recalculations', () => {
    const routePath: [number, number][] = [[33.0, 35.0], [33.1, 35.1]];

    const { rerender } = renderHook(
      ({ navPosition }) =>
        useRouteDeviation({
          navPosition,
          liveLocation: { lat: 33.05, lon: 35.05, speed: 10 },
          activeRoutePath: routePath,
          activeRouteId: 'drive',
          navStartId: 'live-location',
          navEndId: 'town:sidon',
          onDeviation,
          onRouteTypeChange,
          showToast,
        }),
      { initialProps: { navPosition: { lat: 33.15, lon: 35.15 } } }
    );

    // First off-route reading
    expect(onDeviation).not.toHaveBeenCalled();

    // Second off-route reading - triggers recalc
    rerender({ navPosition: { lat: 33.16, lon: 35.16 } });
    expect(onDeviation).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith('מחשב מסלול מחדש...');

    // Clear previous calls
    onDeviation.mockClear();
    showToast.mockClear();

    // Third off-route reading within 30s - should NOT trigger (cooldown)
    rerender({ navPosition: { lat: 33.17, lon: 35.17 } });
    vi.advanceTimersByTime(5000); // 5 seconds later
    rerender({ navPosition: { lat: 33.18, lon: 35.18 } });
    expect(onDeviation).not.toHaveBeenCalled();

    // After 30s cooldown expires - should trigger again
    vi.advanceTimersByTime(25000); // total 30s
    rerender({ navPosition: { lat: 33.19, lon: 35.19 } });
    expect(onDeviation).toHaveBeenCalledTimes(1);
  });

  it('should not call onRouteTypeChange if speed is already in the correct range', () => {
    const routePath: [number, number][] = [[33.0, 35.0], [33.1, 35.1]];

    renderHook(() =>
      useRouteDeviation({
        navPosition: { lat: 33.05, lon: 35.05 },
        liveLocation: { lat: 33.05, lon: 35.05, speed: 10 },
        activeRoutePath: routePath,
        activeRouteId: 'drive',
        navStartId: 'live-location',
        navEndId: 'town:sidon',
        onDeviation,
        onRouteTypeChange,
        showToast,
      })
    );

    // Drive route at high speed - no change
    expect(onRouteTypeChange).not.toHaveBeenCalled();
  });
});

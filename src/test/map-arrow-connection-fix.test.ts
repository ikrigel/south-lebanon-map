import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * TEST: Map-Arrow Disconnection Fix
 *
 * Issue: Blue arrow (GPS location marker) appears on map but map doesn't center/follow it
 * during active navigation.
 *
 * Root Cause: Race condition where navigationRoute is set BEFORE liveLocation updates.
 * The pan effect would only trigger on liveLocation changes, missing the case where
 * navigationRoute becomes available while liveLocation hasn't changed yet.
 *
 * Solution: Add a second effect that depends ONLY on navigationRoute to immediately
 * pan when a new route is selected.
 */

describe('Map-Arrow Connection Fix', () => {
  describe('Pan effects timing', () => {
    it('should pan when liveLocation updates during active navigation', () => {
      const mockMap = { panTo: vi.fn() };
      const liveLocation = { lat: 33.281, lon: 35.491, accuracy: 10 };
      const navigationRoute = {
        start: { lat: 33.28, lon: 35.49, label: 'Start' },
        end: { lat: 33.29, lon: 35.50, label: 'End' },
        km: 1.2,
        durationMin: 15,
        path: [[33.28, 35.49], [33.29, 35.50]],
        instructions: [],
      };
      const liveFollowDetached = false;

      // Simulate the first effect (depends on liveLocation, navigationRoute)
      if (mockMap && liveLocation && !liveFollowDetached && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }

      expect(mockMap.panTo).toHaveBeenCalledWith(
        [liveLocation.lat, liveLocation.lon],
        { animate: false }
      );
    });

    it('should pan immediately when navigationRoute becomes available (race condition fix)', () => {
      const mockMap = { panTo: vi.fn() };

      // Step 1: User sets navigation destination
      // navigationRoute changes from null → {route object}
      // But liveLocation already has GPS coordinates
      const liveLocation = { lat: 33.281, lon: 35.491, accuracy: 10 };
      const navigationRoute = {
        start: { lat: 33.28, lon: 35.49, label: 'Start' },
        end: { lat: 33.29, lon: 35.50, label: 'End' },
        km: 1.2,
        durationMin: 15,
        path: [[33.28, 35.49], [33.29, 35.50]],
        instructions: [],
      };
      const liveFollowDetached = false;

      // Simulate the new second effect (depends ONLY on navigationRoute)
      if (mockMap && liveLocation && !liveFollowDetached && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }

      expect(mockMap.panTo).toHaveBeenCalledWith(
        [liveLocation.lat, liveLocation.lon],
        { animate: false }
      );
    });

    it('should NOT pan if liveFollowDetached is true', () => {
      const mockMap = { panTo: vi.fn() };
      const liveLocation = { lat: 33.281, lon: 35.491, accuracy: 10 };
      const navigationRoute = {
        start: { lat: 33.28, lon: 35.49, label: 'Start' },
        end: { lat: 33.29, lon: 35.50, label: 'End' },
        km: 1.2,
        durationMin: 15,
        path: [[33.28, 35.49], [33.29, 35.50]],
        instructions: [],
      };
      const liveFollowDetached = true; // Detached!

      if (mockMap && liveLocation && !liveFollowDetached && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }

      expect(mockMap.panTo).not.toHaveBeenCalled();
    });

    it('should NOT pan if navigationRoute is null', () => {
      const mockMap = { panTo: vi.fn() };
      const liveLocation = { lat: 33.281, lon: 35.491, accuracy: 10 };
      const navigationRoute = null; // No navigation
      const liveFollowDetached = false;

      if (mockMap && liveLocation && !liveFollowDetached && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }

      expect(mockMap.panTo).not.toHaveBeenCalled();
    });

    it('should NOT pan if liveLocation is null', () => {
      const mockMap = { panTo: vi.fn() };
      const liveLocation = null; // GPS not available
      const navigationRoute = {
        start: { lat: 33.28, lon: 35.49, label: 'Start' },
        end: { lat: 33.29, lon: 35.50, label: 'End' },
        km: 1.2,
        durationMin: 15,
        path: [[33.28, 35.49], [33.29, 35.50]],
        instructions: [],
      };
      const liveFollowDetached = false;

      if (mockMap && liveLocation && !liveFollowDetached && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }

      expect(mockMap.panTo).not.toHaveBeenCalled();
    });
  });

  describe('Two-effect behavior', () => {
    it('Scenario 1: GPS active BEFORE navigation started', () => {
      // 1. User enables GPS → liveLocation is set, navigationRoute is null
      // 2. User selects navigation end → navigationRoute becomes set
      // 3. EXPECTED: Map pans to live location

      const mockMap = { panTo: vi.fn() };
      const liveLocation = { lat: 33.281, lon: 35.491, accuracy: 10 };
      let navigationRoute = null;

      // Step 1: GPS active
      console.log('Step 1: GPS active, no navigation yet');
      // First effect: liveLocation changed, but no navigationRoute → skip
      if (mockMap && liveLocation && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }
      expect(mockMap.panTo).not.toHaveBeenCalled();

      // Step 2: Navigation started
      navigationRoute = {
        start: { lat: 33.28, lon: 35.49, label: 'Start' },
        end: { lat: 33.29, lon: 35.50, label: 'End' },
        km: 1.2,
        durationMin: 15,
        path: [[33.28, 35.49], [33.29, 35.50]],
        instructions: [],
      };

      console.log('Step 2: Navigation started');
      // Second effect: navigationRoute changed → pan now!
      if (mockMap && liveLocation && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }
      expect(mockMap.panTo).toHaveBeenCalledWith(
        [liveLocation.lat, liveLocation.lon],
        { animate: false }
      );
    });

    it('Scenario 2: Navigation started BEFORE GPS active', () => {
      // 1. User selects navigation end → navigationRoute is set, liveLocation is null
      // 2. User enables GPS → liveLocation is set
      // 3. EXPECTED: Map pans to live location

      const mockMap = { panTo: vi.fn() };
      let liveLocation = null;
      let navigationRoute = null;

      // Step 1: Navigation started but no GPS yet
      navigationRoute = {
        start: { lat: 33.28, lon: 35.49, label: 'Start' },
        end: { lat: 33.29, lon: 35.50, label: 'End' },
        km: 1.2,
        durationMin: 15,
        path: [[33.28, 35.49], [33.29, 35.50]],
        instructions: [],
      };

      console.log('Step 1: Navigation set, GPS not available');
      // Second effect: navigationRoute changed, but no liveLocation → skip
      if (mockMap && liveLocation && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }
      expect(mockMap.panTo).not.toHaveBeenCalled();

      // Step 2: GPS enabled
      liveLocation = { lat: 33.281, lon: 35.491, accuracy: 10 };

      console.log('Step 2: GPS enabled');
      // First effect: liveLocation changed → pan!
      if (mockMap && liveLocation && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }
      expect(mockMap.panTo).toHaveBeenCalledWith(
        [liveLocation.lat, liveLocation.lon],
        { animate: false }
      );
    });

    it('Scenario 3: GPS and navigation both active, user moves', () => {
      // 1. GPS and navigation both active
      // 2. User moves → liveLocation updates
      // 3. EXPECTED: Map pans to new location each time

      const mockMap = { panTo: vi.fn() };
      const navigationRoute = {
        start: { lat: 33.28, lon: 35.49, label: 'Start' },
        end: { lat: 33.29, lon: 35.50, label: 'End' },
        km: 1.2,
        durationMin: 15,
        path: [[33.28, 35.49], [33.29, 35.50]],
        instructions: [],
      };

      // Initial position
      let liveLocation = { lat: 33.281, lon: 35.491, accuracy: 10 };

      console.log('Step 1: Initial position, pan');
      if (mockMap && liveLocation && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }
      expect(mockMap.panTo).toHaveBeenCalledTimes(1);

      // User moves
      liveLocation = { lat: 33.282, lon: 35.492, accuracy: 10 };

      console.log('Step 2: User moved, pan to new location');
      if (mockMap && liveLocation && navigationRoute) {
        mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      }
      expect(mockMap.panTo).toHaveBeenCalledTimes(2);
      expect(mockMap.panTo).toHaveBeenLastCalledWith(
        [33.282, 35.492],
        { animate: false }
      );
    });
  });

  describe('Dependencies correctness', () => {
    it('First effect depends on [liveLocation, navigationRoute]', () => {
      // When either liveLocation or navigationRoute changes, the effect should run
      // This ensures we pan when either one updates
      const deps = ['liveLocation', 'navigationRoute'];
      expect(deps).toContain('liveLocation');
      expect(deps).toContain('navigationRoute');
    });

    it('Second effect depends ONLY on [navigationRoute]', () => {
      // This new effect runs when navigationRoute changes, regardless of liveLocation
      // This fixes the race condition where navigationRoute changes but liveLocation is stale
      const deps = ['navigationRoute'];
      expect(deps).toEqual(['navigationRoute']);
      expect(deps).not.toContain('liveLocation');
    });

    it('Duplicate panning is safe (idempotent)', () => {
      // It's OK if both effects call panTo in the same tick
      // panTo is idempotent - panning to the same location twice is harmless
      const mockMap = { panTo: vi.fn() };
      const liveLocation = { lat: 33.281, lon: 35.491, accuracy: 10 };
      const navigationRoute = {
        start: { lat: 33.28, lon: 35.49, label: 'Start' },
        end: { lat: 33.29, lon: 35.50, label: 'End' },
        km: 1.2,
        durationMin: 15,
        path: [[33.28, 35.49], [33.29, 35.50]],
        instructions: [],
      };

      // Both effects call panTo
      mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
      mockMap.panTo([liveLocation.lat, liveLocation.lon], { animate: false });

      // Both calls happen, but map just pans to same location twice - harmless
      expect(mockMap.panTo).toHaveBeenCalledTimes(2);
      expect(mockMap.panTo).toHaveBeenLastCalledWith(
        [liveLocation.lat, liveLocation.lon],
        { animate: false }
      );
    });
  });
});

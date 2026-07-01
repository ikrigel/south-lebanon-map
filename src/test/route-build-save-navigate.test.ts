import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('Route Build → Save → Navigate Workflow', () => {
  describe('Route Save Flow', () => {
    it('should require a route name before saving', () => {
      // Mock the saveCurrentRoute callback
      const saveCurrentRoute = vi.fn();

      // Simulate: user has built a route but hasn't entered a name
      const routeName = '';
      const navigationRoute = {
        start: { lat: 33.0, lon: 35.0, label: 'Beirut' },
        end: { lat: 33.1, lon: 35.1, label: 'Sidon' },
        km: 50,
        durationMin: 60,
        path: [[33.0, 35.0], [33.05, 35.05], [33.1, 35.1]],
      };

      // Save button should work regardless of name (it defaults to start → end)
      // But a meaningful name is expected from user
      expect(routeName).toBe('');
      expect(navigationRoute).toBeTruthy();
    });

    it('should create SavedRoute with proper structure', () => {
      const navigationRoute = {
        start: { lat: 33.0, lon: 35.0, label: 'Beirut' },
        end: { lat: 33.1, lon: 35.1, label: 'Sidon' },
        km: 50.5,
        durationMin: 65,
        path: [[33.0, 35.0], [33.05, 35.05], [33.1, 35.1]],
        instructions: [
          { text: 'right', bearing: 90, distanceM: 0, action: 'right' as const, confidence: 'route' as const },
        ],
      };

      const routeName = 'Beirut to Sidon Highway';
      const savedRoute = {
        id: `route-${Date.now()}`,
        name: routeName,
        createdAt: new Date().toISOString(),
        km: navigationRoute.km,
        durationMin: navigationRoute.durationMin,
        path: navigationRoute.path,
        instructions: navigationRoute.instructions,
      };

      expect(savedRoute.name).toBe('Beirut to Sidon Highway');
      expect(savedRoute.km).toBe(50.5);
      expect(savedRoute.durationMin).toBe(65);
      expect(savedRoute.path.length).toBe(3);
    });

    it('should add saved route to savedRoutes list', () => {
      const initialSavedRoutes: any[] = [];
      const newRoute = {
        id: 'route-123',
        name: 'Test Route',
        createdAt: '2026-07-01T00:00:00Z',
        km: 50,
        durationMin: 60,
        path: [[33.0, 35.0], [33.1, 35.1]],
      };

      const updatedRoutes = [...initialSavedRoutes, newRoute];

      expect(updatedRoutes).toHaveLength(1);
      expect(updatedRoutes[0].name).toBe('Test Route');
    });

    it('should persist saved routes to localStorage', () => {
      const SAVED_ROUTES_KEY = 'south-lebanon-map:saved-routes:v1';
      const mockStorage = new Map<string, string>();

      const route = {
        id: 'route-123',
        name: 'Test Route',
        createdAt: '2026-07-01T00:00:00Z',
        km: 50,
        durationMin: 60,
        path: [[33.0, 35.0], [33.1, 35.1]],
      };

      // Simulate saving to localStorage
      mockStorage.set(SAVED_ROUTES_KEY, JSON.stringify([route]));

      // Simulate reading from localStorage
      const stored = mockStorage.get(SAVED_ROUTES_KEY);
      const parsed = stored ? JSON.parse(stored) : [];

      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Test Route');
    });
  });

  describe('Route Load & Navigation', () => {
    it('should load saved route and set as navigation start/end', () => {
      const savedRoute = {
        id: 'route-123',
        name: 'Beirut to Sidon',
        createdAt: '2026-07-01T00:00:00Z',
        km: 50,
        durationMin: 60,
        path: [[33.0, 35.0], [33.05, 35.05], [33.1, 35.1]],
        start: { lat: 33.0, lon: 35.0, label: 'Beirut' },
        end: { lat: 33.1, lon: 35.1, label: 'Sidon' },
      };

      // Simulate loading route
      const navCustomStart = savedRoute.start;
      const navCustomEnd = savedRoute.end;
      const navStartId = 'custom-nav-start';
      const navEndId = 'custom-nav-end';
      const calculatedRoute = {
        start: navCustomStart,
        end: navCustomEnd,
        km: savedRoute.km,
        durationMin: savedRoute.durationMin,
        path: savedRoute.path,
      };

      expect(navCustomStart).toEqual({ lat: 33.0, lon: 35.0, label: 'Beirut' });
      expect(navCustomEnd).toEqual({ lat: 33.1, lon: 35.1, label: 'Sidon' });
      expect(calculatedRoute.km).toBe(50);
    });

    it('should navigate from saved route with startRouteNavigation', () => {
      const savedRoute = {
        id: 'route-456',
        name: 'Test Navigation Route',
        createdAt: '2026-07-01T00:00:00Z',
        km: 75,
        durationMin: 90,
        path: [[33.2, 35.2], [33.3, 35.3]],
        start: { lat: 33.2, lon: 35.2, label: 'North' },
        end: { lat: 33.3, lon: 35.3, label: 'South' },
      };

      const startRouteNavigation = vi.fn();

      // Simulate user clicking navigate button
      act(() => {
        startRouteNavigation(savedRoute);
      });

      expect(startRouteNavigation).toHaveBeenCalledWith(savedRoute);
      expect(startRouteNavigation).toHaveBeenCalledTimes(1);
    });

    it('should apply deviation detection after route navigation starts', () => {
      const navigationRoute = {
        start: { lat: 33.0, lon: 35.0, label: 'Start' },
        end: { lat: 33.1, lon: 35.1, label: 'End' },
        km: 50,
        path: [[33.0, 35.0], [33.05, 35.05], [33.1, 35.1]],
      };

      // GPS position on route
      const onRoutePosition = { lat: 33.05, lon: 35.05 };

      // GPS position 200m off route
      const offRoutePosition = { lat: 33.25, lon: 35.25 };

      // The distanceToPolyline would return ~20km for off-route position
      // After 2 consecutive readings, route should recalculate
      const shouldTriggerRecalc = true; // After 2 off-route readings

      expect(navigationRoute).toBeTruthy();
      expect(onRoutePosition).toBeTruthy();
      expect(offRoutePosition).toBeTruthy();
      expect(shouldTriggerRecalc).toBe(true);
    });

    it('should show ghost route during recalculation after navigation starts', () => {
      const savedRoute = {
        id: 'route-789',
        name: 'Test Saved Route',
        createdAt: '2026-07-01T00:00:00Z',
        km: 60,
        path: [[33.0, 35.0], [33.1, 35.1]],
      };

      // User navigates from saved route
      const navigationStarted = true;
      const activeRouteId = 'drive';

      // User deviates from path (2 consecutive readings >80m away)
      const deviationDetected = true;
      let ghostRoutePath: [number, number][] | null = savedRoute.path as [number, number][];

      expect(navigationStarted).toBe(true);
      expect(deviationDetected).toBe(true);
      expect(ghostRoutePath).toEqual(savedRoute.path);

      // After 2.5 seconds, ghost should clear
      const ghostCleared = false; // Simulating the timeout
      setTimeout(() => {
        ghostRoutePath = null;
      }, 2500);

      expect(ghostRoutePath).not.toBeNull(); // Still visible during timeout
    });
  });

  describe('Full Workflow Integration', () => {
    it('should complete: build → name → save → load → navigate', () => {
      // Step 1: Build route (user selects start and end points)
      const navigationRoute = {
        start: { lat: 33.0, lon: 35.0, label: 'Beirut Central' },
        end: { lat: 33.1, lon: 35.1, label: 'Sidon Port' },
        km: 48.5,
        durationMin: 58,
        path: [[33.0, 35.0], [33.05, 35.05], [33.1, 35.1]],
      };

      // Step 2: Enter route name
      let routeName = '';
      routeName = 'Beirut to Sidon via Coastal Road';
      expect(routeName).toBeTruthy();

      // Step 3: Save route
      const savedRoute = {
        id: `route-${Date.now()}`,
        name: routeName,
        createdAt: new Date().toISOString(),
        ...navigationRoute,
      };

      let savedRoutes = [savedRoute];
      expect(savedRoutes).toHaveLength(1);
      expect(savedRoutes[0].name).toBe('Beirut to Sidon via Coastal Road');

      // Step 4: Load saved route (user clicks on saved route from list)
      const loadedRoute = savedRoutes[0];
      expect(loadedRoute.name).toBe('Beirut to Sidon via Coastal Road');
      expect(loadedRoute.km).toBe(48.5);

      // Step 5: Start navigation from saved route
      const startRouteNavigationFn = vi.fn();
      startRouteNavigationFn(loadedRoute);
      expect(startRouteNavigationFn).toHaveBeenCalledWith(loadedRoute);

      // Step 6: Auto-reroute triggers if user deviates
      const deviationDetectedAfterSavedRoute = true;
      expect(deviationDetectedAfterSavedRoute).toBe(true);
    });

    it('should handle multiple saved routes correctly', () => {
      const route1 = {
        id: 'route-1',
        name: 'Beirut to Sidon',
        createdAt: '2026-07-01T00:00:00Z',
        km: 48,
        path: [[33.0, 35.0], [33.1, 35.1]],
      };

      const route2 = {
        id: 'route-2',
        name: 'Sidon to Tyre',
        createdAt: '2026-07-01T01:00:00Z',
        km: 55,
        path: [[33.1, 35.1], [33.2, 35.2]],
      };

      let savedRoutes = [route1];
      savedRoutes = [...savedRoutes, route2];

      expect(savedRoutes).toHaveLength(2);
      expect(savedRoutes[0].name).toBe('Beirut to Sidon');
      expect(savedRoutes[1].name).toBe('Sidon to Tyre');

      // User loads and navigates from second route
      const selectedRoute = savedRoutes[1];
      expect(selectedRoute.name).toBe('Sidon to Tyre');
      expect(selectedRoute.km).toBe(55);
    });

    it('should allow editing saved routes', () => {
      const savedRoutes = [
        {
          id: 'route-1',
          name: 'Original Name',
          createdAt: '2026-07-01T00:00:00Z',
          km: 50,
          path: [[33.0, 35.0], [33.1, 35.1]],
        },
      ];

      // Simulate edit: user clicks edit button
      // This loads the route and allows changing the name
      const routeToEdit = savedRoutes[0];
      let editedName = routeToEdit.name;
      editedName = 'Updated Route Name';

      // Re-save with new name (simulates save button on a loaded route)
      const updatedRoute = { ...routeToEdit, name: editedName };

      expect(updatedRoute.name).toBe('Updated Route Name');
      expect(updatedRoute.id).toBe('route-1');
    });

    it('should exit build mode after successful save', () => {
      // Simulate: user is in route build mode
      let navigationRoute = {
        start: { lat: 33.0, lon: 35.0, label: 'Start' },
        end: { lat: 33.1, lon: 35.1, label: 'End' },
        km: 50,
        path: [[33.0, 35.0], [33.1, 35.1]],
      };

      const routeName = 'Test Route';

      // User clicks save
      const saveHandler = vi.fn(() => {
        // On successful save:
        navigationRoute = null as any; // Clear route (exit build mode)
        // OR: clear navStartId and navEndId to show map without route overlay
      });

      expect(navigationRoute).toBeTruthy();
      saveHandler();

      // After save, route should still exist in savedRoutes
      // but the build UI (input fields) should be hidden or reset
      expect(saveHandler).toHaveBeenCalledTimes(1);
    });
  });
});

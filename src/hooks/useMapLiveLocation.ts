import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NAVIGATION_FOLLOW_MIN_ZOOM } from '../mapHtml';

export const useMapLiveLocation = (
  mapRef: React.MutableRefObject<any>,
  layersRef: React.MutableRefObject<any>,
  liveFollowDetachedRef: React.MutableRefObject<boolean>,
  lastLiveFollowRef: React.MutableRefObject<any>,
  liveLocation: any,
  navigationRoute: any,
  mapBearing: number,
  navFollowZoom: number | undefined,
  navLabels: boolean,
  liveCenterRequestId: number,
  onLiveFollowDetachedChange: (detached: boolean) => void,
) => {
  const lastAppliedZoomRef = useRef<number | undefined>(undefined);

  // Render accuracy circle + location indicator dot
  useEffect(() => {
    const group = layersRef.current.live;
    const map = mapRef.current;
    if (!group || !map || !liveLocation) {
      group?.clearLayers();
      return;
    }
    group.clearLayers();

    const accuracy = liveLocation.accuracy ?? 0;
    if (accuracy > 0 && accuracy < 1000) {
      L.circle([liveLocation.lat, liveLocation.lon], {
        radius: accuracy,
        color: 'rgba(30, 150, 243, 0.2)',
        weight: 0,
        fillOpacity: 0.15,
        interactive: false,
      }).addTo(group);
    }

    // Add location indicator dot (visible even when not in navigation mode)
    const dotIcon = L.icon({
      iconUrl:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI2IiBmaWxsPSIjMWY3YmY2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIzIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
      className: 'location-indicator-dot',
    });
    L.marker([liveLocation.lat, liveLocation.lon], {
      icon: dotIcon,
      interactive: false,
    })
      .addTo(group);
  }, [liveLocation]);

  // Keep map centered on live location ONLY during active navigation (not when just browsing)
  useEffect(() => {
    const map = mapRef.current;

    // DIAGNOSTIC LOGGING - Check each condition
    const hasMap = !!map;
    const hasLiveLocation = !!liveLocation;
    const isDetached = liveFollowDetachedRef.current;
    const hasRoute = !!navigationRoute;

    console.log(
      `[MAP PAN EFFECT] map=${hasMap ? '✓' : '✗'}, liveLocation=${hasLiveLocation ? '✓' : '✗'}, ` +
      `detached=${isDetached ? '✓' : '✗'}, route=${hasRoute ? '✓' : '✗'}`
    );

    if (!map || !liveLocation || liveFollowDetachedRef.current || !navigationRoute) {
      console.log(`[MAP PAN EFFECT] ⏭ Skipping: condition failed`);
      return;
    }

    // Only pan to GPS location during active navigation with route
    console.log(
      `[MAP PAN EFFECT] ✅ Panning to live location: lat=${liveLocation.lat.toFixed(4)}, lon=${liveLocation.lon.toFixed(4)}`
    );
    map.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
  }, [liveLocation, navigationRoute]);

  // CRITICAL FIX: When navigationRoute becomes available, immediately pan to live location if GPS is active
  // This handles the race condition where navigationRoute is set BEFORE liveLocation updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !liveLocation || liveFollowDetachedRef.current || !navigationRoute) {
      return;
    }

    console.log(
      `[MAP PAN NAV-ROUTE-CHANGE] ✅ Navigation route changed, panning to live location: lat=${liveLocation.lat.toFixed(4)}, lon=${liveLocation.lon.toFixed(4)}`
    );
    map.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
  }, [navigationRoute]); // ONLY depend on navigationRoute, not liveLocation

  // Apply navigation zoom scale when selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || navFollowZoom === undefined) return;
    if (navFollowZoom === lastAppliedZoomRef.current) return;

    lastAppliedZoomRef.current = navFollowZoom;
    const clampedZoom = Math.max(navFollowZoom, NAVIGATION_FOLLOW_MIN_ZOOM);

    console.log(`[ZOOM BUTTON] Applying zoom level: ${clampedZoom}`);
    map.setZoom(clampedZoom, { animate: true });
  }, [navFollowZoom]);

  // CENTER ME button: animate map to GPS location via focusTarget
  useEffect(() => {
    if (!liveLocation || liveCenterRequestId <= 0) return;
    console.log(`[CENTER ME] ✅ Clicked - focusTarget will handle animation`);

    // Disable GPS tracking while animation happens
    liveFollowDetachedRef.current = true;
    onLiveFollowDetachedChange(true);

    // Re-enable after 5s to allow focusTarget animation to complete
    const timer = setTimeout(() => {
      liveFollowDetachedRef.current = false;
      onLiveFollowDetachedChange(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [liveCenterRequestId, onLiveFollowDetachedChange]);
};

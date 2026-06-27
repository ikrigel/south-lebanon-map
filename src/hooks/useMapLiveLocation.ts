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

  // Render accuracy circle only (arrow is now an overlay in Map.tsx)
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
  }, [liveLocation]);

  // Keep map centered on live location with smooth animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !liveLocation || liveFollowDetachedRef.current) return;
    if (!navigationRoute) return;

    // Use panTo for smooth animation instead of setView
    map.panTo([liveLocation.lat, liveLocation.lon], { animate: true, duration: 0.5 });
  }, [liveLocation, navigationRoute]);

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

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
  bearingToDestination: number,
  distanceToDestination: number,
  navFollowZoom: number | undefined,
  navLabels: boolean,
  liveCenterRequestId: number,
  onLiveFollowDetachedChange: (detached: boolean) => void,
) => {
  const lastAppliedZoomRef = useRef<number | undefined>(undefined);

  // Arrow marker: points to destination, flips when moving away
  const createArrowMarker = (isMovingAwayFromDest: boolean) => {
    // Arrow always points toward destination (0° = up/north on screen)
    // When moving away, flip 180° to show the back/tail
    const arrowRotation = isMovingAwayFromDest ? 180 : 0;

    const svg = `
      <svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="sh">
            <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.4"/>
          </filter>
        </defs>

        <!-- ROTATING arrow: points toward destination (or tail when moving away) -->
        <g transform="rotate(${arrowRotation} 26 26)">
          <path d="M 26 5 L 34 22 L 30 22 L 30 38 L 22 38 L 22 22 L 18 22 Z"
                fill="#1976D2" stroke="#0D47A1" stroke-width="1" filter="url(#sh)"/>
          <path d="M 26 7 L 32 20 L 28 20 L 28 36 L 24 36 L 24 20 L 20 20 Z"
                fill="white" opacity="0.25"/>
          <circle cx="26" cy="26" r="3" fill="white"/>
        </g>
      </svg>
    `;

    const icon = L.divIcon({
      className: 'marker-live-location-arrow',
      html: svg,
      iconSize: [52, 52],
      iconAnchor: [26, 26],
      popupAnchor: [0, -26],
    });
    return icon;
  };

  // Render live location marker on map (arrow points to destination)
  useEffect(() => {
    const group = layersRef.current.live;
    const map = mapRef.current;
    if (!group || !map || !liveLocation || !navigationRoute) {
      group?.clearLayers();
      return;
    }
    group.clearLayers();

    // Detect if moving away from destination (distance increasing)
    const isMovingAwayFromDest = distanceToDestination > 0.2; // Arbitrary threshold
    const arrowIcon = createArrowMarker(isMovingAwayFromDest);
    L.marker([liveLocation.lat, liveLocation.lon], { icon: arrowIcon, interactive: false }).addTo(group);

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
  }, [liveLocation, navigationRoute, distanceToDestination]);

  // Lock GPS to screen center during navigation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !liveLocation || liveFollowDetachedRef.current) return;
    if (!navigationRoute) return;

    map.setView(
      [liveLocation.lat, liveLocation.lon],
      map.getZoom(),
      { animate: false, noMoveStart: true } as L.ZoomPanOptions
    );
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

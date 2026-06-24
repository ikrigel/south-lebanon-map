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

  // Waze-style arrow SVG marker (rotates based on heading)
  const createArrowMarker = (heading: number) => {
    const arrowDeg = heading + mapBearing;
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="arrow-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.4"/>
          </filter>
        </defs>
        <g transform="rotate(${arrowDeg} 20 20)">
          <!-- Arrow body -->
          <path d="M 20 4 L 28 20 L 24 20 L 24 34 L 16 34 L 16 20 L 12 20 Z"
                fill="#1976D2" stroke="#0D47A1" stroke-width="1" filter="url(#arrow-shadow)"/>
          <!-- White highlight -->
          <path d="M 20 6 L 26 18 L 22 18 L 22 32 L 18 32 L 18 18 L 14 18 Z"
                fill="white" opacity="0.3"/>
          <!-- Center dot -->
          <circle cx="20" cy="20" r="2.5" fill="white"/>
        </g>
      </svg>
    `;

    const icon = L.divIcon({
      className: 'marker-live-location-arrow',
      html: svg,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
    return icon;
  };

  // Render live location marker on map with Waze-style arrow
  useEffect(() => {
    const group = layersRef.current.live;
    const map = mapRef.current;
    if (!group || !map || !liveLocation) {
      group?.clearLayers();
      return;
    }
    group.clearLayers();

    const heading = liveLocation.heading ?? 0;
    const arrowIcon = createArrowMarker(heading);
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
  }, [liveLocation, mapBearing]);

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

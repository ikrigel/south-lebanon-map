import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NAVIGATION_FOLLOW_MIN_ZOOM } from '../mapHtml';
import { useMarkerScreenPosition } from './useMarkerScreenPosition';
import { useMarkerAdjustment } from './useMarkerAdjustment';
import { useHeaderVisibility } from './useHeaderVisibility';
import { useMarkerRepositioning } from './useMarkerRepositioning';

function lowerThirdCenter(map: L.Map, lat: number, lon: number, zoom: number, bearing: number = 0): L.LatLng {
  const size = map.getSize();
  const screenCenterX = size.x / 2;
  const screenCenterY = size.y / 2;

  // Calculate DESIRED screen position where marker should appear
  // Base offset: 1/6 of screen height (marker at 2/3 of screen from top = 1/3 below center)
  const baseOffset = size.y / 6;
  const bearingRad = (bearing * Math.PI) / 180;

  // Offset direction based on bearing
  // bearing = 0° (North): offset (0, +91) → marker at lower third (DOWN on screen)
  // bearing = 90° (East): offset (+91, 0) → marker at right third (RIGHT on screen)
  const offsetX = baseOffset * Math.sin(bearingRad);
  const offsetY = baseOffset * Math.cos(bearingRad);  // POSITIVE = down on screen

  // Clamp offset to prevent excessive panning
  const maxOffsetPx = Math.min(size.x, size.y) * 0.4;
  const clampedOffsetX = Math.max(-maxOffsetPx, Math.min(maxOffsetPx, offsetX));
  const clampedOffsetY = Math.max(-maxOffsetPx, Math.min(maxOffsetPx, offsetY));

  // DESIRED screen position for the marker (always within viewport)
  const desiredScreenX = screenCenterX + clampedOffsetX;
  const desiredScreenY = screenCenterY + clampedOffsetY;

  // DIAGNOSTIC
  const timestamp = new Date().toISOString().split('T')[1];
  console.log(`[${timestamp}] lowerThirdCenter: GPS (${lat.toFixed(4)}, ${lon.toFixed(4)}), screen ${size.x}×${size.y}px`);
  console.log(`[DEBUG] Bearing ${bearing}° → offset (${clampedOffsetX.toFixed(1)}, ${clampedOffsetY.toFixed(1)}) → desired marker at (${desiredScreenX.toFixed(1)}, ${desiredScreenY.toFixed(1)})`);

  // Convert desired screen position directly to lat/lng
  // This avoids using marker's actual (possibly off-screen) position
  const centerLatLng = map.containerPointToLatLng(L.point(desiredScreenX, desiredScreenY));

  console.log(`[DEBUG] Center LatLng (RESULT): (${centerLatLng.lat.toFixed(4)}, ${centerLatLng.lng.toFixed(4)}) ⬅️ WILL CALL map.setView()`);

  // Verification: log marker position on screen
  const screenMarkerX = size.x / 2;
  const screenMarkerY = size.y * (2 / 3);
  const isPortrait = size.y > size.x;
  console.log(`[Nav Marker] Screen: ${size.x}×${size.y}px (${isPortrait ? 'portrait' : 'landscape'}) | Bearing: ${bearing.toFixed(0)}° | Offset: (${clampedOffsetX.toFixed(0)}, ${clampedOffsetY.toFixed(0)}) | Marker at (${screenMarkerX.toFixed(0)}, ${screenMarkerY.toFixed(0)}) | Center LatLng: (${centerLatLng.lat.toFixed(4)}, ${centerLatLng.lng.toFixed(4)})`);

  return centerLatLng;
}

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
  // Initialize new marker positioning system (v3.3.18)
  const markerScreenPosition = useMarkerScreenPosition({
    mapRef,
    liveLocation,
    mapBearing,
    headerHeight: 60, // Typical header height in pixels
    footerHeight: 0,  // No footer in current layout
    leftPanelWidth: 0, // Panels are only visible on desktop
    rightPanelWidth: 0,
  });

  const markerAdjustment = useMarkerAdjustment({
    mapRef,
    liveLocation,
    mapBearing,
    markerScreenPosition: markerScreenPosition.position,
    isNavigationActive: !!navigationRoute && !liveFollowDetachedRef.current,
  });

  const markerRepositioning = useMarkerRepositioning({
    mapRef,
    liveLocation,
    markerScreenPosition: markerScreenPosition.position,
    isNavigationActive: !!navigationRoute && !liveFollowDetachedRef.current,
    headerHeight: 60,
    footerHeight: 0,
    leftPanelWidth: 0,
    rightPanelWidth: 0,
  });

  const headerVisibility = useHeaderVisibility({ defaultMode: 'fix' });
  const lastAppliedZoomRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const group = layersRef.current.live;
    const map = mapRef.current;
    if (!group || !map || !liveLocation) {
      group?.clearLayers();
      return;
    }
    group.clearLayers();

    const arrowDeg = (liveLocation.heading ?? 0) + mapBearing;
    const arrowIcon = L.divIcon({
      className: 'marker-live-location',
      html: `<div style="transform:rotate(${arrowDeg}deg)">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
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

    const now = Date.now();
    const lastFollow = lastLiveFollowRef.current;
    const minPan = 100; // ms
    const minDist = navigationRoute ? 15 : 300; // 15m during nav for smooth tracking
    const shouldPan =
      !liveFollowDetachedRef.current &&
      (!lastFollow || now - lastFollow.at > minPan) &&
      (!lastFollow || Math.abs(liveLocation.lat - lastFollow.lat) > minDist / 111000 ||
                       Math.abs(liveLocation.lon - lastFollow.lon) > minDist / 111000);

    if (shouldPan) {
      const zoomLevel = navFollowZoom ?? map.getZoom();
      const clampedZoom = Math.max(zoomLevel, NAVIGATION_FOLLOW_MIN_ZOOM);
      const adjusted = lowerThirdCenter(map, liveLocation.lat, liveLocation.lon, clampedZoom, mapBearing);
      console.log(`[GPS UPDATE EFFECT] Calling map.setView(${adjusted.lat.toFixed(4)}, ${adjusted.lng.toFixed(4)}, zoom=${clampedZoom})`);
      map.setView(adjusted, clampedZoom, {
        animate: true,
        duration: 0.3,
        easeLinearity: 1.0,
      } as L.ZoomPanOptions);
      lastLiveFollowRef.current = { lat: liveLocation.lat, lon: liveLocation.lon, at: now };
    }
  }, [liveLocation, navigationRoute, mapBearing, navFollowZoom, navLabels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || liveCenterRequestId <= 0 || !liveLocation) return;
    console.log(`[CENTER ME EFFECT] Button clicked (liveCenterRequestId=${liveCenterRequestId})`);
    liveFollowDetachedRef.current = false;
    onLiveFollowDetachedChange(false);
    const zoom = map.getZoom();
    const adjusted = lowerThirdCenter(map, liveLocation.lat, liveLocation.lon, zoom);
    console.log(`[CENTER ME EFFECT] Calling map.setView(${adjusted.lat.toFixed(4)}, ${adjusted.lng.toFixed(4)}, zoom=${zoom})`);
    map.setView(adjusted, zoom, {
      animate: true,
      duration: 0.3,
      easeLinearity: 1.0,
    } as L.ZoomPanOptions);
    console.log(`[CENTER ME EFFECT] setView call complete`);
  }, [liveCenterRequestId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (navFollowZoom === undefined || navFollowZoom === lastAppliedZoomRef.current) return;
    lastAppliedZoomRef.current = navFollowZoom;
    const clampedZoom = Math.max(navFollowZoom, NAVIGATION_FOLLOW_MIN_ZOOM);

    // Zoom works in BOTH modes:
    // - During navigation with live location: apply lower-third positioning
    // - Any other mode: just apply zoom without positional offset
    if (navigationRoute && liveLocation && !liveFollowDetachedRef.current) {
      const adjusted = lowerThirdCenter(map, liveLocation.lat, liveLocation.lon, clampedZoom, mapBearing);
      map.setView(adjusted, clampedZoom, {
        animate: true,
        duration: 0.3,
        easeLinearity: 1.0,
      } as L.ZoomPanOptions);
    } else if (map.setZoom) {
      // Not in active navigation: just zoom the map (check if setZoom exists for test compatibility)
      map.setZoom(clampedZoom, { animate: true } as any);
    }
  }, [navFollowZoom, navigationRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !navigationRoute || !liveLocation || liveFollowDetachedRef.current) return;
    const handleResize = () => {
      const zoom = map.getZoom();
      const adjusted = lowerThirdCenter(map, liveLocation.lat, liveLocation.lon, zoom);
      map.setView(adjusted, zoom, { animate: false } as L.ZoomPanOptions);
    };
    map.on('resize', handleResize);
    return () => map.off('resize', handleResize);
  }, [navigationRoute, liveLocation]);
};

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NAVIGATION_FOLLOW_MIN_ZOOM } from '../mapHtml';
import { useMarkerScreenPosition } from './useMarkerScreenPosition';
import { useMarkerAdjustment } from './useMarkerAdjustment';
import { useHeaderVisibility } from './useHeaderVisibility';
import { useMarkerRepositioning } from './useMarkerRepositioning';

// NAVIGATION MODE: Position GPS marker at lower-third of screen
function lowerThirdCenter(map: L.Map, lat: number, lon: number, zoom: number): L.LatLng {
  const size = map.getSize();

  // Target position: GPS marker should appear at center X, but 2/3 down on Y
  const targetScreenX = size.x / 2;
  const targetScreenY = size.y * (2 / 3);

  // Get current map center
  const center = map.getCenter();

  // Calculate how much to pan to position GPS at target
  // Pan delta = (where GPS currently is) - (where we want GPS to be)
  const gpsScreenPos = map.latLngToContainerPoint([lat, lon] as L.LatLngTuple);
  const panX = gpsScreenPos.x - targetScreenX;
  const panY = gpsScreenPos.y - targetScreenY;

  // DEBUG: Log projection steps
  const projectedCenter = map.project(center, zoom);
  const panPoint = projectedCenter.add(L.point(panX, panY));
  const newCenter = map.unproject(panPoint, zoom);

  console.log(`[NAV] GPS ${lat.toFixed(4)},${lon.toFixed(4)} at screen(${gpsScreenPos.x.toFixed(0)},${gpsScreenPos.y.toFixed(0)}) → pan(${panX.toFixed(0)},${panY.toFixed(0)}) → center${newCenter.lat.toFixed(4)},${newCenter.lng.toFixed(4)}`);

  // VALIDATE: Check if result is crazy far away
  if (Math.abs(newCenter.lat) > 85 || Math.abs(newCenter.lng) > 180) {
    console.error(`⚠️ [INVALID lowerThirdCenter] INPUT: lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)}, zoom=${zoom}`);
    console.error(`   mapCenter=${center.lat.toFixed(4)},${center.lng.toFixed(4)} → projected=${projectedCenter.x.toFixed(0)},${projectedCenter.y.toFixed(0)} → panPoint=${panPoint.x.toFixed(0)},${panPoint.y.toFixed(0)} → RESULT=${newCenter.lat.toFixed(4)},${newCenter.lng.toFixed(4)}`);
    console.error(`   mapSize=${size.x}x${size.y}, targetScreen=${targetScreenX.toFixed(0)},${targetScreenY.toFixed(0)}, gpsScreen=${gpsScreenPos.x.toFixed(0)},${gpsScreenPos.y.toFixed(0)}`);
    return L.latLng(lat, lon);
  }

  return newCenter;
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
      console.log(`[GPS UPDATE EFFECT] map.setView(lat=${adjusted.lat.toFixed(4)}, lon=${adjusted.lng.toFixed(4)}, zoom=${clampedZoom})`);

      // Validate before setting
      if (Math.abs(adjusted.lat) <= 85 && Math.abs(adjusted.lng) <= 180) {
        map.setView(adjusted, clampedZoom, {
          animate: true,
          duration: 0.3,
          easeLinearity: 1.0,
        } as L.ZoomPanOptions);
      } else {
        console.error(`⚠️ [REJECTED INVALID COORDS] lat=${adjusted.lat.toFixed(4)}, lon=${adjusted.lng.toFixed(4)} - NOT calling map.setView()`);
      }
      lastLiveFollowRef.current = { lat: liveLocation.lat, lon: liveLocation.lon, at: now };
    }
  }, [liveLocation, navigationRoute, mapBearing, navFollowZoom, navLabels]);

  useEffect(() => {
    if (!liveLocation || liveCenterRequestId <= 0) return;
    console.log(`[CENTER ME] Clicked - disable GPS tracking during focusTarget animation`);

    // CRITICAL: Don't call flyTo directly! This creates competing animations with focusTarget
    // focusTarget will handle the flyTo(zoom=17) animation
    // We just disable GPS tracking so UPDATE EFFECT doesn't interfere
    liveFollowDetachedRef.current = true;
    onLiveFollowDetachedChange(true);

    // Re-enable GPS tracking after animation window (1 second should be enough for focusTarget's 0.7s animation)
    const timer = setTimeout(() => {
      liveFollowDetachedRef.current = false;
      onLiveFollowDetachedChange(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [liveCenterRequestId, onLiveFollowDetachedChange]);

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
      console.log(`[ZOOM EFFECT] map.setView(lat=${adjusted.lat.toFixed(4)}, lon=${adjusted.lng.toFixed(4)}, zoom=${clampedZoom})`);
      if (Math.abs(adjusted.lat) <= 85 && Math.abs(adjusted.lng) <= 180) {
        map.setView(adjusted, clampedZoom, {
          animate: true,
          duration: 0.3,
          easeLinearity: 1.0,
        } as L.ZoomPanOptions);
      } else {
        console.error(`⚠️ [REJECTED] ZOOM EFFECT invalid: lat=${adjusted.lat.toFixed(4)}, lon=${adjusted.lng.toFixed(4)}`);
      }
    } else if (map.setZoom) {
      console.log(`[ZOOM EFFECT] map.setZoom(${clampedZoom})`);
      map.setZoom(clampedZoom, { animate: true } as any);
    }
  }, [navFollowZoom, navigationRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !navigationRoute || !liveLocation || liveFollowDetachedRef.current) return;
    const handleResize = () => {
      const zoom = map.getZoom();
      const adjusted = lowerThirdCenter(map, liveLocation.lat, liveLocation.lon, zoom);
      console.log(`[RESIZE EFFECT] map.setView(lat=${adjusted.lat.toFixed(4)}, lon=${adjusted.lng.toFixed(4)}, zoom=${zoom})`);
      if (Math.abs(adjusted.lat) <= 85 && Math.abs(adjusted.lng) <= 180) {
        map.setView(adjusted, zoom, { animate: false } as L.ZoomPanOptions);
      } else {
        console.error(`⚠️ [REJECTED] RESIZE EFFECT invalid: lat=${adjusted.lat.toFixed(4)}, lon=${adjusted.lng.toFixed(4)}`);
      }
    };
    map.on('resize', handleResize);
    return () => map.off('resize', handleResize);
  }, [navigationRoute, liveLocation]);
};

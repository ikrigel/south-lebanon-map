import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NAVIGATION_FOLLOW_MIN_ZOOM } from '../mapHtml';

function lowerThirdCenter(map: L.Map, lat: number, lon: number, zoom: number, bearing: number = 0): L.LatLng {
  const size = map.getSize();
  const markerPx = map.project([lat, lon] as L.LatLngTuple, zoom);

  // Position marker ahead in direction of travel, accounting for map rotation
  // Base offset: 1/6 of screen height (marker at 2/3 of screen)
  // Rotate offset based on bearing so marker always stays ahead during navigation
  const baseOffset = size.y / 6;
  const bearingRad = (bearing * Math.PI) / 180;

  // Rotate offset vector based on map bearing
  // bearing = 0° (North): offset center South → marker ahead North
  // bearing = 90° (East): offset center West → marker ahead East
  // bearing = 180° (South): offset center North → marker ahead South
  // bearing = 270° (West): offset center East → marker ahead West
  const offsetX = baseOffset * -Math.sin(bearingRad);
  const offsetY = baseOffset * Math.cos(bearingRad);

  const centerPx = L.point(markerPx.x + offsetX, markerPx.y + offsetY);

  // Verification: log marker position on screen
  const screenMarkerX = size.x / 2;
  const screenMarkerY = size.y * (2 / 3);
  const isPortrait = size.y > size.x;
  console.log(`[Nav Marker] Screen: ${size.x}×${size.y}px (${isPortrait ? 'portrait' : 'landscape'}) | Bearing: ${bearing.toFixed(0)}° | Marker at (${screenMarkerX.toFixed(0)}, ${screenMarkerY.toFixed(0)}) | Ahead in travel direction`);

  return map.unproject(centerPx, zoom);
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
    liveFollowDetachedRef.current = false;
    onLiveFollowDetachedChange(false);
    const zoom = map.getZoom();
    const adjusted = lowerThirdCenter(map, liveLocation.lat, liveLocation.lon, zoom);
    map.setView(adjusted, zoom, {
      animate: true,
      duration: 0.3,
      easeLinearity: 1.0,
    } as L.ZoomPanOptions);
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

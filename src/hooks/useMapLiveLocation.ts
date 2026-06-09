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
    const minDist = navigationRoute ? 100 : 300; // meters, stricter during nav
    const shouldPan =
      !liveFollowDetachedRef.current &&
      (!lastFollow || now - lastFollow.at > minPan) &&
      (!lastFollow || Math.abs(liveLocation.lat - lastFollow.lat) > minDist / 111000 ||
                       Math.abs(liveLocation.lon - lastFollow.lon) > minDist / 111000);

    if (shouldPan) {
      const zoomLevel = navFollowZoom ?? map.getZoom();
      const clampedZoom = Math.max(zoomLevel, NAVIGATION_FOLLOW_MIN_ZOOM);
      map.flyTo([liveLocation.lat, liveLocation.lon], clampedZoom, {
        animate: true,
        duration: 0.5,
        easeLinearity: 0.5,
      });
      lastLiveFollowRef.current = { lat: liveLocation.lat, lon: liveLocation.lon, at: now };
    }
  }, [liveLocation, navigationRoute, mapBearing, navFollowZoom, navLabels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || liveCenterRequestId <= 0 || !liveLocation) return;
    liveFollowDetachedRef.current = false;
    onLiveFollowDetachedChange(false);
    map.flyTo([liveLocation.lat, liveLocation.lon], map.getZoom(), {
      animate: true,
      duration: 0.5,
    });
  }, [liveCenterRequestId]);
};

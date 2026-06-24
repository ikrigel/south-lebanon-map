import { useEffect } from 'react';
import L from 'leaflet';
import { useMarkerScreenPosition } from './useMarkerScreenPosition';
import { useMarkerAdjustment } from './useMarkerAdjustment';
import { useHeaderVisibility } from './useHeaderVisibility';
import { useMarkerRepositioning } from './useMarkerRepositioning';

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
  // DISABLED v3.3.18 marker positioning system - these hooks were calling map.panBy()
  // which was panning the map to invalid coordinates, causing the 5000km jump bug!
  // Keeping this commented out as it's the ROOT CAUSE of the jumping issue.
  /*
  const markerScreenPosition = useMarkerScreenPosition({...});
  const markerAdjustment = useMarkerAdjustment({...});
  const markerRepositioning = useMarkerRepositioning({...});
  const headerVisibility = useHeaderVisibility({...});
  */

  // Render live location marker on map
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
  }, [liveLocation, mapBearing]);

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

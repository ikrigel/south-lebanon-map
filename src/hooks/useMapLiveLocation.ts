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

  // Keep map centered on live location (in both navigation AND browsing modes)
  // Unless user has manually panned the map (detached = true)
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !liveLocation || liveFollowDetachedRef.current) {
      return;
    }

    // Auto-follow GPS in BOTH modes: navigation + browsing
    console.log(
      `[MAP PAN EFFECT] ✅ Following GPS: lat=${liveLocation.lat.toFixed(4)}, lon=${liveLocation.lon.toFixed(4)}`
    );
    map.panTo([liveLocation.lat, liveLocation.lon], { animate: false });
  }, [liveLocation]);

  // Detect user map drag (pan/zoom by user gesture) → set detached flag
  // This lets user browse freely without GPS auto-following
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleDragStart = () => {
      console.log('[MAP DRAG] User started dragging map');
      liveFollowDetachedRef.current = true;
      onLiveFollowDetachedChange(true);
    };

    map.on('dragstart', handleDragStart);
    return () => map.off('dragstart', handleDragStart);
  }, [onLiveFollowDetachedChange]);

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

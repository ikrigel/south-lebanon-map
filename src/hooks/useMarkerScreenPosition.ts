import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import type { MarkerScreenPosition, OcclusionType } from '../types';

interface UseMarkerScreenPositionProps {
  mapRef: React.MutableRefObject<any>;
  liveLocation: any;
  mapBearing: number;
  headerHeight: number;
  footerHeight: number;
  leftPanelWidth: number;
  rightPanelWidth: number;
}

export const useMarkerScreenPosition = (props: UseMarkerScreenPositionProps) => {
  const positionRef = useRef<MarkerScreenPosition>({
    x: 0,
    y: 0,
    isVisible: false,
    occlusion: null,
  });

  const calculateMarkerScreenPosition = useCallback((): MarkerScreenPosition => {
    const map = props.mapRef.current;
    if (!map || !props.liveLocation) {
      return { x: 0, y: 0, isVisible: false, occlusion: null };
    }

    try {
      // Defensive: check map methods exist before calling
      if (!map.getSize || !map.getZoom || !map.project) {
        return { x: 0, y: 0, isVisible: false, occlusion: null };
      }

      const size = map.getSize();
      const zoom = map.getZoom();

      // Validate size and zoom
      if (!size || size.x <= 0 || size.y <= 0 || !Number.isFinite(zoom)) {
        return { x: 0, y: 0, isVisible: false, occlusion: null };
      }

      // Project marker to screen coordinates
      const markerLatLng: L.LatLngTuple = [props.liveLocation.lat, props.liveLocation.lon];
      const markerPx = map.project(markerLatLng, zoom);

      // Validate projection result
      if (!markerPx || !Number.isFinite(markerPx.x) || !Number.isFinite(markerPx.y)) {
        return { x: 0, y: 0, isVisible: false, occlusion: null };
      }

      const screenX = markerPx.x;
      const screenY = markerPx.y;

      // Check visibility bounds
      const isWithinHorizontalBounds = screenX >= 0 && screenX <= size.x;
      const isWithinVerticalBounds = screenY >= 0 && screenY <= size.y;
      const isVisible = isWithinHorizontalBounds && isWithinVerticalBounds;

      // Detect occlusion by UI elements (with defensive boundary checks)
      let occlusion: OcclusionType = null;
      const headerHeight = Math.max(0, props.headerHeight);
      const footerHeight = Math.max(0, props.footerHeight);
      const leftPanelWidth = Math.max(0, props.leftPanelWidth);
      const rightPanelWidth = Math.max(0, props.rightPanelWidth);

      if (screenY < headerHeight) {
        occlusion = 'header';
      } else if (screenY > size.y - footerHeight) {
        occlusion = 'footer';
      } else if (screenX < leftPanelWidth) {
        occlusion = 'left-panel';
      } else if (screenX > size.x - rightPanelWidth) {
        occlusion = 'right-panel';
      }

      return {
        x: screenX,
        y: screenY,
        isVisible,
        occlusion,
      };
    } catch (error) {
      // Silently handle projection errors
      console.debug('[useMarkerScreenPosition] Projection error:', error);
      return { x: 0, y: 0, isVisible: false, occlusion: null };
    }
  }, [props]);

  useEffect(() => {
    // Only calculate if map exists and live location is available
    if (!props.mapRef.current || !props.liveLocation) {
      positionRef.current = { x: 0, y: 0, isVisible: false, occlusion: null };
      return;
    }
    const position = calculateMarkerScreenPosition();
    positionRef.current = position;
  }, [props.liveLocation, props.mapBearing, props.headerHeight, props.footerHeight,
      props.leftPanelWidth, props.rightPanelWidth, calculateMarkerScreenPosition]);

  return {
    position: positionRef.current,
    calculateMarkerScreenPosition,
  };
};

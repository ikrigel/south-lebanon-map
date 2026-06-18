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

    const size = map.getSize();
    const zoom = map.getZoom();

    // Project marker to screen coordinates
    const markerLatLng: L.LatLngTuple = [props.liveLocation.lat, props.liveLocation.lon];
    const markerPx = map.project(markerLatLng, zoom);
    const screenX = markerPx.x;
    const screenY = markerPx.y;

    // Check visibility bounds
    const isWithinHorizontalBounds = screenX >= 0 && screenX <= size.x;
    const isWithinVerticalBounds = screenY >= 0 && screenY <= size.y;
    const isVisible = isWithinHorizontalBounds && isWithinVerticalBounds;

    // Detect occlusion by UI elements
    let occlusion: OcclusionType = null;
    if (screenY < props.headerHeight) {
      occlusion = 'header';
    } else if (screenY > size.y - props.footerHeight) {
      occlusion = 'footer';
    } else if (screenX < props.leftPanelWidth) {
      occlusion = 'left-panel';
    } else if (screenX > size.x - props.rightPanelWidth) {
      occlusion = 'right-panel';
    }

    return {
      x: screenX,
      y: screenY,
      isVisible,
      occlusion,
    };
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

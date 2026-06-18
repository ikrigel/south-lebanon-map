import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import type { MarkerScreenPosition, SafeZone } from '../types';
import { detectOcclusionAndGetSafeZone, isMarkerPositionSafe } from '../utils/markerOcclusionDetection';

interface UseMarkerRepositioningProps {
  mapRef: React.MutableRefObject<any>;
  liveLocation: any;
  markerScreenPosition: MarkerScreenPosition;
  isNavigationActive: boolean;
  headerHeight: number;
  footerHeight: number;
  leftPanelWidth: number;
  rightPanelWidth: number;
}

export const useMarkerRepositioning = (props: UseMarkerRepositioningProps) => {
  const safeZoneRef = useRef<SafeZone | null>(null);

  const calculateSafeZone = useCallback((): SafeZone | null => {
    const map = props.mapRef.current;
    if (!map || !props.isNavigationActive || !props.liveLocation) {
      return null;
    }

    const size = map.getSize();

    // Detect occlusion and get safe zone
    const safeZone = detectOcclusionAndGetSafeZone(
      props.markerScreenPosition,
      size.x,
      size.y,
      {
        header: props.headerHeight,
        footer: props.footerHeight,
        leftPanel: props.leftPanelWidth,
        rightPanel: props.rightPanelWidth,
      }
    );

    return safeZone;
  }, [props]);

  const repositionMarkerToSafeZone = useCallback(() => {
    const map = props.mapRef.current;
    if (!map || !props.isNavigationActive || !props.liveLocation) {
      safeZoneRef.current = null;
      return;
    }

    try {
      // Defensive: check map methods exist
      if (!map.getSize || !map.panBy) {
        safeZoneRef.current = null;
        return;
      }

      // Check if current position is safe
      const size = map.getSize();
      if (!size || size.x <= 0 || size.y <= 0) {
        safeZoneRef.current = null;
        return;
      }

      const isSafe = isMarkerPositionSafe(
        props.markerScreenPosition,
        size.x,
        size.y,
        {
          header: Math.max(0, props.headerHeight),
          footer: Math.max(0, props.footerHeight),
          leftPanel: Math.max(0, props.leftPanelWidth),
          rightPanel: Math.max(0, props.rightPanelWidth),
        }
      );

      if (isSafe) {
        safeZoneRef.current = null;
        return;
      }

      // Get safe zone and move marker there
      const safeZone = calculateSafeZone();
      if (!safeZone) {
        safeZoneRef.current = null;
        return;
      }

      safeZoneRef.current = safeZone;

      // Calculate pan delta to move marker from actual position to safe zone target
      const deltaX = safeZone.targetX - props.markerScreenPosition.x;
      const deltaY = safeZone.targetY - props.markerScreenPosition.y;

      // Validate deltas
      if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
        safeZoneRef.current = null;
        return;
      }

      // Pan the map to move marker to safe zone (only if movement needed)
      const movementThreshold = 1;
      if (Math.abs(deltaX) > movementThreshold || Math.abs(deltaY) > movementThreshold) {
        try {
          map.panBy([-deltaX, -deltaY], {
            animate: true,
            duration: 0.3,
          });
        } catch (panError) {
          console.debug('[useMarkerRepositioning] Pan error:', panError);
          safeZoneRef.current = null;
        }
      }
    } catch (error) {
      console.debug('[useMarkerRepositioning] Repositioning error:', error);
      safeZoneRef.current = null;
    }
  }, [props, calculateSafeZone]);

  useEffect(() => {
    if (!props.isNavigationActive) {
      safeZoneRef.current = null;
      return;
    }

    repositionMarkerToSafeZone();
  }, [props.markerScreenPosition, props.isNavigationActive, repositionMarkerToSafeZone]);

  return {
    safeZone: safeZoneRef.current,
  };
};

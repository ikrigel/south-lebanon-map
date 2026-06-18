import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { MARKER_POSITION_TOLERANCE_PX } from '../constants';

interface UseMarkerAdjustmentProps {
  mapRef: React.MutableRefObject<any>;
  liveLocation: any;
  mapBearing: number;
  markerScreenPosition: { x: number; y: number; isVisible: boolean; occlusion: string | null };
  isNavigationActive: boolean;
}

interface AdjustmentState {
  needsAdjustment: boolean;
  targetX: number;
  targetY: number;
  actualX: number;
  actualY: number;
  delta: number;
}

/**
 * Calculate bearing-aware target position
 * bearing = 0° (North): lower third (marker at bottom)
 * bearing = 90° (East): right third (marker on right)
 * bearing = 180° (South): upper third (marker at top)
 * bearing = 270° (West): left third (marker on left)
 */
function getBearingAwareTarget(bearing: number, screenWidth: number, screenHeight: number): { targetX: number; targetY: number } {
  // Normalize bearing to 0-360
  const normalizedBearing = ((bearing % 360) + 360) % 360;

  // Default: lower third (bearing near 0° / 360°)
  let targetX = screenWidth / 2;
  let targetY = screenHeight * (2 / 3);

  // Rotate target position based on bearing
  if (normalizedBearing > 45 && normalizedBearing <= 135) {
    // East (90°): right third
    targetX = screenWidth * (2 / 3);
    targetY = screenHeight / 2;
  } else if (normalizedBearing > 135 && normalizedBearing <= 225) {
    // South (180°): upper third
    targetX = screenWidth / 2;
    targetY = screenHeight * (1 / 3);
  } else if (normalizedBearing > 225 && normalizedBearing <= 315) {
    // West (270°): left third
    targetX = screenWidth * (1 / 3);
    targetY = screenHeight / 2;
  }

  return { targetX, targetY };
}

export const useMarkerAdjustment = (props: UseMarkerAdjustmentProps) => {
  const adjustmentStateRef = useRef<AdjustmentState>({
    needsAdjustment: false,
    targetX: 0,
    targetY: 0,
    actualX: 0,
    actualY: 0,
    delta: 0,
  });

  const calculateAdjustment = useCallback(() => {
    const map = props.mapRef.current;
    if (!map || !props.isNavigationActive || !props.liveLocation || !props.markerScreenPosition.isVisible) {
      adjustmentStateRef.current = {
        needsAdjustment: false,
        targetX: 0,
        targetY: 0,
        actualX: 0,
        actualY: 0,
        delta: 0,
      };
      return;
    }

    const size = map.getSize();
    const { targetX, targetY } = getBearingAwareTarget(props.mapBearing, size.x, size.y);

    const actualX = props.markerScreenPosition.x;
    const actualY = props.markerScreenPosition.y;

    // Calculate distance between actual and target
    const deltaX = targetX - actualX;
    const deltaY = targetY - actualY;
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    adjustmentStateRef.current = {
      needsAdjustment: delta > MARKER_POSITION_TOLERANCE_PX,
      targetX,
      targetY,
      actualX,
      actualY,
      delta,
    };
  }, [props]);

  useEffect(() => {
    calculateAdjustment();
  }, [props.mapBearing, props.markerScreenPosition, props.isNavigationActive, calculateAdjustment]);

  return {
    adjustmentState: adjustmentStateRef.current,
  };
};

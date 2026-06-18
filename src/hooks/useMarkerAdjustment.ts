import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import { MARKER_POSITION_TOLERANCE_PX, MARKER_ADJUSTMENT_MAX_ITERATIONS, MARKER_ADJUSTMENT_DELAY_MS } from '../constants';

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
  const [adjustmentInProgress, setAdjustmentInProgress] = useState(false);
  const adjustmentStateRef = useRef<AdjustmentState>({
    needsAdjustment: false,
    targetX: 0,
    targetY: 0,
    actualX: 0,
    actualY: 0,
    delta: 0,
  });
  const iterationCountRef = useRef(0);
  const adjustmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const performAdjustment = useCallback(() => {
    const map = props.mapRef.current;
    if (!map || !props.isNavigationActive || !props.liveLocation || !props.markerScreenPosition.isVisible) {
      setAdjustmentInProgress(false);
      return;
    }

    calculateAdjustment();
    const state = adjustmentStateRef.current;

    // Check if adjustment is needed and within iteration limit
    if (!state.needsAdjustment || iterationCountRef.current >= MARKER_ADJUSTMENT_MAX_ITERATIONS) {
      setAdjustmentInProgress(false);
      iterationCountRef.current = 0;
      return;
    }

    // Pan map by a fraction of the delta to move marker closer to target
    const deltaX = state.targetX - state.actualX;
    const deltaY = state.targetY - state.actualY;

    if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
      // Use a smaller adjustment factor for smoother movement (0.2 = 20% of delta per iteration)
      const adjustmentFactor = 0.2;
      if (map.panBy) {
        map.panBy([-deltaX * adjustmentFactor, -deltaY * adjustmentFactor], { animate: false });
      }
    }

    iterationCountRef.current += 1;

    // Schedule next iteration if more adjustments needed
    if (iterationCountRef.current < MARKER_ADJUSTMENT_MAX_ITERATIONS && state.delta > MARKER_POSITION_TOLERANCE_PX) {
      if (adjustmentTimeoutRef.current) {
        clearTimeout(adjustmentTimeoutRef.current);
      }
      adjustmentTimeoutRef.current = setTimeout(() => {
        performAdjustment();
      }, MARKER_ADJUSTMENT_DELAY_MS);
    } else {
      setAdjustmentInProgress(false);
      iterationCountRef.current = 0;
    }
  }, [props, calculateAdjustment]);

  // Trigger adjustment when marker position changes significantly
  useEffect(() => {
    calculateAdjustment();
    const state = adjustmentStateRef.current;

    // Start adjustment if needed and not already in progress
    if (state.needsAdjustment && !adjustmentInProgress && props.isNavigationActive) {
      setAdjustmentInProgress(true);
      iterationCountRef.current = 0;
      performAdjustment();
    }
  }, [props.mapBearing, props.markerScreenPosition, props.isNavigationActive, calculateAdjustment, performAdjustment, adjustmentInProgress]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (adjustmentTimeoutRef.current) {
        clearTimeout(adjustmentTimeoutRef.current);
      }
    };
  }, []);

  return {
    adjustmentState: adjustmentStateRef.current,
    adjustmentInProgress,
  };
};

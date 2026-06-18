import type { SafeZone, OcclusionType, MarkerScreenPosition } from '../types';

interface OcclusionBounds {
  header: number;
  footer: number;
  leftPanel: number;
  rightPanel: number;
}

/**
 * Detect which UI element occludes the marker and return the nearest safe zone
 */
export function detectOcclusionAndGetSafeZone(
  markerPosition: MarkerScreenPosition,
  screenWidth: number,
  screenHeight: number,
  bounds: OcclusionBounds
): SafeZone | null {
  if (!markerPosition.occlusion) {
    return null;
  }

  const margin = 20; // Pixels to avoid overlapping with UI

  switch (markerPosition.occlusion) {
    case 'header':
      // Move to center-bottom (lower third)
      return {
        type: 'center-bottom',
        targetX: screenWidth / 2,
        targetY: screenHeight * (2 / 3),
        adjustedBearing: 0,
      };

    case 'footer':
      // Move to center-top (upper third)
      return {
        type: 'center-top',
        targetX: screenWidth / 2,
        targetY: screenHeight * (1 / 3),
        adjustedBearing: 180,
      };

    case 'left-panel':
      // Move to right third
      return {
        type: 'right-third',
        targetX: screenWidth * (2 / 3),
        targetY: screenHeight / 2,
        adjustedBearing: 90,
      };

    case 'right-panel':
      // Move to left third
      return {
        type: 'left-third',
        targetX: screenWidth * (1 / 3),
        targetY: screenHeight / 2,
        adjustedBearing: 270,
      };

    default:
      return {
        type: 'center',
        targetX: screenWidth / 2,
        targetY: screenHeight / 2,
        adjustedBearing: null,
      };
  }
}

/**
 * Calculate safe zone boundaries based on UI layout
 * Returns the area where marker can be positioned without being occluded
 */
export function calculateSafeZoneBoundaries(
  screenWidth: number,
  screenHeight: number,
  bounds: OcclusionBounds
): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  margin: number;
} {
  const margin = 20;

  return {
    minX: bounds.leftPanel + margin,
    maxX: screenWidth - bounds.rightPanel - margin,
    minY: bounds.header + margin,
    maxY: screenHeight - bounds.footer - margin,
    margin,
  };
}

/**
 * Check if marker position is safe (not occluded by UI)
 */
export function isMarkerPositionSafe(
  markerPosition: MarkerScreenPosition,
  screenWidth: number,
  screenHeight: number,
  bounds: OcclusionBounds
): boolean {
  if (!markerPosition.isVisible) {
    return false;
  }

  const safeZone = calculateSafeZoneBoundaries(screenWidth, screenHeight, bounds);

  return (
    markerPosition.x >= safeZone.minX &&
    markerPosition.x <= safeZone.maxX &&
    markerPosition.y >= safeZone.minY &&
    markerPosition.y <= safeZone.maxY
  );
}

/**
 * Determine if header should be hidden based on marker occlusion and visibility mode
 */
export function shouldHideHeader(
  markerPosition: MarkerScreenPosition,
  visibilityMode: 'fix' | 'manual' | 'auto',
  headerVisible: boolean
): boolean {
  if (visibilityMode === 'fix') {
    return false; // Always show header in fix mode
  }

  if (visibilityMode === 'manual') {
    return !headerVisible; // User controls visibility
  }

  // Auto mode: hide if header occludes marker
  if (visibilityMode === 'auto') {
    return markerPosition.occlusion === 'header';
  }

  return false;
}

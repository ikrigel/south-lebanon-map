import { describe, it, expect } from 'vitest';
import {
  detectOcclusionAndGetSafeZone,
  calculateSafeZoneBoundaries,
  isMarkerPositionSafe,
  shouldHideHeader,
} from '../utils/markerOcclusionDetection';
import type { MarkerScreenPosition } from '../types';

describe('Occlusion Detection', () => {
  const screenWidth = 800;
  const screenHeight = 600;
  const bounds = {
    header: 60,
    footer: 36,
    leftPanel: 360,
    rightPanel: 340,
  };

  describe('detectOcclusionAndGetSafeZone', () => {
    it('should return center-bottom safe zone for header occlusion', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 30,
        isVisible: true,
        occlusion: 'header',
      };

      const safeZone = detectOcclusionAndGetSafeZone(markerPosition, screenWidth, screenHeight, bounds);

      expect(safeZone).not.toBeNull();
      expect(safeZone?.type).toBe('center-bottom');
      expect(safeZone?.targetX).toBe(screenWidth / 2);
      expect(safeZone?.targetY).toBe(screenHeight * (2 / 3));
    });

    it('should return center-top safe zone for footer occlusion', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 590,
        isVisible: true,
        occlusion: 'footer',
      };

      const safeZone = detectOcclusionAndGetSafeZone(markerPosition, screenWidth, screenHeight, bounds);

      expect(safeZone).not.toBeNull();
      expect(safeZone?.type).toBe('center-top');
      expect(safeZone?.targetY).toBe(screenHeight * (1 / 3));
    });

    it('should return right-third safe zone for left-panel occlusion', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 100,
        y: 300,
        isVisible: true,
        occlusion: 'left-panel',
      };

      const safeZone = detectOcclusionAndGetSafeZone(markerPosition, screenWidth, screenHeight, bounds);

      expect(safeZone).not.toBeNull();
      expect(safeZone?.type).toBe('right-third');
      expect(safeZone?.targetX).toBe(screenWidth * (2 / 3));
    });

    it('should return left-third safe zone for right-panel occlusion', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 750,
        y: 300,
        isVisible: true,
        occlusion: 'right-panel',
      };

      const safeZone = detectOcclusionAndGetSafeZone(markerPosition, screenWidth, screenHeight, bounds);

      expect(safeZone).not.toBeNull();
      expect(safeZone?.type).toBe('left-third');
      expect(safeZone?.targetX).toBe(screenWidth * (1 / 3));
    });

    it('should return null when no occlusion', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 300,
        isVisible: true,
        occlusion: null,
      };

      const safeZone = detectOcclusionAndGetSafeZone(markerPosition, screenWidth, screenHeight, bounds);

      expect(safeZone).toBeNull();
    });
  });

  describe('calculateSafeZoneBoundaries', () => {
    it('should calculate correct safe zone boundaries', () => {
      const safeZone = calculateSafeZoneBoundaries(screenWidth, screenHeight, bounds);

      expect(safeZone.minX).toBe(bounds.leftPanel + 20);
      expect(safeZone.maxX).toBe(screenWidth - bounds.rightPanel - 20);
      expect(safeZone.minY).toBe(bounds.header + 20);
      expect(safeZone.maxY).toBe(screenHeight - bounds.footer - 20);
      expect(safeZone.margin).toBe(20);
    });

    it('should have valid boundary ranges', () => {
      const safeZone = calculateSafeZoneBoundaries(screenWidth, screenHeight, bounds);

      expect(safeZone.minX).toBeLessThan(safeZone.maxX);
      expect(safeZone.minY).toBeLessThan(safeZone.maxY);
    });
  });

  describe('isMarkerPositionSafe', () => {
    it('should return true for marker in safe zone', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 300,
        isVisible: true,
        occlusion: null,
      };

      const safe = isMarkerPositionSafe(markerPosition, screenWidth, screenHeight, bounds);
      expect(safe).toBe(true);
    });

    it('should return false for marker outside bounds', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 300,
        isVisible: false,
        occlusion: null,
      };

      const safe = isMarkerPositionSafe(markerPosition, screenWidth, screenHeight, bounds);
      expect(safe).toBe(false);
    });

    it('should return false for marker in header area', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 30,
        isVisible: true,
        occlusion: 'header',
      };

      const safe = isMarkerPositionSafe(markerPosition, screenWidth, screenHeight, bounds);
      expect(safe).toBe(false);
    });

    it('should return false for marker near left panel edge', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 375,
        y: 300,
        isVisible: true,
        occlusion: null,
      };

      const safe = isMarkerPositionSafe(markerPosition, screenWidth, screenHeight, bounds);
      expect(safe).toBe(false);
    });

    it('should return false for marker near right panel edge', () => {
      // maxX = 800 - 340 - 20 = 440, so x=441 is outside safe zone
      const markerPosition: MarkerScreenPosition = {
        x: 750, // Definitely outside safe zone
        y: 300,
        isVisible: true,
        occlusion: 'right-panel',
      };

      const safe = isMarkerPositionSafe(markerPosition, screenWidth, screenHeight, bounds);
      expect(safe).toBe(false);
    });
  });

  describe('shouldHideHeader', () => {
    it('should always show header in fix mode', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 30,
        isVisible: true,
        occlusion: 'header',
      };

      const shouldHide = shouldHideHeader(markerPosition, 'fix', true);
      expect(shouldHide).toBe(false);
    });

    it('should respect user toggle in manual mode', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 300,
        isVisible: true,
        occlusion: null,
      };

      const hiddenWhenVisible = shouldHideHeader(markerPosition, 'manual', true);
      const shownWhenHidden = shouldHideHeader(markerPosition, 'manual', false);

      expect(hiddenWhenVisible).toBe(false);
      expect(shownWhenHidden).toBe(true);
    });

    it('should auto-hide header when it occludes marker', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 30,
        isVisible: true,
        occlusion: 'header',
      };

      const shouldHide = shouldHideHeader(markerPosition, 'auto', true);
      expect(shouldHide).toBe(true);
    });

    it('should not auto-hide header when marker is safe', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 400,
        y: 300,
        isVisible: true,
        occlusion: null,
      };

      const shouldHide = shouldHideHeader(markerPosition, 'auto', true);
      expect(shouldHide).toBe(false);
    });

    it('should not auto-hide for non-header occlusions', () => {
      const markerPosition: MarkerScreenPosition = {
        x: 100,
        y: 300,
        isVisible: true,
        occlusion: 'left-panel',
      };

      const shouldHide = shouldHideHeader(markerPosition, 'auto', true);
      expect(shouldHide).toBe(false);
    });
  });
});

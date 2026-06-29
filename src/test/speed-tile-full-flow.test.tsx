import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// Mock MiniOverlay component to test speed display
const MockMiniOverlay = ({ currentSpeed, liveLocation, miniOverlayOpen }: any) => {
  if (!miniOverlayOpen) return null;

  // Simulate the speed tile rendering logic
  const speedValue = currentSpeed ?? liveLocation?.speed ?? null;
  const speedInKmh = (speedValue !== null && speedValue !== undefined && speedValue >= 0)
    ? Math.round(speedValue)
    : null;

  return (
    <div data-testid="mini-overlay">
      <div data-testid="speed-tile">
        <small>⚡ מהירות</small>
        <b>{speedInKmh !== null ? `${speedInKmh} קמ״ש` : '—'}</b>
      </div>
    </div>
  );
};

describe('Speed Tile Display - Full Flow Simulation', () => {
  describe('Speed calculations and display', () => {
    it('should display 18 km/h speed correctly', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={18}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 18 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log('[TEST] 18 km/h display:', speedDisplay);
      expect(speedDisplay).toContain('18 קמ״ש');
    });

    it('should display 20 km/h speed correctly', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={20}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 20 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log('[TEST] 20 km/h display:', speedDisplay);
      expect(speedDisplay).toContain('20 קמ״ש');
    });

    it('should display 0.1 km/h (ultra-low speed)', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={0.1}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 0.1 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log('[TEST] 0.1 km/h display:', speedDisplay);
      expect(speedDisplay).toContain('0 קמ״ש');
    });

    it('should display 1.5 km/h (slow walking)', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={1.5}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 1.5 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log('[TEST] 1.5 km/h display:', speedDisplay);
      expect(speedDisplay).toContain('2 קמ״ש');
    });

    it('should display 0 km/h (standing still)', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={0}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 0 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log('[TEST] 0 km/h display:', speedDisplay);
      expect(speedDisplay).toContain('0 קמ״ש');
    });

    it('should show dash when speed is null', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={null}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: null }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log('[TEST] null speed display:', speedDisplay);
      expect(speedDisplay).toContain('—');
    });

    it('should show dash when speed is undefined', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={undefined}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: undefined }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log('[TEST] undefined speed display:', speedDisplay);
      expect(speedDisplay).toContain('—');
    });
  });

  describe('Prop priority and fallback', () => {
    it('should use currentSpeed prop if provided', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={25}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 10 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log('[TEST] currentSpeed priority:', speedDisplay);
      expect(speedDisplay).toContain('25 קמ״ש');
    });

    it('should fallback to liveLocation.speed if currentSpeed undefined', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={undefined}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 15 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log('[TEST] liveLocation.speed fallback:', speedDisplay);
      expect(speedDisplay).toContain('15 קמ״ש');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle slow walking (1 km/h)', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={1}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 1 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log(`[TEST-WALK] 1 km/h → ${speedDisplay}`);
      expect(speedDisplay).toContain('1 קמ״ש');
    });

    it('should handle normal walking (2 km/h)', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={2}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 2 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log(`[TEST-WALK] 2 km/h → ${speedDisplay}`);
      expect(speedDisplay).toContain('2 קמ״ש');
    });

    it('should handle vehicle speed (50 km/h)', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={50}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 50 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log(`[TEST-VEHICLE] 50 km/h → ${speedDisplay}`);
      expect(speedDisplay).toContain('50 קמ״ש');
    });

    it('should handle high speed (100 km/h)', () => {
      const { getByTestId } = render(
        <MockMiniOverlay
          currentSpeed={100}
          liveLocation={{ lat: 33.47, lon: 35.12, speed: 100 }}
          miniOverlayOpen={true}
        />
      );

      const speedDisplay = getByTestId('speed-tile').textContent;
      console.log(`[TEST-VEHICLE] 100 km/h → ${speedDisplay}`);
      expect(speedDisplay).toContain('100 קמ״ש');
    });
  });
});

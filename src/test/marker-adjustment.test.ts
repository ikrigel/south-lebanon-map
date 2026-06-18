import { describe, it, expect } from 'vitest';

// Bearing-aware target position calculation (from useMarkerAdjustment)
function getBearingAwareTarget(bearing: number, screenWidth: number, screenHeight: number): { targetX: number; targetY: number } {
  const normalizedBearing = ((bearing % 360) + 360) % 360;

  let targetX = screenWidth / 2;
  let targetY = screenHeight * (2 / 3);

  if (normalizedBearing > 45 && normalizedBearing <= 135) {
    targetX = screenWidth * (2 / 3);
    targetY = screenHeight / 2;
  } else if (normalizedBearing > 135 && normalizedBearing <= 225) {
    targetX = screenWidth / 2;
    targetY = screenHeight * (1 / 3);
  } else if (normalizedBearing > 225 && normalizedBearing <= 315) {
    targetX = screenWidth * (1 / 3);
    targetY = screenHeight / 2;
  }

  return { targetX, targetY };
}

describe('Marker Adjustment - Bearing-Aware Target Position', () => {
  const screenWidth = 800;
  const screenHeight = 600;

  it('should place marker in lower third at 0° bearing (North)', () => {
    const { targetX, targetY } = getBearingAwareTarget(0, screenWidth, screenHeight);

    expect(targetX).toBe(screenWidth / 2);
    expect(targetY).toBe(screenHeight * (2 / 3));
  });

  it('should place marker in right third at 90° bearing (East)', () => {
    const { targetX, targetY } = getBearingAwareTarget(90, screenWidth, screenHeight);

    expect(targetX).toBe(screenWidth * (2 / 3));
    expect(targetY).toBe(screenHeight / 2);
  });

  it('should place marker in upper third at 180° bearing (South)', () => {
    const { targetX, targetY } = getBearingAwareTarget(180, screenWidth, screenHeight);

    expect(targetX).toBe(screenWidth / 2);
    expect(targetY).toBe(screenHeight * (1 / 3));
  });

  it('should place marker in left third at 270° bearing (West)', () => {
    const { targetX, targetY } = getBearingAwareTarget(270, screenWidth, screenHeight);

    expect(targetX).toBe(screenWidth * (1 / 3));
    expect(targetY).toBe(screenHeight / 2);
  });

  it('should handle bearing > 360°', () => {
    const target360 = getBearingAwareTarget(0, screenWidth, screenHeight);
    const target400 = getBearingAwareTarget(400, screenWidth, screenHeight);

    expect(target400.targetX).toBe(target360.targetX);
    expect(target400.targetY).toBe(target360.targetY);
  });

  it('should handle negative bearing', () => {
    const targetPos = getBearingAwareTarget(-90, screenWidth, screenHeight);
    const target270 = getBearingAwareTarget(270, screenWidth, screenHeight);

    expect(targetPos.targetX).toBe(target270.targetX);
    expect(targetPos.targetY).toBe(target270.targetY);
  });

  it('should calculate correct delta between actual and target', () => {
    const { targetX, targetY } = getBearingAwareTarget(0, screenWidth, screenHeight);
    const actualX = 300;
    const actualY = 200;

    const deltaX = targetX - actualX;
    const deltaY = targetY - actualY;
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    expect(deltaX).toBe(100); // 400 - 300
    expect(deltaY).toBe(200); // 400 - 200
    expect(delta).toBeGreaterThan(0);
  });

  it('should detect adjustment needed when delta exceeds tolerance', () => {
    const tolerance = 5;
    const { targetX, targetY } = getBearingAwareTarget(0, screenWidth, screenHeight);
    const actualX = 300;
    const actualY = 200;

    const deltaX = targetX - actualX;
    const deltaY = targetY - actualY;
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const needsAdjustment = delta > tolerance;
    expect(needsAdjustment).toBe(true);
  });

  it('should not detect adjustment needed when delta within tolerance', () => {
    const tolerance = 5;
    const { targetX, targetY } = getBearingAwareTarget(0, screenWidth, screenHeight);
    const actualX = Math.round(targetX);
    const actualY = Math.round(targetY);

    const deltaX = targetX - actualX;
    const deltaY = targetY - actualY;
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const needsAdjustment = delta > tolerance;
    expect(needsAdjustment).toBe(false);
  });

  it('should handle intermediate bearing values', () => {
    const { targetX, targetY } = getBearingAwareTarget(45, screenWidth, screenHeight);

    // At 45°, should be in lower third (default range)
    expect(targetX).toBe(screenWidth / 2);
    expect(targetY).toBe(screenHeight * (2 / 3));
  });

  it('should handle edge case bearings', () => {
    // Bearing 0: North (lower-third)
    const pos0 = getBearingAwareTarget(0, screenWidth, screenHeight);
    expect(pos0.targetY).toBe(screenHeight * (2 / 3));

    // Bearing 46: East side (right-third, since > 45 and <= 135)
    const pos46 = getBearingAwareTarget(46, screenWidth, screenHeight);
    expect(pos46.targetX).toBe(screenWidth * (2 / 3));
    expect(pos46.targetY).toBe(screenHeight / 2);

    // Bearing 136: South side (upper-third, since > 135 and <= 225)
    const pos136 = getBearingAwareTarget(136, screenWidth, screenHeight);
    expect(pos136.targetY).toBe(screenHeight * (1 / 3));

    // Bearing 226: West side (left-third, since > 225 and <= 315)
    const pos226 = getBearingAwareTarget(226, screenWidth, screenHeight);
    expect(pos226.targetX).toBe(screenWidth * (1 / 3));

    // Bearing 315: West side (left-third, since > 225 and <= 315)
    const pos315 = getBearingAwareTarget(315, screenWidth, screenHeight);
    expect(pos315.targetX).toBe(screenWidth * (1 / 3));

    // Bearing 359: Almost full circle (lower-third, since > 315)
    const pos359 = getBearingAwareTarget(359, screenWidth, screenHeight);
    expect(pos359.targetY).toBe(screenHeight * (2 / 3));
  });
});

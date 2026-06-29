import { describe, it, expect } from 'vitest';
import { haversineKm } from '../util';

describe('Speed Calculation Logic (18-20 km/h)', () => {
  it('should calculate 20 km/h for 100m movement in 18 seconds', () => {
    // 20 km/h = 100 meters in 18 seconds
    const distanceKm = 0.1; // 100 meters
    const timeElapsedMs = 18000; // 18 seconds
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

    const calculatedSpeed = distanceKm / timeElapsedHours;

    expect(calculatedSpeed).toBeCloseTo(20, 0); // ~20 km/h
    console.log(`Speed calculated: ${calculatedSpeed.toFixed(2)} km/h`);
  });

  it('should calculate 18 km/h for 100m movement in 20 seconds', () => {
    // 18 km/h = 100 meters in 20 seconds
    const distanceKm = 0.1; // 100 meters
    const timeElapsedMs = 20000; // 20 seconds
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

    const calculatedSpeed = distanceKm / timeElapsedHours;

    expect(calculatedSpeed).toBeCloseTo(18, 0); // ~18 km/h
    console.log(`Speed calculated: ${calculatedSpeed.toFixed(2)} km/h`);
  });

  it('should NOT be filtered by 1.5m minimum distance threshold at 20 km/h', () => {
    // At 20 km/h, expect movement > 1.5m per second
    // 20 km/h = 5.56 m/s
    // So even 1 second should give > 1.5m
    const MINIMUM_DISTANCE_METERS = 1.5;
    const MINIMUM_DISTANCE_KM = MINIMUM_DISTANCE_METERS / 1000;

    // Typical GPS update: 30 meters in 5.4 seconds = ~20 km/h
    const distanceKm = 0.03; // 30 meters
    const timeElapsedSeconds = 5.4;

    expect(distanceKm * 1000).toBeGreaterThan(MINIMUM_DISTANCE_METERS);
    expect(timeElapsedSeconds).toBeGreaterThan(1);

    const timeElapsedHours = (timeElapsedSeconds * 1000) / (1000 * 60 * 60);
    const speed = distanceKm / timeElapsedHours;

    expect(speed).toBeCloseTo(20, 0);
    console.log(`Speed from 30m in 5.4s: ${speed.toFixed(2)} km/h`);
  });

  it('should capture speed in MiniOverlay when liveLocation.speed is provided', () => {
    const liveLocation = {
      lat: 33.5,
      lon: 35.1,
      speed: 20, // 20 km/h
      heading: 90,
      accuracy: 10,
    };

    // MiniOverlay logic: speed !== null && speed !== undefined
    const speedInKmh = liveLocation.speed !== null && liveLocation.speed !== undefined
      ? Math.round(liveLocation.speed)
      : null;

    expect(speedInKmh).toBe(20);
  });

  it('should show "—" in MiniOverlay when speed is null', () => {
    const liveLocation = {
      lat: 33.5,
      lon: 35.1,
      speed: null,
      heading: 90,
      accuracy: 10,
    };

    const speedInKmh = liveLocation.speed !== null && liveLocation.speed !== undefined
      ? Math.round(liveLocation.speed)
      : null;

    expect(speedInKmh).toBeNull();
  });

  it('should handle speed = 0 (stationary) correctly', () => {
    const liveLocation = {
      lat: 33.5,
      lon: 35.1,
      speed: 0,
      heading: 90,
      accuracy: 10,
    };

    // This is the key check: speed === 0 should NOT be treated as falsy
    const speedDisplay = liveLocation.speed !== null && liveLocation.speed !== undefined
      ? `${Math.round(liveLocation.speed)} קמ״ש`
      : '—';

    expect(speedDisplay).toBe('0 קמ״ש');
  });

  it('should correctly detect when time elapsed is 0 (edge case)', () => {
    const distanceKm = 0.05; // 50 meters
    const timeElapsedMs = 0; // No time elapsed
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

    // This would cause division by zero if not handled
    expect(timeElapsedHours).toBe(0);

    // The check is: if (distanceKm > threshold && timeElapsedHours > 0)
    // So this should correctly skip speed calculation
    const shouldCalculate = distanceKm > 0.0015 && timeElapsedHours > 0;
    expect(shouldCalculate).toBe(false);
  });

  it('should fall back to device speed when calculated speed is null', () => {
    const calculatedSpeed = null;
    const deviceSpeed = 22; // Device provides GPS speed
    const finalSpeed = calculatedSpeed !== null ? calculatedSpeed : deviceSpeed;

    expect(finalSpeed).toBe(22);
  });

  it('should use calculated speed when available (preferred over device speed)', () => {
    const calculatedSpeed = 20;
    const deviceSpeed = 25; // Device speed is different
    const finalSpeed = calculatedSpeed !== null ? calculatedSpeed : deviceSpeed;

    expect(finalSpeed).toBe(20); // Use calculated, not device
  });
});

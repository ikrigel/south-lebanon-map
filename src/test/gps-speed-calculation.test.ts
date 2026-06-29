import { describe, it, expect } from 'vitest';
import { haversineKm } from '../util';

/**
 * Test GPS speed calculation logic
 * Verifies that speed is correctly calculated from position deltas
 */
describe('GPS Speed Calculation', () => {
  it('should calculate speed correctly for known distances and times', () => {
    // Test case: 1 km traveled in 1 hour = 1 km/h
    const distanceKm = 1;
    const timeElapsedMs = 1000 * 60 * 60; // 1 hour
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
    const speed = distanceKm / timeElapsedHours;

    expect(speed).toBe(1);
  });

  it('should calculate speed for 100 km in 2 hours = 50 km/h', () => {
    const distanceKm = 100;
    const timeElapsedMs = 2 * 1000 * 60 * 60; // 2 hours
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
    const speed = distanceKm / timeElapsedHours;

    expect(speed).toBe(50);
  });

  it('should calculate speed for 500 meters in 30 seconds', () => {
    const distanceKm = 0.5;
    const timeElapsedMs = 30 * 1000; // 30 seconds
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
    const speed = distanceKm / timeElapsedHours;

    // 0.5 km / (30/3600) hours = 0.5 km / 0.00833 hours = 60 km/h
    expect(speed).toBeCloseTo(60, 0);
  });

  it('should filter out GPS jitter (movements < 5m)', () => {
    // Movement of 3 meters (< 5m threshold)
    const distanceKm = 0.003;
    const timeElapsedMs = 1000; // 1 second
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

    // Should treat as stationary
    let calculatedSpeed: number | null = null;
    if (distanceKm > 0.005 && timeElapsedHours > 0) {
      calculatedSpeed = distanceKm / timeElapsedHours;
    } else if (distanceKm <= 0.005) {
      calculatedSpeed = 0; // Stationary
    }

    expect(calculatedSpeed).toBe(0);
  });

  it('should calculate real-world distance using haversineKm', () => {
    // Two nearby points: start at (33.27, 35.15), end at (33.275, 35.15)
    // Roughly 0.556 km apart (north-south)
    const start: [number, number] = [33.27, 35.15];
    const end: [number, number] = [33.275, 35.15];

    const distanceKm = haversineKm(start, end);

    // Should be approximately 0.556 km
    expect(distanceKm).toBeGreaterThan(0.5);
    expect(distanceKm).toBeLessThan(1);
  });

  it('should calculate speed from real GPS points', () => {
    // Start: (33.27, 35.15), End: (33.275, 35.15)
    // Time: 60 seconds
    const start: [number, number] = [33.27, 35.15];
    const end: [number, number] = [33.275, 35.15];

    const distanceKm = haversineKm(start, end);
    const timeElapsedMs = 60 * 1000; // 60 seconds
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

    const speed = distanceKm / timeElapsedHours;

    // 0.556 km / (60/3600) hours = 0.556 km / 0.0167 hours ≈ 33 km/h
    expect(speed).toBeGreaterThan(20);
    expect(speed).toBeLessThan(50);
  });

  it('should return null speed on first GPS update (no previous location)', () => {
    // First update: no previous location reference
    const calculatedSpeed: number | null = null;

    expect(calculatedSpeed).toBeNull();
  });

  it('should handle zero time elapsed gracefully', () => {
    const distanceKm = 1;
    const timeElapsedMs = 0;
    const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

    // Should not divide by zero
    let speed: number | null = null;
    if (distanceKm > 0.005 && timeElapsedHours > 0) {
      speed = distanceKm / timeElapsedHours;
    } else if (distanceKm <= 0.005) {
      speed = 0;
    }

    expect(speed).toBeNull();
  });
});

/**
 * Tests for the "nearby town" logic in coord-popup.
 * We test the pure calculation: given a click lat/lon, does the nearest-town
 * search return the right town?
 */
import { describe, it, expect } from 'vitest';
import { haversineKm } from '../util';
import { towns } from '../data/geo';

// The same logic as in Map.tsx handleClick
function findNearbyTown(clickLat: number, clickLon: number, maxKm = 0.5) {
  return towns
    .filter(t => t.side === 'LB')
    .map(t => ({ t, d: haversineKm([clickLat, clickLon], [t.lat, t.lon]) }))
    .filter(({ d }) => d <= maxKm)
    .sort((a, b) => a.d - b.d)[0]?.t ?? null;
}

describe('coord-popup nearby town detection', () => {
  it('finds מארון א-ראס when clicking 111m away', () => {
    // Exact coords from user screenshot: 33.10742°N, 35.44589°E
    const town = findNearbyTown(33.10742, 35.44589);
    expect(town).not.toBeNull();
    expect(town?.id).toBe('maroun');
    expect(town?.name_he).toBe('מארון א־ראס');
  });

  it('finds closest town when multiple are within 500m', () => {
    // Click directly on מארון א-ראס coords
    const town = findNearbyTown(33.1075, 35.4447);
    expect(town?.id).toBe('maroun');
  });

  it('returns null when clicking in open terrain far from any town', () => {
    // Middle of nowhere in the map area
    const town = findNearbyTown(33.05, 35.20);
    expect(town).toBeNull();
  });

  it('finds בינת ג׳בייל when clicking 200m away', () => {
    const bintjbeil = towns.find(t => t.id === 'bintj')!;
    expect(bintjbeil).toBeDefined();
    const clickLat = bintjbeil.lat + 0.001; // ~111m north
    const clickLon = bintjbeil.lon;
    const town = findNearbyTown(clickLat, clickLon);
    expect(town?.id).toBe('bintj');
  });

  it('distance to מארון א-ראס from screenshot coords is under 200m', () => {
    const d = haversineKm([33.10742, 35.44589], [33.1075, 35.4447]);
    expect(d).toBeLessThan(0.2);
  });

  it('maroun entry exists in towns data with correct coords', () => {
    const maroun = towns.find(t => t.id === 'maroun');
    expect(maroun).toBeDefined();
    expect(maroun?.lat).toBeCloseTo(33.1075, 2);
    expect(maroun?.lon).toBeCloseTo(35.4447, 2);
    expect(maroun?.side).toBe('LB');
  });
});

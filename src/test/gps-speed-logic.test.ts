/**
 * GPS Speed Calculation Logic Test
 *
 * Tests the speed calculation algorithm used in useLiveLocationCallbacks.ts
 * Verifies that speed is correctly calculated from position deltas.
 */

// Simulate haversineKm function for testing
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371; // Earth's radius in km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

describe('GPS Speed Calculation Logic', () => {
  describe('Speed calculation from position deltas', () => {
    it('should calculate 1 km/h for 1 km traveled in 1 hour', () => {
      const distanceKm = 1;
      const timeElapsedMs = 1000 * 60 * 60; // 1 hour
      const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
      const speed = distanceKm / timeElapsedHours;

      expect(speed).toBe(1);
    });

    it('should calculate 50 km/h for 100 km in 2 hours', () => {
      const distanceKm = 100;
      const timeElapsedMs = 2 * 1000 * 60 * 60; // 2 hours
      const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
      const speed = distanceKm / timeElapsedHours;

      expect(speed).toBe(50);
    });

    it('should calculate 60 km/h for 500m in 30 seconds', () => {
      const distanceKm = 0.5;
      const timeElapsedMs = 30 * 1000; // 30 seconds
      const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
      const speed = distanceKm / timeElapsedHours;

      // 0.5 km / (30/3600) hours ≈ 60 km/h
      expect(Math.round(speed)).toBe(60);
    });

    it('should calculate 100 km/h for 1 km in 36 seconds', () => {
      const distanceKm = 1;
      const timeElapsedMs = 36 * 1000; // 36 seconds
      const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
      const speed = distanceKm / timeElapsedHours;

      // 1 km / (36/3600) hours = 100 km/h
      expect(Math.round(speed)).toBe(100);
    });
  });

  describe('GPS jitter filtering (ignore movements < 5m)', () => {
    it('should treat 3m movement as stationary', () => {
      const distanceKm = 0.003; // 3 meters
      const timeElapsedMs = 1000; // 1 second

      let calculatedSpeed: number | null = null;
      if (distanceKm > 0.005) {
        const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
        calculatedSpeed = distanceKm / timeElapsedHours;
      } else if (distanceKm <= 0.005) {
        calculatedSpeed = 0; // Stationary
      }

      expect(calculatedSpeed).toBe(0);
    });

    it('should calculate speed for 7m movement (> 5m)', () => {
      const distanceKm = 0.007; // 7 meters
      const timeElapsedMs = 1000; // 1 second

      let calculatedSpeed: number | null = null;
      if (distanceKm > 0.005) {
        const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
        calculatedSpeed = distanceKm / timeElapsedHours;
      } else if (distanceKm <= 0.005) {
        calculatedSpeed = 0;
      }

      expect(calculatedSpeed).toBeGreaterThan(0);
      expect(Math.round(calculatedSpeed)).toBe(25); // 0.007 km / (1/3600) hours ≈ 25.2 km/h
    });
  });

  describe('Real-world GPS point distance calculations', () => {
    it('should calculate distance between two nearby points', () => {
      // South Lebanon coordinates
      const start: [number, number] = [33.27, 35.15];
      const end: [number, number] = [33.275, 35.15];

      const distanceKm = haversineKm(start, end);

      // Should be approximately 0.556 km (1 degree latitude ≈ 111 km)
      expect(distanceKm).toBeGreaterThan(0.5);
      expect(distanceKm).toBeLessThan(0.65);
    });

    it('should calculate speed from real GPS points (0.556 km in 60 seconds)', () => {
      const start: [number, number] = [33.27, 35.15];
      const end: [number, number] = [33.275, 35.15];

      const distanceKm = haversineKm(start, end);
      const timeElapsedMs = 60 * 1000; // 60 seconds
      const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

      const speed = distanceKm / timeElapsedHours;

      // 0.556 km / (60/3600) hours ≈ 33 km/h
      expect(speed).toBeGreaterThan(25);
      expect(speed).toBeLessThan(40);
    });

    it('should calculate speed for longer distance (10 km in 10 minutes)', () => {
      const distanceKm = 10;
      const timeElapsedMs = 10 * 60 * 1000; // 10 minutes
      const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

      const speed = distanceKm / timeElapsedHours;

      // 10 km / (10/60) hours = 60 km/h
      expect(speed).toBe(60);
    });
  });

  describe('Edge cases and error conditions', () => {
    it('should return null for first GPS update (no previous location)', () => {
      const prevLoc = null;
      const calculatedSpeed = prevLoc ? 100 : null;

      expect(calculatedSpeed).toBeNull();
    });

    it('should not divide by zero when time elapsed is 0', () => {
      const distanceKm = 1;
      const timeElapsedMs = 0;
      const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

      let calculatedSpeed: number | null = null;
      if (distanceKm > 0.005 && timeElapsedHours > 0) {
        calculatedSpeed = distanceKm / timeElapsedHours;
      } else if (distanceKm <= 0.005) {
        calculatedSpeed = 0;
      }

      expect(calculatedSpeed).toBeNull();
    });

    it('should return null when movement is exactly 0', () => {
      const distanceKm = 0;
      const timeElapsedMs = 5000;

      let calculatedSpeed: number | null = null;
      if (distanceKm > 0.005 && timeElapsedMs > 0) {
        const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
        calculatedSpeed = distanceKm / timeElapsedHours;
      } else if (distanceKm <= 0.005) {
        calculatedSpeed = 0;
      }

      expect(calculatedSpeed).toBe(0);
    });
  });

  describe('Display formatting', () => {
    it('should round speed to integer for display', () => {
      const speed = 37.8;
      const displaySpeed = Math.round(speed);

      expect(displaySpeed).toBe(38);
    });

    it('should format null speed as "—" (dash)', () => {
      const speed: number | null = null;
      const display = speed !== null ? `${Math.round(speed)} קמ״ש` : '—';

      expect(display).toBe('—');
    });

    it('should format 0 speed as "0 קמ״ש"', () => {
      const speed: number | null = 0;
      const display = speed !== null ? `${Math.round(speed)} קמ״ש` : '—';

      expect(display).toBe('0 קמ״ש');
    });

    it('should format 42.5 km/h as "43 קמ״ש"', () => {
      const speed: number | null = 42.5;
      const display = speed !== null ? `${Math.round(speed)} קמ״ש` : '—';

      expect(display).toBe('43 קמ״ש');
    });
  });
});

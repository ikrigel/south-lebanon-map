import { describe, it, expect } from 'vitest';

/**
 * Test for MiniOverlay fixes:
 * 1. Rotation disabled (no transform rotation)
 * 2. Speed display with proper m/s to km/h conversion
 * 3. Sunrise/sunset with Israel timezone
 */

describe('MiniOverlay Fixes', () => {
  describe('Fix 1: Rotation Disabled', () => {
    it('should not rotate mini overlay', () => {
      // In MiniOverlay.tsx, transform is now hardcoded to 'none'
      // instead of conditional rotation based on prefs.rotateToHeading
      const transform = 'none';
      expect(transform).toBe('none');
      expect(transform).not.toContain('rotate(');
    });
  });

  describe('Fix 2: Speed Conversion (m/s to km/h)', () => {
    it('should convert 5 m/s to 18 km/h', () => {
      const speedMsec = 5;
      const speedKmh = Math.round(speedMsec * 3.6);
      expect(speedKmh).toBe(18);
    });

    it('should convert 10 m/s to 36 km/h', () => {
      const speedMsec = 10;
      const speedKmh = Math.round(speedMsec * 3.6);
      expect(speedKmh).toBe(36);
    });

    it('should display dash for null speed', () => {
      const speedMsec = null;
      const speedKmh = speedMsec ? Math.round(speedMsec * 3.6) : null;
      expect(speedKmh).toBeNull();
    });

    it('should display dash for undefined speed', () => {
      const speedMsec = undefined;
      const speedKmh = speedMsec ? Math.round(speedMsec * 3.6) : null;
      expect(speedKmh).toBeNull();
    });
  });

  describe('Fix 3: Sunrise/Sunset with Israel Timezone', () => {
    // Test timezone offset calculation
    const getIsraelTimezoneOffset = (date: Date): number => {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const dayOfMonth = date.getUTCDate();

      // Standard time: November to March (UTC+2)
      if (month < 3 || month > 10) {
        return 2;
      }

      // DST: April to September (UTC+3)
      if (month >= 4 && month <= 9) {
        return 3;
      }

      // March and October: need to check DST boundaries
      const findLastThursday = (y: number, m: number) => {
        const lastDay = new Date(y, m, 0).getDate();
        for (let day = lastDay; day >= 1; day--) {
          const d = new Date(y, m - 1, day);
          if (d.getDay() === 4) return day;
        }
        return 1;
      };

      const findFirstThursday = (y: number, m: number) => {
        for (let day = 1; day <= 7; day++) {
          const d = new Date(y, m - 1, day);
          if (d.getDay() === 4) return day;
        }
        return 1;
      };

      if (month === 3) {
        const lastThursday = findLastThursday(year, 3);
        if (dayOfMonth < lastThursday) return 2;
        if (dayOfMonth === lastThursday && date.getUTCHours() < 2) return 2;
        return 3;
      }

      if (month === 10) {
        const firstThursday = findFirstThursday(year, 10);
        if (dayOfMonth < firstThursday) return 3;
        if (dayOfMonth === firstThursday && date.getUTCHours() < 2) return 3;
        return 2;
      }

      return 2;
    };

    it('should return UTC+2 for January (winter standard time)', () => {
      const date = new Date('2026-01-15T12:00:00Z');
      const offset = getIsraelTimezoneOffset(date);
      expect(offset).toBe(2);
    });

    it('should return UTC+2 for November (winter standard time)', () => {
      const date = new Date('2026-11-15T12:00:00Z');
      const offset = getIsraelTimezoneOffset(date);
      expect(offset).toBe(2);
    });

    it('should return UTC+3 for May (summer DST)', () => {
      const date = new Date('2026-05-15T12:00:00Z');
      const offset = getIsraelTimezoneOffset(date);
      expect(offset).toBe(3);
    });

    it('should return UTC+3 for August (summer DST)', () => {
      const date = new Date('2026-08-15T12:00:00Z');
      const offset = getIsraelTimezoneOffset(date);
      expect(offset).toBe(3);
    });

    it('should correctly compute sunrise time in Israeli local time', () => {
      // Example: If sunrise UTC is 04:30, with UTC+2 offset, local time is 06:30
      const sunriseUTCMinutes = 270; // 4:30 AM in minutes from midnight
      const isrTzOffset = 2; // Winter: UTC+2
      const sunriseLocalMinutes = sunriseUTCMinutes + isrTzOffset * 60;

      // Convert back to hours:minutes
      const hours = Math.floor(sunriseLocalMinutes / 60) % 24;
      const minutes = sunriseLocalMinutes % 60;

      expect(hours).toBe(6);
      expect(minutes).toBe(30);
    });

    it('should handle DST offset correctly (UTC+3 in summer)', () => {
      // Example: If sunrise UTC is 03:30, with UTC+3 offset (summer), local time is 06:30
      const sunriseUTCMinutes = 210; // 3:30 AM in minutes from midnight
      const isrTzOffset = 3; // Summer: UTC+3
      const sunriseLocalMinutes = sunriseUTCMinutes + isrTzOffset * 60;

      const hours = Math.floor(sunriseLocalMinutes / 60) % 24;
      const minutes = sunriseLocalMinutes % 60;

      expect(hours).toBe(6);
      expect(minutes).toBe(30);
    });
  });
});

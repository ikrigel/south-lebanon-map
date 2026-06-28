import { useState, useEffect } from 'react';
import type { SunTimes } from '../types';

/**
 * Calculate sunrise and sunset times for a given latitude and longitude
 * Uses simplified algorithm (good enough for military navigation)
 */
export const useSunTimes = (lat: number | null, lon: number | null): SunTimes | null => {
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);

  useEffect(() => {
    if (lat === null || lon === null) {
      setSunTimes(null);
      return;
    }

    // Simplified sunrise/sunset calculation (SPA algorithm simplified)
    const now = new Date();
    const J2000 = 2451545.0; // Julian Day number for 2000-01-01
    const JD = now.getTime() / 86400000 + 2440587.5; // Current Julian Day
    const n = JD - J2000 - 0.0008; // Days since J2000

    // Mean solar time
    const J = n - lon / 360;

    // Solar mean anomaly (degrees)
    const M = (357.52910 + 35999.05030 * (n / 36525)) % 360;
    const Mrad = (M * Math.PI) / 180;

    // Equation of center
    const C =
      (1.91460 - 0.004817 * (n / 36525) - 0.000014 * ((n / 36525) ** 2)) * Math.sin(Mrad) +
      (0.019993 - 0.000101 * (n / 36525)) * Math.sin(2 * Mrad) +
      0.00029 * Math.sin(3 * Mrad);

    // Sun's true longitude
    const lambda = (280.46645 + 36000.76983 * (n / 36525) + C) % 360;

    // Sun's declination
    const eps = (23.439291 - 0.0130041 * (n / 36525)) * (Math.PI / 180);
    const lambda_rad = (lambda * Math.PI) / 180;
    const delta = Math.asin(Math.sin(eps) * Math.sin(lambda_rad));

    // Hour angle at sunrise/sunset
    const lat_rad = (lat * Math.PI) / 180;
    const cosH =
      -Math.tan(lat_rad) * Math.tan(delta);

    // Clamp to valid range
    const H =
      cosH > 1
        ? Math.PI // No sunrise/sunset (polar night)
        : cosH < -1
        ? 0 // No sunset/sunrise (polar day)
        : Math.acos(Math.max(-1, Math.min(1, cosH)));

    // Sunrise/sunset times (in hours from noon UTC)
    const Jrise = J + (H * 180) / (Math.PI * 360) - C / 360;
    const Jset = J - (H * 180) / (Math.PI * 360) - C / 360;

    // Convert to local time
    const timeOffset = now.getTimezoneOffset() * 60000;
    const baseDate = new Date(now);
    baseDate.setHours(12, 0, 0, 0);

    const sunrise = new Date(baseDate.getTime() + (Jrise - Math.floor(Jrise)) * 86400000 - timeOffset);
    const sunset = new Date(baseDate.getTime() + (Jset - Math.floor(Jset)) * 86400000 - timeOffset);

    // Calculate daylight duration
    const daylightMs = sunset.getTime() - sunrise.getTime();
    const daylightDuration = daylightMs / 60000; // in minutes

    setSunTimes({ sunrise, sunset, daylightDuration });
  }, [lat, lon]);

  return sunTimes;
};

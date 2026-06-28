import { useMemo } from 'react';
import type { BearingInfo } from '../types';
import { haversineKm } from '../util';

/**
 * Calculate bearing information to target
 * Returns bearing to target and compass direction
 */
export const useBearingInfo = (
  fromLat: number | null,
  fromLon: number | null,
  toLat: number | null,
  toLon: number | null,
  currentBearing: number | null,
): BearingInfo | null => {
  return useMemo(() => {
    if (fromLat === null || fromLon === null || toLat === null || toLon === null) {
      return null;
    }

    // Calculate bearing to target
    const dLon = (toLon - fromLon) * (Math.PI / 180);
    const lat1 = fromLat * (Math.PI / 180);
    const lat2 = toLat * (Math.PI / 180);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-359

    // Get compass direction
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
    const index = Math.round(bearing / 45) % 8;
    const direction = directions[index];

    // Calculate relative bearing (difference between current bearing and target bearing)
    let relativeBearing = bearing - (currentBearing ?? 0);
    while (relativeBearing > 180) relativeBearing -= 360;
    while (relativeBearing < -180) relativeBearing += 360;

    return {
      toBearing: Math.round(bearing),
      fromBearing: currentBearing ? Math.round(currentBearing) : 0,
      relativeBearing: Math.round(relativeBearing),
      direction,
    };
  }, [fromLat, fromLon, toLat, toLon, currentBearing]);
};

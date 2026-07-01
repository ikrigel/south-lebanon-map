import { useEffect, useRef } from 'react';
import { distanceToPolyline } from '../util';

interface UseRouteDeviationParams {
  navPosition: { lat: number; lon: number } | null;
  liveLocation: { lat: number; lon: number; speed?: number | null } | null;
  activeRoutePath: [number, number][] | null;
  activeRouteId: 'drive' | 'foot' | 'aerial';
  navStartId: string;
  navEndId: string;
  onDeviation: () => void;
  onRouteTypeChange: (id: 'drive' | 'foot') => void;
  showToast: (msg: string) => void;
}

const DEVIATION_THRESHOLD_M = 80;
const RECALC_COOLDOWN_MS = 30_000;
const OFF_ROUTE_TRIGGER_COUNT = 2;
const SPEED_TO_DRIVE_KMH = 8;
const SPEED_TO_FOOT_KMH = 3;

export function useRouteDeviation(params: UseRouteDeviationParams) {
  const offRouteCountRef = useRef(0);
  const lastRecalcAtRef = useRef(0);
  const speedHistoryRef = useRef<(number | null)[]>([]);

  useEffect(() => {
    // Guard: only active during GPS-led navigation
    if (params.navStartId !== 'live-location') return;
    if (!params.navPosition || !params.activeRoutePath || params.activeRoutePath.length < 2) return;
    if (params.activeRouteId === 'aerial') return;

    // A. DEVIATION CHECK
    const devResult = distanceToPolyline(
      [params.navPosition.lat, params.navPosition.lon],
      params.activeRoutePath
    );

    if (devResult.km * 1000 > DEVIATION_THRESHOLD_M) {
      offRouteCountRef.current += 1;
    } else {
      offRouteCountRef.current = 0;
    }

    // B. SPEED → ROUTE TYPE
    if (params.liveLocation?.speed !== undefined && params.liveLocation?.speed !== null) {
      speedHistoryRef.current.push(params.liveLocation.speed);
      if (speedHistoryRef.current.length > 3) {
        speedHistoryRef.current.shift();
      }

      // Switch to drive if moving fast on foot route
      if (params.liveLocation.speed > SPEED_TO_DRIVE_KMH && params.activeRouteId === 'foot') {
        params.onRouteTypeChange('drive');
      }

      // Switch to foot if moving slowly on drive route (all 3 readings < 3 km/h)
      if (
        params.activeRouteId === 'drive' &&
        speedHistoryRef.current.length === 3 &&
        speedHistoryRef.current.every(s => s !== null && s < SPEED_TO_FOOT_KMH)
      ) {
        params.onRouteTypeChange('foot');
      }
    }

    // C. RECALC TRIGGER
    if (offRouteCountRef.current >= OFF_ROUTE_TRIGGER_COUNT) {
      const now = Date.now();
      if (now - lastRecalcAtRef.current >= RECALC_COOLDOWN_MS) {
        lastRecalcAtRef.current = now;
        offRouteCountRef.current = 0;
        params.showToast('מחשב מסלול מחדש...');
        params.onDeviation();
      }
    }
  }, [params.navPosition, params.activeRoutePath]);
}

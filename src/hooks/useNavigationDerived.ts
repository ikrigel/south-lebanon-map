import { useMemo, useEffect } from 'react';
import type { NavPoint, RoadRoute } from '../types';
import { haversineKm, bearingDegrees } from '../util';
import { clean } from '../navigation/turnHelpers';
import { useNavPoints } from './useNavPoints';

interface UseNavigationDerivedProps {
  navStartId: string | null;
  navEndId: string | null;
  navStartQuery: string;
  navEndQuery: string;
  navCustomStart: { lat: number; lon: number } | null;
  navCustomEnd: { lat: number; lon: number } | null;
  liveLocation: { lat: number; lon: number; heading?: number } | null;
  customPois: any[];
  activeSavedRoute: any | null;
  activeRouteOption: any | null;
  navPosition: { lat: number; lon: number } | null;
  lastDistToDestMRef: React.MutableRefObject<number | undefined>;
  recordedTrack: [number, number][];
  towns: any[];
  unifilPoints: any[];
  roadRoute: RoadRoute | null;
  footRoute: RoadRoute | null;
  savedMultiRoutes: any[];
  activeMultiRoute: any | null;
}

export const useNavigationDerived = (props: UseNavigationDerivedProps) => {
  const {
    navStartId, navEndId, navStartQuery, navEndQuery, navCustomStart, navCustomEnd,
    liveLocation, customPois, activeSavedRoute, activeRouteOption, navPosition,
    lastDistToDestMRef, recordedTrack, towns, unifilPoints, roadRoute, footRoute,
    savedMultiRoutes, activeMultiRoute,
  } = props;

  const navPoints = useNavPoints({
    towns,
    unifilPoints,
    customPois,
    roadRoute,
    footRoute,
    savedMultiRoutes,
    activeMultiRoute,
  });

  const routePointMatches = (q: string) => {
    const term = clean(q);
    if (!term) return navPoints.slice(0, 8);
    return navPoints
      .filter(p => clean(`${p.label} ${p.group}`).includes(term))
      .slice(0, 8);
  };

  const startMatches = routePointMatches(navStartQuery);
  const endMatches = routePointMatches(navEndQuery);

  const navStart = useMemo(
    () => navPoints.find(p => p.id === navStartId),
    [navPoints, navStartId],
  );
  const navEnd = useMemo(
    () => navPoints.find(p => p.id === navEndId),
    [navPoints, navEndId],
  );

  const calculatedRoute = useMemo(() => {
    const start = navPoints.find(p => p.id === navStartId) ?? null;
    const end = navPoints.find(p => p.id === navEndId) ?? null;
    if (!start || !end || start.id === end.id) return null;
    const fallbackKm = haversineKm([start.lat, start.lon], [end.lat, end.lon]);
    return {
      start: { lat: start.lat, lon: start.lon, label: start.label },
      end: { lat: end.lat, lon: end.lon, label: end.label },
      km: activeRouteOption?.km ?? fallbackKm,
      durationMin: activeRouteOption?.durationMin,
      path: activeRouteOption?.path,
      instructions: activeRouteOption?.instructions,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navStartId, navEndId, navPoints, activeRouteOption]);

  const navigationRoute = useMemo(() => {
    if (activeSavedRoute) {
      return {
        start: activeSavedRoute.start,
        end: activeSavedRoute.end,
        km: activeSavedRoute.km,
        durationMin: activeSavedRoute.durationMin,
        path: activeSavedRoute.path,
        instructions: activeSavedRoute.instructions,
      };
    }
    return calculatedRoute;
  }, [activeSavedRoute, calculatedRoute]);

  useEffect(() => {
    if (navPosition && navigationRoute) {
      lastDistToDestMRef.current = haversineKm(
        [navPosition.lat, navPosition.lon],
        [navigationRoute.end.lat, navigationRoute.end.lon],
      ) * 1000;
    } else {
      lastDistToDestMRef.current = undefined;
    }
  }, [navPosition, navigationRoute, lastDistToDestMRef]);

  const mapBearing = useMemo(() => {
    if (typeof liveLocation?.heading === 'number' && isFinite(liveLocation.heading)) {
      return liveLocation.heading;
    }
    if (recordedTrack.length >= 2) {
      return bearingDegrees(recordedTrack[recordedTrack.length - 2], recordedTrack[recordedTrack.length - 1]);
    }
    const line = navigationRoute?.path;
    if (line && line.length >= 2) return bearingDegrees(line[0], line[1]);
    if (navigationRoute) {
      return bearingDegrees(
        [navigationRoute.start.lat, navigationRoute.start.lon],
        [navigationRoute.end.lat, navigationRoute.end.lon],
      );
    }
    return 0;
  }, [liveLocation, recordedTrack, navigationRoute]);

  return {
    navPoints,
    navigationRoute,
    mapBearing,
    navStart,
    navEnd,
    startMatches,
    endMatches,
  };
};

import { useMemo, useEffect } from 'react';
import { haversineKm } from '../util';
import { fmtDate, bearingDegrees } from '../util';
import { NAV_SCALES } from '../constants';
import type { NavPoint } from '../types';
import { towns, unifilPoints, terrainFeatures, incidents } from '../data/geo';

interface UseNavigationDerivedProps {
  navStartId: string;
  navEndId: string;
  navCustomStart: { lat: number; lon: number; label: string } | null;
  navCustomEnd: { lat: number; lon: number; label: string } | null;
  liveLocation: { lat: number; lon: number; accuracy?: number; heading?: number } | null;
  customPois: any[];
  activeSavedRoute: any;
  activeRouteOption: any;
  navPosition: any;
  lastDistToDestMRef: React.MutableRefObject<number | undefined>;
  recordedTrack: [number, number][];
  navigationRoute: any;
}

export function useNavigationDerived(props: UseNavigationDerivedProps) {
  // Build navigation points array
  const navPoints = useMemo<NavPoint[]>(() => {
    const townPoints = towns.map(t => ({
      id: `town:${t.id}`,
      label: `${t.name_he} (${t.name_en})`,
      group: t.side === 'LB' ? 'יישובים בלבנון' : 'יישובי ייחוס בישראל',
      lat: t.lat,
      lon: t.lon,
    }));
    const unifilNavPoints = unifilPoints.map(u => ({
      id: `unifil:${u.id}`,
      label: u.name_he,
      group: 'נקודות יוניפי״ל ציבוריות',
      lat: u.lat,
      lon: u.lon,
    }));
    const terrainNavPoints = terrainFeatures.map(f => ({
      id: `terrain:${f.id}`,
      label: `${f.name_he} (${f.name_en})`,
      group: 'רכסים, הרים, נחלים ונהרות',
      lat: f.lat,
      lon: f.lon,
    }));
    const incidentPoints = incidents.map(i => ({
      id: `incident:${i.id}`,
      label: `${fmtDate(i.date)} · ${i.title_he}`,
      group: 'אירועים מדווחים',
      lat: i.lat,
      lon: i.lon,
    }));
    const customPoiPoints = props.customPois.map(p => ({
      id: `poi:${p.id}`,
      label: p.name,
      group: 'נקודות עניין אישיות',
      lat: p.lat,
      lon: p.lon,
    }));
    const customEnd: NavPoint[] = props.navCustomEnd ? [{
      id: 'custom-nav-end',
      label: props.navCustomEnd.label,
      group: 'ניווט מהיר',
      lat: props.navCustomEnd.lat,
      lon: props.navCustomEnd.lon,
    }] : [];
    const customStart: NavPoint[] = props.navCustomStart ? [{
      id: 'custom-nav-start',
      label: props.navCustomStart.label,
      group: 'ניווט מהיר',
      lat: props.navCustomStart.lat,
      lon: props.navCustomStart.lon,
    }] : [];
    const liveNavPoint: NavPoint[] = props.liveLocation ? [{
      id: 'live-location',
      label: 'מיקום נוכחי (GPS)',
      group: 'ניווט מהיר',
      lat: props.liveLocation.lat,
      lon: props.liveLocation.lon,
    }] : [];
    return [...liveNavPoint, ...customStart, ...customEnd, ...customPoiPoints, ...townPoints, ...terrainNavPoints, ...unifilNavPoints, ...incidentPoints];
  }, [props.customPois, props.navCustomEnd, props.navCustomStart, props.liveLocation]);

  const navStart = navPoints.find(p => p.id === props.navStartId) ?? null;
  const navEnd = navPoints.find(p => p.id === props.navEndId) ?? null;

  const calculatedRoute = useMemo(() => {
    const start = navPoints.find(p => p.id === props.navStartId) ?? null;
    const end = navPoints.find(p => p.id === props.navEndId) ?? null;
    if (!start || !end || start.id === end.id) return null;
    const fallbackKm = haversineKm([start.lat, start.lon], [end.lat, end.lon]);
    return {
      start: { lat: start.lat, lon: start.lon, label: start.label },
      end: { lat: end.lat, lon: end.lon, label: end.label },
      km: props.activeRouteOption?.km ?? fallbackKm,
      durationMin: props.activeRouteOption?.durationMin,
      path: props.activeRouteOption?.path,
      instructions: props.activeRouteOption?.instructions,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.navStartId, props.navEndId, navPoints, props.activeRouteOption]);

  const navigationRoute = useMemo(() => {
    if (props.activeSavedRoute) {
      return {
        start: props.activeSavedRoute.start,
        end: props.activeSavedRoute.end,
        km: props.activeSavedRoute.km,
        durationMin: props.activeSavedRoute.durationMin,
        path: props.activeSavedRoute.path,
        instructions: props.activeSavedRoute.instructions,
      };
    }
    return calculatedRoute;
  }, [props.activeSavedRoute, calculatedRoute]);

  useEffect(() => {
    if (props.navPosition && navigationRoute) {
      props.lastDistToDestMRef.current = haversineKm(
        [props.navPosition.lat, props.navPosition.lon],
        [navigationRoute.end.lat, navigationRoute.end.lon],
      ) * 1000;
    } else {
      props.lastDistToDestMRef.current = undefined;
    }
  }, [props.navPosition, navigationRoute, props.lastDistToDestMRef]);

  const mapBearing = useMemo(() => {
    if (typeof props.liveLocation?.heading === 'number' && isFinite(props.liveLocation.heading)) {
      return props.liveLocation.heading;
    }
    if (props.recordedTrack.length >= 2) {
      return bearingDegrees(props.recordedTrack[props.recordedTrack.length - 2], props.recordedTrack[props.recordedTrack.length - 1]);
    }
    const line = navigationRoute?.path;
    if (line && line.length >= 2) return bearingDegrees(line[0], line[1]);
    if (navigationRoute) {
      return bearingDegrees(
        [navigationRoute.start.lat, navigationRoute.start.lon],
        [navigationRoute.end.lat, navigationRoute.end.lon]
      );
    }
    return 0;
  }, [props.liveLocation, props.recordedTrack, navigationRoute]);

  const navFollowZoom = NAV_SCALES.find(s => s.label === props.navStartId)?.zoom ?? 15;

  const routePointMatches = (q: string) => {
    const term = q.toLowerCase().trim();
    if (!term) return navPoints.slice(0, 8);
    return navPoints
      .filter(p => `${p.label} ${p.group}`.toLowerCase().includes(term))
      .slice(0, 8);
  };

  const startMatches = routePointMatches(props.navStartId);
  const endMatches = routePointMatches(props.navEndId);

  return { navPoints, calculatedRoute, navigationRoute, mapBearing, navStart, navEnd, startMatches, endMatches, navFollowZoom };
}

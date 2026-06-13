import { useMemo } from 'react';
import type { NavPoint } from '../types';

interface UseNavPointsDeps {
  towns: any[];
  unifilPoints: any[];
  customPois: any[];
  roadRoute: any;
  footRoute: any;
  savedMultiRoutes: any[];
  activeMultiRoute: any;
}

export const useNavPoints = (deps: UseNavPointsDeps) => {
  return useMemo<NavPoint[]>(() => {
    const pts: NavPoint[] = [];

    deps.towns.forEach(t => {
      pts.push({
        id: `town-${t.id}`,
        label: t.name_he,
        group: 'towns',
        lat: t.lat,
        lon: t.lon,
        type: 'town',
      });
    });

    deps.unifilPoints.forEach((u: any) => {
      pts.push({
        id: `unifil-${u.id}`,
        label: u.name_he,
        group: 'unifil',
        lat: u.lat,
        lon: u.lon,
        type: 'unifil',
      });
    });

    deps.customPois.forEach((p: any) => {
      pts.push({
        id: `poi-${p.id}`,
        label: p.name,
        group: 'pois',
        lat: p.lat,
        lon: p.lon,
        type: 'poi',
      });
    });

    if (deps.roadRoute) {
      pts.push({
        id: `route-road-${Date.now()}`,
        label: `${deps.roadRoute.start.label} ← ${deps.roadRoute.end.label} (נהיגה)`,
        group: 'routes',
        lat: deps.roadRoute.end.lat,
        lon: deps.roadRoute.end.lon,
        type: 'route',
      });
    }

    if (deps.footRoute) {
      pts.push({
        id: `route-foot-${Date.now()}`,
        label: `${deps.footRoute.start.label} ← ${deps.footRoute.end.label} (הליכה)`,
        group: 'routes',
        lat: deps.footRoute.end.lat,
        lon: deps.footRoute.end.lon,
        type: 'route',
      });
    }

    deps.savedMultiRoutes.forEach((r: any, idx: number) => {
      pts.push({
        id: `multi-route-${r.id}`,
        label: r.name || `מסלול מרובה #${idx + 1}`,
        group: 'multi-routes',
        lat: r.points[r.points.length - 1]?.[0] ?? 33.3,
        lon: r.points[r.points.length - 1]?.[1] ?? 35.5,
        type: 'multi-route',
      });
    });

    if (deps.activeMultiRoute) {
      const activePt = deps.activeMultiRoute.points[deps.activeMultiRoute.points.length - 1];
      if (activePt) {
        pts.push({
          id: `active-multi-route-${Date.now()}`,
          label: deps.activeMultiRoute.name || 'מסלול מרובה פעיל',
          group: 'multi-routes',
          lat: activePt[0],
          lon: activePt[1],
          type: 'active-multi-route',
        });
      }
    }

    return pts;
  }, [deps.towns, deps.unifilPoints, deps.customPois, deps.roadRoute, deps.footRoute, deps.savedMultiRoutes, deps.activeMultiRoute]);
};

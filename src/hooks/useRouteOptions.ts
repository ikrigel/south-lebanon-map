import { useMemo } from 'react';
import type { RouteOption, NavPoint } from '../types';
import { computeGeodesicPath } from '../navigation/routeParsers';
import { haversineKm } from '../util';

export const useRouteOptions = ({
  navStart,
  navEnd,
  roadRoute,
  footRoute,
  routeStatus,
  footRouteStatus,
  activeRouteId,
}: {
  navStart: NavPoint | null;
  navEnd: NavPoint | null;
  roadRoute: any;
  footRoute: any;
  routeStatus: 'idle' | 'loading' | 'ready' | 'error';
  footRouteStatus: 'idle' | 'loading' | 'ready' | 'error';
  activeRouteId: string;
}) => {
  const routeOptions: RouteOption[] = useMemo(() => {
    if (!navStart || !navEnd || navStart.id === navEnd.id) return [];
    const aerialKm = haversineKm([navStart.lat, navStart.lon], [navEnd.lat, navEnd.lon]);
    const aerialPath = computeGeodesicPath(
      [navStart.lat, navStart.lon],
      [navEnd.lat, navEnd.lon],
      32,
    );
    return [
      {
        id: 'drive',
        labelHe: 'מסלול כביש',
        km: roadRoute?.km ?? aerialKm,
        durationMin: roadRoute?.durationMin,
        path: roadRoute?.path,
        instructions: roadRoute?.instructions,
        passabilityHe: 'כלי רכב בלבד',
        airspaceHe: 'ללא אישור מיוחד',
        color: '#4a90c4',
        lineStyle: 'solid' as const,
        status: routeStatus as RouteOption['status'],
      },
      {
        id: 'foot',
        labelHe: 'שביל שטח (הליכה)',
        km: footRoute?.km ?? aerialKm,
        durationMin: footRoute?.durationMin,
        path: footRoute?.path,
        instructions: footRoute?.instructions,
        passabilityHe: 'כוחות קרקעיים בלבד',
        airspaceHe: 'שביל / דרך עפר',
        color: '#6dc463',
        lineStyle: 'dashed' as const,
        status: footRouteStatus as RouteOption['status'],
      },
      {
        id: 'aerial',
        labelHe: 'קו טיסה ישיר',
        km: aerialKm,
        durationMin: undefined,
        path: aerialPath,
        instructions: undefined,
        passabilityHe: 'כלי טיס בלבד',
        airspaceHe: 'אזור אווירי מוגבל — נדרש אישור',
        color: '#e8c44a',
        lineStyle: 'dotted' as const,
        status: 'ready' as const,
      },
    ];
  }, [navStart?.id, navEnd?.id, navStart?.lat, navStart?.lon, navEnd?.lat, navEnd?.lon, roadRoute, footRoute, routeStatus, footRouteStatus]);

  const activeRouteOption = useMemo(
    () => routeOptions.find(r => r.id === activeRouteId) ?? routeOptions[0] ?? null,
    [routeOptions, activeRouteId],
  );

  const routeOverlaysMemo = useMemo(() => routeOptions.map(opt => ({
    id: opt.id,
    path: opt.path ?? [],
    color: opt.color,
    lineStyle: opt.lineStyle,
    labelHe: opt.labelHe,
    km: opt.km,
    durationMin: opt.durationMin,
    isActive: opt.id === activeRouteId,
  })), [routeOptions, activeRouteId]);

  return {
    routeOptions,
    activeRouteOption,
    routeOverlaysMemo,
  };
};

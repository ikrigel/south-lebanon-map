import { useMemo } from 'react';
import { haversineKm, bearingDegrees } from '../util';
import type { TurnInstruction } from '../types';
import { composeTurnInstruction, normalizeTurnDelta, turnActionFromDelta } from '../navigation/turnHelpers';

interface UseCurrentTurnInstructionDeps {
  navigationRoute: any;
  navPosition: any;
  mapBearing: number;
}

export const useCurrentTurnInstruction = (deps: UseCurrentTurnInstructionDeps) => {
  return useMemo<TurnInstruction | null>(() => {
    if (!deps.navigationRoute) return null;
    const path: [number, number][] = deps.navigationRoute.path && deps.navigationRoute.path.length >= 2
      ? deps.navigationRoute.path
      : [
          [deps.navigationRoute.start.lat, deps.navigationRoute.start.lon],
          [deps.navigationRoute.end.lat, deps.navigationRoute.end.lon],
        ];
    if (path.length < 2) return null;

    const current: [number, number] = deps.navPosition
      ? [deps.navPosition.lat, deps.navPosition.lon]
      : path[0];
    const remainingToEndKm = haversineKm(current, [deps.navigationRoute.end.lat, deps.navigationRoute.end.lon]);
    const confidence: TurnInstruction['confidence'] = deps.navigationRoute.path && deps.navigationRoute.path.length >= 3 ? 'route' : 'estimated';
    if (remainingToEndKm < 0.15) {
      return composeTurnInstruction('arrive', Math.max(0, remainingToEndKm * 1000), deps.mapBearing, confidence);
    }

    const routeInstructions = deps.navigationRoute.instructions?.filter((instruction: any) => instruction.action !== 'none') ?? [];
    if (routeInstructions.length && deps.navigationRoute.path && deps.navigationRoute.path.length >= 2) {
      const cumulativeMeters = (deps.navigationRoute.path as [number, number][]).reduce((acc: number[], point: [number, number], index: number) => {
        if (index === 0) return [0];
        const previous = deps.navigationRoute.path![index - 1];
        acc.push(acc[index - 1] + haversineKm(previous, point) * 1000);
        return acc;
      }, []);
      let nearestIndex = 0;
      let nearestKm = Infinity;
      deps.navigationRoute.path.forEach((point: [number, number], index: number) => {
        const km = haversineKm(current, point);
        if (km < nearestKm) {
          nearestKm = km;
          nearestIndex = index;
        }
      });
      const currentDistanceM = deps.navPosition ? cumulativeMeters[nearestIndex] ?? 0 : 0;
      const aheadInstructions = routeInstructions
        .filter((instruction: any) => instruction.distanceM >= currentDistanceM + 15)
        .sort((a: any, b: any) => a.distanceM - b.distanceM);
      const nextMeaningful = aheadInstructions.find((instruction: any) => instruction.action !== 'straight') ?? aheadInstructions[0];
      if (nextMeaningful) {
        return composeTurnInstruction(
          nextMeaningful.action,
          Math.max(0, nextMeaningful.distanceM - currentDistanceM),
          nextMeaningful.bearing,
          'route',
          nextMeaningful.roadName,
          nextMeaningful.lat,
          nextMeaningful.lon
        );
      }
    }

    let nearestIndex = 0;
    let nearestKm = Infinity;
    path.forEach((point: [number, number], index: number) => {
      const km = haversineKm(current, point);
      if (km < nearestKm) {
        nearestKm = km;
        nearestIndex = index;
      }
    });

    const baseIndex = Math.max(0, Math.min(path.length - 2, nearestIndex));
    let targetIndex = Math.min(path.length - 1, baseIndex + 1);
    let accumulatedKm = 0;
    for (let i = baseIndex; i < path.length - 1; i += 1) {
      accumulatedKm += haversineKm(path[i], path[i + 1]);
      targetIndex = i + 1;
      if (accumulatedKm >= 0.28) break;
    }

    const previousPoint = path[Math.max(0, baseIndex - 1)];
    const basePoint = path[baseIndex];
    const nextPoint = path[targetIndex] ?? path[Math.min(path.length - 1, baseIndex + 1)];
    const previousBearing = baseIndex > 0 ? bearingDegrees(previousPoint, basePoint) : bearingDegrees(current, nextPoint);
    const nextBearing = bearingDegrees(basePoint, nextPoint);
    const delta = normalizeTurnDelta(nextBearing - previousBearing);
    const action = turnActionFromDelta(delta);
    const distanceM = Math.max(0, haversineKm(current, nextPoint) * 1000);
    return composeTurnInstruction(action, distanceM, nextBearing, confidence);
  }, [deps.navigationRoute, deps.navPosition, deps.mapBearing]);
};

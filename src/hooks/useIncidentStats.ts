import { useMemo } from 'react';
import type { Incident } from '../types';
import { distanceToPolyline } from '../util';

interface UseIncidentStatsDeps {
  filtered: Incident[];
  blueLine: any;
}

export const useIncidentStats = (deps: UseIncidentStatsDeps) => {
  return useMemo(() => {
    const distances = deps.filtered.map(i => distanceToPolyline([i.lat, i.lon], deps.blueLine).km);
    const validDistances = distances.filter(d => isFinite(d));
    return {
      total: deps.filtered.length,
      avg: validDistances.length > 0 ? validDistances.reduce((a, b) => a + b, 0) / validDistances.length : 0,
      min: validDistances.length > 0 ? Math.min(...validDistances) : 0,
      max: validDistances.length > 0 ? Math.max(...validDistances) : 0,
      byType: Object.entries(
        deps.filtered.reduce((acc, i) => {
          acc[i.type] = (acc[i.type] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([type, n]) => ({ type, n })),
    };
  }, [deps.filtered, deps.blueLine]);
};

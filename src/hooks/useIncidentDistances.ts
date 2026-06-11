import { useMemo } from 'react';
import type { Incident } from '../types';
import { distanceToPolyline } from '../util';

interface UseIncidentDistancesDeps {
  filtered: Incident[];
  blueLine: any;
}

export const useIncidentDistances = (deps: UseIncidentDistancesDeps) => {
  const distances = useMemo(() => {
    return deps.filtered.map(i => ({
      id: i.id,
      ...distanceToPolyline([i.lat, i.lon], deps.blueLine),
    }));
  }, [deps.filtered, deps.blueLine]);

  const distanceById = useMemo(() => {
    const map = new Map(distances.map(d => [d.id, d]));
    return map;
  }, [distances]);

  return { distances, distanceById };
};

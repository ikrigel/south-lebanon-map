import { useMemo } from 'react';
import type { Incident, PoiColor, PoiShape, PoiSize } from '../types';
import { TYPE_LABEL, SEV_LABEL, distanceToPolyline } from '../util';
import { clean } from '../navigation/turnHelpers';
import { TYPES, SEVS } from '../constants';

interface UseIncidentFilteringProps {
  incidents: Incident[];
  yearFrom: number;
  yearTo: number;
  typeFilter: Set<string>;
  sevFilter: Set<string>;
  query: string;
  selectedId: string | null;
  distances: any[];
  distanceById: Map<string, any>;
  blueLine: [number, number][];
}

export function useIncidentFiltering({
  incidents,
  yearFrom,
  yearTo,
  typeFilter,
  sevFilter,
  query,
  selectedId,
  distances,
  distanceById,
  blueLine,
}: UseIncidentFilteringProps) {
  const filtered = useMemo(() => {
    const q = clean(query);
    return incidents.filter(i => {
      if (i.year < yearFrom || i.year > yearTo) return false;
      if (!typeFilter.has(i.type)) return false;
      if (!sevFilter.has(i.severity)) return false;
      if (q && !clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]} ${SEV_LABEL[i.severity]}`).includes(q)) return false;
      return true;
    });
  }, [yearFrom, yearTo, typeFilter, sevFilter, query, incidents]);

  const selected = useMemo(
    () => filtered.find(i => i.id === selectedId) || incidents.find(i => i.id === selectedId) || null,
    [selectedId, filtered, incidents]
  );

  const distanceLine = useMemo<[[number, number], [number, number]] | null>(() => {
    if (!selected) return null;
    const d = distanceById.get(selected.id);
    if (!d) {
      const d2 = distanceToPolyline([selected.lat, selected.lon], blueLine);
      return [[selected.lat, selected.lon], d2.nearest];
    }
    return [[selected.lat, selected.lon], d.nearest];
  }, [selected, distanceById, blueLine]);

  const stats = useMemo(() => {
    const ds = distances.map(d => d.km);
    const sum = ds.reduce((s, x) => s + x, 0);
    return {
      total: filtered.length,
      min: ds.length ? Math.min(...ds) : NaN,
      max: ds.length ? Math.max(...ds) : NaN,
      avg: ds.length ? sum / ds.length : NaN,
      byType: TYPES.map(t => ({ type: t, n: filtered.filter(f => f.type === t).length })),
      bySev: SEVS.map(s => ({ sev: s, n: filtered.filter(f => f.severity === s).length })),
    };
  }, [filtered, distances]);

  return { filtered, selected, distanceLine, stats };
}

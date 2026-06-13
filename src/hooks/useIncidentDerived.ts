import { useMemo } from 'react';
import { distanceToPolyline, TYPE_LABEL, SEV_LABEL } from '../util';
import { clean } from '../navigation/turnHelpers';
import { TYPES, SEVS } from '../constants';
import { incidents } from '../data/geo';

interface UseIncidentDerivedProps {
  yearFrom: number;
  yearTo: number;
  typeFilter: Set<string>;
  sevFilter: Set<string>;
  query: string;
  selectedId: string | null;
  distances: Array<{ km: number }>;
  distanceById: Map<string, { km: number; nearest: [number, number] }>;
  blueLine: [number, number][];
}

export function useIncidentDerived(props: UseIncidentDerivedProps) {
  const filtered = useMemo(() => {
    const q = clean(props.query);
    return incidents.filter(i => {
      if (i.year < props.yearFrom || i.year > props.yearTo) return false;
      if (!props.typeFilter.has(i.type)) return false;
      if (!props.sevFilter.has(i.severity)) return false;
      if (q && !clean(`${i.title_he} ${i.desc_he} ${i.source_label} ${TYPE_LABEL[i.type]} ${SEV_LABEL[i.severity]}`).includes(q)) return false;
      return true;
    });
  }, [props.yearFrom, props.yearTo, props.typeFilter, props.sevFilter, props.query]);

  const selected = useMemo(
    () => filtered.find(i => i.id === props.selectedId) || incidents.find(i => i.id === props.selectedId) || null,
    [props.selectedId, filtered]
  );

  const distanceLine = useMemo<[[number, number], [number, number]] | null>(() => {
    if (!selected) return null;
    const d = props.distanceById.get(selected.id);
    if (!d) {
      const d2 = distanceToPolyline([selected.lat, selected.lon], props.blueLine);
      return [[selected.lat, selected.lon], d2.nearest];
    }
    return [[selected.lat, selected.lon], d.nearest];
  }, [selected, props.distanceById, props.blueLine]);

  const stats = useMemo(() => {
    const ds = props.distances.map(d => d.km);
    const sum = ds.reduce((s, x) => s + x, 0);
    return {
      total: filtered.length,
      min: ds.length ? Math.min(...ds) : NaN,
      max: ds.length ? Math.max(...ds) : NaN,
      avg: ds.length ? sum / ds.length : NaN,
      byType: TYPES.map(t => ({ type: t, n: filtered.filter(f => f.type === t).length })),
      bySev: SEVS.map(s => ({ sev: s, n: filtered.filter(f => f.severity === s).length })),
    };
  }, [filtered, props.distances]);

  return { filtered, selected, distanceLine, stats };
}

import { useCallback } from 'react';
import { MAX_MULTI_ROUTE_POINTS } from '../constants';

interface UseMapInteractionProps {
  addPoiMode: boolean;
  measureMode: boolean;
  multiRouteBuildMode: boolean;
  multiRouteDraftPoints: any[];
  setMultiRouteDraftPoints: (points: any[]) => void;
  setPoiDraft: (draft: any) => void;
  setManualMeasure: (fn: (prev: any[]) => any[]) => void;
  setSelectedId: (id: string | null) => void;
  showToast: (msg: string) => void;
}

export function useMapInteraction({
  addPoiMode,
  measureMode,
  multiRouteBuildMode,
  multiRouteDraftPoints,
  setMultiRouteDraftPoints,
  setPoiDraft,
  setManualMeasure,
  setSelectedId,
  showToast,
}: UseMapInteractionProps) {
  const onMapClick = useCallback((lat: number, lon: number) => {
    if (multiRouteBuildMode) {
      const newPoint = { lat, lon, label: `נקודה ${multiRouteDraftPoints.length + 1}`, order: multiRouteDraftPoints.length };
      setMultiRouteDraftPoints(prev => prev.length >= MAX_MULTI_ROUTE_POINTS ? prev : [...prev, newPoint]);
      return;
    }
    if (addPoiMode) {
      setPoiDraft({ lat, lon });
    } else if (measureMode) {
      setManualMeasure(prev => {
        if (prev.length === 2) return [[lat, lon]];
        return [...prev, [lat, lon]];
      });
    } else {
      setSelectedId(null);
    }
  }, [addPoiMode, measureMode, multiRouteBuildMode, multiRouteDraftPoints.length, setMultiRouteDraftPoints, setPoiDraft, setManualMeasure, setSelectedId]);

  return { onMapClick };
}

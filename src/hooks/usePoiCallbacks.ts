import { useCallback } from 'react';
import { safeText, haversineKm } from '../util';
import { normalizePoi } from '../storage/normalize';
import type { CustomPoi, PoiColor, PoiShape, PoiSize } from '../types';

interface UsePoiCallbacksProps {
  addPoiMode: boolean;
  measureMode: boolean;
  multiRouteBuildMode: boolean;
  multiRouteDraftPoints: any[];
  poiDraft: { lat: number; lon: number } | null;
  poiName: string;
  poiDescription: string;
  poiMarkerColor: PoiColor;
  poiMarkerShape: PoiShape;
  poiMarkerSize: PoiSize;
  customPois: CustomPoi[];
  setAddPoiMode: (v: boolean) => void;
  setPoiDraft: (p: any) => void;
  setPoiName: (n: string) => void;
  setPoiDescription: (d: string) => void;
  setMultiRouteDraftPoints: (pts: any[] | ((prev: any[]) => any[])) => void;
  setManualMeasure: (m: any) => void;
  setSelectedId: (id: any) => void;
  setCustomPois: (fn: (prev: CustomPoi[]) => CustomPoi[]) => void;
  setVisible: (fn: (v: any) => any) => void;
  showToast: (msg: string) => void;
  MAX_MULTI_ROUTE_POINTS: number;
}

export function usePoiCallbacks(props: UsePoiCallbacksProps) {
  const toggleSet = (set: Set<string>, item: string): Set<string> => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    return next;
  };

  const onMapClick = useCallback((lat: number, lon: number) => {
    if (props.multiRouteBuildMode) {
      const newPoint = { lat, lon, label: `נקודה ${props.multiRouteDraftPoints.length + 1}`, order: props.multiRouteDraftPoints.length };
      props.setMultiRouteDraftPoints(prev => prev.length >= props.MAX_MULTI_ROUTE_POINTS ? prev : [...prev, newPoint]);
      return;
    }
    if (props.addPoiMode) {
      props.setPoiDraft({ lat, lon });
    } else if (props.measureMode) {
      props.setManualMeasure(prev => {
        if (prev.length === 2) return [[lat, lon]];
        return [...prev, [lat, lon]];
      });
    } else {
      props.setSelectedId(null);
    }
  }, [props]);

  const savePoi = useCallback(() => {
    if (!props.poiDraft) return;
    const name = safeText(props.poiName, `נקודת עניין ${props.customPois.length + 1}`) || `נקודת עניין ${props.customPois.length + 1}`;
    const description = safeText(props.poiDescription, 'נקודה שהמשתמש הוסיף למפה');
    const poi: CustomPoi = {
      id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      description,
      lat: props.poiDraft.lat,
      lon: props.poiDraft.lon,
      createdAt: new Date().toISOString(),
      markerColor: props.poiMarkerColor,
      markerShape: props.poiMarkerShape,
      markerSize: props.poiMarkerSize,
    };
    props.setCustomPois(prev => [poi, ...prev]);
    props.setPoiDraft(null);
    props.setPoiName('');
    props.setPoiDescription('');
    props.setAddPoiMode(false);
    props.showToast(`נקודת העניין "${poi.name}" נשמרה`);
  }, [props]);

  const importPois = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 500_000) {
      props.showToast('קובץ נקודות העניין גדול מדי לייבוא');
      return;
    }
    let data: unknown;
    try {
      const text = await file.text();
      data = JSON.parse(text);
    } catch {
      props.showToast('לא ניתן לקרוא את קובץ נקודות העניין');
      return;
    }
    const items = (Array.isArray(data) ? data : [data]).slice(0, 1000);
    const valid = items.map(normalizePoi).filter((p): p is CustomPoi => Boolean(p));
    if (valid.length) {
      props.setCustomPois(prev => [...valid, ...prev]);
      props.showToast(`${valid.length} נקודות עניין יובאו בהצלחה`);
    } else {
      props.showToast('לא נמצאו נקודות עניין תקינות בקובץ');
    }
  }, [props]);

  const handleQrImportPois = useCallback((pois: any[]) => {
    const valid = (pois as unknown as Partial<CustomPoi>[]).map(normalizePoi).filter((p): p is CustomPoi => Boolean(p));
    if (!valid.length) return;
    props.setCustomPois(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const fresh = valid.filter(p => !existingIds.has(p.id));
      if (!fresh.length) return prev;
      props.showToast(`${fresh.length} נקודות עניין יובאו מברקוד`);
      return [...fresh, ...prev];
    });
  }, [props]);

  const visibleKey = useCallback((k: string) => () =>
    props.setVisible((v: any) => ({ ...v, [k]: !v[k] })), [props]);

  return {
    onMapClick,
    savePoi,
    importPois,
    handleQrImportPois,
    visibleKey,
    toggleSet,
  };
}

import { useCallback } from 'react';
import type { CustomPoi, PoiColor, PoiShape, PoiSize } from '../types';
import { MAX_IMPORTED_POIS, MAX_POI_FILE_BYTES } from '../constants';
import { safeText } from '../util';
import { normalizePoi } from '../storage/normalize';

interface UsePoiManagementProps {
  poiDraft: { lat: number; lon: number } | null;
  poiName: string;
  poiDescription: string;
  poiMarkerColor: PoiColor;
  poiMarkerShape: PoiShape;
  poiMarkerSize: PoiSize;
  customPois: CustomPoi[];
  setPoiDraft: (draft: any) => void;
  setPoiName: (name: string) => void;
  setPoiDescription: (desc: string) => void;
  setCustomPois: (fn: (pois: CustomPoi[]) => CustomPoi[]) => void;
  setAddPoiMode: (mode: boolean) => void;
  showToast: (msg: string) => void;
  downloadJson: (name: string, data: any) => void;
}

export function usePoiManagement({
  poiDraft,
  poiName,
  poiDescription,
  poiMarkerColor,
  poiMarkerShape,
  poiMarkerSize,
  customPois,
  setPoiDraft,
  setPoiName,
  setPoiDescription,
  setCustomPois,
  setAddPoiMode,
  showToast,
  downloadJson,
}: UsePoiManagementProps) {
  const savePoi = useCallback(() => {
    if (!poiDraft) return;
    const newPoi: CustomPoi = {
      id: `poi-${Date.now()}`,
      name: safeText(poiName, 'נקודה חדשה') || 'נקודה חדשה',
      description: safeText(poiDescription, '') || '',
      lat: poiDraft.lat,
      lon: poiDraft.lon,
      createdAt: new Date().toISOString(),
      markerColor: poiMarkerColor,
      markerShape: poiMarkerShape,
      markerSize: poiMarkerSize,
    };
    setCustomPois(prev => [newPoi, ...prev]);
    setPoiDraft(null);
    setPoiName('');
    setPoiDescription('');
    setAddPoiMode(false);
    showToast(`נקודה "${newPoi.name}" נשמרה`);
  }, [poiDraft, poiName, poiDescription, poiMarkerColor, poiMarkerShape, poiMarkerSize, setCustomPois, setPoiDraft, setPoiName, setPoiDescription, setAddPoiMode, showToast]);

  const importPois = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_POI_FILE_BYTES) {
      showToast(`קובץ גדול מדי. מקסימום: ${MAX_POI_FILE_BYTES / 1024}KB`);
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const pois = Array.isArray(data) ? data : data.pois || [];
      const valid = pois.slice(0, MAX_IMPORTED_POIS).map(normalizePoi).filter(p => p !== null);
      if (!valid.length) {
        showToast('לא נמצאו נקודות עניין תקפות בקובץ');
        return;
      }
      setCustomPois(prev => [...valid, ...prev]);
      showToast(`${valid.length} נקודות עניין יובאו מקובץ`);
    } catch {
      showToast('שגיאה בקריאת קובץ נקודות העניין');
    }
  }, [showToast, setCustomPois]);

  return { savePoi, importPois };
}
